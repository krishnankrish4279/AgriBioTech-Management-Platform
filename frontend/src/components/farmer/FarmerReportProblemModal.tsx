import React, { useState, useEffect } from 'react';
import { Farm, Farmer, CropVariety, FarmerProblemReportResponse } from '../../types';
import { api } from '../../api/client';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  MapPin,
  Sprout,
  ShieldCheck,
  UserCheck,
  Calendar,
  Layers,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';

interface FarmerReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farms: Farm[];
  farmer?: Farmer | null;
}

// Problem Type Options as defined in requirements with farmer-friendly bilingual explanations
const PROBLEM_TYPES = [
  { id: 'Yellow leaves', label: 'Yellow leaves (மஞ்சள் இலைகள்)', icon: '🍂', desc: 'Leaves turning pale or yellow / இலைகள் வெளுத்து மஞ்சள் நிறமாதல்' },
  { id: 'Leaf spots', label: 'Leaf spots (இலைப்புள்ளி நோய்)', icon: '🟤', desc: 'Brown, dark, or rusty spots on foliage / இலைகளில் பழுப்பு அல்லது கருப்பு புள்ளிகள்' },
  { id: 'Insects/Pests', label: 'Insects/Pests (பூச்சி தாக்குதல்)', icon: '🐛', desc: 'Insects chewing leaves or burrowing stems / புழு, வண்டு மற்றும் சாறு உறிஞ்சும் பூச்சிகள்' },
  { id: 'Drying leaves', label: 'Drying leaves (இலை காய்ந்து போதல்)', icon: '🥀', desc: 'Wilting, curling, or burnt edges / நுனி இலைகள் கருகி வதங்கி போதல்' },
  { id: 'Poor growth', label: 'Poor growth (வளர்ச்சி குறைவு)', icon: '🌱', desc: 'Stunted plant height or poor flowering / செடி வளர்ச்சி குன்றி பூக்காமல் இருத்தல்' },
  { id: 'Other', label: 'Other (மற்றவை)', icon: '❓', desc: 'Different symptom not listed above / வேறு ஏதேனும் புதிய பயிர் பாதிப்பு' },
  { id: "I don't know", label: "I don't know (தெரியவில்லை)", icon: '🤷', desc: 'Unsure, need expert to inspect / அதிகாரி நேரில் வந்து ஆய்வு செய்ய வேண்டும்' },
];

// Affected Area Options with bilingual hints
const AFFECTED_AREAS = [
  { id: 'Small area', label: 'Small area (சிறிய பகுதி)', badgeColor: '#10b981', hint: 'Just a few plants or one patch / ஓரிரு செடிகள் மட்டும்' },
  { id: 'Some plants', label: 'Some plants (சில இடங்களில்)', badgeColor: '#f59e0b', hint: 'Scattered across different rows / தோட்டத்தின் சில பகுதிகளில்' },
  { id: 'Most of field', label: 'Most of field (பெரும்பாலான தோட்டம்)', badgeColor: '#ef4444', hint: 'Widespread across most of the crop / வயல் முழுவதும் பரவியுள்ளது' },
  { id: 'Not sure', label: 'Not sure (தெரியவில்லை)', badgeColor: '#6b7280', hint: 'Hard to tell, need field visit / சரியாக கணிக்க முடியவில்லை' },
];

const COMMON_CROPS = [
  { id: 'Cotton', label: 'Cotton (பருத்தி)' },
  { id: 'Rice (Paddy)', label: 'Rice / Paddy (நெல்)' },
  { id: 'Chilli', label: 'Chilli (மிளகாய்)' },
  { id: 'Maize', label: 'Maize (மக்காச்சோளம்)' },
  { id: 'Wheat', label: 'Wheat (கோதுமை)' },
  { id: 'Soybean', label: 'Soybean (சோயாபீன்)' },
  { id: 'Sugarcane', label: 'Sugarcane (கரும்பு)' },
  { id: 'Vegetables', label: 'Vegetables (காய்கறிகள்)' },
  { id: 'Other', label: 'Other (மற்ற பயிர்கள்)' }
];

export const FarmerReportProblemModal: React.FC<FarmerReportProblemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  farms,
  farmer,
}) => {
  // Form State
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [problemType, setProblemType] = useState('');
  const [customProblem, setCustomProblem] = useState('');
  const [description, setDescription] = useState('');
  const [affectedArea, setAffectedArea] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<FarmerProblemReportResponse | null>(null);

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmittedReceipt(null);
      setError(null);
      setImageFile(null);
      setImagePreview(null);
      setDescription('');
      setCustomProblem('');
      setCustomCrop('');

      if (farms.length > 0) {
        const defaultFarm = farms[0];
        setSelectedFarmId(defaultFarm.id);
        const crop = defaultFarm.currentCrop || 'Cotton';
        setSelectedCrop(crop);
      } else {
        setSelectedFarmId('');
        setSelectedCrop('Cotton');
      }

      setProblemType('Yellow leaves');
      setAffectedArea('Some plants');
    }
  }, [isOpen, farms]);

  if (!isOpen) return null;

  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  const handleFarmSelect = (farmId: string) => {
    setSelectedFarmId(farmId);
    const farm = farms.find((f) => f.id === farmId);
    if (farm && farm.currentCrop) {
      setSelectedCrop(farm.currentCrop);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setError('Please select your farm or field.');
      return;
    }

    const finalProblem = problemType === 'Other' && customProblem.trim()
      ? customProblem.trim()
      : problemType;

    if (!finalProblem) {
      setError('Please select the problem type.');
      return;
    }

    const finalCrop = selectedCrop === 'Other' && customCrop.trim()
      ? customCrop.trim()
      : selectedCrop || currentFarm?.currentCrop || 'Field Crop';

    setSubmitting(true);
    setError(null);

    try {
      let uploadedUrl: string | undefined = undefined;
      if (imageFile) {
        try {
          const uploadRes = await api.upload(imageFile);
          uploadedUrl = uploadRes.url;
        } catch (uploadErr) {
          console.warn('Image upload error, proceeding with report:', uploadErr);
        }
      }

      const receipt = await api.diseases.reportFarmerProblem({
        farmId: selectedFarmId,
        crop: finalCrop,
        problemType: finalProblem,
        description: description.trim(),
        affectedArea: affectedArea || 'Not sure',
        imageUrl: uploadedUrl,
      });

      setSubmittedReceipt(receipt);
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting crop problem report:', err);
      setError(err.message || 'Failed to submit your report. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="card-glass"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg, 16px)',
          background: '#0d1829',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Sprout size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Report Crop Problem / பயிர் பிரச்சனையை தெரிவிக்க
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Simple 1-minute report for your field agronomist & advisor • வேளாண் அதிகாரிக்கு 1 நிமிடத்தில் தகவல்
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {submittedReceipt ? (
            /* ======================================================= */
            /* SUCCESS CONFIRMATION RECEIPT SCREEN                     */
            /* ======================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  marginTop: '10px',
                }}
              >
                <CheckCircle2 size={42} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                  Report submitted successfully.
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
                  Your report has been forwarded to the field agronomy and biotechnology expert team for diagnosis.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Report ID
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                      #{submittedReceipt.reportId?.slice(-8) || submittedReceipt.id.slice(-8)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Submitted Date
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
                      📅 {new Date(submittedReceipt.submittedDate || submittedReceipt.dateObserved).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Current Status
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.18)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Clock size={12} /> Reported (Pending Review)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Assigned Advisor
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <UserCheck size={14} />
                      {submittedReceipt.assignedAdvisor?.name || 'Priya Sharma (Field Agronomist)'}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Farm & Issue Reported
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#fff', marginTop: '4px' }}>
                    🌾 <strong>{submittedReceipt.crop}</strong> at <strong>{submittedReceipt.farmName}</strong> • Problem: <strong>{submittedReceipt.problemType}</strong> ({submittedReceipt.affectedArea})
                  </div>
                  {submittedReceipt.locationAddress && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      📍 {submittedReceipt.locationAddress}
                    </div>
                  )}
                </div>

                {/* Recommendation box */}
                <div
                  style={{
                    background: submittedReceipt.recommendation || submittedReceipt.recommendedTreatment
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(56, 189, 248, 0.07)',
                    border: submittedReceipt.recommendation || submittedReceipt.recommendedTreatment
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px dashed rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: submittedReceipt.recommendation || submittedReceipt.recommendedTreatment ? '#34d399' : '#38bdf8',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} />
                    {submittedReceipt.recommendation || submittedReceipt.recommendedTreatment
                      ? 'Expert Recommendation Available'
                      : 'Diagnosis & Treatment Recommendation Status'}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#e2e8f0', margin: 0, lineHeight: 1.45 }}>
                    {submittedReceipt.recommendation ||
                      submittedReceipt.recommendedTreatment ||
                      '⏳ Your field agronomist has received this report. Once reviewed, your customized biological diagnosis & treatment protocol will appear here and in your notifications.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="btn btn-primary"
                  style={{ padding: '10px 32px', fontSize: '0.95rem', fontWeight: 700 }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================= */
            /* FARMER-FRIENDLY CROP PROBLEM FORM                       */
            /* ======================================================= */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. SELECT MY FARM / FIELD */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  1. Select My Farm / Field • உங்கள் விவசாய நிலத்தை தேர்வு செய்யவும் <span style={{ color: '#ef4444' }}>*</span>
                </label>

                {farms.length === 0 ? (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No registered farms found. Please contact your field agronomist.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                      {farms.map((f) => {
                        const isSelected = f.id === selectedFarmId;
                        return (
                          <div
                            key={f.id}
                            onClick={() => handleFarmSelect(f.id)}
                            style={{
                              background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              border: isSelected ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              padding: '12px 14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                                {f.farmName}
                              </span>
                              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>
                                {f.totalAreaAcres} Ac
                              </span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              📍 {f.locationAddress}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Auto-detected GPS Indicator (No manual GPS coords required) */}
                    {currentFarm && (
                      <div
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.78rem',
                          color: '#6ee7b7',
                        }}
                      >
                        <MapPin size={15} color="#10b981" />
                        <span>
                          <strong>Location Auto-tagged (தானியங்கி இருப்பிடம்):</strong> {currentFarm.locationAddress}
                          {currentFarm.latitude && currentFarm.longitude && (
                            <span style={{ opacity: 0.8, marginLeft: '6px' }}>
                              (GPS: {currentFarm.latitude.toFixed(4)}, {currentFarm.longitude.toFixed(4)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. SELECT CROP */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  2. Select Crop • பயிரை தேர்வு செய்யவும் <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COMMON_CROPS.map((crop) => {
                    const isSelected = selectedCrop === crop.id;
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => setSelectedCrop(crop.id)}
                        style={{
                          background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#fff' : '#e2e8f0',
                          border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '0.84rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {crop.label}
                      </button>
                    );
                  })}
                </div>
                {selectedCrop === 'Other' && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter crop name... (பயிரின் பெயரை உள்ளிடவும்)"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    style={{ marginTop: '10px' }}
                    required
                  />
                )}
              </div>

              {/* 3. SELECT PROBLEM TYPE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  3. What problem do you see? • என்ன பிரச்சனை தெரிகிறது? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                  {PROBLEM_TYPES.map((item) => {
                    const isSelected = problemType === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setProblemType(item.id)}
                        style={{
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#fff' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.25 }}>
                          {item.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {problemType === 'Other' && (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="What problem are you noticing? (e.g. Stem rotting, white powder on leaves)"
                    value={customProblem}
                    onChange={(e) => setCustomProblem(e.target.value)}
                    style={{ marginTop: '10px' }}
                    required
                  />
                )}
              </div>

              {/* 4. UPLOAD OR CAPTURE CROP PHOTO */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  4. Upload or Capture Crop Photo • பயிர் புகைப்படம் <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400 }}>(Optional / விருப்பப்பட்டால்)</span>
                </label>

                {imagePreview ? (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      background: '#000',
                      maxHeight: '220px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Crop Issue Preview"
                      style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(239, 68, 68, 0.85)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <X size={14} /> Remove Photo / நீக்குக
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.18)',
                      borderRadius: '12px',
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <Camera size={24} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>
                      Take photo or choose from gallery • கேமரா மூலம் படம் எடுக்கவும்
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      PNG, JPG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* 5. DESCRIBE THE PROBLEM IN SIMPLE LANGUAGE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  5. Describe in your own words • உங்கள் சொந்த வார்த்தைகளில் விவரம்
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="e.g. மழை பெய்த பிறகு இலைகள் மஞ்சள் நிறமாக மாறுகின்றன, அடி இலைகள் காய்ந்து விழுகின்றன..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  கடினமான ஆங்கில வார்த்தைகள் தேவையில்லை. நீங்கள் பார்ப்பதை எளிய தமிழில் அல்லது ஆங்கிலத்தில் எழுதலாம்.
                </span>
              </div>

              {/* 6. SELECT AFFECTED AREA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  6. How much of the field is affected? • பாதிப்பின் அளவு <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {AFFECTED_AREAS.map((area) => {
                    const isSelected = affectedArea === area.id;
                    return (
                      <div
                        key={area.id}
                        onClick={() => setAffectedArea(area.id)}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? `2px solid ${area.badgeColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '12px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? area.badgeColor : '#fff' }}>
                          {area.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.25 }}>
                          {area.hint}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. SUBMIT REPORT BUTTON */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '18px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancel / ரத்து செய்க
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Submitting Report...
                    </>
                  ) : (
                    <>
                      <Sprout size={18} /> Submit Problem Report / பிரச்சனையை அனுப்பவும்
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
