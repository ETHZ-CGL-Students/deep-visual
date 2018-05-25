import * as React from 'react';
import styled from 'styled-components';

import { ModelBlock } from './components/Blocks';
import { socket } from './SocketIO';

const Wrapper = styled.div`
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 10px;
	box-sizing: border-box;
`;

interface OwnState {
	model?: Model;
	epochs: number;
	epoch: number;
	batches: number;
	batch: number;
}

class App extends React.Component<{}, OwnState> {
	constructor(props: {}) {
		super(props);

		this.state = {
			epochs: 0,
			epoch: 0,
			batches: 0,
			batch: 0
		};
	}

	componentDidMount() {
		// window.addEventListener('keyup', e => this.handleKeyUp(e), false);
		socket.emit('model', (model: Model) => {
			console.log(model);
			this.setState({
				model
			});
		});
		socket.on('set_params', (data: any) => this.set_params(data));
		socket.on('train_begin', () => this.train_begin());
		socket.on('train_end', () => this.train_end());
		socket.on('epoch_begin', (epoch: number) => this.epoch_begin(epoch));
		socket.on('batch_begin', (batch: number) => this.batch_begin(batch));
	}

	componentWillUnmount() {
		// window.removeEventListener('keyup', e => this.handleKeyUp(e), false);
		socket.off('set_params');
		socket.off('train_begin');
		socket.off('train_end');
		socket.off('epoch_begin');
		socket.off('batch_begin');
	}

	set_params(data: any) {
		console.log(data);
		this.setState({
			epochs: data.epochs,
			batches: Math.ceil(data.samples / data.batch_size)
		});
	}

	start() {
		socket.emit('start');
	}

	train_begin() {
		console.log('Starting...');
	}

	train_end() {
		this.setState({
			epoch: this.state.epochs,
			batch: this.state.batches
		});
	}

	epoch_begin(epoch: number) {
		this.setState({ epoch, batch: 0 });
	}

	batch_begin(batch: number) {
		this.setState({ batch });
	}

	render() {
		const { model } = this.state;

		return (
			<Wrapper>
				<button onClick={() => this.start()}>Start training</button>
				<br />
				<br />

				<progress value={this.state.epoch} max={this.state.epochs} />
				<br />

				<progress value={this.state.batch} max={this.state.batches} />
				<br />
				<br />

				{model && <ModelBlock key={model.id} model={model} />}

				<div style={{ clear: 'both' }} />
			</Wrapper>
		);
	}
}

export default App;
