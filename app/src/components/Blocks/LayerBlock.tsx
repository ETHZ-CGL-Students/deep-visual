import * as React from 'react';
import { Group, Rect, Text } from 'react-konva';

import { TensorBlock } from '.';

interface Props {
	layer: Layer;
	onLayerClick: (layer: Layer, x: number, y: number) => void;
	onLayerTensorClick: (
		layer: Layer,
		tensor: Tensor,
		x: number,
		y: number
	) => void;
	[x: string]: any;
}

export class LayerBlock extends React.Component<Props> {
	handleLayerClick(x: number, y: number) {
		this.props.onLayerClick(this.props.layer, x, y);
	}

	handleTensorClick(tensor: Tensor, x: number, y: number) {
		this.props.onLayerTensorClick(this.props.layer, tensor, x, y);
	}

	render() {
		const { layer, ...rest } = this.props;

		return (
			<Group {...rest}>
				<Rect width={120} height={100} fill="orange" />
				<Text text={layer.name} x={5} y={5} />
				<Text text={layer.type} x={5} y={20} />

				<Rect
					x={55}
					y={86}
					width={10}
					height={10}
					fill="black"
					onClick={e => this.handleLayerClick(e.evt.offsetX, e.evt.offsetY)}
				/>

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
		);
	}
}
