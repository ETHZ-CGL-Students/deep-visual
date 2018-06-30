import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';

import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';

import { EvalNodeModel } from './EvalNodeModel';

export interface EvalNodeWidgetProps extends BaseNodeProps {
	node: EvalNodeModel;
}

export interface EvalNodeWidgetState {}

export class EvalNodeWidget extends BaseNodeWidget<
	EvalNodeWidgetProps,
	EvalNodeWidgetState
> {
	constructor(props: EvalNodeWidgetProps) {
		super(props);
	}

	onEval() {
		this.props.node.eval();
	}

	renderContent() {
		const { node } = this.props;

		return (
			<div
				onMouseDown={e => {
					e.stopPropagation();
					e.preventDefault();
					node.setSelected(false);
				}}
				style={{ cursor: 'text' }}
			>
				<button
					disabled={node.running}
					style={{ width: '100%', cursor: 'pointer' }}
					onClick={() => this.onEval()}
				>
					Run
				</button>
			</div>
		);
	}
}
