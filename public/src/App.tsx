import * as React from 'react'
import { Layer, Stage } from 'react-konva'
import { Menu, Segment, Sidebar } from 'semantic-ui-react'

import { ModelBlock, VariableBlock } from './components/Blocks'
import { GET_MODELS, GET_VARS, Query } from './graphql'

const CANVAS_WIDTH = 2000
const CANVAS_HEIGHT = 2000

interface OwnState {
	models: Model[]
	vars: Variable[]
}

class App extends React.Component<{}, OwnState> {

	constructor(props: {}) {
		super(props)

		this.state = {
			models: [],
			vars: [],
		}
	}

	addModel(model: Model) {
		this.setState({
			models: this.state.models.concat({ ...model })
		})
	}

	addVariable(vari: Variable) {
		this.setState({
			vars: this.state.vars.concat({ ...vari })
		})
	}

	render() {
		return (
			<div>
				<Sidebar.Pushable style={{ minHeight: '100vh' }}>
					<Sidebar as={Menu} animation="push" visible={true} vertical>

						<Query
							query={GET_VARS}
							loading={<Menu.Item />}
							error={err =>
								<Menu.Item>
									<Menu.Header>{err.message}</Menu.Header>
								</Menu.Item>
							}
							data={(data: Variable[]) =>
								<Menu.Item>
									<Menu.Header>Variables</Menu.Header>
									<Menu.Menu>
										{data.map(v => {
											return (
												<Menu.Item key={v.name} onClick={() => this.addVariable(v)}>
													{v.name} <span style={{ float: 'right' }}>({v.type})</span>
												</Menu.Item>
											)
										})}
									</Menu.Menu>
								</Menu.Item>
							}
						/>

						<Query
							query={GET_MODELS}
							loading={<Menu.Item />}
							error={err =>
								<Menu.Item>
									<Menu.Header>{err.message}</Menu.Header>
								</Menu.Item>
							}
							data={(data: Model[]) =>
								<Menu.Item>
									<Menu.Header>Models</Menu.Header>
									<Menu.Menu>
										{data.map(model => {
											return (
												<Menu.Item key={model.name} onClick={() => this.addModel(model)}>
													{model.name} <span style={{ float: 'right' }}>({model.type})</span>
												</Menu.Item>
											)
										})}
									</Menu.Menu>
								</Menu.Item>
							}
						/>
					</Sidebar>

					<Sidebar.Pusher style={{ width: 'calc(100% - 260px)', height: '100vh' }}>
						<Segment basic>
							Testing
							<Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
								<Layer>
									{this.state.models.map(model =>
										<ModelBlock
											key={model.name}
											model={model}
											dragBoundFunc={pos => {
													return {
															x: Math.max(Math.min(pos.x, CANVAS_WIDTH - 50), -50),
															y: Math.max(Math.min(pos.y, CANVAS_HEIGHT - 50), -50),
													}
											}}
										/>
									)}
								</Layer>
								<Layer>
									{this.state.vars.map(vari =>
										<VariableBlock
											key={vari.name}
											variable={vari}
											dragBoundFunc={pos => {
													return {
															x: Math.max(Math.min(pos.x, CANVAS_WIDTH - 25), -25),
															y: Math.max(Math.min(pos.y, CANVAS_HEIGHT - 25), -25),
													}
											}}
										/>
									)}
								</Layer>
							</Stage>
						</Segment>
					</Sidebar.Pusher>
				</Sidebar.Pushable>
			</div>
		)
	}
}

export default App
