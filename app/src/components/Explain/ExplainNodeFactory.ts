import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { ExplainNodeModel } from './ExplainNodeModel';
import { ExplainNodeWidget } from './ExplainNodeWidget';

export class ExplainNodeFactory extends AbstractNodeFactory<ExplainNodeModel> {
	constructor() {
		super('explain');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: ExplainNodeModel
	): JSX.Element {
		return React.createElement(ExplainNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine,
			canEval: false,
			canEditInPorts: false,
			hideRawData: true
		});
	}

	getNewInstance(initialConfig?: any): ExplainNodeModel {
		throw new Error('Not implemented');
	}
}
