export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  phone?: string | null;
  dateOfJoining?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  phone?: string;
  dateOfJoining?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  role?: string;
  salary?: number;
  phone?: string;
  dateOfJoining?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}

export interface DeleteResult {
  success: boolean;
  id: string;
  message: string;
}

export interface RawDbEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  role: string;
  salary: string | number;
  phone: string | null;
  date_of_joining: Date | string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  created_at: Date | string;
  updated_at: Date | string;
}

export function mapDbRecordToEmployee(row: RawDbEmployee): Employee {
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
