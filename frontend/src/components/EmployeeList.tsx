import React, { useState, useMemo } from 'react';
import { Search, Eye, Edit2, Trash2, Filter, UserX, Download, ArrowUpDown } from 'lucide-react';
import { Employee } from '../types/employee';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
];

const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

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
  const [sortBy, setSortBy] = useState<'name' | 'salary' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesSearch =
          `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept =
          selectedDepartment === 'ALL' || emp.department === selectedDepartment;

        const matchesStatus =
          selectedStatus === 'ALL' || emp.status === selectedStatus;

        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        } else if (sortBy === 'salary') {
          return sortOrder === 'asc' ? a.salary - b.salary : b.salary - a.salary;
        } else {
          return sortOrder === 'asc'
            ? a.department.localeCompare(b.department)
            : b.department.localeCompare(a.department);
        }
      });
  }, [employees, searchTerm, selectedDepartment, selectedStatus, sortBy, sortOrder]);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department));
    return Array.from(set);
  }, [employees]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Department', 'Role', 'Salary', 'Status'];
    const rows = filteredEmployees.map((e) => [
      e.id,
      e.firstName,
      e.lastName,
      e.email,
      e.department,
      e.role,
      e.salary,
      e.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (type: 'name' | 'salary' | 'department') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Showing <strong style={{ color: '#fff' }}>{filteredEmployees.length}</strong> of{' '}
            <strong style={{ color: '#fff' }}>{employees.length}</strong> employees
          </div>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title="Export filtered records to CSV"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8125rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th
                onClick={() => toggleSort('name')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Employee</span>
                  <ArrowUpDown size={12} color="#64748b" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('department')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Department</span>
                  <ArrowUpDown size={12} color="#64748b" />
                </div>
              </th>
              <th>Position & Role</th>
              <th
                onClick={() => toggleSort('salary')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Annual Salary</span>
                  <ArrowUpDown size={12} color="#64748b" />
                </div>
              </th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && employees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
                    ⌛
                  </div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                    Querying Apollo GraphQL Server...
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Connecting via API Gateway and ECS Fargate
                  </div>
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <UserX size={44} style={{ margin: '0 auto 0.75rem auto', color: '#64748b', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1rem' }}>
                    No matching records found
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Try clearing the search query or changing filter selections.
                  </div>
                  {(searchTerm || selectedDepartment !== 'ALL' || selectedStatus !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDepartment('ALL');
                        setSelectedStatus('ALL');
                      }}
                      className="btn btn-secondary"
                      style={{ marginTop: '1rem', fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
                    >
                      Reset All Filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const fullName = `${emp.firstName} ${emp.lastName}`;
                const gradient = getAvatarGradient(fullName);

                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          className="user-avatar"
                          style={{
                            background: gradient,
                            color: '#ffffff',
                          }}
                        >
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                            {fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="department-badge">{emp.department}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{emp.role}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#34d399', letterSpacing: '-0.01em' }}>
                        ${emp.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
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
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor:
                              emp.status.toLowerCase() === 'active'
                                ? '#34d399'
                                : emp.status.toLowerCase() === 'inactive'
                                ? '#f87171'
                                : '#fbbf24',
                          }}
                        />
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => onView(emp)}
                          className="btn-icon"
                          title="View Full Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onEdit(emp)}
                          className="btn-icon"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(emp)}
                          className="btn-icon btn-icon-danger"
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
