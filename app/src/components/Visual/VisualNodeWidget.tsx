import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
const Plot = require('react-plotly.js');
// import Drawer from '@material-ui/core/Drawer';
// import ReactJson, { InteractionProps } from 'react-json-view';

import { PlotlyConfig } from '../../PlotlyConfig';
import { BaseNodeProps, BaseNodeWidget } from '../Base/BaseNodeWidget';

import VisualConfigurator from './VisualConfigurator';
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
	currentEvalId: string;
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
		this.shouldRenderPlot = true;
		this.state = {
			editorOpen: false,
			chartName: 'heatmap',
			layout: {
				width: 320, height: 320,
				margin: {t: 0, l: 0, r: 0, b: 0}
			},
			data: [{
				type: 'heatmap',
				colorbar: {thickness: 10}
			}]
		};
		this.onMouseDown = this.onMouseDown.bind(this);

	}

	componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
		if (this.currentEvalId !== this.props.node.evalId) {
			this.currentEvalId = this.props.node.evalId;
			let [error, data] = PlotlyConfig.dataForChart(this.state.chartName, this.props.node.out, this.state.data);
			if (error) {
				console.log(error);
				this.props.node.err = error;
			}
			let layout = PlotlyConfig.layoutForChart(this.state.chartName, this.props.node.out);
			this.shouldRenderPlot = true;
			this.setState({
				data: data,
				layout: layout
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
	}

	updatePlotlyDefs(update: any) {
		console.log('Update');
		console.log(update);
		this.shouldRenderPlot = true;
		this.setState(update);
	}

	getInputShape() {
		if (!this.props.node || !this.props.node.outputMeta) {
			return '?';
		}
		// TODO: for now, this assumes a VisualNode as one input port only
		let inputPort = this.props.node.getInPorts().find(() => true);
		if (inputPort) {
			return inputPort.getMeta() || '?';
		} else {
			return '?';
		}
	}

	getOutputShape() {
		if (!this.props.node || !this.props.node.outputMeta) {
			return '?';
		}
		// TODO: for now, this assumes a VisualNode as one output port only
		let outputPort = this.props.node.getOutPorts().find(() => true);
		if (outputPort) {
			console.log(outputPort);
			return outputPort.getMeta() || '?';
		} else {
			return '?';
		}
	}

	renderContent() {
		// Avoid plotting if no data is available
		if (!this.props.node || !this.props.node.out) {
			return null;
		}

		// React plot should be updated only on specific cases, controlled by shouldRenderPlot
		if (!this.plot || this.shouldRenderPlot) {
			this.shouldRenderPlot = false;
			console.log('Should render now');
			console.log(this.state.data);
			this.plot = (
				<Plot
					data={this.state.data}
					layout={this.state.layout}
					onInitialized={(a: any, e: any) => this.onInitialized(a, e)}
				/>
			);
		}

		this.content = (
			<div
				onMouseDownCapture={this.onMouseDown}
			>
				{this.plot}
				<div>
					<button style={{width: '100%'}} onClick={() => this.openStyleEditor()}>Configurator</button>
				</div>
				<VisualConfigurator
					open={this.state.editorOpen}
					onCloseRequest={() => this.setState({editorOpen: false})}
					data={this.state.data}
					layout={this.state.layout}
					code={this.props.node.code}
					onDataUpdate={(data) => this.updatePlotlyDefs({data: data})}
					onLayoutUpdate={(layout) => this.updatePlotlyDefs({layout: layout})}
					onCodeUpdate={(code) => this.props.node.changeCode(code)}
					onChartNameUpdate={(chartName) => this.setState({chartName: chartName})}
					inputShape={this.getInputShape()}
					outputShape={this.getOutputShape()}
					tensor={this.props.node.out}
				/>

			</div>
		);
		return this.content;
	}
}
