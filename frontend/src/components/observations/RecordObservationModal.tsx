import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farm, CropVariety } from '../../types';
import { ClipboardList, Upload, AlertCircle, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';

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
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchDropdownData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);

    try {
      const [farmsRes, varietiesRes] = await Promise.all([
        api.farmers.getFarms(),
        api.varieties.getAll(),
      ]);

      const parsedFarms = Array.isArray(farmsRes) ? farmsRes : (farmsRes as any)?.farms || (farmsRes as any)?.data || [];
      const parsedVarieties = Array.isArray(varietiesRes) ? varietiesRes : (varietiesRes as any)?.varieties || (varietiesRes as any)?.data || [];

      setFarms(parsedFarms);
      setVarieties(parsedVarieties);
    } catch (err: any) {
      console.error('Failed to load observation form dropdown records:', err);
      setFetchError(err.message || 'Unable to connect to database records. Please verify API connection.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    } else {
      // Reset form states when modal is closed
      setFarmId('');
      setCropVarietyId('');
      setGrowthStage('VEGETATIVE');
      setPlantHealthScore('8');
      setSoilMoisture('OPTIMAL');
      setSoilHealthNotes('');
      setWeatherCondition('SUNNY');
      setPestSymptoms('');
      setNotes('');
      setPhotoFile(null);
      setSubmitError(null);
      setFetchError(null);
    }
  }, [isOpen, fetchDropdownData]);

  const handleFarmSelect = (selectedFarmId: string) => {
    setFarmId(selectedFarmId);
    if (!selectedFarmId) return;

    // Auto-select crop variety if associated with this farm plot and not already chosen
    const selectedFarm = farms.find(f => (f.id || (f as any)._id) === selectedFarmId);
    if (selectedFarm?.cropVarietyId && !cropVarietyId) {
      setCropVarietyId(selectedFarm.cropVarietyId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) {
      setSubmitError('Please select an inspected farm plot.');
      return;
    }
    if (!notes || !notes.trim()) {
      setSubmitError('Please provide field notes and physiological assessment.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let uploadedUrl = '';
      if (photoFile) {
        const uploadRes = await api.upload(photoFile);
        uploadedUrl = uploadRes.url;
      }

      await api.observations.record({
        farmId: farmId.trim(),
        cropVarietyId: cropVarietyId && cropVarietyId.trim() ? cropVarietyId.trim() : undefined,
        growthStage,
        plantHealthScore: parseInt(plantHealthScore, 10) || 8,
        soilMoisture,
        soilHealthNotes: soilHealthNotes ? soilHealthNotes.trim() : 'Adequate organic carbon and microbial presence.',
        weatherCondition,
        pestSymptoms: pestSymptoms && pestSymptoms.trim() ? pestSymptoms.trim() : undefined,
        notes: notes.trim(),
        photoUrl: uploadedUrl || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record field observation.');
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
        {fetchError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={fetchDropdownData}
              disabled={loadingData}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={14} className={loadingData ? 'spin' : ''} />
              {loadingData ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {submitError && (
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
            <AlertCircle size={16} /> {submitError}
          </div>
        )}

        <div className="grid-2">
          {/* Farm Plot Dropdown */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Inspected Farm Plot *</label>
              {loadingData && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={12} className="spin" /> Loading plots...
                </span>
              )}
            </div>
            <select
              className="select-field"
              value={farmId}
              onChange={(e) => handleFarmSelect(e.target.value)}
              required
              disabled={loadingData && farms.length === 0}
            >
              {loadingData && farms.length === 0 ? (
                <option value="" disabled>Loading farm plots from database...</option>
              ) : fetchError && farms.length === 0 ? (
                <option value="" disabled>Failed to load farm plots (Click retry above)</option>
              ) : farms.length === 0 ? (
                <option value="" disabled>No farm plots found in database</option>
              ) : (
                <option value="">Select farm plot...</option>
              )}

              {farms.map(f => {
                const id = f.id || (f as any)._id;
                const farmerName = f.farmer?.fullName;
                const acres = f.totalAreaAcres ? `${f.totalAreaAcres} Acres` : 'Main Plot';
                const label = farmerName
                  ? `${f.farmName} (${farmerName} • ${acres})`
                  : `${f.farmName} (${acres})`;

                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
            {!loadingData && farms.length === 0 && !fetchError && (
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>
                No active farm plots registered in database yet.
              </p>
            )}
          </div>

          {/* Crop Variety Dropdown (Optional) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Active Crop Variety (Optional)</label>
              {loadingData && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Loader2 size={12} className="spin" /> Loading varieties...
                </span>
              )}
            </div>
            <select
              className="select-field"
              value={cropVarietyId}
              onChange={(e) => setCropVarietyId(e.target.value)}
              disabled={loadingData && varieties.length === 0}
            >
              {loadingData && varieties.length === 0 ? (
                <option value="" disabled>Loading crop varieties from database...</option>
              ) : fetchError && varieties.length === 0 ? (
                <option value="" disabled>Failed to load crop varieties</option>
              ) : varieties.length === 0 ? (
                <option value="" disabled>No crop varieties found in database</option>
              ) : (
                <option value="">Select crop variety (optional)...</option>
              )}

              {varieties.map(v => {
                const id = v.id || (v as any)._id;
                const season = v.growingSeason ? ` • ${v.growingSeason}` : '';
                const label = `${v.varietyName} (${v.cropName}${season})`;

                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
            {cropVarietyId && (
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Variety selected for genetic phenotype tracking
              </p>
            )}
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
              <option value="SEEDLING">🌱 Seedling</option>
              <option value="VEGETATIVE">🌿 Vegetative</option>
              <option value="FLOWERING">🌸 Flowering</option>
              <option value="GRAIN_FILLING">🌾 Grain Filling</option>
              <option value="MATURITY">✨ Maturity</option>
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
              <option value="OPTIMAL">💧 Optimal Moisture</option>
              <option value="MODERATE">⚖️ Moderate Moisture</option>
              <option value="DRY">🏜️ Dry / Deficit</option>
              <option value="WATERLOGGED">🌊 Waterlogged</option>
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
          <button type="submit" className="btn btn-primary" disabled={submitting || (loadingData && farms.length === 0)}>
            {submitting ? 'Recording Visit...' : 'Commit Observation Log'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
