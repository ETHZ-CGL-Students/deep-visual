class JsonHandler(tornado.web.RequestHandler):
	def prepare(self):
		self.set_header("Access-Control-Allow-Origin", "*")
		self.set_header("Access-Control-Allow-Method", "OPTIONS, GET, PUT, POST, DELETE")
		self.set_header("Content-Type", "application/json; charset=UTF-8")

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

		self.write("<form method='GET'><select name='i' onchange='this.form.submit()'>")
		self.write("<option value=''>-Wrong predictions</option>")
		for i in range(0, len(wrongs)):
			self.write("<option value='{0}'>#{0}</option>".format(wrongs[i]))
		self.write("</select></form>")

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

class DataHandler(JsonHandler):
	def get(self):
		obj = {}
		obj["wrongs"] = wrongs
		obj["numTests"] = len(mnist.test.images)
		json.dump(obj, self, cls=MyEncoder)

class TestHandler(JsonHandler):
	def get(self, idx):
		obj = {}

		index = int(idx)
		if (index < 0 or index >= len(mnist.test.images)):
			json.dump({ "error": "Invalid index" }, self, cls=MyEncoder)
			return

		img = mnist.test.images[index]
		labels = mnist.test.labels[index]

		obj["svg"] = "<svg width='280' height='280'>"
		for i in range(0, len(img)):
			obj["svg"] += "<rect x='{0}' y='{1}' width='10' height='10' style='fill:rgb({2:.0f},{2:.0f},{2:.0f})' />".format((i % 28) * 10, math.floor(i / 28) * 10, round((1 - img[i]) * 255))
		obj["svg"] += "</svg>"

		obj["labels"] = labels
		obj["correctLabel"] = numpy.argmax(labels)

		res, resSoft = sess.run([y_conv, tf.nn.softmax(y_conv)], feed_dict={x: [img], keep_prob: 1})
		res = res[0]
		resSoft = resSoft[0]

		obj["predictions"] = res
		obj["predictionsSoftMax"] = resSoft
		obj["predictedLabel"] = numpy.argmax(res)

		json.dump(obj, self, cls=MyEncoder)
		self.set_header("Content-Type", "application/json")




print("Running tests...")

#correct_prediction = tf.equal(tf.argmax(y,1), tf.argmax(y_,1))
correct_prediction = tf.equal(tf.argmax(y_conv, 1), tf.argmax(y_, 1))
accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))

acc, res = sess.run([accuracy, y_conv], feed_dict={x: mnist.test.images, y_: mnist.test.labels, keep_prob: 1})
print("Accuracy: {0}".format(acc))

print("Collecting wrong predictions...")
wrongs = []
for i in range(0, len(res)):
	sol = numpy.argmax(mnist.test.labels[i])
	if (sol != numpy.argmax(res[i])):
		wrongs.append(i)