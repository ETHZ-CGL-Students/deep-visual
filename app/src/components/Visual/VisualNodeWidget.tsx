import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';

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
				<div>{ls.join(' x ')}</div>
				<table>
					<tbody>
						{node.out
							.slice(0, 10)
							.map((row: any, x: number) => (
								<tr key={'r' + x}>
									{row
										.slice(0, 10)
										.map((cell: any, y: number) => (
											<td key={'c' + x + '-' + y}>{cell.toFixed(3)}</td>
										))}
								</tr>
							))}
					</tbody>
				</table>
			</>
		);
	}
}
