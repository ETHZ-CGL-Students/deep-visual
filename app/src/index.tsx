import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'storm-react-diagrams/dist/style.min.css';

import App from './App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
registerServiceWorker();
