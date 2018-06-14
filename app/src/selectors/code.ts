import { denormalize, schema } from 'normalizr';
import { createSelector } from 'reselect';

import { AppState, BlockSchema, CodeBlock } from '../types';

export const getCodeState = (state: AppState) => state.code;

export const getCodeBlocks = createSelector([getCodeState], code => {
	const codeBlocks = denormalize(
		Object.keys(code.blocks),
		new schema.Array(BlockSchema),
		code
	) as CodeBlock[];
	return codeBlocks;
});
