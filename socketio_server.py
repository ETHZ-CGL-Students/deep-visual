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
import tensorflow as tf

from abc import ABCMeta, abstractmethod
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
sio = SocketIO(app, message_queue='redis://', json=MyJSONWrapper)
socketio = SocketIO(message_queue='redis://', json=MyJSONWrapper)


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

    if isinstance(data, (str, int, float, bytes, bytearray)):
        return data
    elif isinstance(data, keras.Model):
        return serialize_model(data)
    elif isinstance(data, tf.Tensor):
        return serialize_tensor(data)
    elif isinstance(data, np.ndarray):
        return serialize_matrix(data)
    elif isinstance(data, list):
        return list(map(serialize, data))
    elif isinstance(data, dict):
        return {k: serialize(v) for k, v in data.items()}
    return json.dumps(data)


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

    # Note: Keras does not provide public info about how many
    # times a shared layer is used, therefore we loop until an exception occurs.
    # We want to treat each usage of a shared node as a separate layer
    layers = []
    for layer in model.layers:
        idx = 0
        while True:
            try:
                layers.append(serialize_layer(layer, idx))
            except:
                break
            else:
                idx += 1

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


def serialize_layer(layer, idx):
    """ Serialize idx-th occurrence of a keras layer """

    # Note: call to layer.get_input_at (.get_output_at) returns a Tensor
    # when there is a unique input (output), a list otherwise.
    _inputs = layer.input
    if not isinstance(_inputs, list):
        _inputs = [_inputs]

    _outputs = layer.output
    if not isinstance(_outputs, list):
        _outputs = [_outputs]

    return {
        'name': layer.name if idx is 0 else "%s (%d)" % (layer.name, idx),
        'type': type(layer).__name__,
        'config': layer.get_config(),
        'inputs': [serialize_tensor(t) for t in _inputs],
        'outputs': [serialize_tensor(t) for t in _outputs]
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


class Block(metaclass=ABCMeta):
    """ An arbitrary block of something """

    def __init__(self, type, id=None, x=10, y=10, prev=None, nxt=None):
        self.id = id if id is not None else str(uuid.uuid4())
        self.type = type
        self.locked = False
        self.x = x
        self.y = y
        self.prev = prev if prev is not None else []
        self.next = nxt if nxt is not None else []

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

    @abstractmethod
    def eval(self, gs, ls, input):
        """ Evaluate this block using the given input, returning the output"""
        return


class CodeBlock(Block):
    """ An arbitrary block of code in the editor that can be executed and connected """

    def __init__(self, code='', x=10, y=10, prev=None, nxt=None, data=None):
        if data is not None:
            self.__dict__ = data
        else:
            super(CodeBlock, self).__init__(
                type='Code', x=x, y=y, prev=prev, nxt=nxt)
            self.code = code

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(CodeBlock, self).to_json()
        json['code'] = self.code
        return json

    def eval(self, gs, ls, input):
        out = None

        # Set the input as a local variable so we can use it in the block
        ls['input'] = input

        # Run our custom code
        exec(self.code, gs, ls)

        # Save the output of our cusotm code, so that we can return it
        out = ls.pop('out', None)

        # Clear the input we set
        ls.pop('input')

        # Return our results
        return out


class LayerBlock(Block):
    """ An block representing a layer of a model """

    def __init__(self, layer, x=10, y=10, prev=None, nxt=None):
        super(LayerBlock, self).__init__(
            id=layer.name, type='Layer', x=x, y=y, prev=prev, nxt=nxt)
        self.layer = layer

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(LayerBlock, self).to_json()
        json['layerType'] = type(self.layer).__name__
        return json

    def eval(self, gs, ls, input):
        return self.layer.output


# Exposed variables
vars = {}
# Blocks of code
blocks = []


def saveBlocks():
    with open('save/blocks.json', 'w') as outfile:
        codeBlocks = [b for b in blocks if b.type == 'Code']
        json.dump(codeBlocks, outfile, cls=MyJSONEncoder)


def loadBlocks():
    try:
        with open('save/blocks.json', 'r') as infile:
            global blocks
            # Parse all the code blocks from file
            data = json.load(infile, object_hook=lambda d: CodeBlock(data=d))
            # Add the code blocks to the main blocks array
            blocks.extend(data)
            # Fix the 'prev' and 'next' arrays for all the code blocks,
            # because in the JSON they are id references
            for block in blocks:
                if block.type != 'Code':
                    pass
                else:
                    prevs = block.prev
                    block.prev = []
                    for pId in prevs:
                        pBlock = next((b for b in blocks if b.id == pId), None)
                        if pBlock is not None:
                            block.prev.append(pBlock)
                            if pBlock.type != 'Code':
                                pBlock.next.append(block)

                    nexts = block.next
                    block.next = []
                    for nId in nexts:
                        nBlock = next((b for b in blocks if b.id == nId), None)
                        if nBlock is not None:
                            block.next.append(nBlock)
                            if nBlock.type != 'Code':
                                nBlock.next.append(block)
    except FileNotFoundError:
        pass


# Socket.IO connection event
@sio.on('connect', namespace='/')
def connect():
    print("connect")


# Socket.IO disconnect event
@sio.on('disconnect', namespace='/')
def disconnect():
    print('disconnect')


# List of all blocks
@sio.on('block_list')
def getBlocks():
    return blocks


# Creating a new block
@sio.on('block_create')
def addBlock(args):
    newBlock = CodeBlock(args['code'])
    blocks.append(newBlock)
    sio.emit('block_create', data=newBlock.to_json())
    saveBlocks()


# Edit code of a block
@sio.on('block_change')
def editBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is not None:
        block.code = args['code']
        sio.emit('block_change', data=block.to_json())
        saveBlocks()


# Move block around
@sio.on('block_move')
def moveBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is not None:
        block.x = args['x']
        block.y = args['y']
        sio.emit('block_move', data=block.to_json())


# Connecting blocks together
@sio.on('block_connect')
def connectBlocks(args):
    blockFrom = next((b for b in blocks if b.id == args['from']), None)
    blockTo = next((b for b in blocks if b.id == args['to']), None)
    if blockFrom is None or blockTo is None or blockFrom == blockTo:
        return

    alreadyHas = next((n for n in blockFrom.next if n.id == blockTo.id), None)
    if alreadyHas is not None:
        return

    blockFrom.next.append(blockTo)
    blockTo.prev.append(blockFrom)
    sio.emit('block_connect', data=[blockFrom.to_json(), blockTo.to_json()])
    saveBlocks()


# Disconnecting blocks
@sio.on('block_disconnect')
def disconnectBlocks(args):
    blockFrom = next((b for b in blocks if b.id == args['from']), None)
    blockTo = next((b for b in blocks if b.id == args['to']), None)
    if blockFrom is None or blockTo is None or blockFrom == blockTo:
        return

    blockFrom.next.remove(blockTo)
    blockTo.prev.remove(blockFrom)
    sio.emit('block_disconnect', data=[blockFrom.to_json(), blockTo.to_json()])
    saveBlocks()


# Deleting blocks
@sio.on('block_delete')
def deleteBlock(args):
    global blocks
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is not None:
        # Remove connections on 'next' blocks to this one
        for b in block.next:
            b.prev.remove(block)
        # Remove connections on 'prev' blocks to this one
        for b in block.prev:
            b.next.remove(block)
        # Remove from blocks array
        blocks = [b for b in blocks if b.id != args['id']]
        sio.emit('block_delete', data=block.to_json())
        saveBlocks()


# Evaluating a block (="running")
@sio.on('block_eval')
def evalBlock(args):
    global blocks

    # Find the code block by id
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return ['Invalid block']

    # Build our execution tree
    bs = [block]
    todo = [block]
    while len(todo) > 0:
        b = todo.pop()
        bs.extend(b.prev)
        todo.extend(b.prev)

    bs.reverse()
    outs = {}

    # Save our globals, they will be exposed to the block eval...
    gs = globals()

    # ...and use our exposed variables as the local variables inside the block eval
    ls = vars

    try:
        # Traverse the blocks
        for b in bs:
            input = []

            # Get inputs from previous blocks
            for p in b.prev:
                input.append(outs[p.id])

            # Run the function
            out = b.eval(gs, ls, input)

            # Save the output of our execution
            outs[b.id] = out

        # Get the output for the block we ran the eval socket.io event
        res = outs[block.id]
        if res is not None:
            res = serialize(res)

        # Return our results to the client
        return [None, res]
    except:
        # Return the error to the client
        return [tb.format_exc(), None]


class FitCallback(keras.callbacks.Callback):
    """ Callback used inside the 'fit' method of keras, to 
    update our client with progress on the training """
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

    # Add all layers as blocks
    i = 0
    for layer in model.layers:
        blocks.append(LayerBlock(layer, x=i * 200))
        i += 1
    # Link the layers 'prev' and 'next'
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
    """ Start our webserver and return the socket.io 
    client to which we can attach our own events """

    # We wait with loading blocks until here so that the model layers
    # are exposed, because they might be referenced in one of the
    # code blocks 'next' or 'prev' arrays
    loadBlocks()

    def thread_run():
        sio.run(app, port=8080)

    thread = Thread(target=thread_run)
    thread.start()

    return sio
