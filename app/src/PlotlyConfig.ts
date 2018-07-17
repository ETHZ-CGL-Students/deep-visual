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

	static dataForChart(chartName: string, tensor: any, customDef: any = null) {
		let t = nj.array(tensor);
		let data = PlotlyConfig.chartData[chartName];
		if (!data) {
			return [];
		}
		if (customDef) {
			Object.assign(data, customDef[0]);
		}
		console.log('Data shape:');
		console.log(t.shape);
		console.log('Expected dims:');
		console.log(data._dataDim);
		if (t.shape.length === data._dataDim + 1 && t.shape[0] === 1) {
			t = t.pick(0);
		}
		if (t.shape.length === data._dataDim) {
			if (typeof data._dataKey === 'string') {
				data[data._dataKey] = t.tolist();
			} else {
				console.log('error');
			}
		}
		return [data];
	}

	static layoutForChart(chartName: string, tensor: any) {
		return PlotlyConfig.basicLayout;
	}

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
		'scatter' : {
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
		'histogram2d' : {
			...PlotlyConfig.basicData,
			'type': 'histogram2d',
			'_dataDim' : 2,
			'_dataKey' : ['x', 'y']
		},
		'surface3d' : {
			...PlotlyConfig.basicData,
			'type': 'surface',
			'_dataDim' : 2,
			'_dataKey' : 'z'
		}
	};
}
