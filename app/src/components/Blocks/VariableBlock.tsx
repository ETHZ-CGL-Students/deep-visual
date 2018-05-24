import * as React from 'react';
import { Group, Rect, Text } from 'react-konva';

interface Props {
	variable: Variable;
}

export class VariableBlock extends React.Component<Props> {
	render() {
		const { variable } = this.props;

		return (
			<Group draggable>
				<Rect key={variable.name} width={80} height={50} fill="yellow" />
				<Text text={variable.name} x={5} y={5} />
				<Text text={variable.type} x={5} y={20} />
				<Text text={JSON.stringify(variable.value)} x={5} y={35} />
			</Group>
		);
	}
}
