import { CodeBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';
import { BasePortModel } from '../Base/BasePortModel';

export class CodeNodeModel extends BaseNodeModel {
	code: string;
	protected changeListener?: () => void;

	constructor(block: CodeBlock, type: string = 'code') {
		super(type, block.id);

		this.code = block.code;
		this.color = '#FFE066';

		// Events aren't triggered in the constructor, so we can safely add the ports
		block.inputs.forEach(k => {
			this.addPort(new BasePortModel(true, k));
		});
		block.outputs.forEach(k => {
			this.addPort(new BasePortModel(false, k));
		});
	}

	onChange(listener: () => void) {
		this.changeListener = listener;
	}
	changeCode(code: string) {
		this.code = code;
		if (this.changeListener) {
			this.changeListener();
		}
	}
}
