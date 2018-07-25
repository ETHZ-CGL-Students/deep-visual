export interface Block {
	class: 'LayerBlock' | 'CodeBlock' | 'VariableBlock' | 'VisualBlock' | 'ExplainBlock';
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

export interface VisualBlock extends CodeBlock {}
export function isVisual(block: Block): block is VisualBlock {
	return block.class === 'VisualBlock';
}

export interface ExplainBlock extends CodeBlock {
	inputTensor: string;
	targetSlice: string;
}
export function isExplain(block: Block): block is ExplainBlock {
	return block.class === 'ExplainBlock';
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
