import { BasePortModel } from '../Base/BasePortModel';

import { VariableBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';

export class VariableNodeModel extends BaseNodeModel {
	constructor(block: VariableBlock) {
		super('variable', block.name);

		this.color = 'rgb(0,192,255)';
		this.addPort(new BasePortModel(false, 'value'));
	}
}
