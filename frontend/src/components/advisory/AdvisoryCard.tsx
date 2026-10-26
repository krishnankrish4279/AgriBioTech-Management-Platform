import React from 'react';
import { FarmerAdvisory } from '../../types';
import { MessageSquare, AlertTriangle, Droplets, Sprout, Wind, Dna, Check, User, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { PriorityBadge } from '../common/Badge';

interface AdvisoryCardProps {
  advisory: FarmerAdvisory;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({
  advisory,
  onMarkRead,
  onDelete,
}) => {
  const { isAgronomist, isAdmin } = useAuth();
  const canManage = isAgronomist || isAdmin;

  const categoryConfig: Record<string, { label: string; tamil: string; icon: any }> = {
    DISEASE_ALERT: { label: 'Disease Warning', tamil: 'நோய் எச்சரிக்கை', icon: AlertTriangle },
    IRRIGATION: { label: 'Watering Advice', tamil: 'பாசன வழிகாட்டல்', icon: Droplets },
    NUTRIENT_MANAGEMENT: { label: 'Soil Nutrition', tamil: 'உர மேலாண்மை', icon: Sprout },
    BIOTECH_INPUT: { label: 'Bio-Inputs', tamil: 'இயற்கை உயிர் உரம்', icon: Dna },
    WEATHER_ACTION: { label: 'Weather Alert', tamil: 'வானிலை எச்சரிக்கை', icon: Wind },
    GENERAL: { label: 'General Advice', tamil: 'பொது ஆலோசனை', icon: MessageSquare },
  };

  const cat = categoryConfig[advisory.category] || {
    label: advisory.category.replace('_', ' '),
    tamil: 'விவசாய வழிகாட்டல்',
    icon: MessageSquare,
  };
  const Icon = cat.icon;

  return (
    <div
      className="card-glass card-glass-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderLeft: advisory.priority === 'URGENT'
          ? '4px solid #ef4444'
          : advisory.priority === 'IMPORTANT'
          ? '4px solid #f59e0b'
          : '4px solid #10b981',
        background: advisory.isRead ? 'var(--bg-card)' : 'rgba(15, 23, 42, 0.95)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.05)',
            color: '#38bdf8',
            borderRadius: '9999px',
            padding: '3px 10px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <Icon size={13} color="#06b6d4" /> {cat.label} • <span style={{ color: '#34d399', fontSize: '0.7rem' }}>{cat.tamil}</span>
          </span>

          <PriorityBadge priority={advisory.priority} />
        </div>

        <div>
          {advisory.isRead ? (
            <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Check size={13} /> Read
            </span>
          ) : (
            <span style={{
              fontSize: '0.72rem',
              color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
            }}>
              ● UNREAD
            </span>
          )}
        </div>
      </div>

      {/* Title & Target Farmer */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
          {advisory.title}
        </h3>

        <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginBottom: '10px' }}>
          To Farmer: {advisory.farmer?.fullName} ({advisory.farmer?.preferredLanguage})
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '14px' }}>
          {advisory.message}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.74rem',
        color: 'var(--text-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={13} /> {advisory.advisor?.name || 'Agri-Advisory Center'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{new Date(advisory.createdAt).toLocaleDateString()}</span>
          {!advisory.isRead && onMarkRead && (
            <button
              onClick={() => onMarkRead(advisory.id)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Mark Read
            </button>
          )}
          {canManage && onDelete && (
            <button
              onClick={() => onDelete(advisory.id)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              title="Delete advisory"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
