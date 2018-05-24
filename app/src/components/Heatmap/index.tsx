import * as React from 'react';

declare global {
	interface Window {
		createWebGLHeatmap: any;
	}
}

export interface Props {
	data: Float32Array[];
}

export class Heatmap extends React.Component<Props> {
	heatmap: any;
	canvas: any;

	componentDidMount() {
		this.heatmap = window.createWebGLHeatmap({ canvas: this.canvas });
	}
	render() {
		return <canvas ref={r => (this.canvas = r)} />;
	}
}
