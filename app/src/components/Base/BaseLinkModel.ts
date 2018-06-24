import { DefaultLinkModel, PortModel } from 'storm-react-diagrams';

import API from '../../services/api';
import { Link } from '../../types';

export class BaseLinkModel extends DefaultLinkModel {
	new: boolean;
	implicit: boolean;

	constructor(link?: Link) {
		super();

		if (link) {
			this.id = link.id;
			this.implicit = link.implicit;
			this.new = false;
		} else {
			this.implicit = false;
			this.new = true;
		}
	}

	// This fixes an issue in the original code where setting
	// the port to the same value actually removed the link from the port
	setSourcePort(port: PortModel) {
		if (this.sourcePort !== null) {
			this.sourcePort.removeLink(this);
		}
		if (port !== null) {
			port.addLink(this);
		}
		this.sourcePort = port;

		if (this.sourcePort && this.targetPort) {
			if (this.new) {
				API.createLink(
					this.sourcePort.parent.id,
					this.sourcePort.name,
					this.targetPort.parent.id,
					this.targetPort.name
				);
			}
		}
	}

	// This fixes an issue in the original code where setting
	// the port to the same value actually removed the link from the port
	setTargetPort(port: PortModel) {
		if (this.targetPort !== null) {
			this.targetPort.removeLink(this);
		}
		if (port !== null) {
			port.addLink(this);
		}
		this.targetPort = port;

		if (this.sourcePort && this.targetPort) {
			if (this.new) {
				API.createLink(
					this.sourcePort.parent.id,
					this.sourcePort.name,
					this.targetPort.parent.id,
					this.targetPort.name
				);
			}
		}
	}

	remove() {
		if (this.implicit) {
			return;
		}
		super.remove();
	}
}
