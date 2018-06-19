import { Action } from 'redux';

export enum TypeKeys {
	TRAIN_START = 'TRAIN_START',
	TRAIN_SET_PARAMS = 'TRAIN_SET_PARAMS',
	TRAIN_BEGIN = 'TRAIN_BEGIN',
	TRAIN_END = 'TRAIN_END',
	EPOCH_BEGIN = 'EPOCH_BEGIN',
	BATCH_BEGIN = 'BATCH_BEGIN'
}

export interface TrainStartAction extends Action {
	type: TypeKeys.TRAIN_START;
}
export function startTrain(): TrainStartAction {
	return {
		type: TypeKeys.TRAIN_START
	};
}

export interface TrainSetParamsAction extends Action {
	type: TypeKeys.TRAIN_SET_PARAMS;
	epochs: number;
	batches: number;
}
export function setTrainParams(
	epochs: number,
	batches: number
): TrainSetParamsAction {
	return {
		type: TypeKeys.TRAIN_SET_PARAMS,
		epochs,
		batches
	};
}

export interface TrainBeginAction extends Action {
	type: TypeKeys.TRAIN_BEGIN;
}
export function beginTrain(): TrainBeginAction {
	return {
		type: TypeKeys.TRAIN_BEGIN
	};
}

export interface TrainEndAction extends Action {
	type: TypeKeys.TRAIN_END;
}
export function endTrain(): TrainEndAction {
	return {
		type: TypeKeys.TRAIN_END
	};
}

export interface EpochBeginAction extends Action {
	type: TypeKeys.EPOCH_BEGIN;
	epoch: number;
}
export function beginEpoch(epoch: number): EpochBeginAction {
	return {
		type: TypeKeys.EPOCH_BEGIN,
		epoch
	};
}

export interface BatchBeginAction extends Action {
	type: TypeKeys.BATCH_BEGIN;
	batch: number;
}
export function beginBatch(batch: number): BatchBeginAction {
	return {
		type: TypeKeys.BATCH_BEGIN,
		batch
	};
}

// Merge all actions
export type TrainAction =
	| TrainStartAction
	| TrainSetParamsAction
	| TrainBeginAction
	| TrainEndAction
	| EpochBeginAction
	| BatchBeginAction;
