import * as React from 'react';
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams';

import { BaseNodeWidget } from '../Base/BaseNodeWidget';

import { LayerNodeModel } from './LayerNodeModel';

export class LayerNodeFactory extends AbstractNodeFactory<LayerNodeModel> {
	constructor() {
		super('layer');
	}

	generateReactWidget(
		diagramEngine: DiagramEngine,
		node: LayerNodeModel
	): JSX.Element {
		return React.createElement(BaseNodeWidget as any, {
			node: node,
			diagramEngine: diagramEngine
		});
	}

	getNewInstance(initialConfig?: any): LayerNodeModel {
		throw new Error('Not implemented');
	}
}
