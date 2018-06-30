import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { CodeNodeModel } from '../Code/CodeNodeModel';

import { CodeNodeWidget } from './CodeNodeWidget';

export class CodeNodeFactory extends AbstractNodeFactory<CodeNodeModel> {
	constructor() {
		super('code');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: CodeNodeModel
	): JSX.Element {
		return React.createElement(CodeNodeWidget, {
			node: node,
			diagramEngine: diagramEngine,
			canEditPorts: true,
			canEval: true
		});
	}

	getNewInstance(initialConfig?: any): CodeNodeModel {
		throw new Error('Not implemented');
	}
}
