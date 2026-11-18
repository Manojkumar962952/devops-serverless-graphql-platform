import { PubSub } from 'graphql-subscriptions';

export const pubsub: any = new PubSub();

export const SUBSCRIPTION_EVENTS = {
  EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
} as const;
