
interface TensorShape {
	dims: string[]
}

interface Tensor {
	name: string
	type: string
	shape: TensorShape
}

interface Variable {
	id: number
	name: string
	type: string
	value: string | number | null
}

interface Layer {
	name: string
	type: string
	input: Tensor
	output: Tensor
}

interface Model {
	id: number
	name: string
	type: string
	layers: Layer[]
	inputs: Tensor[]
	outputs: Tensor[]
}
