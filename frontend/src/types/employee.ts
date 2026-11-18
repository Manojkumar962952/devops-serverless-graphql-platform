export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

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
  status: EmployeeStatus;
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
  status?: EmployeeStatus;
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
  status?: EmployeeStatus;
}

export interface DeleteResult {
  success: boolean;
  id: string;
  message: string;
}
