import * as React from 'react'
import { Group, Rect, Text } from 'react-konva'

import { TensorBlock } from '.'

interface Props {
	layer: Layer
	onLayerTensorClick: (layer: Layer, tensor: Tensor, x: number, y: number) => void
	[x: string]: any
}

export class LayerBlock extends React.Component<Props> {

	handleTensorClick(tensor: Tensor, x: number, y: number) {
		this.props.onLayerTensorClick(this.props.layer, tensor, x, y)
	}

	render() {
		const { layer, ...rest } = this.props

		return (
			<Group {...rest}>
				<Rect
					width={120}
					height={100}
					fill="orange"
				/>
				<Text text={layer.name} x={5} y={5} />
				<Text text={layer.type} x={5} y={20} />

				<TensorBlock
					tensor={layer.input}
					x={10}
					y={70}
					onClick={(t, x, y) => this.handleTensorClick(t, x, y)}
				/>

				<TensorBlock
					isOutput
					tensor={layer.output}
					x={110}
					y={70}
					onClick={(t, x, y) => this.handleTensorClick(t, x, y)}
				/>
			</Group>
		)
	}
}
