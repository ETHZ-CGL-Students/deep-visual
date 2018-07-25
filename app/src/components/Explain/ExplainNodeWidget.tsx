import * as React from 'react';

import { BaseNodeProps, BaseNodeState, BaseNodeWidget } from '../Base/BaseNodeWidget';

import { ExplainNodeModel } from './ExplainNodeModel';

export interface ExplainNodeWidgetProps extends BaseNodeProps {
	node: ExplainNodeModel;
}

export interface ExplainNodeWidgetState extends BaseNodeState {}

export class ExplainNodeWidget extends BaseNodeWidget<
	ExplainNodeWidgetProps,
	ExplainNodeWidgetState
> {
	content: any;
	constructor(props: ExplainNodeWidgetProps) {
		super(props);
	}

	renderContent() {
		let styles = {
			container: {
				width: '100%',
				padding: 4
			},
			select: {
				margin: 'auto',
				marginBottom: 5,
				background: 'transparent',
				color: 'white',
			},
			labelBold: {
				fontWeight: 'bold',
				marginBottom: 5
			}
		};
		return (
			<div style={styles.container}>
				<p>Explainer will show which features of <i>Input Tensor</i> caused
					the activation of a selected neuron in <i>target</i>.</p>
				<div>
					<p style={styles.labelBold as any}>INPUT TENSOR</p>
					<select
						style={styles.select}
						value={this.props.node.inputTensor}
						onChange={(e) => this.props.node.changeInputTensor(e.target.value)}
					>
						{this.props.node.globalTensors.map((tensorName) =>
							<option
								style={{color: 'black'}}
								key={tensorName}
								value={tensorName}
							>
								{tensorName}
							</option>
						)}
					</select>
				</div>
				<div>
					<p style={styles.labelBold as any}>TARGET NEURON</p>
					<input
						placeholder="default slicing [:]"
						defaultValue={this.props.node.targetSlice}
						onChange={(e) => this.props.node.changeSlicing(e.target.value)}
						onKeyUp={(e) => e.nativeEvent.stopPropagation()}
					/>
				</div>
			</div>
		);
	}
}
