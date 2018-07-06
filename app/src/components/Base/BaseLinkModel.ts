import { DefaultLinkModel } from 'storm-react-diagrams';

import API from '../../services/api';
import { Link } from '../../types';

import { BasePortModel } from './BasePortModel';

export class BaseLinkModel extends DefaultLinkModel {
	new: boolean;
	implicit: boolean;
	sourcePort: BasePortModel;
	targetPort: BasePortModel;

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
	setSourcePort(port: BasePortModel) {
		if (this.sourcePort !== null) {
			this.sourcePort.removeLink(this);
		}
		if (port !== null) {
			port.addLink(this);
		}
		this.sourcePort = port;

		this.checkCreateLink();
	}

	// This fixes an issue in the original code where setting
	// the port to the same value actually removed the link from the port
	setTargetPort(port: BasePortModel) {
		if (this.targetPort !== null) {
			this.targetPort.removeLink(this);
		}
		if (port !== null) {
			port.addLink(this);
		}
		this.targetPort = port;

		this.checkCreateLink();
	}

	remove() {
		if (this.implicit) {
			return;
		}
		super.remove();
	}

	private checkCreateLink() {
		if (!this.sourcePort || !this.targetPort) {
			return;
		}

		if (!this.new || this.sourcePort.in === this.targetPort.in) {
			return;
		}

		if (!this.sourcePort.in) {
			API.createLink(
				this.sourcePort.parent.id,
				this.sourcePort.name,
				this.targetPort.parent.id,
				this.targetPort.name
			);
		} else {
			API.createLink(
				this.targetPort.parent.id,
				this.targetPort.name,
				this.sourcePort.parent.id,
				this.sourcePort.name
			);
		}
	}
}
