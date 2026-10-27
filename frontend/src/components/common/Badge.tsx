import React from 'react';

interface SeverityBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const map: Record<string, string> = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    CRITICAL: 'badge-critical',
  };
  const labels: Record<string, string> = {
    LOW: 'Low Severity',
    MEDIUM: 'Moderate Severity',
    HIGH: 'High Severity',
    CRITICAL: 'Critical Severity',
  };
  const sev = (severity || 'MEDIUM').toUpperCase();
  return (
    <span className={`badge ${map[sev] || 'badge-medium'}`} title={labels[sev] || sev}>
      {sev}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let styleClass = 'badge-medium';
  let label = status ? status.replace('_', ' ') : 'UNKNOWN';

  const normalized = (status || '').toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'APPLIED') {
    styleClass = 'badge-critical';
    label = 'Active';
  } else if (normalized === 'RESOLVED') {
    styleClass = 'badge-low';
    label = 'Resolved';
  } else if (normalized === 'CONTAINED') {
    styleClass = 'badge-low';
    label = 'Contained';
  } else if (normalized === 'INVESTIGATING' || normalized === 'PENDING_REVIEW') {
    styleClass = 'badge-high';
    label = 'Under Investigation';
  } else if (normalized === 'REPORTED') {
    styleClass = 'badge-medium';
    label = 'Reported';
  } else if (normalized === 'MONITORING') {
    styleClass = 'badge-medium';
    label = 'Monitoring';
  } else if (normalized === 'TREATMENT ONGOING' || normalized === 'TREATMENT_ONGOING') {
    styleClass = 'badge-high';
    label = 'Treatment Ongoing';
  } else if (normalized === 'ESCALATED') {
    styleClass = 'badge-critical';
    label = 'Escalated';
  }

  return (
    <span className={`badge ${styleClass}`} title={label}>
      {label}
    </span>
  );
};

interface BiotechTraitBadgeProps {
  trait: string;
}

export const BiotechTraitBadge: React.FC<BiotechTraitBadgeProps> = ({ trait }) => {
  return (
    <span className="badge badge-biotech" style={{ margin: '2px', textTransform: 'none', fontSize: '0.72rem' }}>
      🧬 {trait}
    </span>
  );
};

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const normalized = role?.toLowerCase() || '';
  if (normalized === 'admin') {
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          fontWeight: 700,
        }}
      >
        🛡️ Admin
      </span>
    );
  }
  if (normalized === 'agronomist') {
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontWeight: 700,
        }}
      >
        🌾 Agronomist
      </span>
    );
  }
  if (normalized === 'biotech_expert') {
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(139, 92, 246, 0.15)',
          color: '#c084fc',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          fontWeight: 700,
        }}
      >
        🔬 Scientist
      </span>
    );
  }
  return (
    <span
      className="badge"
      style={{
        background: 'rgba(59, 130, 246, 0.15)',
        color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        fontWeight: 700,
      }}
    >
      👨‍🌾 Farmer
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const upper = (priority || '').toUpperCase();
  if (upper === 'URGENT') {
    return <span className="badge badge-critical" title="Urgent Action Required">🚨 Urgent</span>;
  }
  if (upper === 'IMPORTANT') {
    return <span className="badge badge-high" title="Important Notice">⚠️ Important</span>;
  }
  return <span className="badge badge-low" title="Standard Advisory">🌱 Routine</span>;
};
