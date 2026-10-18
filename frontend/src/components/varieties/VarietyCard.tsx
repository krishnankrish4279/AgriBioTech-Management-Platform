import React from 'react';
import { CropVariety } from '../../types';
import { BiotechTraitBadge } from '../common/Badge';
import { Sprout, Clock, ShieldCheck, MapPin, Sparkles, TrendingUp, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VarietyCardProps {
  variety: CropVariety;
  onEdit?: (v: CropVariety) => void;
  onDelete?: (id: string) => void;
  onView?: (v: CropVariety) => void;
}

export const VarietyCard: React.FC<VarietyCardProps> = ({
  variety,
  onEdit,
  onDelete,
  onView,
}) => {
  const { isBiotechExpert, isAdmin } = useAuth();
  const canManage = isBiotechExpert || isAdmin;

  const biotechTraitsList = variety.biotechTraits
    ? variety.biotechTraits.split(',').map(t => t.trim())
    : [];

  return (
    <div className="card-glass card-glass-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Image / Badge */}
      <div style={{ position: 'relative', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px' }}>
        <img
          src={variety.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'}
          alt={variety.varietyName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(7, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Sprout size={13} /> {variety.cropName} • {variety.cropType}
        </div>

        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(7, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#06b6d4',
        }}>
          Season: {variety.growingSeason}
        </div>
      </div>

      {/* Variety Titles */}
      <div style={{ flex: 1 }}>
        <h3
          onClick={() => onView && onView(variety)}
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '6px',
            cursor: onView ? 'pointer' : 'default',
            lineHeight: 1.25,
          }}
        >
          {variety.varietyName}
        </h3>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
          {variety.description}
        </p>

        {/* Yield & Maturity Benchmarks */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '14px',
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} color="#10b981" /> Expected Yield
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {variety.expectedYieldMin} - {variety.expectedYieldMax} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>{variety.yieldUnit.split('/')[0]}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} color="#06b6d4" /> Maturity Cycle
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {variety.maturityDays} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
          </div>
        </div>

        {/* Biotech & Disease Traits */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
            Biotechnology Traits:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {biotechTraitsList.map((t, idx) => (
              <BiotechTraitBadge key={idx} trait={t} />
            ))}
          </div>
        </div>

        {variety.diseaseResistanceTraits && (
          <div style={{
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginBottom: '10px'
          }}>
            <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Resistances:</strong> {variety.diseaseResistanceTraits}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '8px',
      }}>
        <button
          onClick={() => onView && onView(variety)}
          className="btn btn-secondary btn-sm"
        >
          View Full Specs
        </button>

        {canManage && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(variety)}
                className="btn btn-secondary btn-sm"
                title="Edit variety"
              >
                <Edit3 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(variety.id)}
                className="btn btn-danger btn-sm"
                title="Delete variety"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
