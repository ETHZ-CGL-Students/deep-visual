import * as Konva from 'konva';
import * as React from 'react';
import { Group, Line, Rect, Text } from 'react-konva';

import { LayerBlock } from '.';
import { socket } from '../../SocketIO';
// import { Heatmap } from '../Heatmap';

export interface Props {
	model: Model;
}

interface OwnState {
	popup: {
		tensor?: Tensor;
		layer?: Layer;
		x: number;
		y: number;
	} | null;
	ref: Konva.Group | null;
	weights: Float32Array[];
}

export class ModelBlock extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			popup: null,
			ref: null,
			weights: []
		};
	}

	handleLayerclick(layer: Layer, x: number, y: number): void {
		if (this.state.popup && layer === this.state.popup.layer) {
			this.setState({ popup: null });
		} else {
			socket.emit('layer', layer.name, (data: ArrayBuffer) => {
				const info = new Int32Array(data, 0, 2);
				const l = info[0];
				const w = info[1];

				const d = new Float32Array(data, 8);
				const ds: Float32Array[] = [];
				for (let i = 0; i < l; i++) {
					ds.push(d.slice(i * w, (i + 1) * w));
				}
				this.setState({
					weights: ds
				});
			});

			this.setState({
				popup: {
					layer,
					x,
					y
				}
			});
		}
	}

	handleTensorClick(layer: Layer, tensor: Tensor, x: number, y: number): void {
		if (this.state.popup && tensor === this.state.popup.tensor) {
			this.setState({ popup: null });
		} else {
			this.setState({
				popup: {
					tensor,
					x,
					y
				}
			});
		}
	}

	render() {
		const { model } = this.props;
		const { popup, ref, weights } = this.state;

		const lines: JSX.Element[] = [];
		for (let i = 0; i < model.layers.length - 1; i++) {
			lines.push(
				<Line
					key={i}
					points={[
						10 + 110 + i * 130,
						50 + 70,
						10 + 10 + (i + 1) * 130,
						50 + 70
					]}
					stroke="red"
					strokeWidth={5}
					lineCap="round"
					lineJoin="round"
					tension={1}
				/>
			);
		}

		return (
			<Group
				draggable
				ref={r => {
					if (r && !this.state.ref) {
						this.setState({ ref: r as any });
					}
				}}
			>
				<Rect
					width={model.layers.length * 130 + 10}
					height={160}
					fill="lightblue"
					stroke="gray"
					strokeWidth={2}
				/>
				<Text text={model.name} x={5} y={5} />
				<Text text={model.type} x={5} y={20} />

				{lines}

				{model.layers.map((layer, i) => (
					<LayerBlock
						key={layer.name}
						layer={layer}
						x={10 + i * 130}
						y={50}
						onLayerClick={(l, x, y) => this.handleLayerclick(l, x, y)}
						onLayerTensorClick={(l, t, x, y) =>
							this.handleTensorClick(l, t, x, y)
						}
					/>
				))}

				{popup && (
					<Group
						x={popup.x}
						y={popup.y}
						offsetX={ref ? ref.x() : 0}
						offsetY={ref ? ref.y() : 0}
					>
						<Rect fill="white" stroke="black" width={200} height={80} />
						{popup.layer && <Text text={popup.layer.name} x={2} y={2} />}
						{popup.tensor && <Text text={popup.tensor.name} x={2} y={2} />}
						{popup.layer && weights.length ? (
							<Text text={'' + weights[0]} x={2} y={22} />
						) : (
							<Text text="Loading..." x={2} y={22} />
						)}
					</Group>
				)}
			</Group>
		);
	}
}
