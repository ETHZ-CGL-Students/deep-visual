import * as io from 'socket.io-client';

import { readMatrixFromBuffer } from '../components/Util';
import { Block, Link, Variable } from '../types';

const socket = io('http://localhost:8080');

export type Listener = () => void;
export type EpochBeginListener = (epoch: number, epochs: number) => void;
export type BatchBeginListener = (batch: number, batches: number) => void;

export type BlockListener = (blocks: Block) => void;
export type BlocksListener = (blocks: Block[]) => void;

export type PortListener = (id: string, port: string) => void;
export type PortRenameListener = (
	id: string,
	port: string,
	oldName: string
) => void;

export type LinkListener = (link: Link) => void;

export type EvalListener = (
	id: string,
	blocks: { [x: string]: boolean }
) => void;

export type EvalCallback = (evalId: string, blocks: {[blockId: string]: Object|false}) => void;
export type DataCallback = (blocks: Block[], links: Link[], vars: Variable[]) => void;

class API {
	connect: Listener[] = [];
	disconnect: Listener[] = [];

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

	evalResult: EvalListener[] = [];

	connected = false;

	constructor() {
		// Subscribe to events
		socket.on('connect', () => {
			this.connected = true;
			this.connect.forEach(l => l());
		});
		socket.on('disconnect', () => {
			this.connected = false;
			this.disconnect.forEach(l => l());
		});

		socket.on('train_begin', () => this.trainBegin.forEach(l => l()));
		socket.on('train_end', () => this.trainEnd.forEach(l => l()));
		socket.on(
			'epoch_begin',
			({ epoch, epochs }: { epoch: number; epochs: number }) =>
				this.epochBegin.forEach(l => l(epoch, epochs))
		);
		socket.on(
			'batch_begin',
			({ batch, batches }: { batch: number; batches: number }) =>
				this.batchBegin.forEach(l => l(batch, batches))
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
		socket.on('eval_results', (data: any) =>
			this.evalResult.forEach(l => l(data.id, data.blocks))
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

	// Main events
	onConnet(listener: Listener) {
		this.connect.push(listener);
	}
	onDisconnet(listener: Listener) {
		this.disconnect.push(listener);
	}

	// Training events
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

	// Eval
	onEvalResults(listener: EvalListener) {
		this.evalResult.push(listener);
	}

	getData(callback: DataCallback) {
		socket.emit('data', (data: any) => {
			return callback(data.blocks, data.links, data.vars);
		});
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
	evalBlock(id: string) {
		socket.emit('block_eval', { id });
	}

	evalAllBlocks() {
		socket.emit('block_eval_all');
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

	getResults(
		id: string,
		blockId: string,
		callback: (err: string | null, out: any) => void
	) {
		socket.emit('eval_get', { id, blockId }, (data: any) => {
			if (data[0]) {
				console.error(data[0]);
				return callback(data[0], null);
			}
			if (data[1] instanceof ArrayBuffer) {

				callback(null, readMatrixFromBuffer(data[1]));
			} else {
				callback(data[0], data[1]);
			}
		});
	}

	startTraining() {
		socket.emit('train_start');
	}
}

export default new API();
