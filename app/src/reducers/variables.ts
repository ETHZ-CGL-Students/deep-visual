import { AppAction } from '../actions';
import { TypeKeys } from '../actions/variables';
import { Variable } from '../types';

export interface VariablesState {
	variables: Variable[];
}

let initialState: VariablesState = {
	variables: []
};

export default (state = initialState, action: AppAction): VariablesState => {
	switch (action.type) {
		case TypeKeys.RESPOND_VARIABLES:
			return {
				...state,
				variables: action.vars
			};

		default:
			return state;
	}
};
