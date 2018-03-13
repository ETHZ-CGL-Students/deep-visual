# -*- coding: utf-8 -*-

import tensorflow as tf
import tornado.ioloop
import tornado.web
import math
import numpy
import os.path
import json
import graphene
from types import ModuleType

from graphene.types import Scalar
from graphql.language import ast

from tornadoql.tornadoql import TornadoQL, PORT

from keras.engine.topology import Container
from keras.models import Sequential
from keras.layers import Dense

# from tensorflow.examples.tutorials.mnist import input_data
# mnist = input_data.read_data_sets("MNIST_data/", one_hot=True)

# def weight_variable(shape):
# 	initial = tf.truncated_normal(shape, stddev=0.1)
# 	return tf.Variable(initial)

# def bias_variable(shape):
# 	initial = tf.constant(0.1, shape=shape)
# 	return tf.Variable(initial)

# def conv2d(x, W):
# 	return tf.nn.conv2d(x, W, strides=[1, 1, 1, 1], padding='SAME')

# def max_pool_2x2(x):
# 	return tf.nn.max_pool(x, ksize=[1, 2, 2, 1], strides=[1, 2, 2, 1], padding='SAME')

# class MyEncoder(json.JSONEncoder):
# 	def default(self, obj):
# 		if isinstance(obj, numpy.integer):
# 			return int(obj)
# 		elif isinstance(obj, numpy.floating):
# 			return float(obj)
# 		elif isinstance(obj, numpy.ndarray):
# 			return obj.tolist()
# 		else:
# 			return super(MyEncoder, self).default(obj)

# x = tf.placeholder(tf.float32, [None, 784])
# #W = tf.Variable(tf.zeros([784, 10]))
# #b = tf.Variable(tf.zeros([10]))

# x_image = tf.reshape(x, [-1, 28, 28, 1])

# W_conv1 = weight_variable([5, 5, 1, 32])
# b_conv1 = bias_variable([32])

# h_conv1 = tf.nn.relu(conv2d(x_image, W_conv1) + b_conv1)
# h_pool1 = max_pool_2x2(h_conv1)

# W_conv2 = weight_variable([5, 5, 32, 64])
# b_conv2 = bias_variable([64])

# h_conv2 = tf.nn.relu(conv2d(h_pool1, W_conv2) + b_conv2)
# h_pool2 = max_pool_2x2(h_conv2)

# W_fc1 = weight_variable([7 * 7 * 64, 1024])
# b_fc1 = bias_variable([1024])

# h_pool2_flat = tf.reshape(h_pool2, [-1, 7*7*64])
# h_fc1 = tf.nn.relu(tf.matmul(h_pool2_flat, W_fc1) + b_fc1)

# keep_prob = tf.placeholder(tf.float32)
# h_fc1_drop = tf.nn.dropout(h_fc1, keep_prob)

# W_fc2 = weight_variable([1024, 10])
# b_fc2 = bias_variable([10])

# #y = tf.matmul(x, W) + b
# y_conv = tf.matmul(h_fc1_drop, W_fc2) + b_fc2

# y_ = tf.placeholder(tf.float32, [None, 10])

# #loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(labels=y_, logits=y))
# #train_step = tf.train.GradientDescentOptimizer(0.5).minimize(loss)
# loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(labels=y_, logits=y_conv))
# train_step = tf.train.AdamOptimizer(1e-4).minimize(loss)
# saver = tf.train.Saver()

primitive = (int, str, bool)
def is_primitive(thing):
	return type(thing) in primitive

def is_excluded(thing):
	return not is_primitive(thing) and not isinstance(thing, Container)

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
	name = graphene.String(required = True)
	type = graphene.String(required = True)
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
	weights = graphene.List(TensorVariable)
	input = graphene.Field(Tensor)
	output = graphene.Field(Tensor)

	def resolve_type(self, info):
		return type(self).__name__
	def resolve_config(self, info):
		return self.get_config()

class Model(graphene.ObjectType):
	name = graphene.String()
	type = graphene.String()
	config = graphene.JSONString()
	layers = graphene.List(Layer)
	inputs = graphene.List(Tensor)
	outputs = graphene.List(Tensor)

	def resolve_type(self, info):
		return type(self).__name__
	def resolve_config(self, info):
		return self.get_config()

class Query(graphene.ObjectType):
	getVars = graphene.List(Variable)
	getModels = graphene.List(Model)

	def resolve_getVars(self, info):
		vars = []
		for name, value in list(globals().items()):
			if (is_excluded(value) or not is_primitive(value)):
				continue

			vars.append(Variable(name = name, value = value))
		return vars

	def resolve_getModels(self, info):
		vars = []
		for name, value in list(globals().items()):
			if (is_excluded(value) or is_primitive(value)):
				continue
			vars.append(value)
		return vars

schema = graphene.Schema(query = Query)

model = Sequential()
model.add(Dense(units=32, activation='relu', input_dim=100))
model.add(Dense(units=10, activation='softmax'))
model.add(Dense(units=32, activation='relu'))
model.add(Dense(units=10, activation='softmax'))
model.compile(loss='categorical_crossentropy', optimizer='sgd', metrics=['accuracy'])

# with tf.Session() as sess:
# 	sess.run(tf.global_variables_initializer())

# 	if os.path.isfile("save/model.ckpt.index"):
# 		saver.restore(sess, "save/model.ckpt")
# 		print("Restored model from file!")
# 	else:
# 		for step in range(20000):
# 			batch_xs, batch_ys = mnist.train.next_batch(200)
# 			_, loss_val = sess.run([train_step, loss], feed_dict={x: batch_xs, y_: batch_ys, keep_prob: 0.5})
# 			if step % 100 == 0:
# 				print("Step: {}, Loss: {}".format(step, loss_val))
# 		save_path = saver.save(sess, "save/model.ckpt")
# 		print("Model saved in file: %s" % save_path)

print("Ready!")

def main():
	print('GraphQL server starting on %s' % PORT)
	TornadoQL.start(schema)

if __name__ == "__main__":
	main()
