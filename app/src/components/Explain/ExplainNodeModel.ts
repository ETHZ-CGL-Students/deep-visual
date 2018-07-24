// mport { BasePortModel } from '../Base/BasePortModel';

import { ExplainBlock } from '../../types';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export class ExplainNodeModel extends CodeNodeModel {
	globalTensors: string[];
	constructor(block: ExplainBlock, globalTensors: string[]) {
		super(block, 'explain');
		this.color = '#3aa047';
		this.globalTensors = globalTensors;
	}
}
