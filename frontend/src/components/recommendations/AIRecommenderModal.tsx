import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../api/client';
import { Farm, CropVariety, DiseaseCase, FieldObservation } from '../../types';
import { Sparkles, Dna, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
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

  // Farm-to-crop matching and surveillance states
  const [mismatchConfirmed, setMismatchConfirmed] = useState(false);
  const [loadingFarmData, setLoadingFarmData] = useState(false);
  const [loadedFarmSummary, setLoadedFarmSummary] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.farmers.getFarms().then(setFarms).catch(console.error);
      api.varieties.getAll().then(setVarieties).catch(console.error);
      setGeneratedResults(null);
      setError('');
      setMismatchConfirmed(false);
      setLoadedFarmSummary(null);
    }
  }, [isOpen]);

  // Find currently selected farm and its registered crop
  const selectedFarm = farms.find(f => f.id === selectedFarmId);
  const registeredCrop = selectedFarm ? (
    selectedFarm.currentCrop ||
    varieties.find(v => v.id === selectedFarm.cropVarietyId)?.cropName ||
    (selectedFarm.farmer?.primaryCrops ? selectedFarm.farmer.primaryCrops.split(',')[0].trim() : '')
  ) : '';

  // Determine if a farm is selected and there is a genuine crop mismatch
  const isCropMismatch = Boolean(
    selectedFarm &&
    registeredCrop &&
    selectedCrop.trim() &&
    !registeredCrop.toLowerCase().includes(selectedCrop.trim().toLowerCase()) &&
    !selectedCrop.trim().toLowerCase().includes(registeredCrop.toLowerCase())
  );

  // When user selects a specific farm, load its registered crop and relevant available soil and surveillance data
  const handleFarmChange = async (farmId: string) => {
    setSelectedFarmId(farmId);
    setMismatchConfirmed(false);
    setError('');

    if (!farmId) {
      // Universal / General Synthesis
      setLoadedFarmSummary(null);
      return;
    }

    const farm = farms.find(f => f.id === farmId);
    if (!farm) return;

    setLoadingFarmData(true);

    // 1. Determine registered crop
    let crop = farm.currentCrop;
    if (!crop && farm.cropVarietyId) {
      const variety = varieties.find(v => v.id === farm.cropVarietyId);
      if (variety?.cropName) {
        crop = variety.cropName;
      }
    }
    if (!crop && farm.farmer?.primaryCrops) {
      crop = farm.farmer.primaryCrops.split(',')[0].trim();
    }

    if (crop) {
      setSelectedCrop(crop);
    }

    // 2. Load soil profile
    if (farm.soilType) {
      const soilText = farm.soilType + (farm.irrigationType ? ` (${farm.irrigationType})` : '');
      setSoilCondition(soilText);
    }

    // 3. Load available surveillance and observation data
    try {
      const [diseaseCases, observations] = await Promise.all([
        api.diseases.getAll({ farmId: farm.id }).catch(() => [] as DiseaseCase[]),
        api.observations.getAll({ farmId: farm.id }).catch(() => [] as FieldObservation[]),
      ]);

      const summaryParts: string[] = [];
      if (crop) summaryParts.push(`Registered Crop: ${crop}`);
      if (farm.soilType) summaryParts.push(`Soil: ${farm.soilType}`);

      // If active disease cases exist for this farm, load their verified symptoms
      if (diseaseCases && diseaseCases.length > 0) {
        const activeCase = diseaseCases.find(d => d.status === 'ACTIVE' || d.severity === 'CRITICAL' || d.severity === 'HIGH') || diseaseCases[0];
        if (activeCase) {
          const symptomText = activeCase.symptoms ? `${activeCase.diseaseName} (${activeCase.symptoms})` : activeCase.diseaseName;
          setDiseaseSymptom(symptomText);
          summaryParts.push(`Surveillance: ${activeCase.diseaseName}`);
        }
      } else {
        setDiseaseSymptom('Preventative health maintenance and routine bio-protection');
      }

      // If field observation exists, sync growth stage
      if (observations && observations.length > 0) {
        const latestObs = observations[0];
        if (latestObs.growthStage) {
          setGrowthStage(latestObs.growthStage);
          summaryParts.push(`Observed Stage: ${latestObs.growthStage}`);
        }
      }

      setLoadedFarmSummary(summaryParts.join(' • '));
    } catch (err) {
      console.warn('Could not load extra surveillance details for farm:', err);
    } finally {
      setLoadingFarmData(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against unconfirmed farm-to-crop mismatch
    if (isCropMismatch && !mismatchConfirmed) {
      setError(`Crop mismatch detected: "${selectedFarm?.farmName}" is registered for "${registeredCrop}", but "${selectedCrop}" is entered. Please either reset to "${registeredCrop}" or confirm your selection below before generating recommendations.`);
      return;
    }

    setGenerating(true);
    setError('');

    try {
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
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
                <div style={{ position: 'relative' }}>
                  <select
                    className="select-field"
                    value={selectedFarmId}
                    onChange={(e) => handleFarmChange(e.target.value)}
                    disabled={loadingFarmData}
                  >
                    <option value="">Universal / General Synthesis</option>
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.farmName} ({f.farmer?.fullName || 'Farmer'})
                      </option>
                    ))}
                  </select>
                  {loadingFarmData && (
                    <div style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)' }}>
                      <RefreshCw size={14} className="spin" color="#06b6d4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Crop Specimen *
                  {registeredCrop && selectedFarm && (
                    <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'none', marginLeft: '6px', fontWeight: 500 }}>
                      (Registered: {registeredCrop})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={selectedCrop}
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    setMismatchConfirmed(false);
                    setError('');
                  }}
                  placeholder="e.g. Wheat, Rice, Chilli, Cotton"
                  required
                />
              </div>
            </div>

            {/* Loaded Farm Records Summary */}
            {selectedFarm && loadedFarmSummary && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: '16px',
                fontSize: '0.78rem',
                color: '#67e8f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Dna size={14} style={{ flexShrink: 0, color: '#22d3ee' }} />
                <span><strong>Loaded Farm Records:</strong> {loadedFarmSummary}</span>
              </div>
            )}

            {/* Crop & Farm Mismatch Warning & Confirmation Box */}
            {isCropMismatch && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
                color: '#fbbf24',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Crop Mismatch Warning:</strong> The selected farm <strong>"{selectedFarm?.farmName}"</strong> is registered for <strong>{registeredCrop}</strong>, but you have specified <strong>"{selectedCrop}"</strong>.
                    <div style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '4px' }}>
                      Biotechnology recommendations are crop-specific. Please confirm if you intend to generate recommendations for an alternate or rotational crop, or reset to the farm's registered crop.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCrop(registeredCrop);
                      setMismatchConfirmed(false);
                      setError('');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fff' }}
                  >
                    ✓ Reset to Registered Crop ({registeredCrop})
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fef3c7', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={mismatchConfirmed}
                      onChange={(e) => {
                        setMismatchConfirmed(e.target.checked);
                        if (e.target.checked) setError('');
                      }}
                      style={{ accentColor: '#f59e0b', width: '15px', height: '15px' }}
                    />
                    Confirm: Proceed with "{selectedCrop}" for this farm
                  </label>
                </div>
              </div>
            )}

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

export default AIRecommenderModal;
