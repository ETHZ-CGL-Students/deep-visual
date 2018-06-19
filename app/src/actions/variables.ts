import { Action } from 'redux';

import { Variable } from '../types';

export enum TypeKeys {
	REQUEST_VARIABLES = 'REQUEST_VARIABLES',
	RESPOND_VARIABLES = 'RESPOND_VARIABLES'
}

export interface RequestVariablesAction extends Action {
	type: TypeKeys.REQUEST_VARIABLES;
}
export function requestVariables(): RequestVariablesAction {
	return {
		type: TypeKeys.REQUEST_VARIABLES
	};
}

export interface RespondVariablesAction extends Action {
	type: TypeKeys.RESPOND_VARIABLES;
	vars: Variable[];
}
export function respondVariables(vars: Variable[]): RespondVariablesAction {
	return {
		type: TypeKeys.RESPOND_VARIABLES,
		vars
	};
}

export type VariableAction = RequestVariablesAction | RespondVariablesAction;
