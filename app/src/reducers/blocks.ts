import { AppAction } from '../actions';
import { TypeKeys } from '../actions/blocks';
import { Block } from '../types';

const merge = require('lodash.merge');

export interface BlocksState {
	blocks: { [x: string]: Block };
}

let initialState: BlocksState = {
	blocks: {}
};

export default (state = initialState, action: AppAction): BlocksState => {
	switch (action.type) {
		case TypeKeys.LIST_RESPONSE:
		case TypeKeys.CREATE_RESPONSE:
		case TypeKeys.CHANGE_RESPONSE:
		case TypeKeys.MOVE_RESPONSE:
		case TypeKeys.CONNECT_RESPONSE:
			return {
				...state,
				blocks: merge({}, state.blocks, action.blocks)
			};

		default:
			return state;
	}
};
