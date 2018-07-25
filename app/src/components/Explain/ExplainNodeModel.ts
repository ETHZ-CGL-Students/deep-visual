// mport { BasePortModel } from '../Base/BasePortModel';

import { ExplainBlock } from '../../types';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export class ExplainNodeModel extends CodeNodeModel {
	globalTensors: string[];
	inputTensor: string;
	targetSlice: string;
	constructor(block: ExplainBlock, globalTensors: string[]) {
		super(block, 'explain');
		this.color = '#3aa047';
		this.globalTensors = globalTensors;
		this.inputTensor = block.inputTensor;
		this.targetSlice = block.targetSlice;
	}

	changeInputTensor(value: string) {
		this.inputTensor = value;
		console.log('Change input', value);
		if (this.changeListener) {
			this.changeListener();
		}
	}

	changeSlicing(value: string|null) {
		if (value) {
			this.targetSlice = value;
			console.log('Change slicing', value);
			if (this.changeListener) {
				this.changeListener();
			}
		}
	}
}
