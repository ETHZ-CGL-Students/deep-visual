import * as Konva from 'konva'
import * as React from 'react'
import { Group, Line, Rect, Text } from 'react-konva'

import { LayerBlock } from '.'

interface Props {
	model: Model
	dragBoundFunc: (pos: Konva.Vector2d) => { x: number, y: number }
}

export class ModelBlock extends React.Component<Props> {

	render() {
		const { model } = this.props

		const lines: React.ReactNode[] = []
		for (let i = -1; i < model.layers.length; i++) {
			lines.push(
				<Line
					points={[20 + 140 + i * 170, 40 + 50, 20 + 10 + (i + 1) * 170, 40 + 50]}
					stroke="red"
					strokeWidth={5}
					lineCap="round"
					lineJoin="round"
					tension={1}
				/>
			)
		}

		return (
			<Group
				draggable
				dragBoundFunc={this.props.dragBoundFunc}
			>
				<Rect
					width={model.layers.length * 170 + 20}
					height={160}
					fill="lightblue"
				/>
				<Text text={model.name} />
				<Text text={model.type} y={15} />

				{model.layers.map((layer, i) =>
					<LayerBlock
						key={layer.name}
						layer={layer}
						x={20 + i * 170}
						y={40}
					/>
				)}

				{lines}
			</Group>
		)
	}
}
