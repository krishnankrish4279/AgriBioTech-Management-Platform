import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Users, AlertCircle, PlusCircle } from 'lucide-react';

interface AddFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFarmerModal: React.FC<AddFarmerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('Punjab');
  const [district, setDistrict] = useState('Ludhiana');
  const [village, setVillage] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('10.0');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [farmingExperienceYears, setFarmingExperienceYears] = useState('12');
  const [primaryCrops, setPrimaryCrops] = useState('Wheat, Rice, Cotton');

  // Initial Farm plot
  const [initialFarmName, setInitialFarmName] = useState('');
  const [initialSoilType, setInitialSoilType] = useState('Alluvial Loam');
  const [initialIrrigationType, setInitialIrrigationType] = useState('Canal & Borewell');
  const [initialLatitude, setInitialLatitude] = useState('30.9010');
  const [initialLongitude, setInitialLongitude] = useState('75.8573');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !state || !district) {
      setError('Please provide full name, phone number, state, and district.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.farmers.create({
        fullName,
        phone,
        email: email || undefined,
        state,
        district,
        village: village || undefined,
        farmSizeAcres: parseFloat(farmSizeAcres) || 5.0,
        preferredLanguage,
        farmingExperienceYears: parseInt(farmingExperienceYears, 10) || 5,
        primaryCrops,
        initialFarmName: initialFarmName || `${fullName.split(' ')[0]}'s Main Plot`,
        initialSoilType,
        initialIrrigationType,
        initialLatitude: parseFloat(initialLatitude) || 30.9010,
        initialLongitude: parseFloat(initialLongitude) || 75.8573,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register farmer profile.');
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
          <Users size={20} /> Register Progressive Farmer & Plot
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
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone Number *</label>
            <input
              type="tel"
              className="input-field"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">State / Province *</label>
            <input
              type="text"
              className="input-field"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">District *</label>
            <input
              type="text"
              className="input-field"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Village / Sub-district</label>
            <input
              type="text"
              className="input-field"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Samrala Kalan"
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Total Land Holding (Acres)</label>
            <input
              type="number"
              step="0.5"
              className="input-field"
              value={farmSizeAcres}
              onChange={(e) => setFarmSizeAcres(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Advisory Language</label>
            <select
              className="select-field"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Spanish">Spanish (Español)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Farming Experience (Years)</label>
            <input
              type="number"
              className="input-field"
              value={farmingExperienceYears}
              onChange={(e) => setFarmingExperienceYears(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Primary Crops Grown</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Wheat, Rice, Bt-Cotton, Mustard"
            value={primaryCrops}
            onChange={(e) => setPrimaryCrops(e.target.value)}
          />
        </div>

        {/* Initial Farm Plot Details */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginTop: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
            Primary Agricultural Plot Specifications:
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Farm Plot Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Green Meadows Agro-Plot A1"
                value={initialFarmName}
                onChange={(e) => setInitialFarmName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Soil Type</label>
              <input
                type="text"
                className="input-field"
                value={initialSoilType}
                onChange={(e) => setInitialSoilType(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Irrigation System</label>
              <input
                type="text"
                className="input-field"
                value={initialIrrigationType}
                onChange={(e) => setInitialIrrigationType(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GPS Latitude</label>
              <input
                type="text"
                className="input-field"
                value={initialLatitude}
                onChange={(e) => setInitialLatitude(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GPS Longitude</label>
              <input
                type="text"
                className="input-field"
                value={initialLongitude}
                onChange={(e) => setInitialLongitude(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Registering...' : 'Complete Farmer Onboarding'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
