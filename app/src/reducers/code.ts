import { AppAction } from '../actions';
import { TypeKeys as CodeTypeKeys } from '../actions/code';
import { CodeBlock } from '../types';

const merge = require('lodash.merge');

export interface CodeState {
	blocks: { [x: string]: CodeBlock };
}

let initialState: CodeState = {
	blocks: {}
};

export default (state = initialState, action: AppAction): CodeState => {
	switch (action.type) {
		case CodeTypeKeys.LIST_RESPONSE:
		case CodeTypeKeys.CREATE_RESPONSE:
		case CodeTypeKeys.CHANGE_RESPONSE:
		case CodeTypeKeys.MOVE_RESPONSE:
		case CodeTypeKeys.CONNECT_RESPONSE:
			return {
				...state,
				blocks: merge({}, state.blocks, action.blocks)
			};

		default:
			return state;
	}
};
