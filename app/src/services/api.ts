import * as openSocket from 'socket.io-client';

import { readMatrixFromBuffer } from '../components/Util';
import { Block, Link, Variable } from '../types';

const socket = openSocket('http://localhost:8080');

export type Listener = () => void;
export type SetParamsListener = (epochs: number, batches: number) => void;
export type EpochBeginListener = (epoch: number) => void;
export type BatchBeginListener = (batch: number) => void;
export type BlockListener = (blocks: Block[]) => void;

class API {
	setParams: SetParamsListener[] = [];
	trainBegin: Listener[] = [];
	trainEnd: Listener[] = [];
	epochBegin: EpochBeginListener[] = [];
	batchBegin: BatchBeginListener[] = [];
	blockCreate: BlockListener[] = [];
	blockChange: BlockListener[] = [];
	blockMove: BlockListener[] = [];
	blockDelete: BlockListener[] = [];
	blockConnect: BlockListener[] = [];
	blockDisconnect: BlockListener[] = [];

	constructor() {
		// Subscribe to events
		socket.on('set_params', (data: any) => {
			const batches = Math.ceil(data.samples / data.batch_size);
			this.setParams.forEach(l => l(data.epochs, batches));
		});
		socket.on('train_begin', () => this.trainBegin.forEach(l => l()));
		socket.on('train_end', () => this.trainEnd.forEach(l => l()));
		socket.on('epoch_begin', (epoch: number) =>
			this.epochBegin.forEach(l => l(epoch))
		);
		socket.on('batch_begin', (batch: number) =>
			this.epochBegin.forEach(l => l(batch))
		);

		socket.on('block_create', (block: Block) =>
			this.blockCreate.forEach(l => l([block]))
		);
		socket.on('block_change', (block: Block) =>
			this.blockChange.forEach(l => l([block]))
		);
		socket.on('block_move', (block: Block) =>
			this.blockMove.forEach(l => l([block]))
		);
		socket.on('block_delete', (block: Block) =>
			this.blockDelete.forEach(l => l([block]))
		);
		socket.on('block_connect', (blocks: Block[]) =>
			this.blockConnect.forEach(l => l(blocks))
		);
		socket.on('block_disconnect', (blocks: Block[]) =>
			this.blockDisconnect.forEach(l => l(blocks))
		);
	}

	// Training events
	onSetParams(listener: SetParamsListener) {
		this.setParams.push(listener);
	}
	onTrainBegin(listener: Listener) {
		this.trainBegin.push(listener);
	}
	onTrainEnd(listener: Listener) {
		this.trainEnd.push(listener);
	}
	onEpochBegin(listener: EpochBeginListener) {
		this.epochBegin.push(listener);
	}
	onBatchBegin(listener: BatchBeginListener) {
		this.batchBegin.push(listener);
	}

	// Block events
	on(
		event:
			| 'blockCreate'
			| 'blockChange'
			| 'blockMove'
			| 'blockDelete'
			| 'blockConnect'
			| 'blockDisconnect',
		listener: BlockListener
	) {
		this[event].push(listener);
	}

	getData(
		callback: (
			{
				blocks,
				links,
				vars
			}: { blocks: Block[]; links: Link[]; vars: Variable[] }
		) => void
	) {
		socket.emit('data', callback);
	}

	createBlock(code: string) {
		socket.emit('block_create', { code });
	}
	changeBlock(id: string, code: string) {
		socket.emit('block_change', { id, code });
	}
	moveBlock(id: string, x: number, y: number) {
		socket.emit('block_move', { id, x, y });
	}
	deleteBlock(id: string) {
		socket.emit('block_delete', { id });
	}
	evalBlock(id: string, callback: (err: string, out: any) => void) {
		socket.emit('block_eval', { id }, ([err, out]: [string, any]) => {
			console.log(err);
			let res = out;
			if (out instanceof ArrayBuffer) {
				res = readMatrixFromBuffer(out);
			}
			console.log(res);
			callback(err, res);
		});
	}

	createPort(id: string, input: boolean, name: string) {
		socket.emit('port_create', { id, input, name });
	}
	renamePort(id: string, input: boolean, oldName: string, newName: string) {
		socket.emit('port_rename', { id, input, oldName, newName });
	}
	deletePort(id: string, input: boolean, name: string) {
		socket.emit('port_delete', { id, input, name });
	}

	createLink(fromId: string, fromPort: string, toId: string, toPort: string) {
		socket.emit('link_create', { fromId, fromPort, toId, toPort });
	}
	deleteLink(id: string) {
		socket.emit('link_delete', { id });
	}

	startTraining() {
		socket.emit('train_start');
	}
}

export default new API();
