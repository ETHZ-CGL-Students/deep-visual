import * as React from 'react';

// import Drawer from '@material-ui/core/Drawer';
// import ReactJson, { InteractionProps } from 'react-json-view';

import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';

import { ExplainNodeModel } from './ExplainNodeModel';

export interface ExplainNodeWidgetProps extends BaseNodeProps {
	node: ExplainNodeModel;
}

export interface VisualNodeWidgetState {}

export class ExplainNodeWidget extends BaseNodeWidget<
	ExplainNodeWidgetProps,
	VisualNodeWidgetState
> {
	content: any;
	constructor(props: ExplainNodeWidgetProps) {
		super(props);
	}

	renderContent() {
		let styles = {
			container: {
				width: 300
			}
		};
		return (
			<div style={styles.container}>
				<p>Explainer will show which features of <i>input_tensor</i> caused
					the activation of a selected neuron in the <i>target_tensor</i>.</p>
				<p>Target tensor: </p>
				<select>
					{this.props.node.globalTensors.map((tensorName) =>
						<option
							key={tensorName}
							value={tensorName}
						>
							{tensorName}
						</option>
					)}
				</select>
			</div>
		);
	}
}
