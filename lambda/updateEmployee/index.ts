import { query } from '../common/db';
import {
  Employee,
  RawDbEmployee,
  UpdateEmployeeInput,
  mapDbRecordToEmployee,
} from '../common/types';

interface LambdaEvent {
  id?: string;
  input?: UpdateEmployeeInput;
  arguments?: {
    id: string;
    input: UpdateEmployeeInput;
  };
  body?: string;
  pathParameters?: { id: string };
  [key: string]: any;
}

export const handler = async (event: LambdaEvent): Promise<Employee> => {
  console.log('[updateEmployee] Received event:', JSON.stringify(event, null, 2));

  let id = event.id;
  let input = event.input;

  if (event.arguments) {
    id = event.arguments.id || id;
    input = event.arguments.input || input;
  } else if (event.body) {
    try {
      const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      id = id || parsed.id;
      input = input || parsed.input || parsed;
    } catch (e) {
      // ignore
    }
  }

  if (event.pathParameters?.id) {
    id = event.pathParameters.id;
  }

  if (!id) {
    throw new Error('Employee ID is required for update.');
  }

  if (!input || Object.keys(input).length === 0) {
    throw new Error('At least one field must be provided to update.');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (input.firstName !== undefined) {
    updates.push(`first_name = $${paramIdx++}`);
    values.push(input.firstName.trim());
  }
  if (input.lastName !== undefined) {
    updates.push(`last_name = $${paramIdx++}`);
    values.push(input.lastName.trim());
  }
  if (input.email !== undefined) {
    updates.push(`email = $${paramIdx++}`);
    values.push(input.email.toLowerCase().trim());
  }
  if (input.department !== undefined) {
    updates.push(`department = $${paramIdx++}`);
    values.push(input.department.trim());
  }
  if (input.role !== undefined) {
    updates.push(`role = $${paramIdx++}`);
    values.push(input.role.trim());
  }
  if (input.salary !== undefined) {
    updates.push(`salary = $${paramIdx++}`);
    values.push(input.salary);
  }
  if (input.phone !== undefined) {
    updates.push(`phone = $${paramIdx++}`);
    values.push(input.phone ? input.phone.trim() : null);
  }
  if (input.dateOfJoining !== undefined) {
    updates.push(`date_of_joining = $${paramIdx++}`);
    values.push(input.dateOfJoining);
  }
  if (input.status !== undefined) {
    updates.push(`status = $${paramIdx++}`);
    values.push(input.status);
  }

  if (updates.length === 0) {
    throw new Error('No valid fields provided for update.');
  }

  // Push ID as the final parameter
  values.push(id);
  const sql = `
    UPDATE employees
    SET ${updates.join(', ')}
    WHERE id = $${paramIdx}
    RETURNING *;
  `;

  try {
    const rows = await query<RawDbEmployee>(sql, values);
    if (rows.length === 0) {
      throw new Error(`Employee with ID "${id}" was not found.`);
    }
    const updated = mapDbRecordToEmployee(rows[0]);
    console.log('[updateEmployee] Successfully updated employee:', updated.id);
    return updated;
  } catch (error) {
    console.error(`[updateEmployee] Failed to update employee ${id}:`, error);
    throw error;
  }
};
