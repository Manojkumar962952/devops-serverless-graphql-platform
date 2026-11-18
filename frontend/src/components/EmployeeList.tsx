import React, { useState, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, Filter, UserX } from 'lucide-react';
import { Employee } from '../types/employee';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  onView,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        selectedDepartment === 'ALL' || emp.department === selectedDepartment;

      const matchesStatus =
        selectedStatus === 'ALL' || emp.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDepartment, selectedStatus]);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return Array.from(set);
  }, [employees]);

  return (
    <div>
      {/* Search and Filters */}
      <div className="actions-header">
        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="select-field"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              className="select-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          Showing <strong>{filteredEmployees.length}</strong> of{' '}
          <strong>{employees.length}</strong> employees
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && employees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Loading employees from AWS GraphQL API...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <UserX size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                  <div>No employee records found matching your filters.</div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="department-badge">{emp.department}</span>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>{emp.role}</td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>
                    ${emp.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-badge-${
                        emp.status.toLowerCase() === 'active'
                          ? 'active'
                          : emp.status.toLowerCase() === 'inactive'
                          ? 'inactive'
                          : 'leave'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => onView(emp)}
                        className="btn-icon"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(emp)}
                        className="btn-icon"
                        title="Edit Employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(emp)}
                        className="btn-icon btn-icon-danger"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
