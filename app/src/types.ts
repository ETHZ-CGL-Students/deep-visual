import { schema } from 'normalizr';

import { CodeState } from './reducers/code';

export interface Block {
	id: string;
	x: number;
	y: number;
	prev: Block[];
	next: Block[];
}

export interface Model extends Block {
	name: string;
	type: string;
	layers: Layer[];
	inputs: Tensor[];
	outputs: Tensor[];
}

export function isModel(block: Block): block is Model {
	return (block as Model).type !== undefined;
}

export interface CodeBlock extends Block {
	id: string;
	code: string;
}

export function isCode(block: Block): block is CodeBlock {
	return (block as CodeBlock).code !== undefined;
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
	code: CodeState;
}

export const BlockSchema = new schema.Entity('blocks');

BlockSchema.define({
	prev: [BlockSchema],
	next: [BlockSchema]
});
