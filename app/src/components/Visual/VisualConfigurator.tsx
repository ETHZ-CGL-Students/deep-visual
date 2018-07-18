import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import ReactJson, { InteractionProps } from 'react-json-view';

import { PlotlyConfig } from '../../PlotlyConfig';

export interface VisualConfiguratorProps {
	open: boolean;
	onCloseRequest: (event: React.SyntheticEvent) => void;
	chartName: string;
	data: any;
	layout: any;
	code: any;
	inputShape: string;
	outputShape: string;
	onUpdate: (data: any[]|null, layout: any|null, code: string|null, chartName: string) => void;
	node: any;
}

export default class VisualConfigurator extends React.Component<VisualConfiguratorProps> {
	props: VisualConfiguratorProps;
	state: {
		tempCode?: string,
		tab: number
	};
	constructor(props: VisualConfiguratorProps) {
		super(props);
		this.state = {
			tab: 0
		};
	}

	onDataUpdate(defs: InteractionProps) {
		let [error, newData] = PlotlyConfig.metadataForChart(this.props.chartName, this.props.node.out, defs.updated_src);
		this.props.node.err = error;
		this.props.onUpdate(newData, null, null, this.props.chartName);
	}

	onLayoutUpdate(defs: InteractionProps) {
		this.props.onUpdate(null, defs.updated_src, null, this.props.chartName);
	}

	onCodeSave() {
		if (this.state.tempCode) {
			let code = this.state.tempCode;
			this.setState({tempCode: undefined}, () => {
				this.props.onUpdate(null, null, code, this.props.chartName);
			});
		}
	}

	handleSelectChart(chartName: any) {
		let [error, newData] = PlotlyConfig.metadataForChart(chartName, this.props.node.out);
		this.props.node.err = error;
		let newLayout = PlotlyConfig.layoutForChart(chartName, this.props.node.out);
		this.props.onUpdate(newData, newLayout, null, chartName);
	}

	render() {

		let styles = {
			title: {
				color: 'white'
			},
			drawerInner: {
				width: 300,
				height: '100vh',
				background: '#282823',
				padding: 10,
				color: 'white',
				overflowX: 'hidden',
			},
			top: {
				position: 'relative',
				// textAlign: 'center'
			},
			line: {
				position: 'absolute',
				top: 0,
				bottom: 0,
				width: 1,
				background: '#777',
				margin: 'auto'
			},
			select: {
				margin: 'auto',
				marginTop: 10,
				marginBottom: 10,
				fontSize: '1.2em',
				background: 'transparent',
				color: 'white',
				textTransform: 'capitalize'
			}
		};

		return (
				<Drawer anchor="right" open={this.props.open} onClose={this.props.onCloseRequest}>
					<div
						onKeyUp={(e) => e.stopPropagation()}
						style={styles.drawerInner as any}
					>
						<h2 style={styles.title}>Visual Configurator</h2>
						<div style={styles.top as any}>
							<p>Input has shape {this.props.inputShape}</p>
							<p>Apply (optional) transformation</p>
							<CodeMirror
								className="code-editor-side"
								value={this.state.tempCode || this.props.code}
								onChange={(c => this.setState({tempCode: c}))}
								options={{
									mode: 'python',
									lineNumbers: false,
								}}
							/>
							<Button
								variant="contained"
								color="primary"
								onClick={() => this.onCodeSave()}
							>
								Save
							</Button>
							<p>Output {this.props.outputShape}</p>

						</div>

						<select
							style={styles.select as any}
							value={this.props.chartName}
							onChange={(e) => this.handleSelectChart(e.target.value)}
						>
							{Object.keys(PlotlyConfig.chartData).map((key) => {
								return (
									<option
										style={{color: 'black'}}
										key={key}
										value={key}
									>
										{key}
									</option>
								);
							})}
						</select>

						<AppBar position="static" color="default">
							<Tabs
								value={this.state.tab}
								onChange={(_, t) => this.setState({tab: t})}
								indicatorColor="primary"
								textColor="primary"
								fullWidth
							>
								<Tab value={0} label="Data" />
								<Tab value={1} label="Layout" />
							</Tabs>
						</AppBar>
						{/* ReactJson fails to update src properly. Workaround: keep both loaded
						https://github.com/mac-s-g/react-json-view/issues/206
						*/}
						<div style={{display: this.state.tab === 0 ? 'block' : 'none', marginTop: 15}}>
							<ReactJson
								src={this.props.data}
								theme="monokai"
								name={false}
								onEdit={(def: any) => this.onDataUpdate(def)}
							/>
						</div>
						<div style={{display: this.state.tab === 1 ? 'block' : 'none', marginTop: 15}}>
							<ReactJson
								src={this.props.layout}
								theme="monokai"
								name={false}
								onEdit={(def: any) => this.onLayoutUpdate(def)}
							/>
						</div>

					</div>
				</Drawer>
			);

	}
}
