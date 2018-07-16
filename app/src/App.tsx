import {
	AppBar,
	Button,
	CircularProgress,
	Divider,
	Drawer,
	FormControl,
	IconButton,
	Input,
	InputAdornment,
	InputLabel,
	LinearProgress,
	List,
	ListItem,
	ListItemText,
	ListSubheader,
	Toolbar,
	Typography
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MenuIcon from '@material-ui/icons/Menu';
import * as React from 'react';
import {
	DiagramEngine,
	DiagramModel,
	DiagramWidget
} from 'storm-react-diagrams';

import { BaseLinkModel } from './components/Base/BaseLinkModel';
import { BaseNodeModel } from './components/Base/BaseNodeModel';
import { BasePortModel } from './components/Base/BasePortModel';
import { CodeNodeFactory } from './components/Code/CodeNodeFactory';
import { CodeNodeModel } from './components/Code/CodeNodeModel';
import { LayerNodeFactory } from './components/Layer/LayerNodeFactory';
import { LayerNodeModel } from './components/Layer/LayerNodeModel';
import { VariableNodeFactory } from './components/Variable/VariableNodeFactory';
import { VariableNodeModel } from './components/Variable/VariableNodeModel';
import { VisualNodeFactory } from './components/Visual/VisualNodeFactory';
import { VisualNodeModel } from './components/Visual/VisualNodeModel';
import API from './services/api';
import { Block, isCode, isLayer, isVar, isVisual, Variable } from './types';

const debounce = require('lodash.debounce');

interface Props {}

interface OwnState {
	connected: boolean;
	loading: boolean;
	blocks: BaseNodeModel[];
	links: BaseLinkModel[];
	vars: Variable[];
	epochProgress: number;
	batchProgress: number;
	menu: boolean;
	playing: boolean;
	filter: string;
}

class App extends React.Component<Props, OwnState> {
	engine: DiagramEngine;
	model: DiagramModel;
	playInterval: any;

	constructor(props: Props) {
		super(props);
		this.playInterval = null;
		this.state = {
			connected: false,
			loading: true,
			blocks: [],
			links: [],
			vars: [],
			epochProgress: 0,
			batchProgress: 0,
			menu: false,
			playing: true,
			filter: ''
		};
	}

	componentDidMount() {
		this.model = new DiagramModel();

		this.engine = new DiagramEngine();
		this.engine.registerNodeFactory(new CodeNodeFactory());
		this.engine.registerNodeFactory(new LayerNodeFactory());
		this.engine.registerNodeFactory(new VariableNodeFactory());
		this.engine.registerNodeFactory(new VisualNodeFactory());
		this.engine.installDefaultFactories();
		this.engine.setDiagramModel(this.model);

		API.onConnet(() => {
			this.setState({ connected: true });
		});
		API.onDisconnet(() => {
			this.setState({ connected: false });
		});

		API.onEpochBegin((epoch: number, epochs: number) => {
			this.setState({ epochProgress: (epoch / epochs) * 100 });
		});
		API.onBatchBegin((batch: number, batches: number) => {
			this.setState({ batchProgress: (batch / batches) * 100 });
		});

		API.getData(({ blocks, links, vars }) => {
			vars.sort((a, b) => a.name.localeCompare(b.name));
			this.setState({ vars, loading: false });

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

		API.onEvalResults((id, blockRes) => {
			console.log('New results available: ' + id);
			// If we're in play mode then we always want to show new results
			// as soon as they become available, so fetch all new data
			if (this.state.playing) {
				Object.keys(blockRes).forEach(blockId => {
					const block = this.state.blocks.find(
						b => b.id === blockId
					) as BaseNodeModel;
					// We get the data for all visual blocks and all blocks with errors
					if (!blockRes[blockId] || block instanceof VisualNodeModel) {
						API.getResults(id, block.id, (err, out) => {
							block.err = err;
							block.out = out;
							this.forceUpdate();
						});
					} else {
						block.err = null;
						block.out = null;
					}
				});
			}
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
		} else if (isVisual(b)) {
			_node = new VisualNodeModel(b);
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
	addVisualBlock() {
		API.createBlock({ type: 'visual' });
	}
	addVariableBlock(name: string) {
		API.createBlock({ type: 'var', var: name });
	}

	evalAll() {
		API.evalAllBlocks((id, blockRes) => {
			// Grab the results for each block
			Object.keys(blockRes).forEach(blockId => {
				const block = this.state.blocks.find(
					b => b.id === blockId
				) as BaseNodeModel;
				// We get the data for all visual blocks and all blocks with errors
				if (!blockRes[block.id] || block instanceof VisualNodeModel) {
					API.getResults(id, block.id, (err, out) => {
						console.log(block.id, err);
						block.err = err;
						block.out = out;
						this.forceUpdate();
					});
				} else {
					block.err = null;
					block.out = null;
				}
			});
		});
	}

	toggleMenu() {
		this.setState({
			menu: !this.state.menu
		});
	}

	togglePlay() {
		this.setState({ playing: !this.state.playing });
	}

	render() {
		const {
			vars,
			epochProgress,
			batchProgress,
			menu,
			playing,
			filter
		} = this.state;

		return (
			<>
				<AppBar title="MaDDNA" position="static" color="default">
					<Toolbar variant="dense">
						<IconButton
							color="inherit"
							aria-label="Menu"
							style={{ marginLeft: -18 }}
							onClick={() => this.toggleMenu()}
						>
							<MenuIcon />
						</IconButton>
						<Typography variant="title" color="inherit" style={{ flex: 1 }}>
							MaDNNA
						</Typography>
						<div style={{ flex: 1 }}>
							<div style={{ width: 200, marginBottom: 4 }}>
								<LinearProgress
									variant="determinate"
									color="primary"
									value={epochProgress}
								/>
							</div>
							<div style={{ width: 200 }}>
								<LinearProgress
									variant="determinate"
									color="secondary"
									value={batchProgress}
								/>
							</div>
						</div>
						<div>
							<Button
								variant="contained"
								color="primary"
								size="small"
								onClick={() => this.evalAll()}
							>
								Run all
							</Button>{' '}
							<Button
								variant="contained"
								size="small"
								style={{ color: playing ? 'forestgreen' : '#ff4d4d' }}
								onClick={() => this.togglePlay()}
							>
								{playing ? 'Playing' : 'Paused'}
							</Button>
						</div>
					</Toolbar>
				</AppBar>
				<div id="content">
					{this.engine &&
						this.model && (
							<DiagramWidget
								className="diagram"
								diagramEngine={this.engine}
								allowLooseLinks={false}
								smartRouting={false}
								allowCanvasZoom={true}
								maxNumberPointsPerLink={0}
							/>
						)}
				</div>
				<Drawer open={menu} onClose={() => this.toggleMenu()}>
					<div style={{ width: 280, overflowX: 'hidden' }}>
						<List dense>
							<ListSubheader component="div" disableSticky>
								Blocks
							</ListSubheader>
							<ListItem button onClick={() => this.addCodeBlock()}>
								<ListItemText primary="Code" secondary="Add custom code" />
							</ListItem>
							<ListItem button onClick={() => this.addVisualBlock()}>
								<ListItemText primary="Visual" secondary="Visualize data" />
							</ListItem>
						</List>
						<Divider />
						<List dense>
							<ListSubheader component="div" disableSticky>
								Variables
							</ListSubheader>
							<ListItem>
								<FormControl style={{ marginTop: -12, marginBottom: 12 }}>
									<InputLabel htmlFor="filter-vars">Search...</InputLabel>
									<Input
										id="filter-vars"
										type="search"
										value={filter}
										onChange={e => this.setState({ filter: e.target.value })}
										endAdornment={
											filter.length > 0 && (
												<InputAdornment position="end">
													<IconButton
														onClick={() => this.setState({ filter: '' })}
													>
														<CloseIcon />
													</IconButton>
												</InputAdornment>
											)
										}
									/>
								</FormControl>
							</ListItem>
							{vars.filter(v => v.name.indexOf(filter) >= 0).map(v => (
								<ListItem
									key={v.name}
									button
									onClick={() => this.addVariableBlock(v.name)}
								>
									<ListItemText primary={v.name} secondary={v.type} />
								</ListItem>
							))}
						</List>
					</div>
				</Drawer>
				{(!this.state.connected || this.state.loading) && (
					<div id="overlay">
						<div>
							<div style={{ marginBottom: 10 }}>
								{this.state.connected
									? 'Loading'
									: this.state.loading
										? 'Connecting'
										: 'Reconnecting'}...
							</div>
							<CircularProgress />
						</div>
					</div>
				)}
			</>
		);
	}
}

export default App;
