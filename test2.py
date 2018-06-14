import keras
import os
import time
import numpy as np
import tensorflow as tf
from threading import Thread

from keras.datasets import mnist
from keras.models import Sequential, Model, load_model
from keras.optimizers import RMSprop
from keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, Flatten

from socketio_server import expose_model, expose_variables, serialize_matrix, FitCallback, sio

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

# Expose our model to the web
expose_model(model)
# Expose our local variables
expose_variables(locals())

graph = tf.get_default_graph()


# This is called to evaluate on a tensor
@sio.on('eval')
def eval(layer=-1, input=True):
    # Use 'with' to switch to the correct graph, because of threading
    with graph.as_default():
        output = model.layers[layer].input if (input == True) else (
            model.layers[layer].output)
        nmodel = Model(inputs=[model.input], outputs=[output])
        nmodel.compile(
            loss='categorical_crossentropy',
            optimizer=RMSprop(),
            metrics=['accuracy'])
        res = nmodel.predict(
            x=np.array([x_test[0]]), batch_size=batch_size, verbose=1)
        return serialize_matrix(res)


# The function that is run to train the keras model, from a separate thread
def run_train():
    # Use 'with' to switch to the correct graph, because of threading
    with graph.as_default():
        model.fit(
            x_train,
            y_train,
            batch_size=batch_size,
            epochs=epochs,
            verbose=1,
            validation_data=(x_test, y_test),
            callbacks=[FitCallback()])
        score = model.evaluate(x_test, y_test, verbose=1)
        print('Test loss:', score[0])
        print('Test accuracy:', score[1])


# This is called to train the model
@sio.on('start')
def train():
    thread = Thread(target=run_train)
    thread.start()


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
