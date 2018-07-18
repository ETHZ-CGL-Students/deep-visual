import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
import * as CodeMirror from 'react-codemirror';

import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import ReactJson, { InteractionProps } from 'react-json-view';

import { PlotlyConfig } from '../../PlotlyConfig';

export interface VisualConfiguratorProps {
	open: boolean;
	onCloseRequest: (event: React.SyntheticEvent) => void;
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
		chartName: string,
		tempCode?: string,
		tab: number
	};
	constructor(props: VisualConfiguratorProps) {
		super(props);
		this.state = {
			tab: 0,
			chartName: 'heatmap'
		};
	}

	onDataUpdate(defs: InteractionProps) {
		let newData = PlotlyConfig.metadataForChart(this.state.chartName, this.props.node.out, defs.updated_src);
		this.props.onUpdate(newData, null, null, this.state.chartName);
	}

	onLayoutUpdate(defs: InteractionProps) {
		this.props.onUpdate(null, defs.updated_src, null, this.state.chartName);
	}

	onCodeSave() {
		if (this.state.tempCode) {
			let code = this.state.tempCode;
			this.setState({tempCode: undefined}, () => {
				this.props.onUpdate(null, null, code, this.state.chartName);
			});
		}
	}

	handleSelectChart(chartName: any) {
		this.setState({chartName: chartName});
		let [error, newData] = PlotlyConfig.metadataForChart(chartName, this.props.node.out);
		this.props.node.err = error;
		let newLayout = PlotlyConfig.layoutForChart(chartName, this.props.node.out);
		this.props.onUpdate(newData, newLayout, null, this.state.chartName);
	}

	static cleanData (originalData: any[]) {
		let data: any[] = [];
		if (!originalData) {
			return [];
		}
		originalData.forEach((d) => {
			let nd = {...d};
			let dataKey = nd._dataKey;
			nd[dataKey] = 'data';
			// delete nd._dataDim;
			data.push(nd);
		});
		return data;
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
			}
		};

		return (
				<Drawer anchor="right" open={this.props.open} onClose={this.props.onCloseRequest}>
					<div
						onKeyUp={(e) => e.stopPropagation()}
						style={styles.drawerInner as any}
					>
						<div>
							<h1 style={styles.title}>Visual Configurator</h1>
							<p>Input shape: {this.props.inputShape}</p>
							<p><i>Transform</i></p>
							<CodeMirror
								className="code-editor-side"
								value={this.state.tempCode || this.props.code}
								onChange={(c => this.setState({tempCode: c}))}
								options={{
									mode: 'python',
									lineNumbers: false,
								}}
							/>
							<button onClick={() => this.onCodeSave()}>Save</button>
							<p>Output shape: {this.props.outputShape}</p>

						</div>
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
						<select value={this.state.chartName} onChange={(e) => this.handleSelectChart(e.target.value)}>
							{Object.keys(PlotlyConfig.chartData).map((key) => {
								return (
									<option
										key={key}
										value={key}
									>
										{key}
									</option>
								);
							})}
						</select>
						{/* ReactJson fails to update src properly. Workaround: keep both visible
						https://github.com/mac-s-g/react-json-view/issues/206
						*/}
						<div style={{display: this.state.tab === 0 ? 'block' : 'none'}}>
							<ReactJson
								src={VisualConfigurator.cleanData(this.props.data)}
								theme="monokai"
								name={false}
								onEdit={(def: any) => this.onDataUpdate(def)}
							/>
						</div>
						<div style={{display: this.state.tab === 1 ? 'block' : 'none'}}>
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
