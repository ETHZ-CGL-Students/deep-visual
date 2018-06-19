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
	y: number | string;
	isOutput?: boolean;
	id: string;
	onClick?: (id: String) => void;
	onConnect?: (from: string, to: string) => void;
}

interface OwnState {
	hovered: boolean;
	clicked: boolean;
	dragging: boolean;
}

let clicked: Connector | undefined;

export class Connector extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			hovered: false,
			clicked: false,
			dragging: false
		};

		this.handleMouseUp = this.handleMouseUp.bind(this);
	}

	handleMouseDown() {
		this.setState({ clicked: true });
		clicked = this;
	}

	handleMouseUp() {
		if (clicked && clicked !== this && this.props.onConnect) {
			this.props.onConnect(clicked.props.id, this.props.id);
		}

		this.setState({ dragging: false, clicked: false });
		window.removeEventListener('mouseup', this.handleMouseUp);
	}

	handleMouseEnter() {
		this.setState({ hovered: true });
	}

	handleMouseLeave() {
		if (this.state.clicked) {
			this.setState({ hovered: false, dragging: true });
			window.addEventListener('mouseup', this.handleMouseUp);
		} else {
			this.setState({ hovered: false });
		}
	}

	render() {
		const { id, y, isOutput, onClick } = this.props;
		const { hovered, dragging } = this.state;

		return (
			<Wrapper
				className="cancel-drag"
				style={{
					left: isOutput ? undefined : -10,
					right: isOutput ? -10 : undefined,
					top: y
				}}
			>
				<Dot
					onMouseDown={() => this.handleMouseDown()}
					onMouseUp={() => this.handleMouseUp()}
					onMouseEnter={() => this.handleMouseEnter()}
					onMouseLeave={() => this.handleMouseLeave()}
					onClick={() => {
						if (onClick) {
							onClick(id);
						}
					}}
					style={{
						backgroundColor: dragging ? 'red' : hovered ? 'orange' : 'black'
					}}
				/>
			</Wrapper>
		);
	}
}
