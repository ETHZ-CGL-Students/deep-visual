import { LinkModel, PortModel } from 'storm-react-diagrams';

import { BaseLinkModel } from '../Base/BaseLinkModel';

import { BaseNodeModel } from './BaseNodeModel';

export class BasePortModel extends PortModel {
	in: boolean;
	label: string;
	parent: BaseNodeModel;

	constructor(isInput: boolean, name: string, label?: string, id?: string) {
		super(name, label, id);
		this.in = isInput;
		this.label = label ? label : name;
	}

	createLinkModel(): LinkModel {
		return super.createLinkModel() || new BaseLinkModel();
	}

	addLink(link: LinkModel): void {
		// If this is a new link for an "in" connection, we have to make
		// sure it's the only one, because there can only be one link per "in" port
		if (this.in) {
			Object.keys(this.links).forEach(l => this.links[l].remove());
		}
		super.addLink(link);
	}

	setName(name: string) {
		const oldName = this.name;
		this.label = this.name = name;

		// Inform model of our change
		this.parent.renamePort(this, oldName);
	}

	getMeta() {
		let getMetaFromPort = (port: BasePortModel | null) => {
			if (port && port.parent && port.parent.outputMeta) {
				return port.parent.outputMeta[port.label];
			} else {
				return null;
			}
		};

		if (this.in) {
			// Go to parent block to find meta information
			let incomingLinks = Object.values(this.links);
			if (incomingLinks.length) {
				return getMetaFromPort(<BasePortModel> incomingLinks[0].sourcePort);
			} else {
				return null;
			}
		} else {
			// Output port, so meta are available in this block
			return getMetaFromPort(this);
		}
	}

	canLinkToPort(port: BasePortModel): boolean {
		return super.canLinkToPort(port) && port.in !== this.in;
	}
}
