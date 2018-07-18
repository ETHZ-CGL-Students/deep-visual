const nj = require('numjs');

export class PlotlyConfig {
	defaultData: {[plotType: string]: any};

	static basicData = {};

	static basicLayout = {
		'width': 320,
		'height': 320,
		'margin': {t: 0, l: 0, r: 0, b: 0},
		'colorscale': 'YIGnBu'
	};

	static recommendedChartForTensor(tensor: any) {
		if (!tensor) {
			return 'Heatmap';
		}
		let t = nj.array(tensor);
		if (t.shape.length === 1 && t.shape[0] < 100) {
			return 'line';
		} else if (t.shape.length === 1) {
			return 'histogram';
		}
		return 'heatmap';
	}

	static metadataForChart(chartName: string, tensor: any, customDef: any = null): [string|null, any[]] {
		let data = {...PlotlyConfig.chartData[chartName]};
		if (!tensor) {
			return ['No input tensor', [data]];
		}
		if (customDef) {
			Object.assign(data, customDef[0]);
		}
		let t = nj.array(tensor);
		if (t.shape.length === data._dataDim) {
			// data[data._dataKey] = tensor;
			delete data[data._dataKey];
			// console.log(tensor);
			return [null, [data]];
		} else {
			return [`Chart ${chartName} requires ${data._dataDim} dimensions but input data is of shape ${t.shape}`, [data]];
		}
	}

	static fullDataForChart(metadata: any[], tensor: any) {
		let result = metadata.slice(0); // copy
		result.forEach((d) => {
			d[d._dataKey] = tensor;
		});
		return result;
	}

	static layoutForChart(chartName: string, tensor: any) {
		return PlotlyConfig.chartLayout[chartName];
	}

	static chartLayout = {
		'heatmap' : {
			...PlotlyConfig.basicLayout
		},
		'bar' : {
			...PlotlyConfig.basicLayout,
			'margin': {t: 20, l: 30, r: 20, b: 20},
		},
		'line' : {
			...PlotlyConfig.basicLayout,
			'margin': {t: 20, l: 30, r: 20, b: 20},
		},
		'box' : {
			...PlotlyConfig.basicLayout,
			'margin': {t: 20, l: 30, r: 20, b: 20},
		},
		'histogram' : {
			...PlotlyConfig.basicLayout,
			'margin': {t: 20, l: 30, r: 20, b: 20},
		},
		'histogram2d' : {
			...PlotlyConfig.basicLayout,
			'margin': {t: 20, l: 30, r: 20, b: 20},
		},
		'surface3d' : {
			...PlotlyConfig.basicLayout,
		}
	};

	static chartData = {
		'heatmap' : {
			...PlotlyConfig.basicData,
			'type': 'heatmap',
			'zmin': -1.0,
			'zmax': 1.0,
			'zauto': true,
			'_dataDim' : 2,
			'_dataKey' : 'z'
		},
		'bar' : {
			...PlotlyConfig.basicData,
			'type': 'bar',
			'_dataDim' : 1,
			'_dataKey' : 'y'
		},
		'line' : {
			...PlotlyConfig.basicData,
			'type': 'scatter',
			'mode': 'lines',
			'marker': {
				color: 'rgb(219, 64, 82)',
				size: 12
			},
			'line': {
				color: 'rgb(128, 0, 128)',
				width: 1
			},
			'_dataDim' : 1,
			'_dataKey' : 'y'
		},
		'box' : {
			...PlotlyConfig.basicData,
			'type': 'box',
			'_dataDim' : 1,
			'_dataKey' : 'y'
		},
		'histogram' : {
			...PlotlyConfig.basicData,
			'type': 'histogram',
			'_dataDim' : 1,
			'_dataKey' : 'x'
		},
		// 'histogram2d' : {
		// 	...PlotlyConfig.basicData,
		// 	'type': 'histogram2d',
		// 	'_dataDim' : 2,
		// 	'_dataKey' : ['x', 'y']
		// },
		'surface3d' : {
			...PlotlyConfig.basicData,
			'type': 'surface',
			'_dataDim' : 2,
			'_dataKey' : 'z'
		}
	};
}
