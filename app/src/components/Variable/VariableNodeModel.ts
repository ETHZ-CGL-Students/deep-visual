import { BasePortModel } from '../Base/BasePortModel';

import { BaseNodeModel } from '../Base/BaseNodeModel';

export class VariableNodeModel extends BaseNodeModel {
	constructor(name: string) {
		super('Variable', name);

		this.color = 'rgb(0,192,255)';
		this.addPort(new BasePortModel(false, 'value'));
	}
}
