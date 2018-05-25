import keras
import os
import time
import numpy
import tensorflow as tf

from keras.datasets import mnist
from keras.models import Sequential, Model, load_model
from keras.optimizers import RMSprop
from keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, Flatten

from socketio_server import expose_model, FitCallback

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

model.summary()

sio = expose_model(model)

graph = tf.get_default_graph()


@sio.on('eval')
def eval():
    with graph.as_default():
        nmodel = Model(inputs=[model.input], outputs=[model.layers[1].output])
        nmodel.compile(
            loss='categorical_crossentropy',
            optimizer=RMSprop(),
            metrics=['accuracy'])
        print(nmodel.predict(x_test, batch_size=batch_size, verbose=1))


@sio.on('start')
def train():
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
