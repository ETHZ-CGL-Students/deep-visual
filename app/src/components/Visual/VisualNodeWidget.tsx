import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python';
import * as React from 'react';
const Plot = require('react-plotly.js');
// import Drawer from '@material-ui/core/Drawer';
// import ReactJson, { InteractionProps } from 'react-json-view';

import { PlotlyConfig } from '../../PlotlyConfig';
import { BaseNodeProps, BaseNodeState, BaseNodeWidget } from '../Base/BaseNodeWidget';

import VisualConfigurator from './VisualConfigurator';
import { VisualNodeModel } from './VisualNodeModel';

const COLORMAPS = [
	'Blackbody',
	'Bluered',
	'Blues',
	'Earth',
	'Electric',
	'Greens',
	'Greys',
	'Hot',
	'Jet',
	'Picnic',
	'Portland',
	'Rainbow',
	'RdBu',
	'Reds',
	'Viridis',
	'YlGnBu',
	'YlOrRd'
];

export interface VisualNodeWidgetProps extends BaseNodeProps {
	node: VisualNodeModel;
}

export interface VisualNodeWidgetState extends BaseNodeState {
	editorOpen: boolean;
	chartName?: string;
	layout?: any;
	data?: any;
	overlayMode: boolean;
}

export class VisualNodeWidget extends BaseNodeWidget<
	VisualNodeWidgetProps,
	VisualNodeWidgetState
> {
	content: any;
	currentEvalId: string;
	shouldRenderPlot: boolean;
	plot: any;
	state: VisualNodeWidgetState;
	plotRef: React.RefObject<any>;
	constructor(props: VisualNodeWidgetProps) {
		super(props);
		this.shouldRenderPlot = false;
		this.state = {
			editorOpen: false,
			overlayMode: false
		};
		this.onMouseDown = this.onMouseDown.bind(this);
		this.plotRef = React.createRef();
	}

	static getDerivedStateFromProps(props: VisualNodeWidgetProps, state: VisualNodeWidgetState) {
		if (!state.data && props.node.out) {
			console.log('Derived');
			let defaultChart = PlotlyConfig.recommendedChartForTensor(props.node.out);
			let defaultLayout = PlotlyConfig.layoutForChart(state.chartName || defaultChart, props.node.out);
			let [error, data] = PlotlyConfig.metadataForChart(
				state.chartName || defaultChart,
				props.node.out,
				state.data
			);
			props.node.err = error;
			return {
				data: data,
				layout: state.layout || defaultLayout,
				chartName: state.chartName || defaultChart
			};
		}
		return null;
	}

	onMouseDown(event: any) {
		event.stopPropagation();
	}

	openStyleEditor() {
		this.setState({editorOpen: true});
	}

	updatePlotlyDefs(data: any[]|null, layout: any|null, code: string|null, chartName: string) {
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
		this.setState(update, () => {
			if (code) {
				this.props.node.changeCode(code);
				this.props.node.eval();
			}
		});
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

	toggleOverlayMode() {
		this.setState({overlayMode: !this.state.overlayMode});
	}

	changeColormap(colormap: string) {
		let data = this.state.data;
		data[0].colorscale = colormap;
		this.updatePlotlyDefs(data, null, null, this.state.chartName || 'heatmap');
	}

	renderContent() {
		// Avoid plotting if no data is available
		if (!this.props.node) {
			return null;
		}

		let shouldRender = this.shouldRenderPlot || (this.currentEvalId !== this.props.node.evalId);

		// React plot should be updated only on specific cases, controlled by shouldRenderPlot
		if (this.props.node.out && shouldRender) {
			this.shouldRenderPlot = false;
			this.currentEvalId = this.props.node.evalId;
			this.plot = (
				<Plot
					ref={this.plotRef}
					data={PlotlyConfig.fullDataForChart(this.state.data, this.props.node.out)}
					layout={this.state.layout}
					// onClick={(e: any) => console.log(e)}
				/>
			);
		}

		const styles = {
			quickSelection: {
				padding: 5,
				display: 'flex',
				justifyContent: 'space-between'
			},
			checkboxLabel: {
				fontSize: '1.1em'
			}
		};

		this.content = (
			<div
				className={this.state.overlayMode ? 'overlay-block' : ''}
				onMouseDownCapture={this.onMouseDown}
			>
				{this.plot}
				<div>
					<button style={{width: '100%'}} onClick={() => this.openStyleEditor()}>Configure</button>
					<div style={styles.quickSelection}>
						<label style={styles.checkboxLabel}>
							<input
								style={{verticalAlign: 'middle'}}
								type="checkbox"
								name="checkbox-overlay"
								onChange={() => this.toggleOverlayMode()}
							/>
							Overlay mode
						</label>
						<select onChange={(e) => this.changeColormap(e.target.value)}>
							{COLORMAPS.map((map) =>
								<option key={map} value={map}>{map}</option>
							)}
						</select>
					</div>

				</div>
				<VisualConfigurator
					open={this.state.editorOpen}
					onCloseRequest={() => this.setState({editorOpen: false})}
					chartName={this.state.chartName || ''}
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
