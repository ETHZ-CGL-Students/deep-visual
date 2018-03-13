import * as React from 'react'
import { Circle, Group, Text } from 'react-konva'

interface Props {
	isOutput?: boolean
	tensor: Tensor
	[x: string]: any
}

export class TensorBlock extends React.Component<Props> {

	render() {
		const { tensor, isOutput, ...rest } = this.props

		return (
			<Group {...rest}>
				<Circle radius={5} fill="black" />
				<Text text={'<' + tensor.shape.dims.join(', ') + '>'} x={isOutput ? -50 : 10} y={-6} />
			</Group>
		)
	}
}
