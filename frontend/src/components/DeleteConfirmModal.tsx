import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Employee } from '../types/employee';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee | null;
  loading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employee,
  loading,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Delete Employee
          </h3>

          <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5' }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: '#f8fafc' }}>
              {employee.firstName} {employee.lastName}
            </strong>
            ? This action triggers a GraphQL mutation to AWS Lambda and removes the record from Amazon RDS.
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
