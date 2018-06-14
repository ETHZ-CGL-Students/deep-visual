import * as React from 'react';
import Draggable, { DraggableData } from 'react-draggable';
import styled from 'styled-components';

import { Block } from '../../types';

const Wrapper = styled.div`
	position: absolute;
	display: inline-block;
	padding: 10px;
	background-color: lightgrey;
	box-sizing: border-box;
`;

export interface BlockProps {
	block: Block;
	trackDrag: boolean;
	onDrag?: (data: DraggableData) => void;
}

export abstract class BlockComp<
	P extends BlockProps,
	S = {}
> extends React.Component<P, S> {
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
				<Wrapper>
					{this.renderContent()}

					<div style={{ clear: 'both' }} />
				</Wrapper>
			</Draggable>
		);
	}

	abstract renderContent(): JSX.Element | null;
}
