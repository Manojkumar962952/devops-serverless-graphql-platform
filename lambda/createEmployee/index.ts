import { query } from '../common/db';
import {
  CreateEmployeeInput,
  Employee,
  RawDbEmployee,
  mapDbRecordToEmployee,
} from '../common/types';

interface LambdaEvent {
  input?: CreateEmployeeInput;
  arguments?: { input: CreateEmployeeInput };
  body?: string;
  [key: string]: any;
}

export const handler = async (event: LambdaEvent): Promise<Employee> => {
  console.log('[createEmployee] Received event:', JSON.stringify(event, null, 2));

  let input: CreateEmployeeInput | undefined;

  // Support direct invocation, GraphQL resolver invocation, or API Gateway proxy
  if (event.input) {
    input = event.input;
  } else if (event.arguments && event.arguments.input) {
    input = event.arguments.input;
  } else if (event.body) {
    try {
      const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      input = parsed.input || parsed;
    } catch (e) {
      throw new Error(`Invalid JSON in event body: ${(e as Error).message}`);
    }
  } else if (event.firstName && event.email) {
    input = event as unknown as CreateEmployeeInput;
  }

  if (!input) {
    throw new Error('Missing "input" object in createEmployee invocation payload.');
  }

  const {
    firstName,
    lastName,
    email,
    department,
    role,
    salary,
    phone = null,
    dateOfJoining = null,
    status = 'ACTIVE',
  } = input;

  if (!firstName || !lastName || !email || !department || !role || salary === undefined) {
    throw new Error('Validation failed: firstName, lastName, email, department, role, and salary are required.');
  }

  const insertSql = `
    INSERT INTO employees (
      first_name,
      last_name,
      email,
      department,
      role,
      salary,
      phone,
      date_of_joining,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    firstName.trim(),
    lastName.trim(),
    email.toLowerCase().trim(),
    department.trim(),
    role.trim(),
    salary,
    phone ? phone.trim() : null,
    dateOfJoining || new Date().toISOString().split('T')[0],
    status,
  ];

  try {
    const rows = await query<RawDbEmployee>(insertSql, values);
    if (!rows || rows.length === 0) {
      throw new Error('Failed to insert employee into database.');
    }
    const created = mapDbRecordToEmployee(rows[0]);
    console.log('[createEmployee] Successfully created employee:', created.id);
    return created;
  } catch (error) {
    console.error('[createEmployee] Database execution failed:', error);
    throw error;
  }
};
