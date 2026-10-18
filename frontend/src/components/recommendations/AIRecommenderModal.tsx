import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farm, CropVariety } from '../../types';
import { Sparkles, Dna, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AIRecommenderModal: React.FC<AIRecommenderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);

  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [growthStage, setGrowthStage] = useState('FLOWERING');
  const [soilCondition, setSoilCondition] = useState('Alluvial Loam pH 6.8');
  const [diseaseSymptom, setDiseaseSymptom] = useState('Foliar Rust Spores and Moisture Stress');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.farmers.getFarms().then(setFarms).catch(console.error);
      api.varieties.getAll().then(setVarieties).catch(console.error);
      setGeneratedResults(null);
      setError('');
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');

    try {
      const selectedFarm = farms.find(f => f.id === selectedFarmId);
      const res = await api.recommendations.generateAI({
        cropName: selectedCrop,
        growthStage,
        soilCondition,
        diseaseSymptom,
        farmId: selectedFarmId || undefined,
        farmerId: selectedFarm?.farmerId || undefined,
      });

      setGeneratedResults(res.recommendations);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore confetti errors
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize AI recommendations');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4' }}>
          <Sparkles size={20} /> AI Biotechnology Recommendation Synthesizer
        </div>
      }
      maxWidth="760px"
    >
      <div>
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

        {!generatedResults ? (
          <form onSubmit={handleGenerate}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.4 }}>
              The AI Biotechnology Engine evaluates crop growth stage, soil physiology, and pest pressure vectors to synthesize targeted biofertilizer, biopesticide, and microbial biocontrol interventions.
            </p>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Target Farm & Farmer</label>
                <select
                  className="select-field"
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                >
                  <option value="">Universal / General Synthesis</option>
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.farmName} ({f.farmer?.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Crop Specimen *</label>
                <input
                  type="text"
                  className="input-field"
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  placeholder="e.g. Wheat, Rice, Bt-Cotton"
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Current Crop Growth Stage</label>
                <select
                  className="select-field"
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                >
                  <option value="SEEDLING">Seedling / Germination</option>
                  <option value="VEGETATIVE">Vegetative Tillering</option>
                  <option value="FLOWERING">Flowering / Booting</option>
                  <option value="GRAIN_FILLING">Grain Filling / Pod Formation</option>
                  <option value="MATURITY">Maturity / Ripening</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Soil & Field Texture Profile</label>
                <input
                  type="text"
                  className="input-field"
                  value={soilCondition}
                  onChange={(e) => setSoilCondition(e.target.value)}
                  placeholder="e.g. Deep Alluvial Loam, pH 6.8"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Agronomic Vector / Pathogen Symptom</label>
              <input
                type="text"
                className="input-field"
                value={diseaseSymptom}
                onChange={(e) => setDiseaseSymptom(e.target.value)}
                placeholder="e.g. Stripe rust pustules, yellowing leaf tips, borer frass..."
                required
              />
            </div>

            <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={generating}>
                Cancel
              </button>
              <button type="submit" className="btn btn-biotech" disabled={generating}>
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw className="spin" size={16} /> Synthesizing Biotech Matrix...
                  </span>
                ) : (
                  '⚡ Run AI Biotech Inference'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#34d399',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={18} /> Generated & Committed 3 Tailored Biotech Prescriptions!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
              {generatedResults.map((r: any) => (
                <div
                  key={r.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                      {r.recommendationType}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                      Dosage: {r.dosage}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {r.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Product:</strong> {r.productName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#d1fae5', marginTop: '4px' }}>
                    {r.reasoning}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                }}
              >
                Done & View All Recommendations
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
