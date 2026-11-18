import { employeeResolvers } from './employeeResolvers';

export const resolvers = {
  Query: {
    ...employeeResolvers.Query,
  },
  Mutation: {
    ...employeeResolvers.Mutation,
  },
  Subscription: {
    ...employeeResolvers.Subscription,
  },
};
