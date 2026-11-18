import { lambdaService } from '../services/lambdaService';
import { dbService } from '../services/dbService';
import { pubsub, SUBSCRIPTION_EVENTS } from '../pubsub';
import {
  CreateEmployeeInput,
  DeleteResult,
  Employee,
  UpdateEmployeeInput,
} from '../types';

const useLambda = process.env.USE_LAMBDA === 'true';

// Helper to choose the execution backend
function getBackend() {
  return useLambda ? lambdaService : dbService;
}

export const employeeResolvers = {
  Query: {
    async employees(
      _: any,
      args: { department?: string; status?: string; limit?: number; offset?: number }
    ): Promise<Employee[]> {
      const backend = getBackend();
      return backend.getEmployees(args);
    },

    async employee(_: any, { id }: { id: string }): Promise<Employee | null> {
      const backend = getBackend();
      return backend.getEmployee(id);
    },

    async health(): Promise<{ status: string; uptime: number; timestamp: string; mode: string }> {
      return {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mode: useLambda ? 'AWS_LAMBDA_RESOLVERS' : 'DIRECT_RDS_FALLBACK',
      };
    },
  },

  Mutation: {
    async createEmployee(
      _: any,
      { input }: { input: CreateEmployeeInput }
    ): Promise<Employee> {
      const backend = getBackend();
      const newEmployee = await backend.createEmployee(input);

      // Publish subscription event
      pubsub.publish(SUBSCRIPTION_EVENTS.EMPLOYEE_CREATED, {
        employeeCreated: newEmployee,
      });

      return newEmployee;
    },

    async updateEmployee(
      _: any,
      { id, input }: { id: string; input: UpdateEmployeeInput }
    ): Promise<Employee> {
      const backend = getBackend();
      const updatedEmployee = await backend.updateEmployee(id, input);

      // Publish subscription event
      pubsub.publish(SUBSCRIPTION_EVENTS.EMPLOYEE_UPDATED, {
        employeeUpdated: updatedEmployee,
      });

      return updatedEmployee;
    },

    async deleteEmployee(
      _: any,
      { id }: { id: string }
    ): Promise<DeleteResult> {
      const backend = getBackend();
      const result = await backend.deleteEmployee(id);

      if (result.success) {
        // Publish subscription event
        pubsub.publish(SUBSCRIPTION_EVENTS.EMPLOYEE_DELETED, {
          employeeDeleted: result,
        });
      }

      return result;
    },
  },

  Subscription: {
    employeeCreated: {
      subscribe: () => {
        return typeof pubsub.asyncIterator === 'function'
          ? pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EMPLOYEE_CREATED])
          : (pubsub.subscribe
              ? pubsub.subscribe(SUBSCRIPTION_EVENTS.EMPLOYEE_CREATED)
              : pubsub[Symbol.asyncIterator]());
      },
    },
    employeeUpdated: {
      subscribe: () => {
        return typeof pubsub.asyncIterator === 'function'
          ? pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EMPLOYEE_UPDATED])
          : (pubsub.subscribe
              ? pubsub.subscribe(SUBSCRIPTION_EVENTS.EMPLOYEE_UPDATED)
              : pubsub[Symbol.asyncIterator]());
      },
    },
    employeeDeleted: {
      subscribe: () => {
        return typeof pubsub.asyncIterator === 'function'
          ? pubsub.asyncIterator([SUBSCRIPTION_EVENTS.EMPLOYEE_DELETED])
          : (pubsub.subscribe
              ? pubsub.subscribe(SUBSCRIPTION_EVENTS.EMPLOYEE_DELETED)
              : pubsub[Symbol.asyncIterator]());
      },
    },
  },
};
