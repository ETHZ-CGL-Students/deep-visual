import * as React from 'react';
import { DraggableData } from 'react-draggable';
import { connect, Dispatch } from 'react-redux';
import styled from 'styled-components';

import { AppAction } from './actions';
import {
	requestChange,
	requestConnect,
	requestCreate,
	requestDelete,
	requestList,
	requestMove
} from './actions/code';
import { CodeBlockComp, ModelBlock } from './components/Blocks';
import { getCodeBlocks } from './selectors/code';
import { socket } from './services/socket';
import { AppState, CodeBlock, Model, Variable } from './types';

const Wrapper = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: stretch;
	align-content: stretch;
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
`;

const Menu = styled.div`
	display: flex;
	flex: 0 0 0;
	flex-direction: column;
	justify-content: space-between;
	align-items: stretch;
	align-content: stretch;
	width: 200px;
	min-width: 200px;
	height: 100%;
	margin: 0;
	padding: 10px 0 0 10px;
	border-right: 1px solid black;
	box-sizing: border-box;
`;

const VarMenu = styled.div`
	flex: 1;
	overflow-y: scroll;
	padding: 0 10px 0 0;
`;

const VarEntry = styled.div`
	display: flex;
	justify-content: space-between;
	&:hover {
		cursor: pointer;
		background-color: lightgrey;
	}
`;

const VarType = styled.div`
	color: grey;
`;

const Content = styled.div`
	position: relative;
	flex: 1;
	height: 100%;
	right: 0;
	margin: 0;
	padding: 10px;
	box-sizing: border-box;
`;

interface Props {
	blocks: CodeBlock[];
	requestList: () => AppAction;
	requestCreate: (code: string) => AppAction;
	requestChange: (id: string, code: string) => AppAction;
	requestMove: (id: string, x: number, y: number) => AppAction;
	requestConnect: (from: string, to: string) => AppAction;
	requestDelete: (id: string) => AppAction;
}

interface OwnState {
	epochs: number;
	epoch: number;
	batches: number;
	batch: number;
	model: Model | undefined;
	vars: Variable[];
}

class App extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			epochs: 0,
			epoch: 0,
			batches: 0,
			batch: 0,
			model: undefined,
			vars: []
		};
	}

	componentDidMount() {
		// window.addEventListener('keyup', e => this.handleKeyUp(e), false);
		socket.emit('model', (model: Model) => {
			console.log(model);
			this.setState({ model });
		});
		socket.emit('variables', (vars: Variable[]) => {
			console.log(vars);
			this.setState({ vars });
		});
		this.props.requestList();
		socket.on('set_params', (data: any) => this.set_params(data));
		socket.on('train_begin', () => this.train_begin());
		socket.on('train_end', () => this.train_end());
		socket.on('epoch_begin', (epoch: number) => this.epoch_begin(epoch));
		socket.on('batch_begin', (batch: number) => this.batch_begin(batch));
	}

	addCodeBlock(code: string = '') {
		this.props.requestCreate(code);
	}

	dragCodeBlock(block: CodeBlock, data: DraggableData) {
		this.props.requestMove(block.id, data.x, data.y);
	}

	changeCodeBlock(block: CodeBlock, newCode: string) {
		this.props.requestChange(block.id, newCode);
	}

	deleteCodeBlock(block: CodeBlock) {
		if (confirm('Are you sure you want to delete this code block?')) {
			this.props.requestDelete(block.id);
		}
	}

	connectCodeBlock(from: string, to: string) {
		this.props.requestConnect(from, to);
	}

	componentWillUnmount() {
		// window.removeEventListener('keyup', e => this.handleKeyUp(e), false);
		socket.off('set_params');
		socket.off('train_begin');
		socket.off('train_end');
		socket.off('epoch_begin');
		socket.off('batch_begin');
	}

	set_params(data: any) {
		this.setState({
			epochs: data.epochs,
			batches: Math.ceil(data.samples / data.batch_size)
		});
	}

	start() {
		socket.emit('start');
	}

	train_begin() {
		console.log('Starting...');
	}

	train_end() {
		this.setState({
			epoch: this.state.epochs,
			batch: this.state.batches
		});
	}

	epoch_begin(epoch: number) {
		this.setState({ epoch, batch: 0 });
	}

	batch_begin(batch: number) {
		this.setState({ batch });
	}

	render() {
		const { blocks } = this.props;
		const { vars, model } = this.state;

		return (
			<Wrapper>
				<Menu>
					<div>
						<button onClick={() => this.start()}>Train</button>&nbsp;
						<button onClick={() => this.addCodeBlock()}>Add Code</button>
						<br />
						<br />
						<progress value={this.state.epoch} max={this.state.epochs} />
						<br />
						<progress value={this.state.batch} max={this.state.batches} />
					</div>
					<h3>Variables</h3>
					<VarMenu>
						{vars.map(v => (
							<VarEntry
								key={v.name}
								onClick={() => this.addCodeBlock(`out = ${v.name}`)}
							>
								<div>{v.name}</div>
								<VarType>{v.type}</VarType>
							</VarEntry>
						))}
					</VarMenu>
				</Menu>
				<Content>
					{model && <ModelBlock trackDrag={false} block={model} />}
					{blocks.map(b => (
						<CodeBlockComp
							key={b.id}
							trackDrag
							onChange={c => this.changeCodeBlock(b, c)}
							onDrag={d => this.dragCodeBlock(b, d)}
							onDelete={() => this.deleteCodeBlock(b)}
							onConnect={(f, t) => this.connectCodeBlock(f, t)}
							block={b}
						/>
					))}
				</Content>
			</Wrapper>
		);
	}
}

const mapStateToProps = (state: AppState) => {
	return {
		blocks: getCodeBlocks(state)
	};
};

const mapDispatchToProps = (dispatch: Dispatch<AppAction>) => {
	return {
		requestList: (): AppAction => dispatch(requestList()),
		requestCreate: (code: string): AppAction => dispatch(requestCreate(code)),
		requestChange: (id: string, code: string): AppAction =>
			dispatch(requestChange(id, code)),
		requestMove: (id: string, x: number, y: number): AppAction =>
			dispatch(requestMove(id, x, y)),
		requestConnect: (from: string, to: string): AppAction =>
			dispatch(requestConnect(from, to)),
		requestDelete: (id: string): AppAction => dispatch(requestDelete(id))
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(App);
