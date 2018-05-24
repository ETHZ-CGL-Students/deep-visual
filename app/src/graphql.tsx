import { ApolloError } from 'apollo-boost';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import * as React from 'react';
import { Query as _Query } from 'react-apollo';

export const GET_VARS = gql`
	query {
		res: getVars {
			name
			type
			value
		}
	}
`;
export const GET_MODELS = gql`
	query {
		res: getModels {
			name
			type
			layers {
				name
				type
				input {
					name
					type
					shape {
						dims
					}
				}
				output {
					name
					type
					shape {
						dims
					}
				}
			}
		}
	}
`;

export const GET_WEIGHTS = gql`
	query {
		getModel(name: $model) {
			layer(name: $layer) {
				weights
			}
		}
	}
`;

interface QueryProps<T> {
	query: DocumentNode;
	loading: React.ReactNode;
	error: (err: ApolloError) => React.ReactNode;
	data: (data: T) => React.ReactNode;
}

export class Query<T> extends React.Component<QueryProps<T>> {
	render() {
		return (
			<_Query query={this.props.query}>
				{({ loading, error, data }) => {
					if (loading) {
						return this.props.loading;
					}
					if (error) {
						return this.props.error(error);
					}

					return this.props.data(data.res);
				}}
			</_Query>
		);
	}
}
