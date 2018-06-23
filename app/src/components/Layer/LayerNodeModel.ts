import { BasePortModel } from '../Base/BasePortModel';

import { BaseNodeModel } from '../Base/BaseNodeModel';

export class LayerNodeModel extends BaseNodeModel {
	constructor(name: string) {
		super('layer', name);

		this.color = 'rgb(0,192,255)';
		this.addPort(new BasePortModel(true, 'input'));
		this.addPort(new BasePortModel(false, 'output'));
		this.addPort(new BasePortModel(false, 'bias'));
		this.addPort(new BasePortModel(false, 'weights'));
	}
}
