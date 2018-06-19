import { applyMiddleware, compose, createStore } from 'redux';

import api from './middleware/api';
import reducers from './reducers';

declare global {
	interface Window {
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: <R>(a: R) => R;
	}
}

// Setup redux store
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore(
	reducers,
	composeEnhancers(applyMiddleware(api))
);
