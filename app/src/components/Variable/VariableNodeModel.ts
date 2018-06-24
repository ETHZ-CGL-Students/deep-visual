import { BasePortModel } from '../Base/BasePortModel';

import { VariableBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';

export class VariableNodeModel extends BaseNodeModel {
	constructor(block: VariableBlock) {
		super('variable', block.name);

		this.color = 'rgb(188, 32, 167)';
		this.addPort(new BasePortModel(false, 'value'));
	}
}
