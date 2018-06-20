import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import { CodeBlock } from '../../types';

import { BlockComp, BlockProps } from '.';

interface Props extends BlockProps {
	block: CodeBlock;
	onEval: (block: CodeBlock) => void;
}

interface OwnState {
	show: boolean;
	error?: string;
	out?: string;
	response?: string;
}

export class CodeBlockComp extends BlockComp<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			show: true
		};
	}

	run() {
		this.props.onEval(this.props.block);
	}

	onChange(code: string) {
		if (this.props.onChange) {
			this.props.onChange(code);
		}
	}

	renderContent() {
		const { block } = this.props;
		const { show, error, out, response } = this.state;

		return (
			<div
				className="cancel-drag"
				style={{ position: 'relative', minWidth: 300, padding: '10px' }}
			>
				<div
					style={{
						visibility: show ? 'visible' : 'hidden',
						maxHeight: show ? undefined : 0
					}}
				>
					<CodeMirror
						value={block.code}
						onChange={c => this.onChange(c)}
						options={{ mode: 'python' }}
					/>

					<div style={{ color: 'red' }}>{error}</div>
					<div>{out}</div>
					<div>{JSON.stringify(response)}</div>
				</div>

				<button
					style={{ width: '100%', marginTop: '1em' }}
					onClick={() => this.run()}
				>
					Run
				</button>
			</div>
		);
	}
}
