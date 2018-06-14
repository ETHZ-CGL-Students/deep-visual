import { Action } from 'redux';

import { CodeBlock } from '../types';

export enum TypeKeys {
	LIST_REQUEST = 'CB_LIST_REQUEST',
	LIST_RESPONSE = 'CB_LIST_RESPONSE',
	CREATE_REQUEST = 'CB_CREATE_REQUEST',
	CREATE_RESPONSE = 'CB_CREATE_RESPONSE',
	CHANGE_REQUEST = 'CB_CHANGE_REQUEST',
	CHANGE_RESPONSE = 'CB_CHANGE_RESPONSE',
	MOVE_REQUEST = 'CB_MOVE_REQUEST',
	MOVE_RESPONSE = 'CB_MOVE_RESPONSE',
	CONNECT_REQUEST = 'CB_CONNECT_REQUEST',
	CONNECT_RESPONSE = 'CB_CONNECT_RESPONSE',
	DELETE_REQUEST = 'CB_DELETE_REQUEST',
	DELETE_RESPONSE = 'CB_DELETE_RESPONSE'
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
	blocks: { [x: string]: CodeBlock };
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
	blocks: { [x: string]: CodeBlock };
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
	blocks: { [x: string]: CodeBlock };
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
	blocks: { [x: string]: CodeBlock };
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
	blocks: { [x: string]: CodeBlock };
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
	blocks: { [x: string]: CodeBlock };
}
export function respondConnect(blocks: any): ConnectResponseAction {
	return {
		type: TypeKeys.CONNECT_RESPONSE,
		blocks
	};
}

// Merge all actions
export type CodeAction =
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
	| DeleteResponseAction;
