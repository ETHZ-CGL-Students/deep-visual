import { AppState } from '../types';

export const getVariables = (state: AppState) =>
	state.variables.variables.sort((a, b) => a.name.localeCompare(b.name));
