import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';
import { CodeNodeModel } from '../Code/CodeNodeModel';

export interface CodeNodeWidgetProps extends BaseNodeProps {
	node: CodeNodeModel;
}

export interface CodeNodeWidgetState {}

export class CodeNodeWidget extends BaseNodeWidget<
	CodeNodeWidgetProps,
	CodeNodeWidgetState
> {
	state: {
		dialogOpen: boolean,
		codeEdited: string
	};
	constructor(props: CodeNodeWidgetProps) {
		super(props);
		this.state = {
			dialogOpen: false,
			codeEdited: this.props.node.code
		};
	}

	onSave() {
		this.props.node.changeCode(this.state.codeEdited);
		this.setState({dialogOpen: false});
	}

	onCancel() {
		this.setState({dialogOpen: false});
	}

	renderContent() {
		const { node } = this.props;

		let styles = {
			textarea: {
				width: '100%',
				display: 'block',
				maxWidth: '100%',
				padding: '15px 15px 30px',
				border: 'none',
				borderRadius: '5px'
			}
		};

		return (
			<div
				onMouseDown={e => {
					e.stopPropagation();
					e.preventDefault();
					node.setSelected(false);
				}}
				style={{ cursor: 'text' }}
			>
				<textarea
					style={styles.textarea}
					value={node.code}
					readOnly={true}
					onClick={() => this.setState({dialogOpen: true})}
				/>
				<Dialog
					open={this.state.dialogOpen}
					aria-labelledby="form-dialog-title"
				>
					<DialogTitle id="form-dialog-title">Edit code</DialogTitle>
					<DialogContent>
						<CodeMirror
							value={node.code}
							onChange={c => this.setState({codeEdited: c})}
							options={{
								mode: 'python',
								lineNumbers: true,
								viewportMargin: Infinity
							}}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => this.onCancel()} color="primary">
							Cancel
						</Button>
						<Button onClick={() => this.onSave()} color="primary">
							Save
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}
