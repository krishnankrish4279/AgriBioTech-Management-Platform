import React, { useState } from 'react';
import { api } from '../../api/client';
import { DiseaseCase, DiseaseCaseFollowUp } from '../../types';
import { X, CheckCircle2, ShieldAlert, AlertTriangle, FileText, Stethoscope, ArrowRight } from 'lucide-react';

interface AgronomistReviewModalProps {
  diseaseCase: DiseaseCase;
  selectedFollowUp?: DiseaseCaseFollowUp | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export const AgronomistReviewModal: React.FC<AgronomistReviewModalProps> = ({
  diseaseCase,
  selectedFollowUp,
  isOpen,
  onClose,
  onReviewed,
}) => {
  const [newStatus, setNewStatus] = useState<'Monitoring' | 'Treatment Ongoing' | 'Resolved' | 'Escalated'>('Monitoring');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reviewNotes.trim()) {
      setError('Please provide review notes documenting your assessment of the case.');
      return;
    }

    if (newStatus === 'Resolved' && !reason.trim()) {
      setError('Evidence-based resolution requires providing a clear justification/reason for marking this case as Resolved.');
      return;
    }

    setSubmitting(true);
    try {
      await api.diseases.reviewFollowUp(diseaseCase.id, {
        followUpId: selectedFollowUp?.id,
        newStatus,
        reviewNotes: reviewNotes.trim(),
        reason: reason.trim() || undefined,
      });

      onReviewed();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit agronomist review:', err);
      setError(err.message || 'Unable to record review decision. Please check backend authorization.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: Array<{
    value: 'Monitoring' | 'Treatment Ongoing' | 'Resolved' | 'Escalated';
    label: string;
    description: string;
    color: string;
    bg: string;
  }> = [
    {
      value: 'Monitoring',
      label: '🔬 Monitoring',
      description: 'Observe field response; evidence insufficient to declare full resolution.',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
    },
    {
      value: 'Treatment Ongoing',
      label: '💊 Treatment Ongoing',
      description: 'Prescribed biological intervention in progress; follow-up cycle active.',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
    {
      value: 'Resolved',
      label: '✅ Resolved',
      description: 'Evidence verifies pathogen contained and healthy vegetative growth restored.',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      value: 'Escalated',
      label: '🚨 Escalated',
      description: 'Condition worsened or vector density high; requires specialized biotechnology protocol.',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
    },
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content card-glass"
        style={{
          maxWidth: '640px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: 'var(--radius-lg, 16px)',
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <Stethoscope size={16} /> Agronomist & Expert Case Review
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              Official Decision: {diseaseCase.diseaseName}
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Current Official Status: <strong style={{ color: '#fff' }}>{diseaseCase.status}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Follow-Up Context Preview */}
        {selectedFollowUp && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Reviewed Follow-Up Report ({new Date(selectedFollowUp.treatmentDate).toLocaleDateString()})
            </div>
            <div style={{ color: '#e2e8f0', marginBottom: '4px' }}>
              Reported Condition: <strong style={{ color: selectedFollowUp.currentCondition === 'Improved' ? '#34d399' : selectedFollowUp.currentCondition === 'Worsened' ? '#f87171' : '#fbbf24' }}>{selectedFollowUp.currentCondition}</strong>
            </div>
            <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
              Applied: {selectedFollowUp.treatmentApplied}
            </div>
            <div style={{ color: '#94a3b8' }}>
              Current Symptoms: {selectedFollowUp.currentSymptoms}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Select New Official Case Status */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0' }}>
              Update Official Case Status *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {statusOptions.map((opt) => {
                const selected = newStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewStatus(opt.value)}
                    style={{
                      background: selected ? opt.bg : 'rgba(255, 255, 255, 0.03)',
                      border: selected ? `2px solid ${opt.color}` : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: selected ? opt.color : '#fff', marginBottom: '4px' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Notes (Required) */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <FileText size={14} color="#38bdf8" /> Agronomist Review Assessment & Notes *
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Record your scientific agronomic assessment, observations on symptom reduction or disease containment, and next recommended steps."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Evidence / Reason (Required when resolving or escalating) */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              Reason / Evidence Justification {newStatus === 'Resolved' && <span style={{ color: '#ef4444' }}>* (Required to Resolve)</span>}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={newStatus === 'Resolved' ? 'e.g., Canopy clear of active lesions for 10 days; vegetative recovery verified.' : 'e.g., Ongoing spore incubation; secondary spray cycle necessary.'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={newStatus === 'Resolved'}
              style={{ width: '100%' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Recording Decision...' : 'Save Official Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
