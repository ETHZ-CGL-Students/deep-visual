import * as React from 'react';
import { BaseWidget, BaseWidgetProps, PortWidget } from 'storm-react-diagrams';

import { BasePortModel } from './BasePortModel';

export interface BasePortLabelProps extends BaseWidgetProps {
	model: BasePortModel;
	onDelete?: () => void;
}

export interface BasePortLabelState {}

/**
 * @author Dylan Vorster
 */
export class BasetPortLabelWidget extends BaseWidget<
	BasePortLabelProps,
	BasePortLabelState
> {
	constructor(props: BasePortLabelProps) {
		super('srd-default-port', props);
	}

	getClassName() {
		return (
			super.getClassName() +
			(this.props.model.in ? this.bem('--in') : this.bem('--out'))
		);
	}

	changeName() {
		const newName = prompt('Argument name:', this.props.model.label);
		if (newName) {
			this.props.model.setName(newName);
			this.forceUpdate();
		}
	}

	render() {
		const { model, onDelete } = this.props;

		const port = <PortWidget node={model.getParent()} name={model.name} />;
		const label = (
			<div
				className="name"
				onDoubleClick={() => onDelete && this.changeName()}
				style={{ padding: '0 10px' }}
			>
				{model.name}
			</div>
		);

		const del = onDelete && <a className="round-button" onClick={() => onDelete()}>✕</a>;

		return (
			<div {...this.getProps()}>
				{model.in ? port : del}
				{label}
				{model.in ? del : port}
			</div>
		);
	}
}
