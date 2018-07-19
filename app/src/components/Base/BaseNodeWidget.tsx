import * as React from 'react';
import * as tinycolor from 'tinycolor2';

import {
	BaseWidget,
	BaseWidgetProps,
	DiagramEngine
} from 'storm-react-diagrams';

import { BaseNodeModel } from './BaseNodeModel';
import { BasetPortLabelWidget } from './BasePortLabelWidget';
import { BasePortModel } from './BasePortModel';

export interface BaseNodeProps extends BaseWidgetProps {
	node: BaseNodeModel;
	diagramEngine: DiagramEngine;
	canEditInPorts?: boolean;
	canEditOutPorts?: boolean;
	canEval?: boolean;
	hideRawData?: boolean;
}

export interface BaseNodeState {}

/**
 * @author Dylan Vorster
 */
export class BaseNodeWidget<
	P extends BaseNodeProps = BaseNodeProps,
	S extends BaseNodeState = BaseNodeState
> extends BaseWidget<P, S> {
	constructor(props: P) {
		super('srd-default-node', props);
	}

	generatePort(port: BasePortModel) {
		return (
			<BasetPortLabelWidget
				key={port.id}
				model={port}
				onDelete={
					(port.in && this.props.canEditInPorts || !port.in && this.props.canEditOutPorts) ?
						() => this.deletePort(port) : undefined
				}
			/>
		);
	}

	addPort(isIn: boolean) {
		const letter = isIn ? 'x' : 'y';
		let i = 0;
		while (this.props.node.getPort(letter + i) != null) {
			i++;
		}
		this.props.node.addPort(new BasePortModel(isIn, letter + i));
		this.forceUpdate();
	}

	deletePort(port: BasePortModel) {
		this.props.node.removePort(port);
		this.forceUpdate();
	}

	onEval() {
		this.props.node.eval();
	}

	render() {
		const { node, canEval, canEditInPorts, canEditOutPorts, hideRawData } = this.props;

		const content = this.renderContent();

		return (
			<div
				{...this.getProps()}
				style={{
					background: tinycolor(node.color).setAlpha(0.8),
					maxWidth: 600
				}}
			>
				<div className={this.bem('__title')}>
					<div className={this.bem('__name')}>{node.name}</div>
				</div>
				<div className={this.bem('__ports')}>
					<div className={this.bem('__in')}>
						{node.getInPorts().map(p => this.generatePort(p))}
						{canEditInPorts && (
							<div style={{ display: 'flex', marginTop: 2, paddingLeft: 1 }}>
								<a className="round-button" onClick={() => this.addPort(true)}>
									＋
								</a>
							</div>
						)}
					</div>
					<div className={this.bem('__out')}>
						{node.getOutPorts().map(p => this.generatePort(p))}
						{canEditOutPorts && (
							<div
								style={{
									display: 'flex',
									marginTop: 2,
									paddingRight: 1,
									justifyContent: 'flex-end'
								}}
							>
								<a className="round-button" onClick={() => this.addPort(false)}>
									＋
								</a>
							</div>
						)}
					</div>
				</div>
				{canEval && (
					<button
						disabled={node.running}
						style={{ width: '100%', cursor: 'pointer' }}
						onClick={() => this.onEval()}
					>
						▶
					</button>
				)}
				{node.err && <div style={{ padding: 4, color: 'darkred', background: 'antiquewhite'}}>{node.err}</div>}
				{canEval &&
					!hideRawData && (
						<pre style={{ margin: 0 }}>{JSON.stringify(node.out, null, 2)}</pre>
					)}
				{content && <div>{content}</div>}
			</div>
		);
	}

	renderContent(): JSX.Element | null {
		return null;
	}
}
