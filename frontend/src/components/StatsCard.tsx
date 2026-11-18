import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, iconBg }) => {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
    </div>
  );
};
