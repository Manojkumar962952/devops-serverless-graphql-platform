import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} color="#10b981" />,
    info: <Info size={18} color="#3b82f6" />,
    warning: <AlertCircle size={18} color="#f59e0b" />,
    error: <AlertCircle size={18} color="#ef4444" />,
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      {icons[toast.type]}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{toast.title}</div>
        {toast.description && (
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {toast.description}
          </div>
        )}
      </div>
      <button onClick={onDismiss} className="btn-icon" style={{ padding: '0.2rem' }}>
        <X size={14} />
      </button>
    </div>
  );
};
