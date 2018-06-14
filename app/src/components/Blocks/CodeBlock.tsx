import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import { socket } from '../../services/socket';
import { CodeBlock } from '../../types';
import { Connector } from '../Connector';

import { BlockComp, BlockProps } from '.';

interface Props extends BlockProps {
	block: CodeBlock;
	onDelete: () => void;
	onChange: (code: string) => void;
	onConnect: (from: string, to: string) => void;
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
			show: false
		};
	}

	run() {
		console.log(this.props.block.code);
		socket.emit(
			'code_run',
			this.props.block.id,
			([err, [out, res]]: [string, any]) => {
				console.log(out);
				console.log(res);
				this.setState({
					error: err,
					out,
					response: res
				});
			}
		);
	}

	toggle() {
		this.setState({
			show: !this.state.show
		});
	}

	renderContent() {
		const { block, onChange, onDelete } = this.props;
		const { show, error, out, response } = this.state;

		return (
			<div
				className="cancel-drag"
				style={{ position: 'relative', minWidth: 300, padding: '10px' }}
			>
				<div style={{ display: 'flex', marginBottom: '1em' }}>
					<button style={{ flex: 1 }} onClick={() => this.toggle()}>
						{show ? 'Hide' : 'Toggle'}
					</button>
					<button onClick={() => onDelete()}>X</button>
				</div>

				{this.renderLines()}

				<Connector
					y={60}
					id={block.id}
					onConnect={(f, t) => this.props.onConnect(f, t)}
				/>
				<Connector
					isOutput
					y={60}
					id={block.id}
					onConnect={(f, t) => this.props.onConnect(f, t)}
				/>

				<div
					style={{
						visibility: show ? 'visible' : 'hidden',
						maxHeight: show ? undefined : 0
					}}
				>
					<CodeMirror
						value={block.code}
						onChange={c => onChange(c)}
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

	renderLines() {
		const block = this.props.block;
		const x = 300;
		const y = 22;

		return (
			<>
				{this.props.block.next.map(b => {
					const toX = b.x - block.x - 20;
					const toY = b.y - block.y + 22;

					const len = Math.sqrt(Math.pow(x - toX, 2) + Math.pow(y - toY, 2));
					const angle = Math.atan((toY - y) / (toX - x));
					const transX = x - 0.5 * len * (1 - Math.cos(angle));
					const transY = y + 0.5 * len * Math.sin(angle);

					const style: React.CSSProperties = {
						position: 'absolute',
						transform: `translate(${transX}px, ${transY}px) rotate(${angle}rad)`,
						width: `${len}px`,
						height: `${0}px`
					};

					return (
						<div key={b.id} style={style}>
							<div
								style={{ background: 'green', height: 5, marginRight: 20 }}
							/>
							<div
								style={{
									width: 0,
									height: 0,
									marginRight: 6,
									marginTop: -17,
									borderTop: '14px solid transparent',
									borderBottom: '14px solid transparent',
									borderLeft: '22px solid green',
									float: 'right'
								}}
							/>
						</div>
					);
				})}
			</>
		);
	}
}
