import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { StatsCard } from './components/StatsCard';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';

import { GET_EMPLOYEES } from './graphql/queries';
import {
  CREATE_EMPLOYEE,
  UPDATE_EMPLOYEE,
  DELETE_EMPLOYEE,
} from './graphql/mutations';
import {
  EMPLOYEE_CREATED_SUBSCRIPTION,
  EMPLOYEE_UPDATED_SUBSCRIPTION,
  EMPLOYEE_DELETED_SUBSCRIPTION,
} from './graphql/subscriptions';
import {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from './types/employee';

export const App: React.FC = () => {
  // Query
  const { data, loading, refetch, error } = useQuery(GET_EMPLOYEES, {
    variables: { limit: 100 },
    notifyOnNetworkStatusChange: true,
  });

  // Mutations
  const [createEmployeeMutation, { loading: creating }] = useMutation(CREATE_EMPLOYEE);
  const [updateEmployeeMutation, { loading: updating }] = useMutation(UPDATE_EMPLOYEE);
  const [deleteEmployeeMutation, { loading: deleting }] = useMutation(DELETE_EMPLOYEE);

  // Check if WebSocket subscriptions are configured
  const isWsEnabled = Boolean(
    import.meta.env.VITE_GRAPHQL_WS_URL &&
    import.meta.env.VITE_GRAPHQL_WS_URL.trim() !== ''
  );

  // Subscriptions (active only when a dedicated WebSocket endpoint is configured)
  const { data: createdSubData } = useSubscription(EMPLOYEE_CREATED_SUBSCRIPTION, {
    skip: !isWsEnabled,
    shouldResubscribe: isWsEnabled,
  });
  const { data: updatedSubData } = useSubscription(EMPLOYEE_UPDATED_SUBSCRIPTION, {
    skip: !isWsEnabled,
    shouldResubscribe: isWsEnabled,
  });
  const { data: deletedSubData } = useSubscription(EMPLOYEE_DELETED_SUBSCRIPTION, {
    skip: !isWsEnabled,
    shouldResubscribe: isWsEnabled,
  });

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = (type: 'success' | 'info' | 'error' | 'warning', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Query Data
  useEffect(() => {
    if (data?.employees) {
      setEmployees(data.employees);
    }
  }, [data]);

  // Handle Subscription Events
  useEffect(() => {
    if (createdSubData?.employeeCreated) {
      const emp = createdSubData.employeeCreated;
      addToast('info', 'GraphQL Subscription Triggered', `New employee created: ${emp.firstName} ${emp.lastName}`);
      refetch();
    }
  }, [createdSubData]);

  useEffect(() => {
    if (updatedSubData?.employeeUpdated) {
      const emp = updatedSubData.employeeUpdated;
      addToast('info', 'GraphQL Subscription Triggered', `Employee updated: ${emp.firstName} ${emp.lastName}`);
      refetch();
    }
  }, [updatedSubData]);

  useEffect(() => {
    if (deletedSubData?.employeeDeleted) {
      const res = deletedSubData.employeeDeleted;
      addToast('warning', 'GraphQL Subscription Triggered', `Employee removed (ID: ${res.id.slice(0, 8)}...)`);
      refetch();
    }
  }, [deletedSubData]);

  // Stats calculation
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const departmentsCount = new Set(employees.map((e) => e.department)).size;
  const avgSalary =
    totalCount > 0
      ? Math.round(employees.reduce((acc, curr) => acc + curr.salary, 0) / totalCount)
      : 0;

  // CRUD Handlers
  const handleCreateEmployee = async (input: CreateEmployeeInput | UpdateEmployeeInput) => {
    try {
      const res = await createEmployeeMutation({
        variables: { input },
      });
      if (res.data?.createEmployee) {
        addToast('success', 'Employee Created', `${input.firstName} ${input.lastName} was added successfully.`);
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Failed to Create', err.message);
      throw err;
    }
  };

  const handleUpdateEmployee = async (input: CreateEmployeeInput | UpdateEmployeeInput) => {
    if (!editingEmployee) return;
    try {
      const res = await updateEmployeeMutation({
        variables: {
          id: editingEmployee.id,
          input,
        },
      });
      if (res.data?.updateEmployee) {
        addToast('success', 'Employee Updated', `Updated details for ${input.firstName || editingEmployee.firstName}`);
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Failed to Update', err.message);
      throw err;
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    try {
      const res = await deleteEmployeeMutation({
        variables: { id: deletingEmployee.id },
      });
      if (res.data?.deleteEmployee?.success) {
        addToast('success', 'Employee Deleted', `Successfully deleted ${deletingEmployee.firstName} ${deletingEmployee.lastName}`);
        setDeletingEmployee(null);
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Failed to Delete', err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1.5rem 0' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>
              Employee Directory
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Real-time GraphQL CRUD with Apollo Client, AWS Lambda, ECS Fargate, and Amazon RDS PostgreSQL
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => refetch()}
              className="btn btn-secondary"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Error Alert if API is down */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
            }}
          >
            <strong>GraphQL Network Error:</strong> {error.message}.
            Ensure the Apollo Server is running on port 4000 or the AWS API Gateway URL is reachable.
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="stats-grid">
          <StatsCard
            title="Total Employees"
            value={totalCount}
            subtitle="Synced with PostgreSQL"
            icon={<Users size={24} color="#3b82f6" />}
            iconBg="rgba(59, 130, 246, 0.15)"
          />
          <StatsCard
            title="Active Workforce"
            value={activeCount}
            subtitle={`${totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% active status`}
            icon={<UserCheck size={24} color="#10b981" />}
            iconBg="rgba(16, 185, 129, 0.15)"
          />
          <StatsCard
            title="Active Departments"
            value={departmentsCount}
            subtitle="Cross-functional units"
            icon={<Building2 size={24} color="#8b5cf6" />}
            iconBg="rgba(139, 92, 246, 0.15)"
          />
          <StatsCard
            title="Average Salary"
            value={`$${avgSalary.toLocaleString()}`}
            subtitle="Live SQL calculation"
            icon={<DollarSign size={24} color="#f59e0b" />}
            iconBg="rgba(245, 158, 11, 0.15)"
          />
        </div>

        {/* Employee Table */}
        <EmployeeList
          employees={employees}
          loading={loading}
          onView={(emp) => setViewingEmployee(emp)}
          onEdit={(emp) => setEditingEmployee(emp)}
          onDelete={(emp) => setDeletingEmployee(emp)}
        />
      </main>

      {/* Modern Architecture Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(9, 13, 22, 0.85)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ fontWeight: 600, color: '#94a3b8' }}>CloudOps Employee Portal</span> • Powered by AWS Serverless GraphQL
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#475569' }}>Pipeline:</span>
            <span style={{ color: '#06b6d4' }}>CloudFront</span> →
            <span style={{ color: '#818cf8' }}>API Gateway</span> →
            <span style={{ color: '#f59e0b' }}>ECS Fargate</span> →
            <span style={{ color: '#eab308' }}>Lambda</span> →
            <span style={{ color: '#3b82f6' }}>PostgreSQL</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateEmployee}
        loading={creating}
      />

      <EmployeeModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSubmit={handleUpdateEmployee}
        loading={updating}
      />

      <EmployeeDetailModal
        isOpen={Boolean(viewingEmployee)}
        employee={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingEmployee)}
        employee={deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteEmployee}
        loading={deleting}
      />

      {/* Notifications */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
