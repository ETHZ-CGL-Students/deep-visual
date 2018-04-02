import * as React from 'react'
import { Layer, Stage } from 'react-konva'
import styled from 'styled-components'

import { ModelBlock, VariableBlock } from './components/Blocks'
import { GET_MODELS, GET_VARS, Query } from './graphql'

let id = 0
const MENU_WIDTH = 220

const Wrapper = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: stretch;
	height: 100vh;
`

const Menu = styled.div`
	padding: 4px;
	overflow: auto;
	z-index: 1000;
	width: ${MENU_WIDTH}px;
	border-right: 1px solid black;
`

const MenuDiv = styled.div`
	cursor: pointer;
	margin: 4px 0;
	padding: 2px;

	&:hover {
		background: lightgray;
	}
`

const Content = styled.div`
	flex: 1;
`

const MenuItem = ({ obj, onClick }: { obj: { name: string, type: string }, onClick: () => void }) => (
	<MenuDiv onClick={onClick}>
		{obj.name} <span style={{ float: 'right' }}>({obj.type})</span>
	</MenuDiv>
)

interface OwnState {
	models: Model[]
	vars: Variable[]
	ref: HTMLDivElement | null
	selected: (Model | Variable)[]
}

class App extends React.Component<{}, OwnState> {

	constructor(props: {}) {
		super(props)

		this.state = {
			models: [],
			vars: [],
			ref: null,
			selected: [],
		}
	}

	componentDidMount() {
		window.addEventListener('keyup', e => this.handleKeyUp(e), false)
	}

	componentWillUnmount() {
		window.removeEventListener('keyup', e => this.handleKeyUp(e), false)
	}

	addModel(model: Model) {
		this.setState({
			models: this.state.models.concat({ ...model, id: ++id })
		})
	}

	addVariable(vari: Variable) {
		this.setState({
			vars: this.state.vars.concat({ ...vari, id: ++id })
		})
	}

	handleKeyUp(event: any) {
		if (event.keyCode === 46) {
			this.setState({
				models: this.state.models.filter(m => !(this.state.selected.indexOf(m) >= 0)),
				vars: this.state.vars.filter(v => !(this.state.selected.indexOf(v) >= 0)),
				selected: [],
			})
		}
	}

	handleModelUnselect(obj: Model | Variable) {
		const newSelected = [...this.state.selected]
		if (!(newSelected.indexOf(obj) >= 0)) {
			newSelected.push(obj)
		}
		this.setState({
			selected: newSelected
		})
	}
	handleModelSelect(obj: Model | Variable) {
		const newSelected = [...this.state.selected]
		const idx = newSelected.indexOf(obj)
		if (idx >= 0) {
			newSelected.splice(idx, 1)
		}
		this.setState({
			selected: newSelected
		})
	}

	render() {
		const ref = this.state.ref
		const width = ref ? ref.getBoundingClientRect().width : 400
		const height = ref ? ref.getBoundingClientRect().height : 400

		return (
			<Wrapper>
				<Menu>
					<Query
						query={GET_VARS}
						loading={<div />}
						error={err =>
							<div style={{ width: '100%' }}>
								{err.message}
							</div>
						}
						data={(data: Variable[]) =>
							<div style={{ width: '100%' }}>
								<h2>Variables</h2>
								{data.map(v => <MenuItem key={v.name} obj={v} onClick={() => this.addVariable(v)} />)}
							</div>
						}
					/>

					<Query
						query={GET_MODELS}
						loading={<div />}
						error={err =>
							<div style={{ width: '100%' }}>
								{err.message}
							</div>
						}
						data={(data: Model[]) =>
							<div style={{ width: '100%' }}>
								<h2 style={{ marginTop: '2em' }}>Models</h2>
								<div style={{ width: '100%' }}>
									{data.map(m => <MenuItem key={m.name} obj={m} onClick={() => this.addModel(m)} />)}
								</div>
							</div>
						}
					/>
				</Menu>

				<Content
					innerRef={(r: any) => { if (r && !this.state.ref) { this.setState({ ref: r }) } }}
					onKeyUp={e => this.handleKeyUp(e)}
				>
					<Stage width={width} height={height}>
						<Layer>
							{this.state.models.map(model =>
								<ModelBlock
									key={model.id}
									model={model}
									onModelSelect={m => this.handleModelSelect(m)}
									onModelUnselect={m => this.handleModelUnselect(m)}
								/>
							)}
						</Layer>
						<Layer>
							{this.state.vars.map(vari =>
								<VariableBlock
									key={vari.id}
									variable={vari}
								/>
							)}
						</Layer>
					</Stage>
				</Content>

				<div style={{ clear: 'both ' }} />
			</Wrapper>
		)
	}
}

export default App
