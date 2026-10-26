import React from 'react';
import { BiotechRecommendation } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import {
  Dna,
  Sparkles,
  CheckCircle,
  Beaker,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RecommendationDetailModalProps {
  rec: BiotechRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export const RecommendationDetailModal: React.FC<RecommendationDetailModalProps> = ({
  rec,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  const { isBiotechExpert, isAdmin } = useAuth();
  const canManage = isBiotechExpert || isAdmin;

  if (!isOpen || !rec) return null;

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    BIOFERTILIZER: { label: 'Biofertilizer / உயிர் உரம்', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    BIOPESTICIDE: { label: 'Biopesticide / உயிர் பூச்சிக்கொல்லி', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    BIOLOGICAL_CONTROL: { label: 'Biological Control / இயற்கை கட்டுப்பாடு', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    VARIETY_SELECTION: { label: 'Resilient Seeds / நோய் எதிர்ப்பு விதைகள்', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    CROP_MANAGEMENT: { label: 'Crop Care / பயிர் பராமரிப்பு', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
    SOIL_ENHANCEMENT: { label: 'Soil Enhancer / மண் வள மேம்பாடு', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
  };

  const typeInfo = typeConfig[rec.recommendationType] || {
    label: rec.recommendationType.replace('_', ' '),
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="680px"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: typeInfo.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: typeInfo.color,
            }}
          >
            <Dna size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>
              {rec.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span
                style={{
                  background: typeInfo.bg,
                  color: typeInfo.color,
                  border: `1px solid ${typeInfo.color}40`,
                  borderRadius: '9999px',
                  padding: '2px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Beaker size={11} /> {typeInfo.label}
              </span>
              <StatusBadge status={rec.status} />
            </div>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Prescribed Formulation & Target Issue */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Prescribed Bio-Input Formulation • பரிந்துரைக்கப்பட்ட இயற்கை உரம் / பூச்சி விரட்டி
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
            {rec.productName}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginTop: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Target Issue • தீர்க்கும் பிரச்சனை:</span> <strong>{rec.targetIssue}</strong>
          </div>
        </div>

        {/* Biological Mechanism & Reasoning */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color: '#34d399',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <ShieldCheck size={14} /> Biological Mechanism & How it works • எப்படி வேலை செய்கிறது
          </div>
          <p style={{ fontSize: '0.86rem', color: '#d1fae5', margin: 0, lineHeight: 1.5 }}>
            {rec.reasoning}
          </p>
        </div>

        {/* Dosage & Application Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Dosage & Rate • மருந்தின் அளவு
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {rec.dosage}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Application Instructions • பயன்படுத்தும் முறை
            </div>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', marginTop: '4px', lineHeight: 1.4 }}>
              {rec.applicationInstructions || 'Apply uniformly across affected field area.'}
            </div>
          </div>
        </div>

        {/* Expected Benefit */}
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.22)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px 14px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: 700, textTransform: 'uppercase' }}>
            Expected Agronomic Benefit • எதிர்பார்க்கப்படும் பலன்
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e0f2fe', marginTop: '4px' }}>
            🌱 {rec.expectedBenefit}
          </div>
        </div>

        {/* Precautions */}
        {rec.precautions && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: '#fbbf24',
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <AlertTriangle size={14} /> Safety & Biosecurity Precautions
            </div>
            <p style={{ fontSize: '0.84rem', color: '#fef3c7', margin: 0, lineHeight: 1.45 }}>
              {rec.precautions}
            </p>
          </div>
        )}

        {/* Metadata Footer: Creator, Engine, Timestamp */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.76rem',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} color="#10b981" />
            <span>Prescribed by: <strong style={{ color: '#fff' }}>{rec.creator?.name || 'Biotech Scientist'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: rec.isAutomatedSuggestion ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              color: rec.isAutomatedSuggestion ? '#22d3ee' : '#c084fc',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              {rec.isAutomatedSuggestion ? '🤖 AI Rule Engine' : '🧬 Expert Prescribed'}
            </span>
            {rec.createdAt && (
              <span>📅 {new Date(rec.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            {canManage && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(rec.id);
                  onClose();
                }}
                className="btn btn-danger btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {rec.status !== 'APPLIED' && onStatusChange && (
              <button
                type="button"
                onClick={() => {
                  onStatusChange(rec.id, 'APPLIED');
                  onClose();
                }}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle size={15} /> Mark Applied
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
