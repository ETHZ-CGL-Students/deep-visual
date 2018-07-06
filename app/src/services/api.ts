import * as openSocket from 'socket.io-client';

import { readMatrixFromBuffer } from '../components/Util';
import { Block, Link, Variable } from '../types';

const socket = openSocket('http://localhost:8080');

export type Listener = () => void;
export type SetParamsListener = (epochs: number, batches: number) => void;
export type EpochBeginListener = (epoch: number) => void;
export type BatchBeginListener = (batch: number) => void;

export type BlockListener = (blocks: Block) => void;
export type BlocksListener = (blocks: Block[]) => void;

export type PortListener = (id: string, port: string) => void;
export type PortRenameListener = (
	id: string,
	port: string,
	oldName: string
) => void;

export type LinkListener = (link: Link) => void;

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

	portCreate: PortListener[] = [];
	portRename: PortRenameListener[] = [];
	portDelete: PortListener[] = [];

	linkCreate: LinkListener[] = [];
	linkDelete: LinkListener[] = [];

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
			this.blockCreate.forEach(l => l(block))
		);
		socket.on('block_change', (block: Block) =>
			this.blockChange.forEach(l => l(block))
		);
		socket.on('block_move', (block: Block) =>
			this.blockMove.forEach(l => l(block))
		);
		socket.on('block_delete', (block: Block) =>
			this.blockDelete.forEach(l => l(block))
		);

		socket.on('port_create', ({ id, port }: { id: string; port: string }) =>
			this.portCreate.forEach(l => l(id, port))
		);
		socket.on(
			'port_rename',
			({ id, port, oldName }: { id: string; port: string; oldName: string }) =>
				this.portRename.forEach(l => l(id, port, oldName))
		);
		socket.on('port_delete', ({ id, port }: { id: string; port: string }) =>
			this.portDelete.forEach(l => l(id, port))
		);

		socket.on('link_create', (link: Link) =>
			this.linkCreate.forEach(l => l(link))
		);
		socket.on('link_delete', (link: Link) =>
			this.linkDelete.forEach(l => l(link))
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
	onBlockCreate(listener: BlockListener) {
		this.blockCreate.push(listener);
	}
	onBlockChange(listener: BlockListener) {
		this.blockChange.push(listener);
	}
	onBlockMove(listener: BlockListener) {
		this.blockMove.push(listener);
	}
	onBlockDelete(listener: BlockListener) {
		this.blockDelete.push(listener);
	}

	// Port events
	onPortCreate(listener: PortListener) {
		this.portCreate.push(listener);
	}
	onPortRename(listener: PortRenameListener) {
		this.portRename.push(listener);
	}
	onPortDelete(listener: PortListener) {
		this.portDelete.push(listener);
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

	createBlock(args: {
		type: 'code' | 'var' | 'visual';
		code?: string;
		var?: string;
	}) {
		socket.emit('block_create', args);
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
	evalBlock(id: string, callback: (err: string | null, out: any) => void) {
		socket.emit('block_eval', { id }, (data: any) => {
			console.log(data);
			if (data instanceof ArrayBuffer) {
				callback(null, readMatrixFromBuffer(data));
			} else {
				callback(data[0], data[1]);
			}
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
