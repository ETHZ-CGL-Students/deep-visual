import { DefaultLinkModel, PortModel } from 'storm-react-diagrams';

import API from '../../services/api';

export class BaseLinkModel extends DefaultLinkModel {
	new: boolean;

	constructor(id?: string) {
		super();

		if (id) {
			this.id = id;
			this.new = false;
		} else {
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
}
