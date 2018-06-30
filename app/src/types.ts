export interface Block {
	class: 'LayerBlock' | 'CodeBlock' | 'VariableBlock' | 'EvalBlock';
	id: string;
	x: number;
	y: number;
	inputs: string[];
	outputs: string[];
	error: string;
	out: any;
}

export interface Link {
	id: string;
	implicit: boolean;
	fromId: string;
	fromPort: string;
	toId: string;
	toPort: string;
}

export interface LayerBlock extends Block {
	type: string;
}
export function isLayer(block: Block): block is LayerBlock {
	return block.class === 'LayerBlock';
}

export interface VariableBlock extends Block {
	name: string;
}
export function isVar(block: Block): block is VariableBlock {
	return block.class === 'VariableBlock';
}

export interface CodeBlock extends Block {
	code: string;
}
export function isCode(block: Block): block is CodeBlock {
	return block.class === 'CodeBlock';
}

export interface EvalBlock extends Block {}
export function isEval(block: Block): block is EvalBlock {
	return block.class === 'EvalBlock';
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
