import { query } from '../common/db';
import { DeleteResult } from '../common/types';

interface LambdaEvent {
  id?: string;
  arguments?: { id: string };
  pathParameters?: { id: string };
  body?: string;
  [key: string]: any;
}

export const handler = async (event: LambdaEvent): Promise<DeleteResult> => {
  console.log('[deleteEmployee] Received event:', JSON.stringify(event, null, 2));

  let id = event.id;
  if (!id && event.arguments?.id) {
    id = event.arguments.id;
  } else if (!id && event.pathParameters?.id) {
    id = event.pathParameters.id;
  } else if (!id && event.body) {
    try {
      const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      id = parsed.id;
    } catch (e) {
      // ignore
    }
  }

  if (!id) {
    throw new Error('Employee ID is required for deletion.');
  }

  const sql = 'DELETE FROM employees WHERE id = $1 RETURNING id;';

  try {
    const rows = await query<{ id: string }>(sql, [id]);
    if (rows.length === 0) {
      return {
        success: false,
        id,
        message: `Employee with ID "${id}" was not found or already deleted.`,
      };
    }

    console.log('[deleteEmployee] Successfully deleted employee:', id);
    return {
      success: true,
      id,
      message: `Employee with ID "${id}" was successfully deleted.`,
    };
  } catch (error) {
    console.error(`[deleteEmployee] Failed to delete employee ${id}:`, error);
    throw error;
  }
};
