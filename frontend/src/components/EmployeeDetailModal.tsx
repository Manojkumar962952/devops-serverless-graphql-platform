import React from 'react';
import { X, User, Mail, Building, Briefcase, DollarSign, Calendar, Phone, Clock } from 'lucide-react';
import { Employee } from '../types/employee';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="#3b82f6" />
            <h2 className="modal-title">Employee Details</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Header Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1.25rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #334155',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.35rem',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
              }}
            >
              {employee.firstName[0]}
              {employee.lastName[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {employee.firstName} {employee.lastName}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{employee.role}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={13} /> Email Address
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.2rem' }}>{employee.email}</p>
            </div>

            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Building size={13} /> Department
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.2rem' }}>{employee.department}</p>
            </div>

            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase size={13} /> Status
              </span>
              <p style={{ marginTop: '0.2rem' }}>
                <span className={`status-badge status-badge-${employee.status.toLowerCase() === 'active' ? 'active' : employee.status.toLowerCase() === 'inactive' ? 'inactive' : 'leave'}`}>
                  {employee.status}
                </span>
              </p>
            </div>

            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <DollarSign size={13} /> Compensation
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', marginTop: '0.2rem' }}>
                ${employee.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })} / yr
              </p>
            </div>

            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={13} /> Phone
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.2rem' }}>
                {employee.phone || 'N/A'}
              </p>
            </div>

            <div className="detail-item">
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> Joined Date
              </span>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '0.2rem' }}>
                {employee.dateOfJoining || 'N/A'}
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid #334155',
              fontSize: '0.75rem',
              color: '#64748b',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div><strong>ID (UUID):</strong> {employee.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Created: {new Date(employee.createdAt).toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Last Updated: {new Date(employee.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
