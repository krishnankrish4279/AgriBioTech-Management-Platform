import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farm, CropVariety } from '../../types';
import { ClipboardList, Upload, AlertCircle, Sparkles } from 'lucide-react';

interface RecordObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordObservationModal: React.FC<RecordObservationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);

  const [farmId, setFarmId] = useState('');
  const [cropVarietyId, setCropVarietyId] = useState('');
  const [growthStage, setGrowthStage] = useState<'SEEDLING' | 'VEGETATIVE' | 'FLOWERING' | 'GRAIN_FILLING' | 'MATURITY'>('VEGETATIVE');
  const [plantHealthScore, setPlantHealthScore] = useState('8');
  const [soilMoisture, setSoilMoisture] = useState<'OPTIMAL' | 'DRY' | 'WATERLOGGED' | 'MODERATE'>('OPTIMAL');
  const [soilHealthNotes, setSoilHealthNotes] = useState('');
  const [weatherCondition, setWeatherCondition] = useState<'SUNNY' | 'HUMID_OVERCAST' | 'RAINY' | 'DRY_WINDY'>('SUNNY');
  const [pestSymptoms, setPestSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.farmers.getFarms().then(setFarms).catch(console.error);
      api.varieties.getAll().then(setVarieties).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !notes) {
      setError('Please select a farm and provide field notes.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let uploadedUrl = '';
      if (photoFile) {
        const uploadRes = await api.upload(photoFile);
        uploadedUrl = uploadRes.url;
      }

      await api.observations.record({
        farmId,
        cropVarietyId: cropVarietyId || undefined,
        growthStage,
        plantHealthScore: parseInt(plantHealthScore, 10) || 8,
        soilMoisture,
        soilHealthNotes: soilHealthNotes || 'Adequate organic carbon and microbial presence.',
        weatherCondition,
        pestSymptoms: pestSymptoms || undefined,
        notes,
        photoUrl: uploadedUrl || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record field observation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
          <ClipboardList size={20} /> Log Agronomist Field Visit Observation
        </div>
      }
      maxWidth="780px"
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
            <label className="form-label">Inspected Farm Plot *</label>
            <select
              className="select-field"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
              required
            >
              <option value="">Select farm plot...</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.farmName} ({f.farmer?.fullName} - {f.totalAreaAcres} Acres)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Active Crop Variety</label>
            <select
              className="select-field"
              value={cropVarietyId}
              onChange={(e) => setCropVarietyId(e.target.value)}
            >
              <option value="">Select crop variety (optional)...</option>
              {varieties.map(v => (
                <option key={v.id} value={v.id}>
                  {v.varietyName} ({v.cropName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Growth Stage *</label>
            <select
              className="select-field"
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value as any)}
            >
              <option value="SEEDLING">Seedling</option>
              <option value="VEGETATIVE">Vegetative</option>
              <option value="FLOWERING">Flowering</option>
              <option value="GRAIN_FILLING">Grain Filling</option>
              <option value="MATURITY">Maturity</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Plant Health Score ({plantHealthScore}/10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={plantHealthScore}
              onChange={(e) => setPlantHealthScore(e.target.value)}
              style={{ width: '100%', marginTop: '10px', accentColor: '#10b981' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Soil Moisture State</label>
            <select
              className="select-field"
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(e.target.value as any)}
            >
              <option value="OPTIMAL">Optimal Moisture</option>
              <option value="MODERATE">Moderate Moisture</option>
              <option value="DRY">Dry / Deficit</option>
              <option value="WATERLOGGED">Waterlogged</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Weather Conditions</label>
            <select
              className="select-field"
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value as any)}
            >
              <option value="SUNNY">☀️ Sunny & Clear</option>
              <option value="HUMID_OVERCAST">☁️ Humid / Overcast</option>
              <option value="RAINY">🌧️ Rainy</option>
              <option value="DRY_WINDY">💨 Dry & Windy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Pest Symptoms (if any)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Mild leaf curling, minor aphid presence..."
              value={pestSymptoms}
              onChange={(e) => setPestSymptoms(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Agronomist Field Notes & Physiological Assessment *</label>
          <textarea
            className="textarea-field"
            placeholder="Record vegetative vigour, tiller count, canopy architecture, root nodulation, recommended immediate actions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Attach Field Visit Photo</label>
          <div style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
          }}>
            <input
              type="file"
              accept="image/*"
              id="obs-photo-upload"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPhotoFile(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="obs-photo-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Upload size={20} color="#10b981" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {photoFile ? `Selected: ${photoFile.name}` : 'Click to attach field visit photo'}
              </span>
            </label>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Recording Visit...' : 'Commit Observation Log'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
