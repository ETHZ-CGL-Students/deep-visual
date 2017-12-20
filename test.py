import tensorflow as tf
import tornado.ioloop
import tornado.web
import math
import numpy

from tensorflow.examples.tutorials.mnist import input_data
mnist = input_data.read_data_sets("MNIST_data/", one_hot=True)

def weight_variable(shape):
	initial = tf.truncated_normal(shape, stddev=0.1)
	return tf.Variable(initial)

def bias_variable(shape):
	initial = tf.constant(0.1, shape=shape)
	return tf.Variable(initial)

def conv2d(x, W):
	return tf.nn.conv2d(x, W, strides=[1, 1, 1, 1], padding='SAME')

def max_pool_2x2(x):
	return tf.nn.max_pool(x, ksize=[1, 2, 2, 1], strides=[1, 2, 2, 1], padding='SAME')

x = tf.placeholder(tf.float32, [None, 784])
#W = tf.Variable(tf.zeros([784, 10]))
#b = tf.Variable(tf.zeros([10]))

x_image = tf.reshape(x, [-1, 28, 28, 1])

W_conv1 = weight_variable([5, 5, 1, 32])
b_conv1 = bias_variable([32])

h_conv1 = tf.nn.relu(conv2d(x_image, W_conv1) + b_conv1)
h_pool1 = max_pool_2x2(h_conv1)

W_conv2 = weight_variable([5, 5, 32, 64])
b_conv2 = bias_variable([64])

h_conv2 = tf.nn.relu(conv2d(h_pool1, W_conv2) + b_conv2)
h_pool2 = max_pool_2x2(h_conv2)

W_fc1 = weight_variable([7 * 7 * 64, 1024])
b_fc1 = bias_variable([1024])

h_pool2_flat = tf.reshape(h_pool2, [-1, 7*7*64])
h_fc1 = tf.nn.relu(tf.matmul(h_pool2_flat, W_fc1) + b_fc1)

keep_prob = tf.placeholder(tf.float32)
h_fc1_drop = tf.nn.dropout(h_fc1, keep_prob)

W_fc2 = weight_variable([1024, 10])
b_fc2 = bias_variable([10])

#y = tf.matmul(x, W) + b
y_conv = tf.matmul(h_fc1_drop, W_fc2) + b_fc2

y_ = tf.placeholder(tf.float32, [None, 10])

#loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(labels=y_, logits=y))
#train_step = tf.train.GradientDescentOptimizer(0.5).minimize(loss)
loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(labels=y_, logits=y_conv))
train_step = tf.train.AdamOptimizer(1e-4).minimize(loss)

sess = tf.InteractiveSession()
tf.global_variables_initializer().run()

for step in range(1000):
	batch_xs, batch_ys = mnist.train.next_batch(100)
	_, loss_val = sess.run([train_step, loss], feed_dict={x: batch_xs, y_: batch_ys, keep_prob: 0.5})
	if step % 100 == 0:
		print("Step: {}, Loss: {}".format(step, loss_val))

#correct_prediction = tf.equal(tf.argmax(y,1), tf.argmax(y_,1))
correct_prediction = tf.equal(tf.argmax(y_conv, 1), tf.argmax(y_, 1))
accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))

print(sess.run(accuracy, feed_dict={x: mnist.test.images, y_: mnist.test.labels, keep_prob: 1}))

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.write("<!DOCTYPE html><html><head></head><body>")

		iMax = len(mnist.test.images) - 1
		index = int(self.get_argument("i", 0))
		if (index < 0 or index > iMax):
			self.redirect("?i=0")
			return

		self.write("<form method='GET'>")
		self.write("<input name='i' type='number' min='0' max='{0}' value={1}>"
			.format(iMax, index))
		self.write("<input type='submit' value='Show' /></form>")

		self.write("<div style='display: inline-block'>")
		self.write("<svg width='280' height='280'>")
		img = mnist.test.images[index]
		for i in range(0, len(img)):
			self.write("<rect x='{0}' y='{1}' width='10' height='10' style='fill:rgb({2:.0f},{2:.0f},{2:.0f})' />".format((i % 28) * 10, math.floor(i / 28) * 10, round((1 - img[i]) * 255)))
		self.write("</svg></div>")

		self.write("<div style='display: inline-block'><h1>Labels</h1>")
		self.write("<table><thead><tr><th>Index</th><th>Value</th></tr></thead><tbody>")
		labels = mnist.test.labels[index]
		pred = numpy.argmax(labels)
		for i in range(0, len(labels)):
			self.write("<tr style='background-color:{0};'><td>{1}</td><td>{2}</td></tr>"
				.format("green" if pred == i else "transparent", i, labels[i]))
		self.write("</tbody></table></div>")

		res, resSoft = sess.run([y_conv, tf.nn.softmax(y_conv)], feed_dict={x: [img], keep_prob: 1})
		res = res[0]
		resSoft = resSoft[0]
		resPred = numpy.argmax(res)
		self.write("<div style='display: inline-block'><h1>Prediction</h1>")
		self.write("<table><thead><tr><th>Index</th><th>Value</th><th>Softmax</th></tr></thead><tbody>")
		for i in range(0, len(res)):
			self.write("<tr style='background-color:{0};'><td>{1}</td><td>{2: .10f}</td><td>{3: 1.10f}</td></tr>"
				.format(("green" if resPred == pred else "orange") if resPred == i else 
					("yellow" if resSoft[i] > resSoft[resPred] / 2 else "transparent"), i, res[i], resSoft[i]))
		self.write("</tbody></table></div>")

		#self.write("<h1>B</h1>")
		#bs = b.eval(sess)
		#for val in bs:
		#	self.write("{}, ".format(val))

		#self.write("<h1>W</h1>")
		#ws = W.eval(sess)
		#for row in ws:
		#	for val in row:
		#		self.write("{}, ".format(val))

		self.write("</body></html>")

def make_app():
	return tornado.web.Application([
		(r"/", MainHandler),
	])

if __name__ == "__main__":
	app = make_app()
	app.listen(8888)
	tornado.ioloop.IOLoop.current().start()
