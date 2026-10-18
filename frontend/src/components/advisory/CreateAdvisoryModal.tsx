import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farmer } from '../../types';
import { MessageSquareShare, Send, AlertCircle } from 'lucide-react';

interface CreateAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAdvisoryModal: React.FC<CreateAdvisoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerId, setFarmerId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('DISEASE_ALERT');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'IMPORTANT' | 'URGENT'>('IMPORTANT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.farmers.getAll().then(setFarmers).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !title || !message) {
      setError('Please select a farmer, title, and advisory message.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.advisories.create({
        farmerId,
        title,
        category: category as any,
        message,
        priority,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch farmer advisory.');
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
          <MessageSquareShare size={20} /> Dispatch Personalized Farmer Advisory
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
            <label className="form-label">Recipient Farmer *</label>
            <select
              className="select-field"
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              required
            >
              <option value="">Select target farmer...</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.fullName} ({f.district}, {f.state} - {f.preferredLanguage})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Advisory Urgency Priority *</label>
            <select
              className="select-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <option value="URGENT">🚨 URGENT (Immediate Action Required)</option>
              <option value="IMPORTANT">⚠️ IMPORTANT (Seasonal Warning)</option>
              <option value="ROUTINE">ℹ️ ROUTINE (General Guidance)</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Advisory Subject / Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Yellow Rust Barrier Spray Required"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category Domain</label>
            <select
              className="select-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="DISEASE_ALERT">Disease & Pest Outbreak Alert</option>
              <option value="IRRIGATION">Irrigation Guidance</option>
              <option value="NUTRIENT_MANAGEMENT">Nutrient & Bio-Fertilizer Schedule</option>
              <option value="BIOTECH_INPUT">Biotechnology Input & Seeds</option>
              <option value="WEATHER_ACTION">Agro-Meteorology Weather Alert</option>
              <option value="GENERAL">General Best Practices</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Personalized Advisory Message & Action Plan *</label>
          <textarea
            className="textarea-field"
            placeholder="Write clear, actionable steps for the farmer including dosages, timing, irrigation windows..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Dispatching...' : '🚀 Dispatch Advisory Message'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
