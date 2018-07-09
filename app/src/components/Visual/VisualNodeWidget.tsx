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
	content: any;
	data: any;
	constructor(props: VisualNodeWidgetProps) {
		super(props);
		this.onMouseDown = this.onMouseDown.bind(this);
	}

	onMouseDown(event: any) {
		event.stopPropagation();
	}

	onInitialized(a: any, e: any) {
		return;
	}

	renderContent() {
		const { node } = this.props;

		if (!node.out) {
			return null;
		}

		if (this.content && (node.out === this.data)) {
			return this.content;
		}

		this.data = node.out;
		this.content = (
			<div
				onMouseDownCapture={this.onMouseDown}
			>
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
					onInitialized={(a: any, e: any) => this.onInitialized(a, e)}
				/>
			</div>
		);
		return this.content;
	}
}
