import * as React from 'react';

import { LayerBlock } from '../../types';

import { BlockComp, BlockProps } from './Block';

interface Props extends BlockProps {
	block: LayerBlock;
}

export class LayerBlockComp extends BlockComp<Props> {
	renderContent() {
		const { block } = this.props;

		return (
			<>
				<div>Name: {block.id}</div>
				<div>Type: {block.layerType}</div>
			</>
		);
	}
}
