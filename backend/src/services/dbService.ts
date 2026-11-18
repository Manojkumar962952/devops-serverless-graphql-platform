import { Pool } from 'pg';
import {
  CreateEmployeeInput,
  DeleteResult,
  Employee,
  UpdateEmployeeInput,
} from '../types';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'employeedb',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function mapRow(row: any): Employee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    department: row.department,
    role: row.role,
    salary: typeof row.salary === 'string' ? parseFloat(row.salary) : row.salary,
    phone: row.phone,
    dateOfJoining: row.date_of_joining
      ? new Date(row.date_of_joining).toISOString().split('T')[0]
      : null,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const dbService = {
  async createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    const p = getPool();
    const sql = `
      INSERT INTO employees (first_name, last_name, email, department, role, salary, phone, date_of_joining, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      input.firstName,
      input.lastName,
      input.email,
      input.department,
      input.role,
      input.salary,
      input.phone || null,
      input.dateOfJoining || new Date().toISOString().split('T')[0],
      input.status || 'ACTIVE',
    ];
    const res = await p.query(sql, values);
    return mapRow(res.rows[0]);
  },

  async getEmployees(params: {
    department?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Employee[]> {
    const p = getPool();
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.department) {
      where.push(`department = $${idx++}`);
      values.push(params.department);
    }
    if (params.status) {
      where.push(`status = $${idx++}`);
      values.push(params.status);
    }

    let sql = 'SELECT * FROM employees';
    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }
    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(params.limit || 50, params.offset || 0);

    const res = await p.query(sql, values);
    return res.rows.map(mapRow);
  },

  async getEmployee(id: string): Promise<Employee | null> {
    const p = getPool();
    const res = await p.query('SELECT * FROM employees WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length === 0) return null;
    return mapRow(res.rows[0]);
  },

  async updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    const p = getPool();
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.firstName !== undefined) {
      updates.push(`first_name = $${idx++}`);
      values.push(input.firstName);
    }
    if (input.lastName !== undefined) {
      updates.push(`last_name = $${idx++}`);
      values.push(input.lastName);
    }
    if (input.email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(input.email);
    }
    if (input.department !== undefined) {
      updates.push(`department = $${idx++}`);
      values.push(input.department);
    }
    if (input.role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(input.role);
    }
    if (input.salary !== undefined) {
      updates.push(`salary = $${idx++}`);
      values.push(input.salary);
    }
    if (input.phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(input.phone);
    }
    if (input.dateOfJoining !== undefined) {
      updates.push(`date_of_joining = $${idx++}`);
      values.push(input.dateOfJoining);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(input.status);
    }

    if (updates.length === 0) {
      throw new Error('No fields provided to update');
    }

    values.push(id);
    const sql = `
      UPDATE employees
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const res = await p.query(sql, values);
    if (res.rows.length === 0) {
      throw new Error(`Employee with ID ${id} not found.`);
    }
    return mapRow(res.rows[0]);
  },

  async deleteEmployee(id: string): Promise<DeleteResult> {
    const p = getPool();
    const res = await p.query('DELETE FROM employees WHERE id = $1 RETURNING id', [id]);
    if (res.rows.length === 0) {
      return { success: false, id, message: 'Employee not found or already deleted.' };
    }
    return { success: true, id, message: `Employee ${id} deleted successfully.` };
  },
};
