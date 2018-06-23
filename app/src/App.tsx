import * as React from 'react';
import {
	DiagramEngine,
	DiagramModel,
	DiagramWidget
} from 'storm-react-diagrams';

import { Block, isCode, Variable } from './types';

import { BaseLinkModel } from './components/Base/BaseLinkModel';
import { BaseNodeModel } from './components/Base/BaseNodeModel';
import { CodeNodeFactory } from './components/Code/CodeNodeFactory';
import { CodeNodeModel } from './components/Code/CodeNodeModel';
import { LayerNodeFactory } from './components/Layer/LayerNodeFactory';
import { LayerNodeModel } from './components/Layer/LayerNodeModel';
import API from './services/api';

const debounce = require('lodash.debounce');

interface Props {}

interface OwnState {
	vars: Variable[];
	epochs: number;
	epoch: number;
	batches: number;
	batch: number;
}

class App extends React.Component<Props, OwnState> {
	engine: DiagramEngine;
	model: DiagramModel;

	constructor(props: Props) {
		super(props);

		this.state = {
			vars: [],
			epochs: 0,
			epoch: 0,
			batches: 0,
			batch: 0
		};
	}

	componentDidMount() {
		this.model = new DiagramModel();

		this.engine = new DiagramEngine();
		this.engine.registerNodeFactory(new CodeNodeFactory());
		this.engine.registerNodeFactory(new LayerNodeFactory());
		this.engine.installDefaultFactories();
		this.engine.setDiagramModel(this.model);

		API.getData(({ blocks, links, vars }) => {
			console.log(blocks);
			console.log(links);
			console.log(vars);

			this.setState({ vars });

			const blockModels: { [x: string]: BaseNodeModel } = {};
			blocks.forEach(b => (blockModels[b.id] = this.addNodeForBlock(b)));

			links.forEach(link => {
				const from = blockModels[link.fromId].getPort(link.fromPort);
				const to = blockModels[link.toId].getPort(link.toPort);
				if (!from || !to) {
					console.log('Could not create link: Port not found', link, from, to);
					return;
				}
				const linkModel = new BaseLinkModel(link.id);
				linkModel.setSourcePort(from);
				linkModel.setTargetPort(to);
				linkModel.addListener({
					entityRemoved: () => API.deleteLink(linkModel.id),
					sourcePortChanged: event => {
						console.log(event);
						/*API.createLink(
							linkModel.getSourcePort().parent.id,
							linkModel.getSourcePort().name,
							linkModel.getTargetPort().parent.id,
							linkModel.getTargetPort().name
						);*/
					},
					targetPortChanged: event => {
						console.log(event);
						/*API.createLink(
							linkModel.getSourcePort().parent.id,
							linkModel.getSourcePort().name,
							linkModel.getTargetPort().parent.id,
							linkModel.getTargetPort().name
						);*/
					}
				});
				this.model.addLink(linkModel);
			});

			this.engine.zoomToFit();
			this.forceUpdate();
		});

		API.on('blockCreate', bs => bs.forEach(b => this.addNodeForBlock(b)));
		API.on('blockChange', bs => {
			//
		});
		API.on('blockMove', bs =>
			bs.forEach(b => {
				const node = this.model.getNode(b.id) as BaseNodeModel;
				if (!node) {
					return;
				}
				node.pauseEvents();
				node.x = b.x;
				node.y = b.y;
				node.resumeEvents();
				this.forceUpdate();
			})
		);
	}

	addNodeForBlock(b: Block) {
		let node: BaseNodeModel = isCode(b)
			? new CodeNodeModel(b)
			: new LayerNodeModel(b.id);

		node.setPosition(b.x, b.y);
		node.onMove(debounce(() => API.moveBlock(b.id, node.x, node.y), 100));
		node.onNewPort(port => API.createPort(b.id, port.in, port.name));
		node.onRenamePort((port, oldName) =>
			API.renamePort(b.id, port.in, oldName, port.name)
		);
		node.onDeletePort(port => API.deletePort(b.id, port.in, port.name));
		node.addListener({
			entityRemoved: () => API.deleteBlock(node.id)
		});

		this.model.addNode(node);
		this.forceUpdate();
		return node;
	}

	addCodeBlock(code: string = '') {
		API.createBlock(code);
	}

	dragBlock(id: string, x: number, y: number) {
		API.moveBlock(id, x, y);
	}

	changeCodeBlock(id: string, newCode: string) {
		API.changeBlock(id, newCode);
	}

	deleteCodeBlock(id: string) {
		if (confirm('Are you sure you want to delete this code block?')) {
			API.deleteBlock(id);
		}
	}

	eval(id: string) {
		API.evalBlock(id, () => {
			//
		});
	}

	start() {
		API.startTraining();
	}

	render() {
		const { vars } = this.state;

		return (
			<div id="wrapper">
				<div id="menu">
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
					<div id="menu-var">
						{vars.map(v => (
							<div
								key={v.name}
								className="menu-var-entry"
								onClick={() => this.addCodeBlock(`out = ${v.name}`)}
							>
								<div>{v.name}</div>
								<div className="type">{v.type}</div>
							</div>
						))}
					</div>
				</div>
				<div id="content">
					{this.engine &&
						this.model && (
							<DiagramWidget
								className="diagram"
								diagramEngine={this.engine}
								maxNumberPointsPerLink={0}
							/>
						)}
				</div>
			</div>
		);
	}
}

export default App;
