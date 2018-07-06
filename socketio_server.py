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
from keras import Model
from keras import backend as K
from keras.layers import Input, InputLayer
from keras.optimizers import RMSprop

eventlet.monkey_patch(socket=True)


class MyJSONEncoder(json.JSONEncoder):
    """ Custom json encoder to search for a 'to_json' method on objects """

    def default(self, obj):
        if hasattr(obj, 'to_json'):
            return obj.to_json()
        elif isinstance(obj, np.ndarray):
            return "<ndarray [" + ', '.join(map(str, obj.shape)) + "]>"
        return "<" + type(obj).__name__ + ">"


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
sio = SocketIO(app, json=MyJSONWrapper)


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

    if mat is None or len(mat) == 0:
        return ""

    # First get the size of each dim, and the amount of dims
    dims = mat.shape

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
        # Special handling for matrices to show dimensions
        if isinstance(value, np.ndarray):
            self.type = "ndarray [" + ", ".join(map(str, value.shape)) + "]"
        else:
            self.type = type(value).__name__

    def to_json(self):
        return {'name': self.name, 'type': self.type}


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
            'implicit': self.implicit,
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
    def eval(self, gs, inputs):
        """ Evaluate this block using the given input, returning the output"""
        return None


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

    def eval(self, gs, inputs):
        # Empty all outputs (if not already set - this allows
        # passing inputs by using the same port name)
        for k in self.outputs.keys():
            if k not in inputs:
                inputs[k] = None

        # Run our custom code
        with stdoutIO() as s:
            exec(self.code, gs, inputs)

        # Save the output ports of our execution
        outs = {}
        for k in self.outputs.keys():
            outs[k] = inputs[k]

        # Print statements to console. We could also return them or something...
        text = s.getvalue()
        if len(text) > 0:
            print(self.id + ': ' + text)

        # Return an object with our output ports
        return outs


class LayerBlock(Block):
    """ An block representing a layer of a model """

    def __init__(self, layer, x=10, y=10):
        super(LayerBlock, self).__init__(id=layer.name, x=x, y=y)
        self.layer = layer
        self.inputs = OrderedDict([
            ('input', None)
        ])
        self.outputs = OrderedDict([
            ('output', []),
            ('weights', [])
        ])

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(LayerBlock, self).to_json()
        json['class'] = 'LayerBlock'
        json['type'] = type(self.layer).__name__
        return json

    def eval(self, gs, inputs):
        x = inputs['input']
        if self.layer is None or x is None:
            return {
                'output': None,
                'weights': self.layer.get_weights()
            }

        with self.layer.output.graph.as_default():
            layerFunc = K.function(
                [self.layer.input] + [K.learning_phase()], [self.layer.output])
            return {
                'output': layerFunc(inputs=[x])[0],
                'weights': self.layer.get_weights()
            }


class VariableBlock(Block):
    """ An block representing an exposed variable """

    def __init__(self, name, value, x=10, y=10):
        super(VariableBlock, self).__init__(id=name, x=x, y=y)
        self.name = name
        self.value = value
        self.inputs = OrderedDict([
        ])
        self.outputs = OrderedDict([
            ('value', [])
        ])

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(VariableBlock, self).to_json()
        json['class'] = 'VariableBlock'
        json['name'] = self.name
        return json

    def eval(self, gs, inputs):
        return {'value': self.value}


class VisualBlock(Block):
    """ An block used to visualize data (usually matrices) """

    def __init__(self, id=None, x=10, y=10):
        super(VisualBlock, self).__init__(id=id, x=x, y=y)
        self.inputs = OrderedDict([
            ('input', None)
        ])
        # We add a fake output, which isn't shown in the frontend but allows
        # us to cache the result (=input) and send it as binary socket data
        # More advanced visualization blocks could also transform the data
        # on the server side this way
        self.outputs = OrderedDict([
            ('__output__', [])
        ])

    def to_json(self):
        """ This is called by our custom json serializer """

        json = super(VisualBlock, self).to_json()
        json['class'] = 'VisualBlock'
        return json

    def eval(self, gs, inputs):
        return {
            '__output__': inputs['input']
        }



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
    c = d['class']
    if c == 'CodeBlock':
        return CodeBlock(data=d)
    elif c == 'VariableBlock':
        return VariableBlock(
            name=d['name'], value=vars[d['name']], x=d['x'], y=d['y'])
    elif c == 'VisualBlock':
        return VisualBlock(id=d['id'], x=d['x'], y=d['y'])

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
                    print('load_data: Invalid block id ' + l['fromId'])
                    return

                toBlock = next((b for b in blocks if b.id == l['toId']), None)
                if toBlock is None:
                    print('load_data: Invalid block id ' + l['toId'])
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
    t = args['type']
    newBlock = None

    if t == 'code':
        newBlock = CodeBlock(args['code'])
    elif t == 'var':
        newBlock = VariableBlock(name=args['var'], value=vars[name])
    elif t == 'visual':
        newBlock = VisualBlock()

    if newBlock is not None:
        blocks.append(newBlock)
        sio.emit('block_create', data=newBlock)

        saveData()


# Edit code of a block
@sio.on('block_change')
def editBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return

    if isinstance(block, CodeBlock) and 'code' in args:
        block.code = args['code']

    sio.emit('block_change', data=block)
    saveData()


# Move block around
@sio.on('block_move')
def moveBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return

    block.x = args['x']
    block.y = args['y']
    sio.emit('block_move', data=block)
    saveData()


# Deleting blocks
@sio.on('block_delete')
def deleteBlock(args):
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        print('block_delete: Could not find block ' + args['id'])
        return

    if isinstance(block, LayerBlock):
        print('block_delete: Layer blocks cannot be deleted')
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
    sio.emit('block_delete', data=block)
    saveData()


# Evaluating a block (="running")
@sio.on('block_eval')
def evalBlock(args):
    global blocks

    # Find the code block by id
    block = next((b for b in blocks if b.id == args['id']), None)
    if block is None:
        return ['Invalid block']

    if isinstance(block, LayerBlock):
        return ['Cannot evaluate layer directly']

    print('Eval: ' + block.id)

    # Build our execution tree
    bs = [block]
    todo = [block]
    while len(todo) > 0:
        b = todo.pop()
        ins = list(
            map(lambda l: l.fromBlock,
                filter(lambda l: l is not None, b.inputs.values())))
        bs.extend(ins)
        todo.extend(ins)

    bs.reverse()
    outs = {}

    # Save our globals, they will be exposed to the block eval
    gs = globals()

    try:
        # Traverse the blocks
        for b in bs:
            # Collect inputs for this block
            inputs = {}

            # Set inputs from links
            for k, l in b.inputs.items():
                if l is None:
                    inputs[k] = None
                else:
                    inputs[k] = outs[l.fromBlock.id][l.fromPort]

            # Run the function
            out = b.eval(gs, inputs)

            # Save the output ports of our execution
            outs[b.id] = out

        # Get the output for the block we ran the eval socket.io event
        res = outs[block.id]

        # Return our results to the client
        # If the client clicked eval on a visual block then return binary data
        if isinstance(block, VisualBlock):
            return serialize_matrix(res['__output__'])
        else:
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

    sio.emit('link_create', data=link)
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

    if link.implicit is True:
        print('link_delete: Implicit links cannot be deleted')
        return

    # Remove link from blocks
    link.toBlock.inputs[link.toPort] = None
    link.fromBlock.outputs[link.fromPort].remove(link)

    # Delete link
    links.remove(link)
    sio.emit('link_delete', data=link)
    saveData()


def expose_model(model):
    """ Expose a model to the web clients """

    # Add all layers as blocks
    i = 0
    for layer in model.layers:
        blocks.append(LayerBlock(layer, x=i * 150))
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
