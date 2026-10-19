import React, { useState } from 'react';
import { DiseaseCase } from '../../types';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  X,
  MapPin,
  Calendar,
  Sprout,
  ShieldAlert,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  User,
} from 'lucide-react';

interface DiseaseDetailModalProps {
  diseaseCase: DiseaseCase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const DiseaseDetailModal: React.FC<DiseaseDetailModalProps> = ({
  diseaseCase,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { isAdmin, isAgronomist, isBiotechExpert } = useAuth();
  const canEdit = isAdmin || isAgronomist || isBiotechExpert;
  const canDelete = isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [diseaseName, setDiseaseName] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when diseaseCase changes
  React.useEffect(() => {
    if (diseaseCase) {
      setDiseaseName(diseaseCase.diseaseName || '');
      setSeverity(diseaseCase.severity || 'MEDIUM');
      setStatus(diseaseCase.status || 'ACTIVE');
      setSymptoms(diseaseCase.symptoms || '');
      setTreatment(diseaseCase.recommendedTreatment || '');
      setIsEditing(false);
      setError(null);
    }
  }, [diseaseCase]);

  if (!isOpen || !diseaseCase) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.diseases.updateCase(diseaseCase.id, {
        diseaseName,
        severity: severity as any,
        status: status as any,
        symptoms,
        recommendedTreatment: treatment,
      });
      setIsEditing(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update disease case.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete the case for "${diseaseCase.diseaseName}"?`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.diseases.deleteCase(diseaseCase.id);
      onClose();
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to delete disease case.');
      setDeleting(false);
    }
  };

  const handleSyncFarmCoords = async () => {
    setSaving(true);
    setError(null);
    try {
      const farmLat = diseaseCase.farm?.latitude ?? (diseaseCase.farm as any)?.lat;
      const farmLng = diseaseCase.farm?.longitude ?? (diseaseCase.farm as any)?.lng;
      if (!farmLat || !farmLng) {
        throw new Error('Linked farm does not have verified geographic coordinates in database.');
      }
      await api.diseases.updateCase(diseaseCase.id, {
        latitude: farmLat,
        longitude: farmLng,
      });
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to sync coordinates with farm.');
    } finally {
      setSaving(false);
    }
  };

  const cropName = diseaseCase.crop || diseaseCase.cropVariety?.cropName || diseaseCase.farm?.currentCrop;
  const varietyName = diseaseCase.cropVariety?.varietyName;
  const farmName = diseaseCase.farm?.farmName || (typeof diseaseCase.farm === 'string' ? diseaseCase.farm : 'Farm Plot');
  const farmerName = diseaseCase.farm?.farmer?.fullName;
  const locationAddress = diseaseCase.locationAddress || diseaseCase.farm?.locationAddress;
  const lat = diseaseCase.latitude ?? diseaseCase.lat;
  const lng = diseaseCase.longitude ?? diseaseCase.lng;

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: '680px', width: '92%' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <ShieldAlert size={20} color="#ef4444" />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>{diseaseCase.diseaseName}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Surveillance Record #{diseaseCase.id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              margin: '16px 24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="modal-body">
          {/* Status Badges & Quick Meta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <SeverityBadge severity={diseaseCase.severity} />
              <StatusBadge status={diseaseCase.status} />
              {diseaseCase.isDemo ? (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'rgba(148, 163, 184, 0.15)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Demo Record
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Field Report
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <Calendar size={14} />
              {diseaseCase.dateObserved ? new Date(diseaseCase.dateObserved).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Diagnosis / Issue Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  placeholder="e.g. Yellow leaves or pathogen diagnosis"
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div>
                  <label className="input-label">Severity Level</label>
                  <select
                    className="select-field"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Case Status</label>
                  <select
                    className="select-field"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="REPORTED">REPORTED (Farmer Submission)</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Observed Symptoms</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label">Recommended Treatment / Biocontrol</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Specify targeted biocontrol protocol..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Farm & Host Crop Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    FARM & LOCATION
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#10b981" /> {farmName}
                  </div>
                  {farmerName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--brand-emerald)', marginTop: '2px' }}>
                      Farmer: {farmerName}
                    </div>
                  )}
                  {locationAddress && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {locationAddress}
                    </div>
                  )}
                  {lat && lng && !(lat === 0 && lng === 0) ? (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'monospace' }}>
                      GPS: [{lat.toFixed(4)}, {lng.toFixed(4)}]
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <AlertTriangle size={12} /> Geographic coordinates unmapped
                      </span>
                      {canEdit && (diseaseCase.farm?.latitude || (typeof diseaseCase.farm === 'object' && (diseaseCase.farm as any)?.latitude)) && (
                        <button
                          type="button"
                          onClick={handleSyncFarmCoords}
                          disabled={saving}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MapPin size={12} color="#10b981" /> Sync with Farm Location
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    AFFECTED CROP / VARIETY
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sprout size={14} color="#34d399" /> {cropName || 'Unspecified Crop'}
                  </div>
                  {varietyName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Cultivar: <strong>{varietyName}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} /> Reporter: {diseaseCase.reportedBy?.name || 'Surveillance Unit'}
                  </div>
                  {diseaseCase.assignedAdvisor && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                      🧑‍🌾 Assigned Advisor: <strong>{diseaseCase.assignedAdvisor.name}</strong>
                    </div>
                  )}
                  {diseaseCase.problemType && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
                      📋 Problem Type: <strong>{diseaseCase.problemType}</strong>
                    </div>
                  )}
                  {diseaseCase.affectedArea && (
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '2px' }}>
                      📐 Affected Area: <strong>{diseaseCase.affectedArea}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Symptoms Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  CLINICAL SYMPTOMS & PATHOLOGY
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                  }}
                >
                  {diseaseCase.symptoms}
                </div>
              </div>

              {/* Treatment Protocol */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-emerald)', marginBottom: '6px' }}>
                  RECOMMENDED BIOCONTROL & TREATMENT PROTOCOL
                </div>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontSize: '0.85rem',
                    color: '#d1fae5',
                    lineHeight: 1.5,
                  }}
                >
                  {diseaseCase.recommendedTreatment || 'Standard biosecurity isolation and bio-fungicide barrier application.'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isEditing && (
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="btn btn-danger btn-sm"
                  disabled={deleting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Report'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} /> Edit Case
                </button>
              )}
              <button onClick={onClose} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
