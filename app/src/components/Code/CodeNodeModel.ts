import { CodeBlock } from '../../types';
import { BaseNodeModel } from '../Base/BaseNodeModel';
import { BasePortModel } from '../Base/BasePortModel';

export class CodeNodeModel extends BaseNodeModel {
	code: string;
	err: string | null;
	out: string | null;
	running: boolean;
	protected changeListener?: () => void;
	protected runListener?: () => void;

	constructor(block: CodeBlock) {
		super('code', block.id);

		this.code = block.code;
		this.color = 'rgb(0,192,255)';
		this.running = false;

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

	onRun(listener: () => void) {
		this.runListener = listener;
	}
	run() {
		if (this.runListener) {
			this.runListener();
		}
	}
}
