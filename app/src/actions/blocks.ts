import { Action } from 'redux';

import { Block, CodeBlock } from '../types';

export enum TypeKeys {
	LIST_REQUEST = 'BLOCKS_LIST_REQUEST',
	LIST_RESPONSE = 'BLOCKS_LIST_RESPONSE',
	CREATE_REQUEST = 'BLOCKS_CREATE_REQUEST',
	CREATE_RESPONSE = 'BLOCKS_CREATE_RESPONSE',
	CHANGE_REQUEST = 'BLOCKS_CHANGE_REQUEST',
	CHANGE_RESPONSE = 'BLOCKS_CHANGE_RESPONSE',
	MOVE_REQUEST = 'BLOCKS_MOVE_REQUEST',
	MOVE_RESPONSE = 'BLOCKS_MOVE_RESPONSE',
	CONNECT_REQUEST = 'BLOCKS_CONNECT_REQUEST',
	CONNECT_RESPONSE = 'BLOCKS_CONNECT_RESPONSE',
	DELETE_REQUEST = 'BLOCKS_DELETE_REQUEST',
	DELETE_RESPONSE = 'BLOCKS_DELETE_RESPONSE',
	EVAL_REQUEST = 'BLOCKS_EVAL_REQUEST',
	EVAL_RESPONSE = 'BLOCKS_EVAL_RESPONSE'
}

export interface ListRequestAction extends Action {
	type: TypeKeys.LIST_REQUEST;
}
export function requestList(): ListRequestAction {
	return {
		type: TypeKeys.LIST_REQUEST
	};
}

export interface ListResponseAction extends Action {
	type: TypeKeys.LIST_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondList(blocks: any): ListResponseAction {
	return {
		type: TypeKeys.LIST_RESPONSE,
		blocks
	};
}

export interface CreateRequestAction extends Action {
	type: TypeKeys.CREATE_REQUEST;
	code: string;
}
export function requestCreate(code: string): CreateRequestAction {
	return {
		type: TypeKeys.CREATE_REQUEST,
		code
	};
}

export interface CreateResponseAction extends Action {
	type: TypeKeys.CREATE_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondCreate(blocks: any): CreateResponseAction {
	return {
		type: TypeKeys.CREATE_RESPONSE,
		blocks
	};
}

export interface ChangeRequestAction extends Action {
	type: TypeKeys.CHANGE_REQUEST;
	id: string;
	code: string;
}
export function requestChange(id: string, code: string): ChangeRequestAction {
	return {
		type: TypeKeys.CHANGE_REQUEST,
		id,
		code
	};
}

export interface ChangeResponseAction extends Action {
	type: TypeKeys.CHANGE_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondChange(blocks: any): ChangeResponseAction {
	return {
		type: TypeKeys.CHANGE_RESPONSE,
		blocks
	};
}

export interface MoveRequestAction extends Action {
	type: TypeKeys.MOVE_REQUEST;
	id: string;
	x: number;
	y: number;
}
export function requestMove(
	id: string,
	x: number,
	y: number
): MoveRequestAction {
	return {
		type: TypeKeys.MOVE_REQUEST,
		id,
		x,
		y
	};
}

export interface MoveResponseAction extends Action {
	type: TypeKeys.MOVE_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondMove(blocks: any): MoveResponseAction {
	return {
		type: TypeKeys.MOVE_RESPONSE,
		blocks
	};
}

export interface DeleteRequestAction extends Action {
	type: TypeKeys.DELETE_REQUEST;
	id: string;
}
export function requestDelete(id: string): DeleteRequestAction {
	return {
		type: TypeKeys.DELETE_REQUEST,
		id
	};
}

export interface DeleteResponseAction extends Action {
	type: TypeKeys.DELETE_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondDelete(blocks: any): DeleteResponseAction {
	return {
		type: TypeKeys.DELETE_RESPONSE,
		blocks
	};
}

export interface ConnectRequestAction extends Action {
	type: TypeKeys.CONNECT_REQUEST;
	from: string;
	to: string;
}
export function requestConnect(from: string, to: string): ConnectRequestAction {
	return {
		type: TypeKeys.CONNECT_REQUEST,
		from,
		to
	};
}

export interface ConnectResponseAction extends Action {
	type: TypeKeys.CONNECT_RESPONSE;
	blocks: { [x: string]: Block };
}
export function respondConnect(blocks: any): ConnectResponseAction {
	return {
		type: TypeKeys.CONNECT_RESPONSE,
		blocks
	};
}

export interface EvalRequestAction extends Action {
	type: TypeKeys.EVAL_REQUEST;
	block: CodeBlock;
}
export function requestEval(block: CodeBlock): EvalRequestAction {
	return {
		type: TypeKeys.EVAL_REQUEST,
		block
	};
}

export interface EvalResponseAction extends Action {
	type: TypeKeys.EVAL_RESPONSE;
	data: any;
}
export function respondEval(data: any): EvalResponseAction {
	return {
		type: TypeKeys.EVAL_RESPONSE,
		data
	};
}

// Merge all actions
export type BlockAction =
	| ListRequestAction
	| ListResponseAction
	| CreateRequestAction
	| CreateResponseAction
	| ChangeRequestAction
	| ChangeResponseAction
	| MoveRequestAction
	| MoveResponseAction
	| ConnectRequestAction
	| ConnectResponseAction
	| DeleteRequestAction
	| DeleteResponseAction
	| EvalRequestAction
	| EvalResponseAction;
