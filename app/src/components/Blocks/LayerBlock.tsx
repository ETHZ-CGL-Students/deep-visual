import * as React from 'react';
import styled from 'styled-components';

import { TensorBlock } from '.';

const Wrapper = styled.div`
	position: relative;
	display: inline-block;
	width: 140px;
	height: 120px;
	margin: 10px;
	padding: 10px;
	background-color: orange;
	box-sizing: border-box;
`;

const Rect = styled.div`
	position: absolute;
	left: 60px;
	bottom: 10px;
	width: 20px;
	height: 20px;
	background-color: black;
`;

interface Props {
	layer: Layer;
	onLayerClick: (layer: Layer, event: React.MouseEvent<HTMLElement>) => void;
	onLayerTensorClick: (
		layer: Layer,
		tensor: Tensor,
		event: React.MouseEvent<HTMLElement>
	) => void;
}

export class LayerBlock extends React.Component<Props> {
	handleLayerClick(event: React.MouseEvent<HTMLElement>) {
		this.props.onLayerClick(this.props.layer, event);
	}

	handleTensorClick(tensor: Tensor, event: React.MouseEvent<HTMLElement>) {
		this.props.onLayerTensorClick(this.props.layer, tensor, event);
	}

	render() {
		const { layer } = this.props;

		return (
			<Wrapper>
				<div>Name: {layer.name}</div>
				<div>Type: {layer.type}</div>

				<Rect onClick={e => this.handleLayerClick(e)} />

				<TensorBlock
					tensor={layer.input}
					x={10}
					y={60}
					onClick={(t, e) => this.handleTensorClick(t, e)}
				/>

				<TensorBlock
					isOutput
					tensor={layer.output}
					x={10}
					y={60}
					onClick={(t, e) => this.handleTensorClick(t, e)}
				/>
			</Wrapper>
		);
	}
}
