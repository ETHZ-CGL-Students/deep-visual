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
		chartName?: string,
		layout?: any,
		data?: any
	};
	constructor(props: VisualNodeWidgetProps) {
		super(props);
		this.shouldRenderPlot = false;
		this.state = {
			editorOpen: false,
		};
		this.onMouseDown = this.onMouseDown.bind(this);

	}

	componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
		if (this.currentEvalId !== this.props.node.evalId) {
			let defaultChart = PlotlyConfig.recommendedChartForTensor(this.props.node.out);
			this.currentEvalId = this.props.node.evalId;
			this.shouldRenderPlot = true;
			let [error, data] = PlotlyConfig.metadataForChart(
				this.state.chartName || defaultChart,
				this.props.node.out,
				this.state.data
			);
			this.props.node.err = error;
			let layout = PlotlyConfig.layoutForChart(this.state.chartName || defaultChart, this.props.node.out);
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
			chartName: data.type
		});
	}

	openStyleEditor() {
		this.setState({editorOpen: true});
	}

	updatePlotlyDefs(data: any[]|null, layout: any|null, code: string|null, chartName: string) {
		if (code) {
			this.props.node.changeCode(code);
		}
		let update: any = {};
		if (data) {
			/* tslint:disable: no-string-literal */
			update['data'] = data;
		}
		if (layout) {
			/* tslint:disable: no-string-literal */
			update['layout'] = layout;
		}
		/* tslint:disable: no-string-literal */
		update['chartName'] = chartName;
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
			return outputPort.getMeta() || '?';
		} else {
			return '?';
		}
	}

	renderContent() {
		// Avoid plotting if no data is available
		if (!this.props.node) {
			return null;
		}

		// React plot should be updated only on specific cases, controlled by shouldRenderPlot
		if (this.shouldRenderPlot) {
			this.shouldRenderPlot = false;
			this.plot = (
				<Plot
					data={PlotlyConfig.fullDataForChart(this.state.data, this.props.node.out)}
					layout={this.state.layout}
					onClick={(e: any) => console.log(e)}
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
					onUpdate={(d, l, c, n) => this.updatePlotlyDefs(d, l, c, n)}
					inputShape={this.getInputShape()}
					outputShape={this.getOutputShape()}
					node={this.props.node}
				/>

			</div>
		);
		return this.content;
	}
}
