import * as Konva from 'konva';
import * as React from 'react';
import { Circle, Group, Text } from 'react-konva';

interface Props {
	isOutput?: boolean;
	tensor: Tensor;
	onClick: (tensor: Tensor, x: number, y: number) => void;
	[x: string]: any;
}

interface OwnState {
	ref: Konva.Text | null;
	over: boolean;
}

export class TensorBlock extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			ref: null,
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
		const { tensor, isOutput, onClick, ...rest } = this.props;

		return (
			<Group {...rest}>
				<Circle
					radius={this.state.over ? 10 : 5}
					fill={this.state.over ? 'green' : 'black'}
					onMouseEnter={() => this.handleMouseEnter()}
					onMouseLeave={() => this.handleMouseLeave()}
					onClick={e =>
						this.props.onClick(this.props.tensor, e.evt.offsetX, e.evt.offsetY)
					}
				/>
				<Text
					text={'<' + tensor.shape.dims.join(', ') + '>'}
					x={
						isOutput
							? this.state.ref
								? -this.state.ref.getTextWidth() + 2
								: 0
							: -2
					}
					y={isOutput ? -20 : 8}
					ref={r => {
						if (r && !this.state.ref) {
							this.setState({ ref: r as any });
						}
					}}
				/>
			</Group>
		);
	}
}
