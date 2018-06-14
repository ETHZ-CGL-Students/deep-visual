import * as React from 'react';
import styled from 'styled-components';

import { socket } from '../../services/socket';
import { Layer, Model, Tensor } from '../../types';
import { readMatrixFromBuffer } from '../Util';

import { BlockComp, BlockProps } from '.';
import { LayerBlock } from './LayerBlock';
// import { Heatmap } from '../Heatmap';

const MENU_WIDTH = 200;

const Wrapper = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
`;

const Popup = styled.div`
	position: absolute;
	max-width: 600px;
	max-height: 300px;
	padding: 10px;
	z-index: 100;
	background-color: white;
	border: 1px solid black;
	overflow: scroll;
`;

const Table = styled.table`
	margin: 0;
	padding: 0;
	border-collapse: collapse;
`;

const Td = styled.td`
	min-width: 10px;
	height: 10px;
	border-collapse: collapse;
`;

export interface Props extends BlockProps {
	block: Model;
}

interface OwnState {
	popup: {
		tensor?: Tensor;
		layer?: Layer;
		x: number;
		y: number;
	} | null;
	loading: boolean;
	weights: number[][];
	evals: number[][];
}

export class ModelBlock extends BlockComp<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			popup: null,
			loading: false,
			weights: [],
			evals: []
		};
	}

	handleLayerclick(layer: Layer, event: React.MouseEvent<HTMLElement>): void {
		if (this.state.popup && layer === this.state.popup.layer) {
			this.setState({ popup: null });
			return;
		}

		this.setState({ loading: true, weights: [] });

		socket.emit('layer', layer.name, (data: ArrayBuffer) => {
			const mat = readMatrixFromBuffer(data);

			this.setState({
				loading: false,
				weights: mat
			});
		});

		this.setState({
			popup: {
				layer,
				x: event.clientX - MENU_WIDTH,
				y: event.clientY
			}
		});
	}

	handleTensorClick(
		layer: Layer,
		tensor: Tensor,
		event: React.MouseEvent<HTMLElement>
	): void {
		if (this.state.popup && tensor === this.state.popup.tensor) {
			this.setState({ popup: null });
			return;
		}

		this.setState({ loading: true, evals: [] });

		socket.emit(
			'eval',
			this.props.block.layers.indexOf(layer),
			layer.input === tensor,
			(data: ArrayBuffer) => {
				const mat = readMatrixFromBuffer(data);

				this.setState({
					loading: false,
					evals: mat
				});
			}
		);

		this.setState({
			popup: {
				tensor,
				x: event.clientX - MENU_WIDTH,
				y: event.clientY
			}
		});
	}

	renderContent() {
		const { block } = this.props;
		const { popup, loading, weights, evals } = this.state;

		return (
			<>
				<div>Name: {block.name}</div>
				<div>Type: {block.type}</div>

				<Wrapper>
					{block.layers.map((layer, i) => (
						<LayerBlock
							key={layer.name}
							layer={layer}
							onLayerClick={(l, e) => this.handleLayerclick(l, e)}
							onLayerTensorClick={(l, t, e) => this.handleTensorClick(l, t, e)}
						/>
					))}
				</Wrapper>

				{popup && (
					<Popup style={{ left: popup.x, top: popup.y }}>
						{popup.layer ? (
							!loading ? (
								weights.length ? (
									<>
										<div>
											Shape: {weights.length} x {weights[0].length}
										</div>
										{this.renderData(weights)}
									</>
								) : (
									'No data'
								)
							) : (
								'Loading...'
							)
						) : null}
						{popup.tensor ? (
							<>
								<div>
									Shape:{' '}
									{popup.tensor.shape.dims.map(d => (d ? d : '?')).join(' x ')}
								</div>
								{!loading
									? evals.length
										? this.renderData(evals)
										: 'No data'
									: 'Loading...'}
							</>
						) : null}
					</Popup>
				)}
			</>
		);
	}

	renderData(data: number[][]) {
		return (
			<Table>
				<tbody>
					{data
						.slice(0, 10)
						.map((ds, i) => (
							<tr key={i}>
								{ds
									.slice(0, 10)
									.map((d, j) => (
										<Td
											key={j}
											style={{ background: `hsl(${240 - d * 240}, 100%, 50%)` }}
										/>
									))}
							</tr>
						))}
				</tbody>
			</Table>
		);
	}
}
