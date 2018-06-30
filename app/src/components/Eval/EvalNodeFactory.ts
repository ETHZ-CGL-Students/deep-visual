import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { BaseNodeWidget } from '../Base/BaseNodeWidget';

import { EvalNodeModel } from './EvalNodeModel';

export class EvalNodeFactory extends AbstractNodeFactory<EvalNodeModel> {
	constructor() {
		super('eval');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: EvalNodeModel
	): JSX.Element {
		return React.createElement(BaseNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine,
			canEval: true
		});
	}

	getNewInstance(initialConfig?: any): EvalNodeModel {
		throw new Error('Not implemented');
	}
}
