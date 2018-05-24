import graphene

from graphene.types import Scalar
from tornadoql.tornadoql import TornadoQL, PORT

primitive = (int, str, bool)


def is_primitive(thing):
    return type(thing) in primitive


def is_excluded(thing):
    return not is_primitive(thing)


class DataValue(Scalar):
    @staticmethod
    def serialize(data):
        if is_primitive(data):
            return data
        return None

    @staticmethod
    def parse_literal(node):
        return None

    @staticmethod
    def parse_value(value):
        return None


class Variable(graphene.ObjectType):
    name = graphene.String(required=True)
    type = graphene.String(required=True)
    value = graphene.Field(DataValue)

    def resolve_type(self, info):
        return type(self.value).__name__


class TensorShape(graphene.ObjectType):
    dims = graphene.List(graphene.String)
    nDims = graphene.String()


class TensorVariable(graphene.ObjectType):
    name = graphene.String()
    type = graphene.String()
    shape = graphene.Field(TensorShape)

    def resolve_type(self, info):
        return self.dtype.as_numpy_dtype.__name__


class Tensor(graphene.ObjectType):
    name = graphene.String()
    type = graphene.String()
    shape = graphene.Field(TensorShape)

    def resolve_type(self, info):
        return self.dtype.as_numpy_dtype.__name__


class Layer(graphene.ObjectType):
    name = graphene.String()
    type = graphene.String()
    config = graphene.JSONString()
    weights = graphene.List(graphene.List(graphene.Float))
    input = graphene.Field(Tensor)
    output = graphene.Field(Tensor)

    def resolve_type(self, info):
        return type(self).__name__

    def resolve_weights(self, info):
        ws = self.get_weights()
        for x in ws:
            print(x)
            return x
        # return None

    def resolve_config(self, info):
        return self.get_config()


class Model(graphene.ObjectType):
    var = graphene.String()
    name = graphene.String()
    type = graphene.String()
    config = graphene.JSONString()
    layers = graphene.List(Layer)
    inputs = graphene.List(Tensor)
    outputs = graphene.List(Tensor)
    layer = graphene.Field(Layer, name=graphene.String())

    def resolve_layer(self, info, name=None):
        for layer in self.layers:
            if (layer.name == name):
                return layer
        return None

    def resolve_type(self, info):
        return type(self).__name__

    def resolve_config(self, info):
        return self.get_config()


def expose_model(model):
    class Query(graphene.ObjectType):
        getModel = graphene.Field(Model)

        def resolve_getModel(self, info, name=None, var=None):
            return model

    schema = graphene.Schema(query=Query)

    print('GraphQL server starting on %s' % PORT)
    TornadoQL.start(schema)

    return session
