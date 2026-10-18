import React from 'react';
import { ActivityLogItem } from '../../types';
import { Activity, ShieldAlert, Dna, Sprout, ClipboardCheck, MessageSquare, User } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: ActivityLogItem[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  const getIcon = (action: string) => {
    if (action.includes('DISEASE')) return <ShieldAlert size={15} color="#ef4444" />;
    if (action.includes('RECOMMENDATION')) return <Dna size={15} color="#8b5cf6" />;
    if (action.includes('VARIETY')) return <Sprout size={15} color="#10b981" />;
    if (action.includes('OBSERVATION')) return <ClipboardCheck size={15} color="#06b6d4" />;
    if (action.includes('ADVISORY')) return <MessageSquare size={15} color="#f59e0b" />;
    return <Activity size={15} color="#10b981" />;
  };

  return (
    <div className="card-glass">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#10b981" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Real-Time Activity Audit Trail</h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>LIVE AUDIT STREAM</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No recent activity logged yet.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                {getIcon(act.action)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                    {act.details}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{act.module}</span>
                  {act.user && (
                    <>
                      <span>•</span>
                      <span>By {act.user.name} ({act.user.role.replace('_', ' ')})</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
