import eventlet
import inspect
import json
import keras
import time
import sys
import io
import uuid
import json
import contextlib
import pickle
import traceback as tb
import numpy as np

from types import ModuleType
from threading import Thread
from flask import Flask
from flask_socketio import SocketIO, emit

eventlet.monkey_patch(socket=True)


class MyJSONEncoder(json.JSONEncoder):
    """ Custom json encoder to search for a 'to_json' method on objects """

    def default(self, obj):
        if hasattr(obj, 'to_json'):
            return obj.to_json()
        return json.JSONEncoder.default(self, obj)


class MyJSONWrapper(object):
    """ Json wrapper for the custom json encoder, that we can pass to socketio """

    @staticmethod
    def dumps(*args, **kwargs):
        if 'cls' not in kwargs:
            kwargs['cls'] = MyJSONEncoder
        return json.dumps(*args, **kwargs)

    @staticmethod
    def loads(*args, **kwargs):
        return json.loads(*args, **kwargs)


# Setup Flask web server & socketio
# sio is used when running on the main thread
# socketio is used in off-main threads and transfers data via redis to 'sio'
app = Flask(__name__)
sio = SocketIO(app, binary=True, message_queue='redis://', json=MyJSONWrapper)
socketio = SocketIO(binary=True, message_queue='redis://', json=MyJSONWrapper)


# Context manager allows us to capture 'print' statements and other output
# while running exec
@contextlib.contextmanager
def stdoutIO(stdout=None):
    old = sys.stdout
    if stdout is None:
        stdout = io.StringIO()
    sys.stdout = stdout
    yield stdout
    sys.stdout = old


# TODO: This needs to make sure we serialize matrixes properly
# Plus we can probably combine this with the custom json encoder above
def serialize(data):
    """ Custom serialization function to serialize any variable to json """

    if isinstance(data, str):
        return data
    if isinstance(data, (int, float)):
        return data
    if isinstance(data, keras.Model):
        return serialize_model(data)
    elif isinstance(data, np.ndarray):
        return serialize_matrix(data)
    elif isinstance(data, list):
        return list(map(serialize, data))
    return None


def serialize_matrix(mat):
    """ Serialize a matrix to an array of bytes: [nDims] [dim1, dim2, ...] [values]"""

    if len(mat) == 0:
        return []

    # First get the size of each dim, and the amount of dims
    dims = []
    curr = mat
    while (isinstance(curr, np.ndarray)):
        dims.append(len(curr))
        curr = curr[0]

    # Then write the amount of dims, and each dim size
    str = len(dims).to_bytes(4, 'little')
    for dim in dims:
        str += dim.to_bytes(4, 'little')

    # Then write the bytes of the matrix. This is similar to 'tobytes()'
    # See https://docs.scipy.org/doc/numpy-1.14.0/reference/generated/numpy.ndarray.tostring.html
    str += mat.tostring()
    return str


def serialize_variable(name, var):
    """ Serialize an arbitrary variable """

    return {'name': name, 'type': type(var).__name__}


def serialize_model(model):
    """ Serialize keras models """

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
        'id': model.name,
        'name': model.name,
        'config': model.get_config(),
        'layers': layers,
        'inputs': inputs,
        'outputs': outputs
    }


def serialize_layer(layer):
    """ Serialize keras layers """

    return {
        'name': layer.name,
        'type': type(layer).__name__,
        'config': layer.get_config(),
        'input': serialize_tensor(layer.input),
        'output': serialize_tensor(layer.output)
    }


def serialize_tensor(tensor):
    """ Serialize a tensor """

    return {
        'name': tensor.name,
        'type': tensor.dtype.as_numpy_dtype.__name__,
        'shape': serialize_tensorshape(tensor.shape)
    }


def serialize_tensorshape(tensorshape):
    """ Serialize the tensorshape """

    dims = []
    for dim in tensorshape.dims:
        dims.append(dim.value)
    return {'dims': dims, 'nDims': tensorshape.ndims}


class Block(object):
    """ An arbitrary block of something """

    def __init__(self, type, id=str(uuid.uuid4()), x=10, y=10, prev=[],
                 nxt=[]):
        self.id = id
        self.type = type
        self.locked = False
        self.x = x
        self.y = y
        self.prev = prev
        self.next = nxt

    def to_json(self):
        """ This is called by our custom json serializer """

        return {
            'id': self.id,
            'type': self.type,
            'x': self.x,
            'y': self.y,
            'prev': list(map(lambda b: b.id, self.prev)),
            'next': list(map(lambda b: b.id, self.next))
        }


class CodeBlock(Block):
    """ An arbitrary block of code in the editor that can be executed and connected """

    def __init__(self, code, x=10, y=10, prev=[], nxt=[]):
        super(CodeBlock, self).__init__(
            type='Code', x=x, y=y, prev=prev, nxt=nxt)
        self.code = code

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(CodeBlock, self).to_json()
        json['code'] = self.code
        return json


class LayerBlock(Block):
    """ An block representing a layer of a model """

    def __init__(self, layer, x=10, y=10, prev=[], nxt=[]):
        super(LayerBlock, self).__init__(
            id=layer.name, type='Layer', x=x, y=y, prev=prev, nxt=nxt)
        self.layer = layer

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(LayerBlock, self).to_json()
        json['layer_type'] = type(self.layer).__name__
        return json


# Exposed variables
vars = {}
# Blocks of code
blocks = []


# Socket.IO connection event
@sio.on('connect', namespace='/')
def connect():
    print("connect")


# Socket.IO disconnect event
@sio.on('disconnect', namespace='/')
def disconnect():
    print('disconnect')


# Client requests all blocks of code
@sio.on('code')
def getCode():
    return blocks


# Client creates a new code block
@sio.on('code_create')
def addCode(code):
    newBlock = CodeBlock(code)
    blocks.append(newBlock)
    return newBlock


# Client edits the code of a code block
@sio.on('code_change')
def editCode(args):
    block = next((c for c in blocks if c.id == args['id']), None)
    if block != None:
        block.code = args['code']
    return block


# Client changes the location of a code block
@sio.on('code_move')
def moveCode(args):
    block = next((c for c in blocks if c.id == args['id']), None)
    if block != None:
        block.x = args['x']
        block.y = args['y']
    return block


# Client connects to code blocks together
@sio.on('code_connect')
def connectCode(args):
    blockFrom = next((c for c in blocks if c.id == args['from']), None)
    blockTo = next((c for c in blocks if c.id == args['to']), None)
    if blockFrom == None or blockTo == None:
        return None

    blockFrom.next.append(blockTo)
    blockTo.prev.append(blockFrom)
    return [blockFrom, blockTo]


# Client deletes a code block
@sio.on('code_delete')
def deleteCode(args):
    global blocks
    blocks = [c for c in blocks if c.id != args['id']]
    return blocks


# Client clicks 'run' on a code block
@sio.on('code_run')
def runCode(blockId):
    # Find the code block by id
    block = next((c for c in blocks if c.id == blockId), None)
    if block == None:
        return ['Invalid block']

    # Save our globals - they will be exposed to the 'exec' function
    gs = globals()

    # TODO: Properly create our AST
    # Currently this only goes back one 'path', so a block
    # with more than one input doesn't work
    blocks = [block]
    first = block
    while len(first.prev) > 0:
        print(first.to_json())
        first = first.prev[0]
        blocks.insert(0, first)

    try:
        out = None
        # This captures any print and output statements
        with stdoutIO() as s:
            # Traverse the blocks
            for b in blocks:
                # Set our 'locals' available inside the block to the exposed variables
                ls = vars
                # Set the block's input value equal to the last block's output value
                ls['input'] = out
                # Run our custom code
                exec(b.code, gs, ls)
                # Save the output of our cusotm code, so the next block can use it as the input
                out = ls.pop('out', None)

        res = None
        # If our last block had output, then it will be in the out variable
        if out is not None:
            res = serialize(out)

        # Return our results to the client
        return [None, [s.getvalue(), res]]
    except:
        # Return the error to the client
        return [tb.format_exc(), []]


class FitCallback(keras.callbacks.Callback):
    """ Callback used inside the 'fit' method of keras, to update our client with progress on the training """
    last_time = 0

    def set_params(self, params):
        socketio.emit('set_params', params)

    def on_train_begin(self, logs={}):
        socketio.emit('train_begin', logs)

    def on_train_end(self, logs={}):
        socketio.emit('train_end', logs)

    def on_batch_begin(self, batch, logs={}):
        if (time.time() - self.last_time < 1):
            return
        socketio.emit('batch_begin', batch)
        self.last_time = time.time()

    def on_epoch_begin(self, epoch, logs={}):
        socketio.emit('epoch_begin', epoch)


def expose_model(model):
    """ Expose a model to the web clients """

    i = 0
    for layer in model.layers:
        blocks.append(LayerBlock(layer, x=i * 100))
        i += 1
    for layer in model.layers:
        p = next((l.name for l in model.layers if l.output == layer.input),
                 None)
        prev = next((b for b in blocks if b.id == p), None)

        n = next((l.name for l in model.layers if l.input == layer.output),
                 None)
        nxt = next((b for b in blocks if b.id == n), None)

        for b in blocks:
            if b.id == layer.name:
                if prev is not None:
                    b.prev = [prev]
                if nxt is not None:
                    b.next = [nxt]
                break

    @sio.on('model')
    def getModel():
        return serialize_model(model)

    @sio.on('layer')
    def getLayer(layer_name=None):
        layer = model.get_layer(name=layer_name)
        weights = layer.get_weights()
        if len(weights) <= 0:
            return None
        return serialize_matrix(weights[0])


def expose_variables(newVars):
    """ Expose variables to our web clients """

    global vars
    for key, value in newVars.items():
        if (key.startswith("__") or key == "expose_variables"
                or key == "expose_model" or isinstance(value, SocketIO)
                or isinstance(value, type) or isinstance(value, ModuleType)):
            continue
        vars[key] = value

    @sio.on('variables')
    def getModel():
        ret = []
        for key, value in vars.items():
            ret.append(serialize_variable(key, value))
        return ret


def start():
    """ Start our webserver and return the socket.io client to which we can attach our own events """

    def thread_run():
        sio.run(app, port=8080)

    thread = Thread(target=thread_run)
    thread.start()

    return sio
