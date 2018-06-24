import { NodeModel } from 'storm-react-diagrams';

import { BasePortModel } from './BasePortModel';

export class BaseNodeModel extends NodeModel {
	public name: string;
	public color: string;

	protected triggerEvents: boolean = true;
	protected _x: number = 0;
	protected _y: number = 0;
	protected moveListener?: () => void;
	protected newPortListener?: (port: BasePortModel) => void;
	protected renamePortListener?: (port: BasePortModel, oldName: string) => void;
	protected deletePortListener?: (port: BasePortModel) => void;

	ports: { [s: string]: BasePortModel };
	// TODO: Sadly the base node class maps the ports by name instead of id
	// so when we change the port name it moves around. This mapping helps prevent that
	portsById: { [s: string]: BasePortModel } = {};

	constructor(type: string, id?: string) {
		super(type, id);
		this.name = type + ' - ' + id;
	}

	getInPorts() {
		return Object.keys(this.portsById)
			.map(p => this.portsById[p])
			.filter(p => p.in);
	}

	getOutPorts() {
		return Object.keys(this.portsById)
			.map(p => this.portsById[p])
			.filter(p => !p.in);
	}

	onMove(listener: () => void) {
		this.moveListener = listener;
	}
	onNewPort(listener: (port: BasePortModel) => void) {
		this.newPortListener = listener;
	}
	onRenamePort(listener: (port: BasePortModel, oldName: string) => void) {
		this.renamePortListener = listener;
	}
	onDeletePort(listener: (port: BasePortModel) => void) {
		this.deletePortListener = listener;
	}

	addPort(port: any) {
		if (this.newPortListener) {
			this.newPortListener(port);
		}
		this.portsById[port.id] = port;
		return super.addPort(port);
	}

	renamePort(port: BasePortModel, oldName: string) {
		delete this.ports[oldName];
		this.ports[port.name] = port;

		// Trigger event
		if (this.renamePortListener) {
			this.renamePortListener(port, oldName);
		}
	}

	removePort(port: any) {
		if (this.deletePortListener) {
			this.deletePortListener(port);
		}

		delete this.portsById[port.id];
		super.removePort(port);
	}

	pauseEvents() {
		this.triggerEvents = false;
	}
	resumeEvents() {
		this.triggerEvents = true;
	}

	get x() {
		return this._x;
	}
	set x(value: number) {
		this._x = value;
		if (this.triggerEvents && this.moveListener) {
			this.moveListener();
		}
	}

	get y() {
		return this._y;
	}
	set y(value: number) {
		this._y = value;
		if (this.triggerEvents && this.moveListener) {
			this.moveListener();
		}
	}

	remove() {
		if (!confirm('Are you sure you want to delete this block?')) {
			return;
		}
		super.remove();
	}
}
