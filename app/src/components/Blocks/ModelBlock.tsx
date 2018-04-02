import * as Konva from 'konva'
import * as React from 'react'
import { Group, Line, Rect, Text } from 'react-konva'

import { LayerBlock } from '.'

export interface Props {
	model: Model,
	onModelSelect: (model: Model) => void
	onModelUnselect: (model: Model) => void
}

interface OwnState {
	popup: { tensor: Tensor, x: number, y: number } | null
	ref: Konva.Group | null
	selected: boolean
}

export class ModelBlock extends React.Component<Props, OwnState> {

	constructor(props: Props) {
		super(props)

		this.state = {
			popup: null,
			ref: null,
			selected: false,
		}
	}

	handleTensorClick(layer: Layer, tensor: Tensor, x: number, y: number): void {
		if (this.state.popup && tensor === this.state.popup.tensor) {
			this.setState({ popup: null })
		} else {
			this.setState({
				popup: {
					tensor,
					x,
					y,
				}
			})
		}
	}

	handleClick() {
		this.setState({
			selected: !this.state.selected
		})
		if (this.state.selected) {
			this.props.onModelUnselect(this.props.model)
		} else {
			this.props.onModelSelect(this.props.model)
		}
	}

	render() {
		const { model } = this.props
		const { popup, ref, selected } = this.state

		const lines: JSX.Element[] = []
		for (let i = 0; i < model.layers.length - 1; i++) {
			lines.push(
				<Line
					key={i}
					points={[10 + 110 + i * 130, 50 + 70, 10 + 10 + (i + 1) * 130, 50 + 70]}
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
				ref={r => { if (r && !this.state.ref) { this.setState({ ref: r as any }) } }}
				onClick={() => this.handleClick()}
			>
				<Rect
					width={model.layers.length * 130 + 10}
					height={160}
					fill="lightblue"
					stroke={selected ? 'black' : 'gray'}
					strokeWidth={selected ? 4 : 2}
				/>
				<Text text={model.name} x={5} y={5} />
				<Text text={model.type} x={5} y={20} />

				{lines}

				{model.layers.map((layer, i) =>
					<LayerBlock
						key={layer.name}
						layer={layer}
						x={10 + i * 130}
						y={50}
						onLayerTensorClick={(l, t, x, y) => this.handleTensorClick(l, t, x, y)}
					/>
				)}

				{popup &&
					<Group x={popup.x} y={popup.y} offsetX={ref ? ref.x() : 0} offsetY={ref ? ref.y() : 0}>
						<Rect fill="white" stroke="black" width={200} height={80} />
						<Text text={popup.tensor.name} x={2} y={2} />
					</Group>
				}
			</Group>
		)
	}
}
