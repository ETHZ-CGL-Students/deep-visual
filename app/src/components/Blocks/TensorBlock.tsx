import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
	position: absolute;
	user-select: none;
`;

const Dot = styled.div`
	display: inline-block;
	width: 20px;
	height: 20px;
	border-radius: 50%;
`;

interface Props {
	y: number;
	isOutput?: boolean;
	tensor: Tensor;
	onClick: (tensor: Tensor, event: React.MouseEvent<HTMLElement>) => void;
}

interface OwnState {
	clicked: boolean;
	dragging: boolean;
}

export class TensorBlock extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			clicked: false,
			dragging: false
		};

		this.handleMouseUp = this.handleMouseUp.bind(this);
	}

	handleMouseDown() {
		this.setState({ clicked: true });
	}

	handleMouseUp() {
		this.setState({ dragging: false, clicked: false });
		window.removeEventListener('mouseup', this.handleMouseUp);
	}

	handleMouseLeave() {
		if (this.state.clicked) {
			this.setState({ dragging: true });
			window.addEventListener('mouseup', this.handleMouseUp);
		}
	}

	render() {
		const { y, isOutput } = this.props;

		return (
			<Wrapper
				className="cancel-drag"
				style={{
					left: isOutput ? undefined : -20,
					right: isOutput ? -20 : undefined,
					top: y
				}}
			>
				<Dot
					onMouseDown={() => this.handleMouseDown()}
					onMouseUp={() => this.handleMouseUp()}
					onMouseLeave={() => this.handleMouseLeave()}
					onClick={e => this.props.onClick(this.props.tensor, e)}
					style={{
						backgroundColor: this.state.dragging ? 'red' : 'black'
					}}
				/>
			</Wrapper>
		);
	}
}
