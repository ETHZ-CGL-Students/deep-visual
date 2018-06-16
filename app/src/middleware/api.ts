import { normalize } from 'normalizr';
import { Dispatch, MiddlewareAPI } from 'redux';

import { AppAction } from '../actions';
import {
	respondChange,
	respondConnect,
	respondCreate,
	respondList,
	respondMove,
	TypeKeys as CodeTypeKeys
} from '../actions/code';
import { socket } from '../services/socket';
import { AppState, BlockSchema, CodeBlock } from '../types';

export default ({ dispatch }: MiddlewareAPI<Dispatch<AppAction>, AppState>) => (
	next: Dispatch<AppAction>
) => (action: AppAction): any => {
	next(action);

	switch (action.type) {
		case CodeTypeKeys.LIST_REQUEST:
			socket.emit('code', (blocks: CodeBlock[]) => {
				console.log(blocks);
				const data = normalize(blocks, [BlockSchema]);
				dispatch(respondList(data.entities.blocks));
			});
			break;

		case CodeTypeKeys.CREATE_REQUEST:
			socket.emit('code_create', action.code, (block: CodeBlock) => {
				const data = normalize(block, BlockSchema);
				dispatch(respondCreate(data.entities.blocks));
			});
			break;

		case CodeTypeKeys.CHANGE_REQUEST:
			socket.emit(
				'code_change',
				{ id: action.id, code: action.code },
				(block: CodeBlock) => {
					const data = normalize(block, BlockSchema);
					dispatch(respondChange(data.entities.blocks));
				}
			);
			break;

		case CodeTypeKeys.MOVE_REQUEST:
			socket.emit(
				'code_move',
				{ id: action.id, x: action.x, y: action.y },
				(block: CodeBlock) => {
					const data = normalize(block, BlockSchema);
					dispatch(respondMove(data.entities.blocks));
				}
			);
			break;

		case CodeTypeKeys.CONNECT_REQUEST:
			socket.emit(
				'code_connect',
				{ from: action.from, to: action.to },
				(block: CodeBlock) => {
					const data = normalize(block, [BlockSchema]);
					dispatch(respondConnect(data.entities.blocks));
				}
			);
			break;

		case CodeTypeKeys.DELETE_REQUEST:
			socket.emit('code_delete', { id: action.id }, (block: CodeBlock) => {
				// TODO: Process deletion
			});
			break;

		default:
			break;
	}
};
