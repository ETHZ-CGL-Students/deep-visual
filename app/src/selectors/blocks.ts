import { denormalize, schema } from 'normalizr';
import { createSelector } from 'reselect';

import { AppState, Block, BlockSchema } from '../types';

export const getBlockState = (state: AppState) => state.blocks;

export const getBlocks = createSelector([getBlockState], state => {
	return denormalize(
		Object.keys(state.blocks),
		new schema.Array(BlockSchema),
		state
	) as Block[];
});
