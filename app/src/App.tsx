import * as React from 'react';
import {
	DiagramEngine,
	DiagramModel,
	DiagramWidget
} from 'storm-react-diagrams';

import { Block, isCode, isLayer, isVar, Variable } from './types';

import { BaseLinkModel } from './components/Base/BaseLinkModel';
import { BaseNodeModel } from './components/Base/BaseNodeModel';
import { BasePortModel } from './components/Base/BasePortModel';
import { CodeNodeFactory } from './components/Code/CodeNodeFactory';
import { CodeNodeModel } from './components/Code/CodeNodeModel';
import { LayerNodeFactory } from './components/Layer/LayerNodeFactory';
import { LayerNodeModel } from './components/Layer/LayerNodeModel';
import { VariableNodeFactory } from './components/Variable/VariableNodeFactory';
import { VariableNodeModel } from './components/Variable/VariableNodeModel';
import API from './services/api';

const debounce = require('lodash.debounce');

interface Props {}

interface OwnState {
	blocks: BaseNodeModel[];
	links: BaseLinkModel[];
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
			blocks: [],
			links: [],
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
		this.engine.registerNodeFactory(new VariableNodeFactory());
		this.engine.installDefaultFactories();
		this.engine.setDiagramModel(this.model);

		API.getData(({ blocks, links, vars }) => {
			console.log(blocks);
			console.log(links);
			console.log(vars);

			vars.sort((a, b) => a.name.localeCompare(b.name));
			this.setState({ vars });

			const blockModels: { [x: string]: BaseNodeModel } = {};
			blocks.forEach(b => (blockModels[b.id] = this.addNodeForBlock(b)));

			links.forEach(link => {
				const from = blockModels[link.fromId].getPort(
					link.fromPort
				) as BasePortModel;
				const to = blockModels[link.toId].getPort(link.toPort) as BasePortModel;

				if (!from || !to) {
					console.log('Could not create link: Port not found', link, from, to);
					return;
				}

				const linkModel = new BaseLinkModel(link);
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
				this.setState(prevState => ({
					links: prevState.links.concat(linkModel)
				}));
			});

			this.engine.zoomToFit();
			this.forceUpdate();
		});

		API.onBlockCreate(b => this.addNodeForBlock(b));
		API.onBlockChange(b => {
			console.log(b);
		});
		API.onBlockMove(b => {
			const node = this.model.getNode(b.id) as BaseNodeModel;
			if (!node) {
				return;
			}
			node.pauseEvents();
			node.x = b.x;
			node.y = b.y;
			Object.keys(node.getPorts()).forEach(p => {
				const port = node.ports[p];
				const portCoords = this.engine.getPortCoords(port);
				port.updateCoords(portCoords);
			});
			node.resumeEvents();
			this.forceUpdate();
		});
	}

	addNodeForBlock(b: Block) {
		let _node: any = null;
		if (isCode(b)) {
			_node = new CodeNodeModel(b);
			_node.onChange(() => {
				API.changeBlock(b.id, _node.code);
			});
		} else if (isVar(b)) {
			_node = new VariableNodeModel(b);
		} else if (isLayer(b)) {
			_node = new LayerNodeModel(b);
		}

		const node = _node as BaseNodeModel;

		node.setPosition(b.x, b.y);
		node.onEval(() => {
			node.err = null;
			node.out = null;
			node.running = true;
			API.evalBlock(b.id, (err, out) => {
				node.err = err;
				node.out = out;
				node.running = false;
				this.forceUpdate();
			});
		});
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
		this.setState(prevState => ({
			blocks: prevState.blocks.concat(node)
		}));
		// this.forceUpdate();
		return node;
	}

	addCodeBlock(code: string = '') {
		API.createBlock({ type: 'code', code });
	}
	addVariableBlock(name: string) {
		API.createBlock({ type: 'var', var: name });
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
						<br />
						<br />
						<progress value={this.state.epoch} max={this.state.epochs} />
						<br />
						<progress value={this.state.batch} max={this.state.batches} />
					</div>
					<h3>Blocks</h3>
					<div id="menu-blocks">
						<div className="menu-entry" onClick={() => this.addCodeBlock()}>
							<div>Code</div>
							<div className="type">Add custom code</div>
						</div>
					</div>
					<h3>Variables</h3>
					<div id="menu-var">
						{vars.map(v => (
							<div
								key={v.name}
								className="menu-entry"
								onClick={() => this.addVariableBlock(v.name)}
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
								allowLooseLinks={false}
								smartRouting={false}
								maxNumberPointsPerLink={0}
							/>
						)}
				</div>
			</div>
		);
	}
}

export default App;
