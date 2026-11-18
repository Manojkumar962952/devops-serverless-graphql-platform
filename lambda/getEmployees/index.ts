import { query } from '../common/db';
import { Employee, RawDbEmployee, mapDbRecordToEmployee } from '../common/types';

interface LambdaEvent {
  department?: string;
  status?: string;
  limit?: number;
  offset?: number;
  arguments?: {
    department?: string;
    status?: string;
    limit?: number;
    offset?: number;
  };
  queryStringParameters?: {
    department?: string;
    status?: string;
    limit?: string;
    offset?: string;
  };
  [key: string]: any;
}

export const handler = async (event: LambdaEvent = {}): Promise<Employee[]> => {
  console.log('[getEmployees] Received event:', JSON.stringify(event, null, 2));

  const args = event.arguments || event.queryStringParameters || event;

  const department = args.department;
  const status = args.status;
  const limit = Math.min(Math.max(parseInt(String(args.limit || 50), 10) || 50, 1), 200);
  const offset = Math.max(parseInt(String(args.offset || 0), 10) || 0, 0);

  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (department && department.trim() !== '') {
    whereClauses.push(`department = $${paramIndex++}`);
    values.push(department.trim());
  }

  if (status && status.trim() !== '') {
    whereClauses.push(`status = $${paramIndex++}`);
    values.push(status.trim());
  }

  let sql = 'SELECT * FROM employees';
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
  values.push(limit, offset);

  try {
    const rows = await query<RawDbEmployee>(sql, values);
    const employees = rows.map(mapDbRecordToEmployee);
    console.log(`[getEmployees] Retrieved ${employees.length} employees`);
    return employees;
  } catch (error) {
    console.error('[getEmployees] Database execution failed:', error);
    throw error;
  }
};
