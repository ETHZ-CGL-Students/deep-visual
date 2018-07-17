import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
const Plot = require('react-plotly.js');
import Drawer from '@material-ui/core/Drawer';
import ReactJson, { InteractionProps } from 'react-json-view';

import { PlotlyConfig } from '../../PlotlyConfig';
import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';

import { VisualNodeModel } from './VisualNodeModel';

export interface VisualNodeWidgetProps extends BaseNodeProps {
	node: VisualNodeModel;
}

export interface VisualNodeWidgetState {}

export class VisualNodeWidget extends BaseNodeWidget<
	VisualNodeWidgetProps,
	VisualNodeWidgetState
> {
	content: any;
	runIdx: number;
	shouldRenderPlot: boolean;
	plot: any;
	state: {
		editorOpen: boolean,
		chartName: string,
		layout: any,
		data: any
	};
	constructor(props: VisualNodeWidgetProps) {
		super(props);
		this.runIdx = -1;
		this.shouldRenderPlot = true;
		this.state = {
			editorOpen: false,
			chartName: 'heatmap',
			layout: {
				width: 320, height: 320,
				margin: {t: 0, l: 0, r: 0, b: 0}
			},
			data: {
				type: 'heatmap',
				colorbar: {thickness: 10}
			}
		};
		this.onMouseDown = this.onMouseDown.bind(this);

	}

	// componentWillUpdate(nextProp: any) {
	// }

	componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
		if (this.runIdx !== this.props.node.runIdx) {
			this.runIdx = this.props.node.runIdx;
			this.shouldRenderPlot = true;
			this.setState({
				data: PlotlyConfig.dataForChart(this.state.chartName, this.props.node.out),
				layout: PlotlyConfig.layoutForChart(this.state.chartName, this.props.node.out)
			});
		}
	}

	onMouseDown(event: any) {
		event.stopPropagation();
	}

	onInitialized(plotDef: any, e: any) {
		let data = plotDef.data;
		delete data.z;
		this.setState({
			layout: plotDef.layout,
			data: data,
		});
	}

	openStyleEditor() {
		this.setState({editorOpen: true});
		console.log(this.state);
	}

	closeStyleEditor() {
		this.setState({editorOpen: false});
	}

	onDefUpdate(newDef: InteractionProps) {
		this.shouldRenderPlot = true;
		let def = newDef.updated_src;
		this.setState({
			data: PlotlyConfig.dataForChart(this.state.chartName, this.props.node.out, def),
			layout: PlotlyConfig.layoutForChart(this.state.chartName, this.props.node.out)
		});
	}

	handleSelectChart(v: any) {
		let chartName = v.target.value;
		this.shouldRenderPlot = true;
		this.setState({
			data: PlotlyConfig.dataForChart(chartName, this.props.node.out),
			layout: PlotlyConfig.layoutForChart(chartName, this.props.node.out)
		});
	}

	exposablePlotData() {
		return false;
	}

	getPlotData() {
		return null;
	}

	renderContent() {
		// Avoid plotting if no data is available
		if (!this.props.node || !this.props.node.out) {
			return null;
		}

		// React plot should be updated only on specific cases, controlled by shouldRenderPlot
		if (!this.plot || this.shouldRenderPlot) {
			this.shouldRenderPlot = false;
			this.plot = (
				<Plot
					data={this.state.data}
					layout={this.state.layout}
					onInitialized={(a: any, e: any) => this.onInitialized(a, e)}
				/>
			);
		}

		let styles = {
			drawerInner: {
				width: 300,
				height: '100vh',
				background: '#282823',
				padding: 10
			}
		};

		this.content = (
			<div
				onMouseDownCapture={this.onMouseDown}
			>
				<div>
					<button style={{float: 'right'}} onClick={() => this.openStyleEditor()}>Style</button>
				</div>
				{this.plot}
				<Drawer anchor="right" open={this.state.editorOpen} onClose={() => this.closeStyleEditor()}>
					<div
						onKeyUp={(e) => e.stopPropagation()}
						style={styles.drawerInner}
					>
						<select onChange={(v) => this.handleSelectChart(v)}>
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
						<ReactJson
							src={this.state.data}
							theme="monokai"
							onEdit={(def) => this.onDefUpdate(def)}
						/>
					</div>
				</Drawer>
			</div>
		);
		return this.content;
	}
}
