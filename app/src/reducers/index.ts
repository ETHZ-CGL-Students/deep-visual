import { combineReducers } from 'redux';

import { AppState } from '../types';

import code from './code';

export default combineReducers<AppState>({
	code
});
