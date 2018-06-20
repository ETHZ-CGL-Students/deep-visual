import { normalize } from 'normalizr';
import { Dispatch, MiddlewareAPI } from 'redux';
import * as openSocket from 'socket.io-client';

import { AppAction } from '../actions';
import {
	respondBlocks,
	respondDelete,
	respondEval,
	TypeKeys as BlockTypeKeys
} from '../actions/blocks';
import {
	beginBatch,
	beginEpoch,
	beginTrain,
	endTrain,
	setTrainParams
} from '../actions/train';
import {
	respondVariables,
	TypeKeys as VariablesTypeKeys
} from '../actions/variables';
import { readMatrixFromBuffer } from '../components/Util';
import { store } from '../store';
import { AppState, Block, BlockSchema, CodeBlock, Variable } from '../types';

const socket = openSocket('http://localhost:8080');

// Subscribe to events
socket.on('set_params', (data: any) =>
	store.dispatch(
		setTrainParams(data.epochs, Math.ceil(data.samples / data.batch_size))
	)
);
socket.on('train_begin', () => store.dispatch(beginTrain()));
socket.on('train_end', () => store.dispatch(endTrain()));
socket.on('epoch_begin', (epoch: number) => store.dispatch(beginEpoch(epoch)));
socket.on('batch_begin', (batch: number) => store.dispatch(beginBatch(batch)));

socket.on('block_create', (block: Block) => {
	const data = normalize(block, BlockSchema);
	store.dispatch(respondBlocks(data));
});
socket.on('block_change', (block: Block) => {
	const data = normalize(block, BlockSchema);
	store.dispatch(respondBlocks(data));
});
socket.on('block_move', (block: Block) => {
	const data = normalize(block, BlockSchema);
	store.dispatch(respondBlocks(data));
});
socket.on('block_connect', (blocks: Block[]) => {
	const data = normalize(blocks, [BlockSchema]);
	store.dispatch(respondBlocks(data));
});
socket.on('block_disconnect', (blocks: Block[]) => {
	const data = normalize(blocks, [BlockSchema]);
	store.dispatch(respondBlocks(data));
});
socket.on('block_delete', (block: Block) => {
	const data = normalize(block, BlockSchema);
	store.dispatch(respondDelete(data));
});

export default ({ dispatch }: MiddlewareAPI<Dispatch<AppAction>, AppState>) => (
	next: Dispatch<AppAction>
) => (action: AppAction): any => {
	next(action);

	switch (action.type) {
		case VariablesTypeKeys.REQUEST_VARIABLES:
			socket.emit('variables', (vars: Variable[]) => {
				dispatch(respondVariables(vars));
			});
			break;

		case BlockTypeKeys.LIST_REQUEST:
			socket.emit('block_list', (blocks: CodeBlock[]) => {
				const data = normalize(blocks, [BlockSchema]);
				dispatch(respondBlocks(data));
			});
			break;

		case BlockTypeKeys.CREATE_REQUEST:
			socket.emit('block_create', { code: action.code });
			break;

		case BlockTypeKeys.CHANGE_REQUEST:
			socket.emit('block_change', { id: action.id, code: action.code });
			break;

		case BlockTypeKeys.MOVE_REQUEST:
			socket.emit('block_move', { id: action.id, x: action.x, y: action.y });
			break;

		case BlockTypeKeys.CONNECT_REQUEST:
			socket.emit('block_connect', { from: action.from, to: action.to });
			break;

		case BlockTypeKeys.DISCONNECT_REQUEST:
			socket.emit('block_disconnect', { from: action.from, to: action.to });
			break;

		case BlockTypeKeys.EVAL_REQUEST:
			socket.emit(
				'block_eval',
				{ id: action.block.id },
				([err, out]: [string, any]) => {
					console.log(err);
					let res = out;
					if (out instanceof ArrayBuffer) {
						res = readMatrixFromBuffer(out);
					}
					console.log(res);
					dispatch(respondEval(action.block, err, res));
				}
			);
			break;

		case BlockTypeKeys.DELETE_REQUEST:
			socket.emit('block_delete', { id: action.id });
			break;

		default:
			break;
	}
};
