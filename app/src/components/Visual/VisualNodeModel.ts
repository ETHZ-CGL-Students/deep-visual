// mport { BasePortModel } from '../Base/BasePortModel';

import { VisualBlock } from '../../types';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export class VisualNodeModel extends CodeNodeModel {
	constructor(block: VisualBlock) {
		super(block, 'visual');
		this.color = '#247BA0';
	}
}
