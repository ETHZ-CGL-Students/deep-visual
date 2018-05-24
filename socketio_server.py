import eventlet
import json
import keras
import time
from threading import Thread
from flask import Flask
from flask_socketio import SocketIO, emit

eventlet.monkey_patch(socket=True)

app = Flask(__name__)
sio = SocketIO(app, binary=True, message_queue='redis://')
socketio = SocketIO(binary=True, message_queue='redis://')


def serialize_model(model):
    layers = []
    for layer in model.layers:
        layers.append(serialize_layer(layer))
    inputs = []
    for input in model.inputs:
        inputs.append(serialize_tensor(input))
    outputs = []
    for output in model.outputs:
        outputs.append(serialize_tensor(output))

    return {
        'name': model.name,
        'config': model.get_config(),
        'layers': layers,
        'inputs': inputs,
        'outputs': outputs
    }


def serialize_layer(layer):
    return {
        'name': layer.name,
        'type': type(layer).__name__,
        'config': layer.get_config(),
        'input': serialize_tensor(layer.input),
        'output': serialize_tensor(layer.output)
    }


def serialize_tensor(tensor):
    return {
        'name': tensor.name,
        'type': tensor.dtype.as_numpy_dtype.__name__,
        'shape': serialize_tensorshape(tensor.shape)
    }


def serialize_tensorshape(tensorshape):
    dims = []
    for dim in tensorshape.dims:
        dims.append(dim.value)
    return {'dims': dims, 'nDims': tensorshape.ndims}


@sio.on('connect', namespace='/')
def connect():
    print("connect")


@sio.on('disconnect', namespace='/')
def disconnect():
    print('disconnect')


class FitCallback(keras.callbacks.Callback):
    last_time = 0

    def set_params(self, params):
        socketio.emit('set_params', params)

    def on_train_begin(self, logs={}):
        socketio.emit('train_begin', logs)

    def on_batch_begin(self, batch, logs={}):
        if (time.time() - self.last_time < 1):
            return
        socketio.emit('batch_begin', batch)
        self.last_time = time.time()

    def on_epoch_begin(self, epoch, logs={}):
        socketio.emit('epoch_begin', epoch)


def expose_model(model):
    @sio.on('model')
    def getModel():
        return serialize_model(model)

    @sio.on('layer')
    def getLayer(layer_name=None):
        print('TESTING')
        layer = model.get_layer(name=layer_name)
        weights = layer.get_weights()
        if len(weights) <= 0:
            return None
        w = weights[0]
        return len(w).to_bytes(4, 'little') + len(w[0]).to_bytes(
            4, 'little') + w.tostring()

    def thread_run():
        sio.run(app, port=8080)

    thread = Thread(target=thread_run)
    thread.start()

    return sio
