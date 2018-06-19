import { schema } from 'normalizr';

import { BlocksState } from './reducers/blocks';
import { VariablesState } from './reducers/variables';

export interface Block {
	id: string;
	type: 'Layer' | 'Code';
	x: number;
	y: number;
	prev: Block[];
	next: Block[];
}

export interface LayerBlock extends Block {
	layerType: string;
}

export function isLayer(block: Block): block is LayerBlock {
	return block.type === 'Layer';
}

export interface CodeBlock extends Block {
	code: string;
}

export function isCode(block: Block): block is CodeBlock {
	return block.type === 'Code';
}

export interface Layer {
	name: string;
	type: string;
	input: Tensor;
	output: Tensor;
}

export interface TensorShape {
	dims: string[];
}

export interface Tensor {
	name: string;
	type: string;
	shape: TensorShape;
}

export interface Variable {
	name: string;
	type: string;
}

export interface AppState {
	blocks: BlocksState;
	variables: VariablesState;
}

export const BlockSchema = new schema.Entity('blocks');

BlockSchema.define({
	prev: [BlockSchema],
	next: [BlockSchema]
});
