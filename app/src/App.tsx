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
	requestDisconnect,
	requestEval,
	requestList,
	requestMove
} from './actions/blocks';
import { startTrain } from './actions/train';
import { requestVariables } from './actions/variables';
import { Arrow } from './components/Arrow';
import { CodeBlockComp, LayerBlockComp } from './components/Blocks';
import { getBlocks, getConnections } from './selectors/blocks';
import { getVariables } from './selectors/variables';
import {
	AppState,
	Block,
	CodeBlock,
	Connection,
	isCode,
	isLayer,
	Variable
} from './types';

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
	blocks: Block[];
	connections: Connection[];
	vars: Variable[];
	requestVariables: () => AppAction;
	requestList: () => AppAction;
	requestCreate: (code: string) => AppAction;
	requestChange: (id: string, code: string) => AppAction;
	requestMove: (id: string, x: number, y: number) => AppAction;
	requestConnect: (from: string, to: string) => AppAction;
	requestDisconnect: (from: string, to: string) => AppAction;
	requestDelete: (id: string) => AppAction;
	requestEval: (b: CodeBlock) => AppAction;
	startTraining: () => AppAction;
}

interface OwnState {
	epochs: number;
	epoch: number;
	batches: number;
	batch: number;
}

class App extends React.Component<Props, OwnState> {
	constructor(props: Props) {
		super(props);

		this.state = {
			epochs: 0,
			epoch: 0,
			batches: 0,
			batch: 0
		};
	}

	componentDidMount() {
		// window.addEventListener('keyup', e => this.handleKeyUp(e), false);
		// this.props.requestModel();
		this.props.requestVariables();
		this.props.requestList();
	}

	addCodeBlock(code: string = '') {
		this.props.requestCreate(code);
	}

	dragBlock(block: Block, data: DraggableData) {
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

	connectBlocks(from: string, to: string) {
		this.props.requestConnect(from, to);
	}

	removeConnection(conn: Connection) {
		this.props.requestDisconnect(conn.from.id, conn.to.id);
	}

	componentWillUnmount() {
		// window.removeEventListener('keyup', e => this.handleKeyUp(e), false);
	}

	start() {
		this.props.startTraining();
	}

	eval(block: CodeBlock) {
		this.props.requestEval(block);
	}

	render() {
		const { blocks, connections, vars } = this.props;

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
					{connections.map(conn => (
						<Arrow
							key={conn.from.id + '-' + conn.to.id}
							conn={conn}
							onClick={() => this.removeConnection(conn)}
						/>
					))}
					{blocks.map(b => this.renderBlock(b))}
				</Content>
			</Wrapper>
		);
	}

	renderBlock(b: Block) {
		if (isLayer(b)) {
			return (
				<LayerBlockComp
					key={b.id}
					trackDrag
					onDrag={d => this.dragBlock(b, d)}
					onConnect={(f, t) => this.connectBlocks(f, t)}
					block={b}
				/>
			);
		} else if (isCode(b)) {
			return (
				<CodeBlockComp
					key={b.id}
					trackDrag
					onChange={c => this.changeCodeBlock(b, c)}
					onDrag={d => this.dragBlock(b, d)}
					onDelete={() => this.deleteCodeBlock(b)}
					onConnect={(f, t) => this.connectBlocks(f, t)}
					onEval={bl => this.eval(bl)}
					block={b}
				/>
			);
		}
		return null;
	}
}

const mapStateToProps = (state: AppState) => {
	return {
		blocks: getBlocks(state),
		connections: getConnections(state),
		vars: getVariables(state)
	};
};

const mapDispatchToProps = (dispatch: Dispatch<AppAction>) => {
	return {
		requestVariables: (): AppAction => dispatch(requestVariables()),
		requestList: (): AppAction => dispatch(requestList()),
		requestCreate: (code: string): AppAction => dispatch(requestCreate(code)),
		requestChange: (id: string, code: string): AppAction =>
			dispatch(requestChange(id, code)),
		requestMove: (id: string, x: number, y: number): AppAction =>
			dispatch(requestMove(id, x, y)),
		requestConnect: (from: string, to: string): AppAction =>
			dispatch(requestConnect(from, to)),
		requestDisconnect: (from: string, to: string): AppAction =>
			dispatch(requestDisconnect(from, to)),
		requestDelete: (id: string): AppAction => dispatch(requestDelete(id)),
		requestEval: (b: CodeBlock): AppAction => dispatch(requestEval(b)),
		startTraining: (): AppAction => dispatch(startTrain())
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(App);
