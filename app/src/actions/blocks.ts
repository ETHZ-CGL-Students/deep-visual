import { Action } from 'redux';

import { Block, CodeBlock } from '../types';

export enum TypeKeys {
	LIST_REQUEST = 'BLOCKS_LIST_REQUEST',
	CREATE_REQUEST = 'BLOCKS_CREATE_REQUEST',
	CHANGE_REQUEST = 'BLOCKS_CHANGE_REQUEST',
	MOVE_REQUEST = 'BLOCKS_MOVE_REQUEST',
	CONNECT_REQUEST = 'BLOCKS_CONNECT_REQUEST',
	DISCONNECT_REQUEST = 'BLOCKS_DISCONNECT_REQUEST',
	BLOCKS_RESPONSE = 'BLOCKS_RESPONSE',

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

export interface DisconnectRequestAction extends Action {
	type: TypeKeys.DISCONNECT_REQUEST;
	from: string;
	to: string;
}
export function requestDisconnect(
	from: string,
	to: string
): DisconnectRequestAction {
	return {
		type: TypeKeys.DISCONNECT_REQUEST,
		from,
		to
	};
}

export interface BlocksResponseAction extends Action {
	type: TypeKeys.BLOCKS_RESPONSE;
	data: {
		entities: { blocks: { [x: string]: Block } };
		result: string | string[];
	};
}
export function respondBlocks(data: any): BlocksResponseAction {
	return {
		type: TypeKeys.BLOCKS_RESPONSE,
		data
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
	data: {
		entities: { blocks: { [x: string]: Block } };
		result: string | string[];
	};
}
export function respondDelete(data: any): DeleteResponseAction {
	return {
		type: TypeKeys.DELETE_RESPONSE,
		data
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
	block: CodeBlock;
	error: string;
	out: any;
}
export function respondEval(
	block: CodeBlock,
	error: string,
	out: any
): EvalResponseAction {
	return {
		type: TypeKeys.EVAL_RESPONSE,
		block,
		error,
		out
	};
}

// Merge all actions
export type BlockAction =
	| ListRequestAction
	| CreateRequestAction
	| ChangeRequestAction
	| MoveRequestAction
	| ConnectRequestAction
	| DisconnectRequestAction
	| BlocksResponseAction
	| DeleteRequestAction
	| DeleteResponseAction
	| EvalRequestAction
	| EvalResponseAction;
