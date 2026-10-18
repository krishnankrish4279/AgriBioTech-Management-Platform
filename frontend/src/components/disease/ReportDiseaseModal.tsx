import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Farm, CropVariety, Disease } from '../../types';
import { api } from '../../api/client';
import { ShieldAlert, Upload, Sparkles, Check, AlertCircle } from 'lucide-react';

interface ReportDiseaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportDiseaseModal: React.FC<ReportDiseaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [catalog, setCatalog] = useState<Disease[]>([]);

  const [farmId, setFarmId] = useState('');
  const [cropVarietyId, setCropVarietyId] = useState('');
  const [diseaseName, setDiseaseName] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [status, setStatus] = useState<'ACTIVE' | 'INVESTIGATING' | 'REPORTED'>('ACTIVE');
  const [symptoms, setSymptoms] = useState('');
  const [recommendedTreatment, setRecommendedTreatment] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.farmers.getFarms().then(setFarms).catch(console.error);
      api.varieties.getAll().then(setVarieties).catch(console.error);
      api.diseases.getCatalog().then(setCatalog).catch(console.error);
    } else {
      setFarmId('');
      setCropVarietyId('');
      setDiseaseName('');
      setStatus('ACTIVE');
      setSymptoms('');
      setRecommendedTreatment('');
      setLatitude('');
      setLongitude('');
      setImageFile(null);
      setError('');
    }
  }, [isOpen]);

  const handleFarmChange = (selectedId: string) => {
    setFarmId(selectedId);
    const chosen = farms.find((f) => f.id === selectedId);
    if (chosen) {
      if (chosen.latitude !== undefined && chosen.latitude !== null) {
        setLatitude(chosen.latitude.toString());
      }
      if (chosen.longitude !== undefined && chosen.longitude !== null) {
        setLongitude(chosen.longitude.toString());
      }
    }
  };

  const handleDiseaseSelect = (name: string) => {
    setDiseaseName(name);
    const matched = catalog.find(d => d.diseaseName === name);
    if (matched) {
      setSymptoms(matched.commonSymptoms);
      setRecommendedTreatment(matched.recommendedBiotechSolution);
      setSeverity(matched.severityLevelDefault);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !diseaseName || !symptoms) {
      setError('Please select a farm, disease name, and describe the symptoms.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let uploadedUrl = '';
      if (imageFile) {
        const uploadRes = await api.upload(imageFile);
        uploadedUrl = uploadRes.url;
      }

      await api.diseases.reportCase({
        farmId,
        cropVarietyId: cropVarietyId || undefined,
        diseaseName,
        severity,
        status,
        symptoms,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        recommendedTreatment,
        imageUrl: uploadedUrl || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit disease surveillance report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
          <ShieldAlert size={20} /> Report Crop Disease Outbreak
        </div>
      }
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Affected Farm Plot *</label>
            <select
              className="select-field"
              value={farmId}
              onChange={(e) => handleFarmChange(e.target.value)}
              required
            >
              <option value="">Select target farm...</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farmName} ({f.farmer?.fullName} - {f.totalAreaAcres} Acres)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Planted Crop Variety</label>
            <select
              className="select-field"
              value={cropVarietyId}
              onChange={(e) => setCropVarietyId(e.target.value)}
            >
              <option value="">Select crop variety (optional)...</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.varietyName} ({v.cropName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">GPS Latitude (Decimal)</label>
            <input
              type="number"
              step="any"
              className="input-field"
              placeholder="e.g. 13.0827 (Auto-filled from farm)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">GPS Longitude (Decimal)</label>
            <input
              type="number"
              step="any"
              className="input-field"
              placeholder="e.g. 80.2707 (Auto-filled from farm)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Pathogen / Disease Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Wheat Stripe Rust, Pink Bollworm"
              value={diseaseName}
              onChange={(e) => setDiseaseName(e.target.value)}
              list="disease-catalog-list"
              required
            />
            <datalist id="disease-catalog-list">
              {catalog.map(d => (
                <option key={d.id} value={d.diseaseName} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Outbreak Severity Level *</label>
            <select
              className="select-field"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
            >
              <option value="CRITICAL">🔴 Critical (Immediate Quarantine)</option>
              <option value="HIGH">🟠 High (Spreading Epidemic)</option>
              <option value="MEDIUM">🔵 Medium (Moderate Lesions)</option>
              <option value="LOW">🟢 Low (Early / Isolated)</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Initial Case Status *</label>
            <select
              className="select-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="ACTIVE">⚠️ Active Outbreak</option>
              <option value="INVESTIGATING">🔍 Under Investigation</option>
              <option value="REPORTED">📋 Reported (Pending Field Inspection)</option>
            </select>
          </div>
        </div>

        {/* Preset Selector */}
        {catalog.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
              AUTO-FILL FROM PATHOGEN REPOSITORY:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {catalog.slice(0, 4).map(d => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => handleDiseaseSelect(d.diseaseName)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  + {d.diseaseName.split('(')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Observed Symptoms Checklist *</label>
          <textarea
            className="textarea-field"
            placeholder="Describe lesion size, chlorosis pattern, pest count, affected percentage of field..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Prescribed Biotech / Biocontrol Treatment</label>
          <textarea
            className="textarea-field"
            placeholder="e.g. Foliar spray of Bacillus subtilis strain Th-82 (5ml/L) + pheromone barrier traps..."
            value={recommendedTreatment}
            onChange={(e) => setRecommendedTreatment(e.target.value)}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Attach Leaf / Plant Photo</label>
          <div style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
          }}>
            <input
              type="file"
              accept="image/*"
              id="disease-photo-upload"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="disease-photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Upload size={24} color="#10b981" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {imageFile ? `Selected: ${imageFile.name}` : 'Click to browse crop lesion photo or drop image here'}
              </span>
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            {submitting ? 'Broadcasting Alert...' : '🚀 Submit Disease Surveillance Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
