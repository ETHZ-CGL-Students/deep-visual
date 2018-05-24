import * as openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:8080');

export { socket };
