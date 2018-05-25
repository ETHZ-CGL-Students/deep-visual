import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
	position: absolute;
`;

const Dot = styled.div`
	display: inline-block;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background-color: black;
`;

interface Props {
	x: number;
	y: number;
	isOutput?: boolean;
	tensor: Tensor;
	onClick: (tensor: Tensor, event: React.MouseEvent<HTMLElement>) => void;
}

interface OwnState {
	over: boolean;
}

export class TensorBlock extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			over: false
		};
	}

	handleMouseEnter() {
		this.setState({ over: true });
	}

	handleMouseLeave() {
		this.setState({ over: false });
	}

	render() {
		const { x, y, isOutput } = this.props;

		return (
			<Wrapper
				style={{
					left: isOutput ? undefined : x,
					right: isOutput ? x : undefined,
					top: y
				}}
			>
				<Dot
					onMouseEnter={() => this.handleMouseEnter()}
					onMouseLeave={() => this.handleMouseLeave()}
					onClick={e => this.props.onClick(this.props.tensor, e)}
				/>
			</Wrapper>
		);
	}
}
