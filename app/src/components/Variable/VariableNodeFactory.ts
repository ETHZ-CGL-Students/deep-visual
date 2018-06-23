import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { BaseNodeWidget } from '../Base/BaseNodeWidget';

import { VariableNodeModel } from './VariableNodeModel';

export class VariableNodeFactory extends AbstractNodeFactory<
	VariableNodeModel
> {
	constructor() {
		super('variable');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: VariableNodeModel
	): JSX.Element {
		return React.createElement(BaseNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine
		});
	}

	getNewInstance(initialConfig?: any): VariableNodeModel {
		throw new Error('Not implemented');
	}
}
