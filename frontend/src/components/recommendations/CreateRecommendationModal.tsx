import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farm, CropVariety } from '../../types';
import { Dna, Beaker, AlertCircle } from 'lucide-react';

interface CreateRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRecommendationModal: React.FC<CreateRecommendationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);

  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [recommendationType, setRecommendationType] = useState<string>('BIOFERTILIZER');
  const [targetIssue, setTargetIssue] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [dosage, setDosage] = useState('');
  const [applicationInstructions, setApplicationInstructions] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [cropVarietyId, setCropVarietyId] = useState('');
  const [farmerId, setFarmerId] = useState('');
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
    if (!title || !productName || !reasoning) {
      setError('Please provide title, product name, and biological reasoning.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.recommendations.create({
        title,
        productName,
        recommendationType: recommendationType as any,
        targetIssue,
        reasoning,
        expectedBenefit,
        dosage,
        applicationInstructions,
        precautions,
        cropVarietyId: cropVarietyId || undefined,
        farmerId: farmerId || undefined,
        isAutomatedSuggestion: false,
        status: 'ACTIVE',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit expert recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
          <Dna size={20} /> Prescribe Expert Biotechnology Solution
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
          }}>
            {error}
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Protocol Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Endophytic Nitrogen Inoculant Stack"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio-Product / Formulation Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Bio-Shield FungStop Ultra (Bacillus subtilis strain QST 713)"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Biotech Category *</label>
            <select
              className="select-field"
              value={recommendationType}
              onChange={(e) => setRecommendationType(e.target.value)}
            >
              <option value="BIOFERTILIZER">Biofertilizer / Microbial Inoculant</option>
              <option value="BIOPESTICIDE">Biopesticide / Botanical Antagonist</option>
              <option value="BIOLOGICAL_CONTROL">Biological Control & Parasitoids</option>
              <option value="VARIETY_SELECTION">Resilient Seed Variety Selection</option>
              <option value="CROP_MANAGEMENT">Biotech Management Practice</option>
              <option value="SOIL_ENHANCEMENT">Soil Microbial Rejuvenator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Target Crop Variety</label>
            <select
              className="select-field"
              value={cropVarietyId}
              onChange={(e) => setCropVarietyId(e.target.value)}
            >
              <option value="">Universal / All crops</option>
              {varieties.map(v => (
                <option key={v.id} value={v.id}>
                  {v.varietyName} ({v.cropName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Target Agronomic Vector / Problem</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Yellow stripe rust outbreak in flowering wheat canopy"
            value={targetIssue}
            onChange={(e) => setTargetIssue(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Biological Mechanism & Scientific Reasoning *</label>
          <textarea
            className="textarea-field"
            placeholder="Explain why this bio-solution works and how it inhibits the pathogen / enhances physiology..."
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Recommended Dosage</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 1.5 Liters per Acre in 150L water"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Agronomic Benefit</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Prevents 20-30% yield loss; preserves flag leaf"
              value={expectedBenefit}
              onChange={(e) => setExpectedBenefit(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Application Instructions</label>
          <textarea
            className="textarea-field"
            placeholder="e.g. Spray using hollow-cone nozzle during late afternoon to maximize bacterial colonization..."
            value={applicationInstructions}
            onChange={(e) => setApplicationInstructions(e.target.value)}
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Safety & Chemical Tank Mixing Precautions</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Do not mix with copper hydroxide fungicides within 72 hours"
            value={precautions}
            onChange={(e) => setPrecautions(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting Protocol...' : 'Save & Publish Recommendation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
