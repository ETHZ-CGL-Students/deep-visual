import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export interface CodeNodeWidgetProps extends BaseNodeProps {
	node: CodeNodeModel;
}

export interface CodeNodeWidgetState {}

export class CodeNodeWidget extends BaseNodeWidget<
	CodeNodeWidgetProps,
	CodeNodeWidgetState
> {
	constructor(props: CodeNodeWidgetProps) {
		super(props);
	}

	onChange(code: string) {
		//
	}

	renderContent() {
		return (
			<div onClick={() => this.props.node.setSelected(false)}>
				<CodeMirror
					value={this.props.node.code}
					onChange={c => this.onChange(c)}
					options={{ mode: 'python' }}
				/>
			</div>
		);
	}
}