import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Layers, AlertCircle } from 'lucide-react';

interface AddFarmPlotModalProps {
  farmerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFarmPlotModal: React.FC<AddFarmPlotModalProps> = ({
  farmerId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farmName, setFarmName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [totalAreaAcres, setTotalAreaAcres] = useState('5.0');
  const [soilType, setSoilType] = useState('Black Clay Loam');
  const [irrigationType, setIrrigationType] = useState('Automated Drip');
  const [latitude, setLatitude] = useState('22.5645');
  const [longitude, setLongitude] = useState('72.9289');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!farmerId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName) {
      setError('Please provide farm plot name.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.farmers.addFarmPlot({
        farmerId,
        farmName,
        locationAddress: locationAddress || 'Agricultural Plot Extension',
        totalAreaAcres: parseFloat(totalAreaAcres) || 5.0,
        soilType,
        irrigationType,
        latitude: parseFloat(latitude) || 22.5645,
        longitude: parseFloat(longitude) || 72.9289,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add farm plot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4' }}>
          <Layers size={20} /> Add Land Plot to Farmer Profile
        </div>
      }
      maxWidth="640px"
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
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Farm Plot Name *</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. East Valley Bio-Plot B2"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Physical Location Address</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Sector 8 Bypass, Ludhiana District"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
          />
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Plot Size (Acres)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={totalAreaAcres}
              onChange={(e) => setTotalAreaAcres(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Soil Type</label>
            <input
              type="text"
              className="input-field"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Irrigation System</label>
            <input
              type="text"
              className="input-field"
              value={irrigationType}
              onChange={(e) => setIrrigationType(e.target.value)}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">GPS Latitude</label>
            <input
              type="text"
              className="input-field"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">GPS Longitude</label>
            <input
              type="text"
              className="input-field"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-biotech" disabled={submitting}>
            {submitting ? 'Adding Plot...' : 'Add Farm Plot'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
