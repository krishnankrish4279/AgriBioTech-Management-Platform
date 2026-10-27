import React, { useState } from 'react';
import { api } from '../../api/client';
import { DiseaseCase, DiseaseCaseFollowUp } from '../../types';
import { X, Calendar, Sprout, AlertCircle, CheckCircle2, Upload, Activity, ShieldCheck, FileText } from 'lucide-react';

interface FarmerFollowUpModalProps {
  diseaseCase: DiseaseCase;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (followUp: DiseaseCaseFollowUp) => void;
}

export const FarmerFollowUpModal: React.FC<FarmerFollowUpModalProps> = ({
  diseaseCase,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const farmName = diseaseCase.farm?.farmName || (typeof diseaseCase.farm === 'string' ? diseaseCase.farm : 'Farm Plot');
  const cropName = diseaseCase.crop || diseaseCase.cropVariety?.cropName || diseaseCase.farm?.currentCrop || 'Field Crop';

  const [treatmentDate, setTreatmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [treatmentApplied, setTreatmentApplied] = useState<string>('');
  const [currentSymptoms, setCurrentSymptoms] = useState<string>('');
  const [pestActivity, setPestActivity] = useState<string>('None observed');
  const [currentCondition, setCurrentCondition] = useState<'Improved' | 'Unchanged' | 'Worsened'>('Improved');
  const [additionalObservations, setAdditionalObservations] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!treatmentDate) {
      setError('Please specify the date when treatment was applied.');
      return;
    }

    const selectedDate = new Date(treatmentDate);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    if (selectedDate > tomorrow) {
      setError('Treatment date cannot be in the future.');
      return;
    }

    if (!treatmentApplied.trim()) {
      setError('Please describe the treatment or biological intervention applied.');
      return;
    }

    if (!currentSymptoms.trim()) {
      setError('Please describe the current symptoms observed on the crop.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedImageUrl: string | undefined = undefined;
      if (photoFile) {
        try {
          const uploadRes = await api.upload(photoFile);
          uploadedImageUrl = uploadRes.url;
        } catch (uploadErr: any) {
          console.warn('Field photograph upload failed, continuing with report:', uploadErr);
        }
      }

      const res = await api.diseases.submitFollowUp(diseaseCase.id, {
        treatmentDate,
        treatmentApplied: treatmentApplied.trim(),
        currentSymptoms: currentSymptoms.trim(),
        pestActivity: pestActivity.trim(),
        currentCondition,
        additionalObservations: additionalObservations.trim() || undefined,
        imageUrl: uploadedImageUrl,
      });

      onSubmitted(res.followUp);
      onClose();
    } catch (err: any) {
      console.error('Failed to submit follow-up report:', err);
      setError(err.message || 'Unable to record follow-up report. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content card-glass"
        style={{
          maxWidth: '620px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: 'var(--radius-lg, 16px)',
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              <ShieldCheck size={16} /> Farmer Case Follow-Up Report
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              Treatment Progress: {diseaseCase.diseaseName}
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Farm: <strong style={{ color: '#fff' }}>{farmName}</strong> &bull; Crop: <strong style={{ color: '#34d399' }}>{cropName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Treatment Date */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <Calendar size={14} color="#38bdf8" /> Treatment Application Date *
            </label>
            <input
              type="date"
              className="input-field"
              value={treatmentDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTreatmentDate(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {/* Treatment / Intervention Applied */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <Sprout size={14} color="#10b981" /> Treatment or Intervention Applied *
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g., Applied Trichoderma viride bio-fungicide spray (5ml/L) and installed 8 yellow sticky traps."
              value={treatmentApplied}
              onChange={(e) => setTreatmentApplied(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Current Symptoms */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <Activity size={14} color="#f59e0b" /> Current Crop Symptoms *
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g., Leaf curling has stopped on top flush; lower leaves still show slight yellowing."
              value={currentSymptoms}
              onChange={(e) => setCurrentSymptoms(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Whitefly or Other Pest Activity */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              🐛 Whitefly or Other Pest Activity
            </label>
            <select
              className="select-field"
              value={pestActivity}
              onChange={(e) => setPestActivity(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="None observed">None observed (Clean canopy)</option>
              <option value="Low / Isolated">Low / Isolated (Few scattered pests)</option>
              <option value="Moderate">Moderate (Active vectors on underside of leaves)</option>
              <option value="Severe / Heavy infestation">Severe / Heavy infestation (Dense vector swarm)</option>
            </select>
          </div>

          {/* Current Condition: Improved, Unchanged, Worsened */}
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              Current Crop Condition *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { value: 'Improved', label: '🌿 Improved', desc: 'Signs of recovery, less symptoms', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                { value: 'Unchanged', label: '⚖️ Unchanged', desc: 'Condition stable, no major shift', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
                { value: 'Worsened', label: '⚠️ Worsened', desc: 'Symptoms spreading or intensifying', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
              ].map((opt) => {
                const selected = currentCondition === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrentCondition(opt.value as any)}
                    style={{
                      background: selected ? opt.bg : 'rgba(255, 255, 255, 0.03)',
                      border: selected ? `2px solid ${opt.color}` : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: selected ? opt.color : '#fff', marginBottom: '3px' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Observations */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <FileText size={14} color="#94a3b8" /> Additional Observations (Optional)
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="e.g., Rain occurred 6 hours after spray; nearby neighbor plots also showing similar symptoms."
              value={additionalObservations}
              onChange={(e) => setAdditionalObservations(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Field Photograph Upload */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
              <Upload size={14} color="#38bdf8" /> Field Photograph (Evidence)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)' }}
            />
            {photoPreview && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={photoPreview}
                  alt="Field preview"
                  style={{ maxHeight: '160px', borderRadius: '8px', border: '1px solid var(--border-subtle)', objectFit: 'cover' }}
                />
              </div>
            )}
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
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              {submitting ? 'Submitting Report...' : 'Submit Follow-Up Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
