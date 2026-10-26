import React, { useState } from 'react';
import { BiotechRecommendation } from '../../types';
import { RecommendationDetailModal } from './RecommendationDetailModal';
import { Beaker, Eye, CheckCircle2, Check } from 'lucide-react';

interface RecommendationCardProps {
  rec: BiotechRecommendation;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (rec: BiotechRecommendation) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  rec,
  onStatusChange,
  onDelete,
  onViewDetails,
}) => {
  const [showInternalDetails, setShowInternalDetails] = useState(false);

  const typeConfig: Record<string, { label: string; tamil: string; color: string; bg: string }> = {
    BIOFERTILIZER: { label: 'Biofertilizer', tamil: 'உயிர் உரம்', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    BIOPESTICIDE: { label: 'Biopesticide', tamil: 'உயிர் பூச்சிக்கொல்லி', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
    BIOLOGICAL_CONTROL: { label: 'Biocontrol', tamil: 'இயற்கை கட்டுப்பாடு', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    VARIETY_SELECTION: { label: 'Resilient Seeds', tamil: 'நோய் எதிர்ப்பு விதைகள்', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    CROP_MANAGEMENT: { label: 'Crop Care', tamil: 'பயிர் பராமரிப்பு', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
    SOIL_ENHANCEMENT: { label: 'Soil Enhancer', tamil: 'மண் வள மேம்பாடு', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  };

  const typeInfo = typeConfig[rec.recommendationType] || {
    label: rec.recommendationType.replace('_', ' '),
    tamil: 'இயற்கை உரம்',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
  };

  const isApplied = (rec.status || '').toUpperCase() === 'APPLIED';

  const handleOpenDetails = () => {
    if (onViewDetails) {
      onViewDetails(rec);
    } else {
      setShowInternalDetails(true);
    }
  };

  return (
    <>
      <div
        className="card-glass card-glass-interactive"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '16px 18px',
          borderRadius: 'var(--radius-lg, 14px)',
          border: isApplied
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid var(--border-subtle)',
          background: isApplied
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(13, 24, 41, 0.7) 100%)'
            : 'var(--bg-card, rgba(13, 24, 41, 0.7))',
          boxSizing: 'border-box',
          gap: '14px',
        }}
      >
        {/* Top Section: Category Badge & Applied Tag */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              gap: '8px',
            }}
          >
            {/* 2. Category badge */}
            <span
              style={{
                background: typeInfo.bg,
                color: typeInfo.color,
                border: `1px solid ${typeInfo.color}35`,
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.02em',
              }}
            >
              <Beaker size={12} /> {typeInfo.label} • <span style={{ opacity: 0.9 }}>{typeInfo.tamil}</span>
            </span>

            {isApplied && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={11} /> Applied / தெளிக்கப்பட்டது
              </span>
            )}
          </div>

          {/* 1. Recommendation title */}
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 12px 0',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.7em',
            }}
            title={rec.title}
          >
            {rec.title}
          </h3>

          {/* 3, 4, 5. Core Information Fields */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem',
              lineHeight: 1.4,
            }}
          >
            {/* 3. Target issue */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, display: 'block' }}>
                TARGET ISSUE • தீர்க்கும் பயிர் பிரச்சனை
              </span>
              <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.82rem' }}>
                {rec.targetIssue}
              </span>
            </div>

            {/* 4. Dosage/application */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600, display: 'block' }}>
                DOSAGE & APPLICATION • மருந்தின் அளவு & தெளிக்கும் முறை
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem' }}>
                {rec.dosage}
              </span>
            </div>

            {/* 5. Expected benefit */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.14)',
                borderRadius: '8px',
                padding: '6px 10px',
              }}
            >
              <span style={{ color: '#34d399', fontSize: '0.74rem', fontWeight: 700, display: 'block' }}>
                EXPECTED BENEFIT • எதிர்பார்க்கப்படும் பலன்
              </span>
              <span style={{ color: '#d1fae5', fontWeight: 600, fontSize: '0.82rem' }}>
                {rec.expectedBenefit}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: 6. View Details & 7. Mark Applied */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* 6. One "View Details" button */}
          <button
            type="button"
            onClick={handleOpenDetails}
            className="btn btn-secondary btn-sm"
            style={{
              flex: 1,
              padding: '7px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Eye size={13} /> View Details / முழு விவரம்
          </button>

          {/* 7. One "Mark Applied" button where applicable */}
          {!isApplied ? (
            onStatusChange ? (
              <button
                type="button"
                onClick={() => onStatusChange(rec.id, 'APPLIED')}
                className="btn btn-primary btn-sm"
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                }}
              >
                <CheckCircle2 size={13} /> Mark Applied
              </button>
            ) : null
          ) : (
            <span
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: '0.76rem',
                color: '#34d399',
                textAlign: 'center',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Check size={13} /> Applied
            </span>
          )}
        </div>
      </div>

      {/* Internal Details Modal Fallback */}
      {!onViewDetails && (
        <RecommendationDetailModal
          rec={rec}
          isOpen={showInternalDetails}
          onClose={() => setShowInternalDetails(false)}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
