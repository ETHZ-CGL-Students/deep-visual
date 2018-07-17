// mport { BasePortModel } from '../Base/BasePortModel';

import { VisualBlock } from '../../types';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export class VisualNodeModel extends CodeNodeModel {
	constructor(block: VisualBlock) {
		super(block, 'visual');
		this.color = '#247BA0';
		if (!this.code || !this.code.length) {
			this.changeCode('y0 = x0');
		}
		// this.addPort(new BasePortModel(true, 'input'));
	}
}
