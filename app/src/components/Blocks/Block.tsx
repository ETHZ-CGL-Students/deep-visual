import * as React from 'react';
import Draggable, { DraggableData } from 'react-draggable';
import styled from 'styled-components';

import { Block } from '../../types';
import { Arrow } from '../Arrow';
import { Connector } from '../Connector';

const Wrapper = styled.div`
	position: absolute;
	display: inline-block;
	padding: 10px;
	background-color: lightgrey;
	box-sizing: border-box;
	border: 1px solid black;
`;

export interface BlockProps {
	block: Block;
	trackDrag: boolean;
	onDrag?: (data: DraggableData) => void;
	onChange?: (code: string) => void;
	onConnect?: (from: string, to: string) => void;
	onDelete?: () => void;
}

export abstract class BlockComp<
	P extends BlockProps,
	S = {}
> extends React.Component<P, S> {
	ref: React.RefObject<HTMLDivElement>;

	constructor(props: P) {
		super(props);

		this.ref = React.createRef();
	}

	onConnect(from: string, to: string) {
		if (this.props.onConnect) {
			this.props.onConnect(from, to);
		}
	}

	render() {
		const { block, trackDrag } = this.props;

		return (
			<Draggable
				cancel=".cancel-drag"
				position={trackDrag ? { x: block.x, y: block.y } : undefined}
				onDrag={(_, d) => {
					if (this.props.onDrag) {
						this.props.onDrag(d);
					}
				}}
			>
				<Wrapper innerRef={this.ref}>
					{this.renderContent()}
					{this.renderLines()}

					<Connector
						y="calc(50% - 10px)"
						id={block.id}
						onConnect={(f, t) => this.onConnect(f, t)}
					/>
					<Connector
						isOutput
						y="calc(50% - 10px)"
						id={block.id}
						onConnect={(f, t) => this.onConnect(f, t)}
					/>

					<div style={{ clear: 'both' }} />
				</Wrapper>
			</Draggable>
		);
	}

	renderLines() {
		const ref = this.ref.current;

		if (!ref) {
			// The first time our component is rendered we don't
			// have a ref yet, so force update to render again with a ref
			this.forceUpdate();
			return;
		}

		const h = ref.offsetHeight;
		const w = ref.offsetWidth;

		const block = this.props.block;

		return (
			<>
				{this.props.block.next.map(b => {
					const toX = b.x - block.x;
					const toY = b.y - block.y + h / 2;

					return (
						<Arrow
							key={b.id}
							from={{ x: w, y: h / 2 }}
							to={{ x: toX, y: toY }}
						/>
					);
				})}
			</>
		);
	}

	abstract renderContent(): JSX.Element | null;
}
