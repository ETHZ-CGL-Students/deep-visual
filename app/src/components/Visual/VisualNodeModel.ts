import { BasePortModel } from '../Base/BasePortModel';

import { VisualBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';

export class VisualNodeModel extends BaseNodeModel {
	constructor(block: VisualBlock) {
		super('visual', block.id);

		this.color = '#247BA0';
		this.addPort(new BasePortModel(true, 'input'));
	}
}
