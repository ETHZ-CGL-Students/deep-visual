import * as Konva from 'konva'
import * as React from 'react'
import { Group, Rect, Text } from 'react-konva'

interface Props {
	variable: Variable
	dragBoundFunc: (pos: Konva.Vector2d) => { x: number, y: number }
}

export class VariableBlock extends React.Component<Props> {

	render() {
		const { variable } = this.props

		return (
			<Group
				draggable
				dragBoundFunc={this.props.dragBoundFunc}
			>
				<Rect
					key={variable.name}
					width={80}
					height={50}
					fill="yellow"
				/>
				<Text text={variable.name} />
				<Text text={variable.type} offsetY={-15} />
				<Text text={JSON.stringify(variable.value)} offsetY={-30} />
			</Group>
		)
	}
}
