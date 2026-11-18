import { query } from '../common/db';
import { Employee, RawDbEmployee, mapDbRecordToEmployee } from '../common/types';

interface LambdaEvent {
  id?: string;
  arguments?: { id: string };
  pathParameters?: { id: string };
  queryStringParameters?: { id: string };
  [key: string]: any;
}

export const handler = async (event: LambdaEvent): Promise<Employee | null> => {
  console.log('[getEmployee] Received event:', JSON.stringify(event, null, 2));

  let id = event.id;
  if (!id && event.arguments?.id) {
    id = event.arguments.id;
  } else if (!id && event.pathParameters?.id) {
    id = event.pathParameters.id;
  } else if (!id && event.queryStringParameters?.id) {
    id = event.queryStringParameters.id;
  }

  if (!id) {
    throw new Error('Employee ID is required.');
  }

  const sql = 'SELECT * FROM employees WHERE id = $1 LIMIT 1;';

  try {
    const rows = await query<RawDbEmployee>(sql, [id]);
    if (rows.length === 0) {
      console.log(`[getEmployee] Employee with ID ${id} not found.`);
      return null;
    }
    const emp = mapDbRecordToEmployee(rows[0]);
    console.log(`[getEmployee] Found employee:`, emp.id);
    return emp;
  } catch (error) {
    console.error(`[getEmployee] Failed to fetch employee with ID ${id}:`, error);
    throw error;
  }
};
