import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { CropVariety } from '../../types';
import { api } from '../../api/client';
import { Sprout, Dna, Upload, AlertCircle } from 'lucide-react';

interface VarietyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialVariety?: CropVariety | null;
}

export const VarietyFormModal: React.FC<VarietyFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialVariety,
}) => {
  const [cropName, setCropName] = useState('');
  const [varietyName, setVarietyName] = useState('');
  const [cropType, setCropType] = useState<'CEREAL' | 'PULSE' | 'OILSEED' | 'CASH_CROP' | 'HORTICULTURE'>('CEREAL');
  const [growingSeason, setGrowingSeason] = useState<'KHARIF' | 'RABI' | 'ZAID' | 'YEAR_ROUND'>('KHARIF');
  const [soilRequirements, setSoilRequirements] = useState('');
  const [expectedYieldMin, setExpectedYieldMin] = useState('20');
  const [expectedYieldMax, setExpectedYieldMax] = useState('30');
  const [yieldUnit, setYieldUnit] = useState('Quintals/Acre');
  const [diseaseResistanceTraits, setDiseaseResistanceTraits] = useState('');
  const [biotechTraits, setBiotechTraits] = useState('');
  const [recommendedRegions, setRecommendedRegions] = useState('');
  const [description, setDescription] = useState('');
  const [maturityDays, setMaturityDays] = useState('120');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialVariety) {
      setCropName(initialVariety.cropName);
      setVarietyName(initialVariety.varietyName);
      setCropType(initialVariety.cropType);
      setGrowingSeason(initialVariety.growingSeason);
      setSoilRequirements(initialVariety.soilRequirements);
      setExpectedYieldMin(String(initialVariety.expectedYieldMin));
      setExpectedYieldMax(String(initialVariety.expectedYieldMax));
      setYieldUnit(initialVariety.yieldUnit);
      setDiseaseResistanceTraits(initialVariety.diseaseResistanceTraits);
      setBiotechTraits(initialVariety.biotechTraits);
      setRecommendedRegions(initialVariety.recommendedRegions);
      setDescription(initialVariety.description);
      setMaturityDays(String(initialVariety.maturityDays));
      setImageUrl(initialVariety.imageUrl || '');
    } else {
      setCropName('');
      setVarietyName('');
      setCropType('CEREAL');
      setGrowingSeason('KHARIF');
      setSoilRequirements('Well-drained loamy soil with pH 6.0 - 7.5');
      setExpectedYieldMin('20');
      setExpectedYieldMax('30');
      setYieldUnit('Quintals/Acre');
      setDiseaseResistanceTraits('Yellow Rust Resistant, Bacterial Blight Immune');
      setBiotechTraits('CRISPR Drought-Resilience, Bio-Fortified Zinc');
      setRecommendedRegions('Indo-Gangetic Plains, Deccan Plateau');
      setDescription('');
      setMaturityDays('120');
      setImageUrl('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80');
    }
  }, [initialVariety, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || !varietyName) {
      setError('Please provide crop name and variety name.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      cropName,
      varietyName,
      cropType,
      growingSeason,
      soilRequirements,
      expectedYieldMin: parseFloat(expectedYieldMin) || 10,
      expectedYieldMax: parseFloat(expectedYieldMax) || 20,
      yieldUnit,
      diseaseResistanceTraits,
      biotechTraits,
      recommendedRegions,
      description,
      maturityDays: parseInt(maturityDays, 10) || 120,
      imageUrl,
    };

    try {
      if (initialVariety) {
        await api.varieties.update(initialVariety.id, payload);
      } else {
        await api.varieties.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save crop variety.');
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
          <Sprout size={20} /> {initialVariety ? 'Edit Crop Variety' : 'Register New Crop Variety'}
        </div>
      }
      maxWidth="800px"
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
            <label className="form-label">Crop Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Wheat, Rice, Cotton, Maize"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variety / Cultivar Designation *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Bt-Cotton BioShield II, DBW-303 Plus"
              value={varietyName}
              onChange={(e) => setVarietyName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Crop Type Category *</label>
            <select
              className="select-field"
              value={cropType}
              onChange={(e) => setCropType(e.target.value as any)}
            >
              <option value="CEREAL">Cereal (Wheat, Rice, Maize)</option>
              <option value="CASH_CROP">Cash Crop (Cotton, Sugarcane)</option>
              <option value="OILSEED">Oilseed (Soybean, Mustard)</option>
              <option value="PULSE">Pulse (Chickpea, Lentil)</option>
              <option value="HORTICULTURE">Horticulture (Tomato, Chilli)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Growing Season *</label>
            <select
              className="select-field"
              value={growingSeason}
              onChange={(e) => setGrowingSeason(e.target.value as any)}
            >
              <option value="KHARIF">Kharif (Monsoon / Summer)</option>
              <option value="RABI">Rabi (Winter / Spring)</option>
              <option value="ZAID">Zaid (Summer)</option>
              <option value="YEAR_ROUND">Year-Round Perennial</option>
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Min Expected Yield</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={expectedYieldMin}
              onChange={(e) => setExpectedYieldMin(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Expected Yield</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={expectedYieldMax}
              onChange={(e) => setExpectedYieldMax(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Yield Metric Unit</label>
            <input
              type="text"
              className="input-field"
              value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Biotechnology Traits & Gene Stacks</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Dual Cry1Ac+Cry2Ab, CRISPR Drought-X, TaHsfA1 Heat Tolerance"
            value={biotechTraits}
            onChange={(e) => setBiotechTraits(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Disease Resistance Traits</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Strip Rust (Yr18/Yr29) Immune, Bacterial Blight (Xa21) Tolerant"
            value={diseaseResistanceTraits}
            onChange={(e) => setDiseaseResistanceTraits(e.target.value)}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Maturity Duration (Days)</label>
            <input
              type="number"
              className="input-field"
              value={maturityDays}
              onChange={(e) => setMaturityDays(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recommended Agro-Climatic Regions</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. North Western Plains, Central Cotton Belt"
              value={recommendedRegions}
              onChange={(e) => setRecommendedRegions(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Soil & Agronomic Requirements</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Deep alluvial loam, pH 6.2 - 7.5, optimal drainage"
            value={soilRequirements}
            onChange={(e) => setSoilRequirements(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description & Agronomic Profile</label>
          <textarea
            className="textarea-field"
            placeholder="Describe physiological attributes, stay-green index, grain quality..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving Variety...' : initialVariety ? 'Update Variety' : 'Register Crop Variety'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
