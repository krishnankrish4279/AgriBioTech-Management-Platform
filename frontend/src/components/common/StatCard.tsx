import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'red';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  onClick,
}) => {
  const colorClassMap = {
    emerald: '',
    cyan: 'cyan',
    purple: 'purple',
    amber: 'amber',
    red: 'red',
  };

  return (
    <div
      className={`stat-card ${colorClassMap[color]} ${onClick ? 'card-glass-interactive' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-label">{title}</div>
        {subtitle && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>
      <div className={`stat-icon ${colorClassMap[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};
