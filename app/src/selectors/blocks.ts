import { denormalize, schema } from 'normalizr';
import { createSelector } from 'reselect';

import { AppState, Block, BlockSchema, Connection } from '../types';

export const getBlockState = (state: AppState) => state.blocks;

export const getBlocks = createSelector([getBlockState], state => {
	return denormalize(
		state.keys,
		new schema.Array(BlockSchema),
		state
	) as Block[];
});

export const getConnections = createSelector([getBlocks], blocks => {
	// We have to map over the previous blocks, because the connections need
	// to be labled with the incoming id
	return blocks.reduce(
		(acc, b) =>
			acc.concat(
				b.prev.map((p, i): Connection => ({ label: '' + i, from: p, to: b }))
			),
		[] as Connection[]
	);
});
