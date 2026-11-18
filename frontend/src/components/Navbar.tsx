import React from 'react';
import { Server, Activity, Database, Cloud } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_HEALTH } from '../graphql/queries';

export const Navbar: React.FC = () => {
  const { data, loading, error } = useQuery(GET_HEALTH, {
    pollInterval: 15000,
    errorPolicy: 'ignore',
  });

  const isHealthy = !loading && !error && data?.health?.status === 'UP';

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Server className="text-blue-500" size={24} style={{ color: '#3b82f6' }} />
          <span>CloudOps HR Portal</span>
          <span className="badge-arch">AWS Serverless GraphQL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8125rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: isHealthy ? '#34d399' : '#f87171',
            }}
          >
            <Activity size={14} />
            <span>
              {loading ? 'Checking...' : isHealthy ? `Backend ${data?.health?.mode || 'UP'}` : 'Offline / Standalone'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span
              title="ECS Fargate"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: '#1e293b',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #334155',
              }}
            >
              <Cloud size={13} style={{ color: '#f59e0b' }} /> ECS
            </span>
            <span
              title="AWS RDS PostgreSQL"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: '#1e293b',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid #334155',
              }}
            >
              <Database size={13} style={{ color: '#3b82f6' }} /> RDS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
