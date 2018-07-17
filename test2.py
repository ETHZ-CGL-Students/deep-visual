import keras
import os
import eventlet
import time
import numpy as np
import tensorflow as tf

from keras.datasets import mnist
from keras.models import Sequential, Model, load_model
from keras.optimizers import RMSprop
from keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, Flatten

from socketio_server import expose_model, expose_variables, start, FitCallback

# -- Test model #1
# if os.path.isfile("save/model.h5"):
#     model = load_model("save/model.h5")
# else:
batch_size = 256
num_classes = 10
epochs = 20

# the data, split between train and test sets
(x_train, y_train), (x_test, y_test) = mnist.load_data()

x_train = x_train.reshape(60000, 784)
x_test = x_test.reshape(10000, 784)
x_train = x_train.astype('float32')
x_test = x_test.astype('float32')
x_train /= 255
x_test /= 255
print(x_train.shape[0], 'train samples')
print(x_test.shape[0], 'test samples')

# convert class vectors to binary class matrices
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

model = Sequential()
model.add(Dense(512, activation='relu', input_shape=(784, )))
model.add(Dropout(0.2))
model.add(Dense(512, activation='relu'))
model.add(Dropout(0.2))
model.add(Dense(num_classes, activation='softmax'))


model.compile(
    loss='categorical_crossentropy', optimizer=RMSprop(), metrics=['accuracy'])

model.evaluate(x_test, y_test, verbose=1)

model.summary()

graph = tf.get_default_graph()

# Expose our model to the web
expose_model(model)
# Expose our local variables
expose_variables(locals())

# Start the web-app
start()

# Fit our model
model.fit(x_train, y_train, verbose=False,
          epochs=epochs, callbacks=[FitCallback()])

# time.sleep(30)
# model.fit(
#     x_train,
#     y_train,
#     batch_size=batch_size,
#     epochs=epochs,
#     verbose=1,
#     validation_data=(x_test, y_test),
#     callbacks=[FitCallback()])
# score = model.evaluate(x_test, y_test, verbose=0)
# print('Test loss:', score[0])
# print('Test accuracy:', score[1])
# # model.save("save/model.h5")
