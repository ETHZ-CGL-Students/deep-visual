import { AppAction } from '../actions';
import { TypeKeys } from '../actions/blocks';
import { Block } from '../types';

export interface BlocksState {
	keys: string[];
	blocks: { [x: string]: Block };
}

let initialState: BlocksState = {
	keys: [],
	blocks: {}
};

export default (state = initialState, action: AppAction): BlocksState => {
	switch (action.type) {
		case TypeKeys.BLOCKS_RESPONSE:
			const keys =
				typeof action.data.result === 'string'
					? [action.data.result]
					: action.data.result;

			return {
				keys: state.keys
					.concat(keys)
					.filter((value, index, self) => self.indexOf(value) === index),
				blocks: Object.assign({}, state.blocks, action.data.entities.blocks)
			};

		case TypeKeys.DELETE_RESPONSE:
			// TODO: Remove block from 'prev' and 'next' references of other blocks
			return {
				...state,
				keys: state.keys.filter(k => k !== action.data.result)
			};

		case TypeKeys.EVAL_RESPONSE:
			return {
				...state,
				blocks: {
					...state.blocks,
					[action.block.id]: {
						...state.blocks[action.block.id],
						error: action.error,
						out: action.out
					}
				}
			};

		default:
			return state;
	}
};
