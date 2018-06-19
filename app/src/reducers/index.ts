import { combineReducers } from 'redux';

import { AppState } from '../types';

import blocks from './blocks';
import variables from './variables';

export default combineReducers<AppState>({
	blocks,
	variables
});
