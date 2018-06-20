import * as React from 'react';

import { Connection } from '../types';

interface Props {
	conn: Connection;
	onClick: () => void;
}

interface State {
	hover: boolean;
}

export class Arrow extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			hover: false
		};
	}

	handleMouseEnter() {
		this.setState({
			hover: true
		});
	}

	handleMouseLeave() {
		this.setState({
			hover: false
		});
	}

	render() {
		const { conn } = this.props;
		const { hover } = this.state;

		const fromDiv = document.getElementById('c-' + conn.from.id + '-output');
		const toDiv = document.getElementById('c-' + conn.to.id + '-input');

		if (!fromDiv || !toDiv) {
			return null;
		}

		const fromX = fromDiv.getBoundingClientRect().left - 200 + 8;
		const fromY = fromDiv.getBoundingClientRect().top + 8;
		const toX = toDiv.getBoundingClientRect().left - 200 + 8;
		const toY = toDiv.getBoundingClientRect().top + 8;

		const dy = toY - fromY;
		const dx = toX - fromX;

		const angle = Math.atan2(dy, dx);
		const length = Math.sqrt(dx * dx + dy * dy);

		const arrowStyle: React.CSSProperties = {
			position: 'absolute',
			left: fromX,
			top: fromY,
			transform: `rotate(${angle}rad)`,
			transformOrigin: '0 0',
			width: length,
			height: 0
		};

		const labelStyle: React.CSSProperties = {
			position: 'absolute',
			left: fromX + dx / 2,
			top: fromY + dy / 2,
			fontSize: '1.5em',
			background: hover ? 'orange' : 'white',
			border: '1px solid black',
			padding: 4,
			cursor: 'default',
			zIndex: 1000
		};

		return (
			<>
				<div style={arrowStyle}>
					<div
						style={{
							background: hover ? 'orange' : 'green',
							height: 4,
							marginRight: 20
						}}
					/>
					<div
						style={{
							width: 0,
							height: 0,
							marginRight: 6,
							marginTop: -17,
							borderTop: '14px solid transparent',
							borderBottom: '14px solid transparent',
							borderLeft: '22px solid ' + (hover ? 'orange' : 'green'),
							float: 'right'
						}}
					/>
				</div>
				<div
					style={labelStyle}
					onMouseEnter={() => this.handleMouseEnter()}
					onMouseLeave={() => this.handleMouseLeave()}
					onClick={() => this.props.onClick()}
				>
					{conn.label}
				</div>
			</>
		);
	}
}
