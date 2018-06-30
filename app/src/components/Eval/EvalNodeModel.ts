import { BasePortModel } from '../Base/BasePortModel';

import { EvalBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';

export class EvalNodeModel extends BaseNodeModel {
	constructor(block: EvalBlock) {
		super('eval', block.id);

		this.color = 'rgb(234, 102, 53)';
		this.addPort(new BasePortModel(true, 'layer'));
		this.addPort(new BasePortModel(true, 'x'));
		this.addPort(new BasePortModel(false, 'y'));
	}
}
