import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { VisualNodeModel } from './VisualNodeModel';
import { VisualNodeWidget } from './VisualNodeWidget';

export class VisualNodeFactory extends AbstractNodeFactory<VisualNodeModel> {
	constructor() {
		super('visual');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: VisualNodeModel
	): JSX.Element {
		return React.createElement(VisualNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine,
			canEval: true,
			hideRawData: true
		});
	}

	getNewInstance(initialConfig?: any): VisualNodeModel {
		throw new Error('Not implemented');
	}
}
