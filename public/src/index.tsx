import ApolloClient from 'apollo-boost'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import * as ReactDOM from 'react-dom'

import App from './App'
import registerServiceWorker from './registerServiceWorker'

import 'semantic-ui-css/semantic.min.css'
import './index.css'

const client = new ApolloClient({ uri: 'http://localhost:8888/graphql' })

ReactDOM.render(
	<ApolloProvider client={client}>
		<App />
	</ApolloProvider>,
	document.getElementById('root') as HTMLElement
)
registerServiceWorker()
