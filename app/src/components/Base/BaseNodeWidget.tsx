import * as React from 'react';
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
	canEditPorts?: boolean;
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
					this.props.canEditPorts ? () => this.deletePort(port) : undefined
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

	render() {
		return (
			<div {...this.getProps()} style={{ background: this.props.node.color }}>
				<div className={this.bem('__title')}>
					<div className={this.bem('__name')}>{this.props.node.name}</div>
				</div>
				<div className={this.bem('__ports')}>
					<div className={this.bem('__in')}>
						{this.props.node.getInPorts().map(p => this.generatePort(p))}
						{this.props.canEditPorts && (
							<div style={{ display: 'flex' }}>
								<button onClick={() => this.addPort(true)}>+</button>
							</div>
						)}
					</div>
					<div className={this.bem('__out')}>
						{this.props.node.getOutPorts().map(p => this.generatePort(p))}
						{this.props.canEditPorts && (
							<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
								<button onClick={() => this.addPort(false)}>+</button>
							</div>
						)}
					</div>
				</div>
				{this.renderContent()}
			</div>
		);
	}

	renderContent(): JSX.Element | null {
		return null;
	}
}
