import React from 'react';

interface SeverityBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  showTamil?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, showTamil = true }) => {
  const map: Record<string, string> = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    CRITICAL: 'badge-critical',
  };
  const tamilLabels: Record<string, string> = {
    LOW: 'குறைவு',
    MEDIUM: 'மிதமானது',
    HIGH: 'அதிகம்',
    CRITICAL: 'அவசரம்',
  };
  const sev = (severity || 'MEDIUM').toUpperCase();
  return (
    <span className={`badge ${map[sev] || 'badge-medium'}`} title={`${sev}: ${tamilLabels[sev] || ''}`}>
      {sev} {showTamil && tamilLabels[sev] ? <span style={{ opacity: 0.85, fontSize: '0.9em', fontWeight: 600 }}>• {tamilLabels[sev]}</span> : null}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
  showTamil?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showTamil = true }) => {
  let styleClass = 'badge-medium';
  let label = status ? status.replace('_', ' ') : 'UNKNOWN';
  let tamil = '';

  const normalized = (status || '').toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'APPLIED') {
    styleClass = 'badge-critical';
    label = 'Active';
    tamil = 'தீவிர பாதிப்பு';
  } else if (normalized === 'RESOLVED') {
    styleClass = 'badge-low';
    label = 'Resolved';
    tamil = 'குணமாகிவிட்டது';
  } else if (normalized === 'CONTAINED') {
    styleClass = 'badge-low';
    label = 'Contained';
    tamil = 'கட்டுப்படுத்தப்பட்டது';
  } else if (normalized === 'INVESTIGATING' || normalized === 'PENDING_REVIEW') {
    styleClass = 'badge-high';
    label = 'Under Investigation';
    tamil = 'ஆய்வில் உள்ளது';
  } else if (normalized === 'REPORTED') {
    styleClass = 'badge-medium';
    label = 'Reported';
    tamil = 'பதிவு செய்யப்பட்டது';
  }

  return (
    <span className={`badge ${styleClass}`} title={`${label}: ${tamil}`}>
      {label} {showTamil && tamil ? <span style={{ opacity: 0.85, fontSize: '0.9em', fontWeight: 600 }}>• {tamil}</span> : null}
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
        🛡️ Admin (நிர்வாகி)
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
        🌾 Agronomist (வேளாண் அதிகாரி)
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
        🔬 Scientist (உயிரி தொழில்நுட்ப நிபுணர்)
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
      👨‍🌾 Farmer (விவசாயி)
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const upper = (priority || '').toUpperCase();
  if (upper === 'URGENT') {
    return <span className="badge badge-critical" title="Urgent Action / உடனடி நடவடிக்கை">🚨 Urgent (உடனடி)</span>;
  }
  if (upper === 'IMPORTANT') {
    return <span className="badge badge-high" title="Important Notice / முக்கியமானது">⚠️ Important (முக்கியம்)</span>;
  }
  return <span className="badge badge-low" title="Normal Field Advice / வழக்கமான வழிகாட்டல்">🌱 Routine (வழக்கமானது)</span>;
};

