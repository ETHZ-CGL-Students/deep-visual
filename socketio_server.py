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
from collections import OrderedDict
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
        elif isinstance(obj, np.ndarray):
            return serialize_matrix(obj)
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


class Variable(object):
    """ A variable that is exposed to the frontend """

    def __init__(self, name, value):
        self.name = name
        self.value = value

    def to_json(self):
        return {'name': self.name, 'type': type(self.value).__name__}


class Link(object):
    """ Links together two blocks """

    def __init__(self,
                 fromBlock,
                 fromPort,
                 toBlock,
                 toPort,
                 implicit=False,
                 id=None):
        self.id = id if id is not None else str(uuid.uuid4())
        self.implicit = implicit
        self.fromBlock = fromBlock
        self.fromPort = fromPort
        self.toBlock = toBlock
        self.toPort = toPort

    def to_json(self):
        return {
            'class': 'Link',
            'id': self.id,
            'fromId': self.fromBlock.id,
            'fromPort': self.fromPort,
            'toId': self.toBlock.id,
            'toPort': self.toPort
        }


class Block(metaclass=ABCMeta):
    """ An arbitrary block of something """

    def __init__(self, id=None, x=10, y=10):
        self.id = id if id is not None else str(uuid.uuid4())
        self.x = x
        self.y = y
        # We use ordered dicts so our ports don't change order
        self.outputs = OrderedDict()
        self.inputs = OrderedDict()

    def to_json(self):
        """ This is called by our custom json serializer """

        return {
            'class': 'Block',
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'outputs': list(self.outputs.keys()),
            'inputs': list(self.inputs.keys())
        }

    @abstractmethod
    def eval(self, gs, ls, input):
        """ Evaluate this block using the given input, returning the output"""
        return


class CodeBlock(Block):
    """ An arbitrary block of code in the editor that can be executed and connected """

    def __init__(self, code='', x=10, y=10, data=None):
        if data is not None:
            self.__dict__ = data
            self.inputs = OrderedDict(
                map(lambda input: (input, None), self.inputs))
            self.outputs = OrderedDict(
                map(lambda output: (output, []), self.outputs))
        else:
            super(CodeBlock, self).__init__(x=x, y=y)
            self.inputs = OrderedDict([('x0', None)])
            self.outputs = OrderedDict([('y0', [])])
            self.code = code

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(CodeBlock, self).to_json()
        json['class'] = 'CodeBlock'
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
        ls.pop('input', None)

        # Return our results
        return out


class LayerBlock(Block):
    """ An block representing a layer of a model """

    def __init__(self, layer, x=10, y=10):
        super(LayerBlock, self).__init__(id=layer.name, x=x, y=y)
        self.layer = layer
        self.inputs = OrderedDict([('input', None)])
        self.outputs = OrderedDict([('output', []), ('bias', []), ('weights',
                                                                   [])])

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(LayerBlock, self).to_json()
        json['class'] = 'LayerBlock'
        json['type'] = type(self.layer).__name__
        return json

    def eval(self, gs, ls, input):
        return self.layer.output


class VariableBlock(Block):
    """ An block representing an exposed variable """

    def __init__(self, name, value, x=10, y=10):
        super(VariableBlock, self).__init__(id=name, x=x, y=y)
        self.name = name
        self.value = value
        self.inputs = OrderedDict([])
        self.outputs = OrderedDict([('value', [])])

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(VariableBlock, self).to_json()
        json['class'] = 'VariableBlock'
        json['name'] = self.name
        return json

    def eval(self, gs, ls, input):
        return self.value


# Exposed variables
vars = {}
# Blocks of code
blocks = []
# Links between blocks
links = []


def saveData():
    with open('save/data.json', 'w') as outfile:
        bs = [b for b in blocks if not isinstance(b, LayerBlock)]
        ls = [l for l in links if l.implicit == False]
        obj = {'blocks': bs, 'links': ls}
        json.dump(obj, outfile, cls=MyJSONEncoder)


def parseDataObject(d):
    if 'class' not in d:
        return d

    # Only parse the blocks at this stage, because links have id refs to
    # the blocks, and we don't have all the blocks yet, so we can resolve the refs
    if d['class'] == 'CodeBlock':
        return CodeBlock(data=d)
    elif d['class'] == 'VariableBlock':
        return VariableBlock(
            name=d['name'], value=vars[d['name']], x=d['x'], y=d['y'])

    return d


def loadData():
    try:
        with open('save/data.json', 'r') as infile:
            global links
            global blocks
            # Parse all the code blocks from file
            data = json.load(infile, object_hook=parseDataObject)

            # Add the code blocks to the main blocks array
            blocks.extend(data['blocks'])

            # Parse the links, now that we have all the blocks ready
            for l in data['links']:
                fromBlock = next((b for b in blocks if b.id == l['fromId']),
                                 None)
                if fromBlock is None:
                    print('link_create: Invalid block id ' + l['fromId'])
                    return

                toBlock = next((b for b in blocks if b.id == l['toId']), None)
                if toBlock is None:
                    print('link_create: Invalid block id ' + l['toId'])
                    return

                fromPort = l['fromPort']
                toPort = l['toPort']

                link = Link(fromBlock, fromPort, toBlock, toPort)
                links.append(link)

                fromBlock.outputs[fromPort].append(link)
                toBlock.inputs[toPort] = link

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


# Get all data (blocks, links and variables)
@sio.on('data')
def getData():
    return {
        'blocks': blocks,
        'links': links,
        'vars': list(map(lambda kv: Variable(kv[0], kv[1]), vars.items()))
    }


# Creating a new block
@sio.on('block_create')
def addBlock(args):
    print(args)
    if 'code' in args:
        newBlock = CodeBlock(args['code'])
        blocks.append(newBlock)
        sio.emit('block_create', data=newBlock.to_json())
    elif 'var' in args:
        name = args['var']
        value = vars[name]
        newBlock = VariableBlock(name, value)
        blocks.append(newBlock)
        sio.emit('block_create', data=newBlock.to_json())
    saveData()


# Edit code of a block
@sio.on('block_change')
def editBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return

    if isinstance(block, CodeBlock) and 'code' in args:
        block.code = args['code']

    sio.emit('block_change', data=block.to_json())
    saveData()


# Move block around
@sio.on('block_move')
def moveBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return

    block.x = args['x']
    block.y = args['y']
    sio.emit('block_move', data=block.to_json())
    saveData()


# Deleting blocks
@sio.on('block_delete')
def deleteBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return

    # Remove all links to this block
    for portName in block.inputs:
        link = block.inputs[portName]
        if link is not None:
            link.fromBlock.outputs[link.fromPort].remove(link)
            links.remove(link)

    # Remove all links from this block
    for portName in block.outputs:
        for link in block.outputs[portName]:
            link.toBlock.inputs[link.toPort] = None
            links.remove(link)

    # Remove from blocks array
    blocks.remove(block)
    sio.emit('block_delete', data=block.to_json())
    saveData()


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

        # Return our results to the client
        return [None, res]
    except:
        # Return the error to the client
        return [tb.format_exc(), None]


# Creating a port
@sio.on('port_create')
def createPort(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        print('port_create: Invalid block id ' + args['id'])
        return

    portName = args['name']
    if args['input'] == True:
        if portName in block.inputs:
            print('port_create: Port name in use: ' + portName)
            return
        block.inputs[portName] = None
    else:
        if portName in block.outputs:
            print('port_create: Port name in use: ' + portName)
            return
        block.outputs[portName] = []

    sio.emit('port_create', data={'id': block.id, 'port': portName})
    saveData()


# Renaming a port
@sio.on('port_rename')
def renamePort(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        print('port_rename: Invalid block id ' + args['id'])
        return

    oldName = args['oldName']
    newName = args['newName']
    if args['input'] == True:
        block.inputs = OrderedDict([(newName, v) if k == oldName else (k, v)
                                    for k, v in block.inputs.items()])
        # block.inputs[newName] = block.inputs.pop(oldName, None)
    else:
        block.outputs = OrderedDict([(newName, v) if k == oldName else (k, v)
                                     for k, v in block.outputs.items()])
        # block.outputs[newName] = block.outputs.pop(oldName, None)

    sio.emit(
        'port_rename',
        data={
            'id': block.id,
            'port': newName,
            'oldName': oldName
        })
    saveData()


# Deleting a port
# TODO: Clean up the links that this port had
@sio.on('port_delete')
def deletePort(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        print('port_delete: Invalid block id ' + args['id'])
        return

    portName = args['name']
    if args['input'] == True:
        block.inputs.pop(portName, None)
    else:
        block.outputs.pop(portName, None)

    sio.emit('port_delete', data={'id': block.id, 'port': portName})
    saveData()


# Connecting blocks together
@sio.on('link_create')
def createLink(args):
    fromBlock = next((b for b in blocks if b.id == args['fromId']), None)
    if fromBlock is None:
        print('link_create: Invalid block id ' + args['fromId'])
        return

    toBlock = next((b for b in blocks if b.id == args['toId']), None)
    if toBlock is None:
        print('link_create: Invalid block id ' + args['toId'])
        return

    fromPort = args['fromPort']
    if fromPort not in fromBlock.outputs:
        print('link_create: Invalid output port ' + fromPort + ' on block ' +
              fromBlock.id)
        return
    toPort = args['toPort']
    if toPort not in toBlock.inputs:
        print('link_create: Invalid input port ' + toPort + ' on block ' +
              toBlock.id)
        return

    alreadyHas = next((l for l in fromBlock.outputs[fromPort]
                       if l.toBlock == toBlock and l.toPort == toPort), None)
    if alreadyHas is not None:
        print('link_create: ' + fromBlock.id + ' already connects to ' +
              toBlock.id + ' from port ' + fromPort + ' to port ' + toPort)
        return

    link = Link(fromBlock, fromPort, toBlock, toPort)
    links.append(link)

    fromBlock.outputs[fromPort].append(link)
    # TODO: Remove any previously existing links on the in port
    toBlock.inputs[toPort] = link

    sio.emit('link_create', data=link.to_json())
    saveData()


# Disconnecting blocks
@sio.on('link_delete')
def deleteLink(args):
    global links

    # Find link
    link = next((l for l in links if l.id == args['id']), None)
    if link is None:
        print('link_delete: Invalid link id ' + args['id'])
        return

    # Remove link from blocks
    link.toBlock.inputs[link.toPort] = None
    link.fromBlock.outputs[link.fromPort].remove(link)

    # Delete link
    links.remove(link)
    sio.emit('link_delete', data=link.to_json())
    saveData()


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
    done = {}
    for layer in model.layers:
        # Find the next layer by looking for a layer with the same 'input' as this 'output'
        p = next((l.name for l in model.layers if l.output == layer.input),
                 None)
        prev = next((b for b in blocks if b.id == p), None)

        # Find the previous layer by looking for a layer with the same 'output' as this 'input'
        n = next((l.name for l in model.layers if l.input == layer.output),
                 None)
        nxt = next((b for b in blocks if b.id == n), None)

        for b in blocks:
            if b.id == layer.name:
                if prev is not None and (prev.id + '-' + b.id) not in done:
                    link = Link(prev, 'output', b, 'input', implicit=True)
                    links.append(link)
                    b.inputs['input'] = link
                    prev.outputs['output'].append(link)
                    done[(prev.id + '-' + b.id)] = link
                if nxt is not None and (b.id + '-' + nxt.id) not in done:
                    link = Link(b, 'output', nxt, 'input', implicit=True)
                    links.append(link)
                    b.outputs['output'].append(link)
                    nxt.inputs['input'] = link
                    done[b.id + '-' + nxt.id] = link
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


def start():
    """ Start our webserver and return the socket.io 
    client to which we can attach our own events """

    # We wait with loading blocks until here so that the model layers
    # are exposed, because they might be referenced in one of the
    # code blocks 'next' or 'prev' arrays
    loadData()

    def thread_run():
        sio.run(app, port=8080)

    thread = Thread(target=thread_run)
    thread.start()

    return sio
