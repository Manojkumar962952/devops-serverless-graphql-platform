import { Buffer } from 'node:buffer';
import {
  LambdaClient,
  InvokeCommand,
  InvocationType,
} from '@aws-sdk/client-lambda';
import {
  CreateEmployeeInput,
  DeleteResult,
  Employee,
  UpdateEmployeeInput,
} from '../types';

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

// Initialize AWS Lambda Client
const lambdaClient = new LambdaClient({ region });

// Function names configured via environment variables
const FUNCTION_NAMES = {
  createEmployee: process.env.LAMBDA_CREATE_EMPLOYEE || 'createEmployee',
  getEmployees: process.env.LAMBDA_GET_EMPLOYEES || 'getEmployees',
  getEmployee: process.env.LAMBDA_GET_EMPLOYEE || 'getEmployee',
  updateEmployee: process.env.LAMBDA_UPDATE_EMPLOYEE || 'updateEmployee',
  deleteEmployee: process.env.LAMBDA_DELETE_EMPLOYEE || 'deleteEmployee',
};

/**
 * Generic helper to invoke an AWS Lambda function synchronously
 */
async function invokeLambda<TResult>(
  functionName: string,
  payload: Record<string, any>
): Promise<TResult> {
  console.log(`[LambdaService] Invoking Lambda "${functionName}" with payload:`, JSON.stringify(payload));

  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: InvocationType.RequestResponse,
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  try {
    const response = await lambdaClient.send(command);

    if (response.FunctionError) {
      const errorPayload = response.Payload
        ? Buffer.from(response.Payload).toString('utf-8')
        : 'Unknown Lambda error';
      console.error(`[LambdaService] Lambda execution error in "${functionName}":`, errorPayload);
      throw new Error(`Lambda execution failed: ${errorPayload}`);
    }

    if (!response.Payload) {
      throw new Error(`Lambda "${functionName}" returned empty payload.`);
    }

    const resultString = Buffer.from(response.Payload).toString('utf-8');
    const result = JSON.parse(resultString);
    return result as TResult;
  } catch (error) {
    console.error(`[LambdaService] Invocation error calling "${functionName}":`, error);
    throw error;
  }
}

export const lambdaService = {
  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    return invokeLambda<Employee>(FUNCTION_NAMES.createEmployee, { input });
  },

  async getEmployees(params: {
    department?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Employee[]> {
    return invokeLambda<Employee[]>(FUNCTION_NAMES.getEmployees, params);
  },

  async getEmployee(id: string): Promise<Employee | null> {
    return invokeLambda<Employee | null>(FUNCTION_NAMES.getEmployee, { id });
  },

  async updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    return invokeLambda<Employee>(FUNCTION_NAMES.updateEmployee, { id, input });
  },

  async deleteEmployee(id: string): Promise<DeleteResult> {
    return invokeLambda<DeleteResult>(FUNCTION_NAMES.deleteEmployee, { id });
  },
};
