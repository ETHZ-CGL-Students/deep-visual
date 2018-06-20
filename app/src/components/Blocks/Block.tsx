import * as React from 'react';
import Draggable, { DraggableData } from 'react-draggable';
import styled from 'styled-components';

import { Block } from '../../types';
import { Connector } from '../Connector';

const Wrapper = styled.div`
	position: absolute;
	display: inline-block;
	padding: 10px;
	background-color: lightgrey;
	box-sizing: border-box;
	border: 1px solid black;
	max-width: 600px;
`;

const Output = styled.div`
	word-break: break-all;
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

	onDelete() {
		if (this.props.onDelete) {
			this.props.onDelete();
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
					<div style={{ display: 'flex', marginBottom: 4 }}>
						<div style={{ flex: 1, cursor: 'default' }}>{block.id}</div>
						{this.props.onDelete && (
							<button onClick={() => this.onDelete()}>X</button>
						)}
					</div>

					<Output style={{ color: 'red' }}>{block.error}</Output>
					<Output style={{ color: 'green' }}>
						{JSON.stringify(block.out)}
					</Output>

					{this.renderContent()}

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

	abstract renderContent(): JSX.Element | null;
}
