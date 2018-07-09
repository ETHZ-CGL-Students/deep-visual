import { BasePortModel } from '../Base/BasePortModel';

import { LayerBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';

export class LayerNodeModel extends BaseNodeModel {
	constructor(block: LayerBlock) {
		super('layer', block.id);

		this.color = '#70C1B3';
		this.addPort(new BasePortModel(true, 'input'));
		this.addPort(new BasePortModel(false, 'output'));
		this.addPort(new BasePortModel(false, 'weights'));
	}

	// Don't allow deleting layer nodes
	remove() {
		return;
	}
}
