import * as React from 'react'
import { Group, Rect, Text } from 'react-konva'

import { TensorBlock } from '.'

interface Props {
	layer: Layer
	[x: string]: any
}

export class LayerBlock extends React.Component<Props> {

	render() {
		const { layer, ...rest } = this.props

		return (
			<Group {...rest}>
				<Rect
					width={150}
					height={100}
					fill="orange"
				/>
				<Text text={layer.name} />
				<Text text={layer.type} y={15} />

				<TensorBlock
					tensor={layer.input}
					x={10}
					y={50}
				/>

				<TensorBlock
					isOutput
					tensor={layer.output}
					x={140}
					y={50}
				/>
			</Group>
		)
	}
}
