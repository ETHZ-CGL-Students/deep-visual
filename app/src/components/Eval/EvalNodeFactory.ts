import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { EvalNodeModel } from './EvalNodeModel';
import { EvalNodeWidget } from './EvalNodeWidget';

export class EvalNodeFactory extends AbstractNodeFactory<EvalNodeModel> {
	constructor() {
		super('eval');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: EvalNodeModel
	): JSX.Element {
		return React.createElement(EvalNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine
		});
	}

	getNewInstance(initialConfig?: any): EvalNodeModel {
		throw new Error('Not implemented');
	}
}
