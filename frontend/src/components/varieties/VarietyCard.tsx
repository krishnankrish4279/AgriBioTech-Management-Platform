import React from 'react';
import { CropVariety } from '../../types';
import { BiotechTraitBadge } from '../common/Badge';
import { TermHelper } from '../common/TermHelper';
import { Sprout, Clock, ShieldCheck, MapPin, Sparkles, TrendingUp, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatInsectProtection, DISEASE_RESISTANCE_STANDARD_EXPLANATION } from '../../utils/traitHelper';

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

  const protectionInfo = formatInsectProtection(variety.biotechTraits);

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
              <Clock size={12} color="#06b6d4" /> Maturity
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {variety.maturityDays} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days</span>
            </div>
          </div>
        </div>

        {/* Insect Protection Features */}
        {variety.biotechTraits && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              🧬 Insect Protection Features
            </div>
            {protectionInfo.insectProtectionExplanation && (
              <p style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                {protectionInfo.insectProtectionExplanation}
              </p>
            )}
            {protectionInfo.technicalDetails && (
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontFamily: 'var(--font-mono, monospace)' }}>
                {protectionInfo.technicalDetails}
              </div>
            )}
            {protectionInfo.otherTraits && (
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px' }}>
                Additional traits: {protectionInfo.otherTraits}
              </div>
            )}
          </div>
        )}

        {/* Disease Resistance Information */}
        {variety.diseaseResistanceTraits && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#10b981" /> Disease Resistance Information
            </div>
            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.35 }}>
              {variety.diseaseResistanceTraits}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', fontStyle: 'italic' }}>
              {DISEASE_RESISTANCE_STANDARD_EXPLANATION}
            </div>
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
