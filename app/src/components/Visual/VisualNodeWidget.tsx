import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
const Plot = require('react-plotly.js');

import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';

import { VisualNodeModel } from './VisualNodeModel';

export interface VisualNodeWidgetProps extends BaseNodeProps {
	node: VisualNodeModel;
}

export interface VisualNodeWidgetState {}

export class VisualNodeWidget extends BaseNodeWidget<
	VisualNodeWidgetProps,
	VisualNodeWidgetState
> {
	constructor(props: VisualNodeWidgetProps) {
		super(props);
	}

	renderContent() {
		const { node } = this.props;

		if (!node.out) {
			return null;
		}

		const ls = [];
		let curr = node.out;
		while (curr.length) {
			ls.push(curr.length);
			curr = curr[0];
		}
		
		return (
			<>
				<Plot
					data={[
						{
							z: node.out,
							type: 'heatmap',
							colorbar: {thickness: 10}
						},
					]}
					layout={{
						width: 320, height: 320,
						margin: {t: 0, l: 0, r: 0, b: 0}
					}}
				/>
			</>
		);
	}
}
