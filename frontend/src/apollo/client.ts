import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpUrl = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql';
const wsUrl = import.meta.env.VITE_GRAPHQL_WS_URL || '';

const httpLink = new HttpLink({
  uri: httpUrl,
});

let link: any = httpLink;

// Enable WebSocket link in browser environment ONLY if a valid wsUrl is provided
if (typeof window !== 'undefined' && wsUrl && wsUrl.trim() !== '') {
  try {
    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUrl,
        lazy: true,
        retryAttempts: 1,
        shouldRetry: () => false,
      })
    );

    // Split based on operation type: subscription -> wsLink, query/mutation -> httpLink
    link = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    );
  } catch (err) {
    console.warn('[ApolloClient] WebSocket link initialization skipped, using HTTP link:', err);
    link = httpLink;
  }
}

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          employees: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
