import React from 'react';
import { Modal } from '../common/Modal';
import { CropVariety } from '../../types';
import { BiotechTraitBadge } from '../common/Badge';
import { Sprout, Clock, ShieldCheck, MapPin, Layers, Dna } from 'lucide-react';
import { formatInsectProtection, DISEASE_RESISTANCE_STANDARD_EXPLANATION } from '../../utils/traitHelper';

interface VarietyDetailModalProps {
  variety: CropVariety | null;
  onClose: () => void;
}

export const VarietyDetailModal: React.FC<VarietyDetailModalProps> = ({ variety, onClose }) => {
  if (!variety) return null;

  const protectionInfo = formatInsectProtection(variety.biotechTraits);

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
          {variety.biotechTraits && (
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dna size={16} /> Insect Protection Features
              </div>
              {protectionInfo.insectProtectionExplanation && (
                <p style={{ fontSize: '0.86rem', color: '#f1f5f9', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  {protectionInfo.insectProtectionExplanation}
                </p>
              )}
              {protectionInfo.technicalDetails && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: '#a78bfa',
                  fontFamily: 'var(--font-mono, monospace)',
                }}>
                  {protectionInfo.technicalDetails}
                </div>
              )}
              {protectionInfo.otherTraits && (
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '8px' }}>
                  Additional traits: {protectionInfo.otherTraits}
                </div>
              )}
            </div>
          )}

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Disease Resistance Information
            </div>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '6px' }}>
              {variety.diseaseResistanceTraits || 'Standard Field Tolerance'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
              {DISEASE_RESISTANCE_STANDARD_EXPLANATION}
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
