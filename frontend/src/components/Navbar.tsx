import React from 'react';
import { Activity, Database, Cloud, Zap, Globe, Sparkles } from 'lucide-react';
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
          <div className="brand-icon-box">
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              CloudOps
            </span>
            <span style={{ color: '#818cf8', fontWeight: 600, marginLeft: '0.25rem' }}>
              HR
            </span>
          </div>
          <span className="badge-arch">Serverless GraphQL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Health Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: isHealthy ? '#34d399' : '#f87171',
            }}
          >
            <div className={`pulse-dot ${isHealthy ? 'pulse-dot-green' : ''}`} style={{ backgroundColor: isHealthy ? '#10b981' : '#ef4444' }} />
            <span>
              {loading ? 'Checking...' : isHealthy ? 'System Healthy' : 'API Standby'}
            </span>
          </div>

          {/* Cloud Architecture Badges */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span
              title="AWS Region Mumbai"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Globe size={13} style={{ color: '#06b6d4' }} /> ap-south-1
            </span>
            <span
              title="ECS Fargate Container"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Cloud size={13} style={{ color: '#f59e0b' }} /> ECS
            </span>
            <span
              title="AWS Lambda CRUD Workers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Zap size={13} style={{ color: '#eab308' }} /> Lambda
            </span>
            <span
              title="Amazon RDS PostgreSQL"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.6)',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
