import * as React from 'react';
import Draggable from 'react-draggable';
import styled from 'styled-components';

import { LayerBlock } from '.';
import { socket } from '../../SocketIO';
// import { Heatmap } from '../Heatmap';

const Wrapper = styled.div`
	position: relative;
	display: inline-block;
	padding: 10px;
	background-color: lightgrey;
	box-sizing: border-box;
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
	loading: boolean;
	weights: number[][];
	evals: number[][];
}

export class ModelBlock extends React.Component<Props, OwnState> {
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
			const info = new Int32Array(data, 0, 2);
			const l = info[0];
			const w = info[1];

			const d = new Float32Array(data, 8);
			const ds: number[][] = [];
			for (let i = 0; i < l; i++) {
				ds.push(Array.from(d.slice(i * w, (i + 1) * w)));
			}
			this.setState({
				loading: false,
				weights: ds
			});
		});

		this.setState({
			popup: {
				layer,
				x: event.clientX,
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
			this.props.model.layers.indexOf(layer),
			layer.input === tensor,
			(data: ArrayBuffer) => {
				const info = new Int32Array(data, 0, 2);
				const l = info[0];
				const w = info[1];

				const d = new Float32Array(data, 8);
				const ds: number[][] = [];
				for (let i = 0; i < l; i++) {
					ds.push(Array.from(d.slice(i * w, (i + 1) * w)));
				}
				this.setState({
					loading: false,
					evals: ds
				});
				console.log(ds);
			}
		);

		this.setState({
			popup: {
				tensor,
				x: event.clientX,
				y: event.clientY
			}
		});
	}

	render() {
		const { model } = this.props;
		const { popup, loading, weights, evals } = this.state;

		return (
			<>
				<Draggable onDrag={(e, d) => console.log(d)} cancel=".cancel-drag">
					<Wrapper>
						<div>Name: {model.name}</div>
						<div>Type: {model.type}</div>

						{model.layers.map((layer, i) => (
							<LayerBlock
								key={layer.name}
								layer={layer}
								onLayerClick={(l, e) => this.handleLayerclick(l, e)}
								onLayerTensorClick={(l, t, e) =>
									this.handleTensorClick(l, t, e)
								}
							/>
						))}

						<div style={{ clear: 'both' }} />
					</Wrapper>
				</Draggable>
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
