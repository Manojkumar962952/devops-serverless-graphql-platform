import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeStatus } from '../types/employee';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeInput | UpdateEmployeeInput) => Promise<void>;
  employee?: Employee | null;
  loading: boolean;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employee,
  loading,
}) => {
  const isEditing = Boolean(employee);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'Engineering',
    role: '',
    salary: 80000,
    phone: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as EmployeeStatus,
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        role: employee.role,
        salary: employee.salary,
        phone: employee.phone || '',
        dateOfJoining: employee.dateOfJoining || new Date().toISOString().split('T')[0],
        status: employee.status,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        department: 'Engineering',
        role: '',
        salary: 85000,
        phone: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      });
    }
    setFormError(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setFormError('First and last name are required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.role.trim()) {
      setFormError('Role is required.');
      return;
    }
    if (formData.salary <= 0) {
      setFormError('Salary must be greater than zero.');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditing ? <Save size={20} color="#3b82f6" /> : <UserPlus size={20} color="#3b82f6" />}
            <h2 className="modal-title">
              {isEditing ? `Edit Employee: ${employee?.firstName} ${employee?.lastName}` : 'Add New Employee'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {formError}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. Jane"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Corporate Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="jane.doe@company.com"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Cloud Architecture">Cloud Architecture</option>
                  <option value="DevSecOps">DevSecOps</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Role / Job Title *</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. DevOps Engineer"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Annual Salary (USD) *</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="form-control"
                  min="1000"
                  step="1000"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Employment Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="+1-555-0199"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Joining</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving to Database...' : isEditing ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
