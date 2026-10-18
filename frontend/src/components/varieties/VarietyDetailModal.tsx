import React from 'react';
import { Modal } from '../common/Modal';
import { CropVariety } from '../../types';
import { BiotechTraitBadge, SeverityBadge } from '../common/Badge';
import { Sprout, Clock, ShieldCheck, MapPin, Layers, Dna, FileText, CheckCircle2 } from 'lucide-react';

interface VarietyDetailModalProps {
  variety: CropVariety | null;
  onClose: () => void;
}

export const VarietyDetailModal: React.FC<VarietyDetailModalProps> = ({ variety, onClose }) => {
  if (!variety) return null;

  const biotechTraitsList = variety.biotechTraits
    ? variety.biotechTraits.split(',').map(t => t.trim())
    : [];

  return (
    <Modal
      isOpen={Boolean(variety)}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
          <Dna size={22} /> {variety.varietyName}
        </div>
      }
      maxWidth="840px"
    >
      <div>
        {/* Banner image and key summary */}
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <img
            src={variety.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'}
            alt={variety.varietyName}
            style={{ width: '120px', height: '100px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <span className="badge badge-low">{variety.cropName}</span>
              <span className="badge badge-medium">{variety.cropType}</span>
              <span className="badge badge-biotech">Season: {variety.growingSeason}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {variety.description}
            </p>
          </div>
        </div>

        {/* 4 KPI Grid */}
        <div className="grid-4" style={{ marginBottom: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Expected Yield Range</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {variety.expectedYieldMin} - {variety.expectedYieldMax} {variety.yieldUnit.split('/')[0]}
            </div>
          </div>

          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Maturity Duration</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {variety.maturityDays} Days
            </div>
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recorded Field Plots</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
              {variety._count?.observations || 3} Logs
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Disease Cases</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {variety._count?.diseaseCases || 1} Reported
            </div>
          </div>
        </div>

        {/* Biotech & Agronomic Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dna size={16} /> Biotechnology Traits & Genetic Modifications
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {biotechTraitsList.map((t, idx) => (
                <BiotechTraitBadge key={idx} trait={t} />
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Disease Resistance & Immunity Matrix
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {variety.diseaseResistanceTraits || 'Standard Field Tolerance'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} /> Soil, pH & Climate Suitability
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {variety.soilRequirements}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} /> Recommended Agro-Climatic Zones
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {variety.recommendedRegions}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Specs
          </button>
        </div>
      </div>
    </Modal>
  );
};
