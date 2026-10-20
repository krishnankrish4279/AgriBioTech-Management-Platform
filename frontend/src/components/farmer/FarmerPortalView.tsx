import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Farmer, Farm, FarmerAdvisory, BiotechRecommendation, DiseaseCase } from '../../types';
import { FarmerReportProblemModal } from './FarmerReportProblemModal';
import { PriorityBadge } from '../common/Badge';
import {
  Tractor,
  Layers,
  Sprout,
  ShieldCheck,
  Dna,
  MessageSquareShare,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  UserCheck,
  HelpCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FarmerPortalView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [advisories, setAdvisories] = useState<FarmerAdvisory[]>([]);
  const [recommendations, setRecommendations] = useState<BiotechRecommendation[]>([]);
  const [problemReports, setProblemReports] = useState<DiseaseCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Farmer Report Modal
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<DiseaseCase | null>(null);

  const loadFarmerData = async () => {
    setLoading(true);
    try {
      // Find farmer profile by email or user ID
      const allFarmers = await api.farmers.getAll();
      const currentFarmer = allFarmers.find(
        (f) => (user?.id && f.userId === user.id) || (user?.email && f.email?.toLowerCase() === user.email.toLowerCase())
      ) || allFarmers[0]; // Fallback to first demo farmer if profile link is pending

      setFarmer(currentFarmer || null);

      if (currentFarmer) {
        // Fetch farms for this farmer
        const allFarms = await api.farmers.getFarms();
        const farmerFarms = allFarms.filter((farm) => farm.farmerId === currentFarmer.id);
        setFarms(farmerFarms);

        // Fetch advisories
        const advData = await api.advisories.getAll({ farmerId: currentFarmer.id });
        setAdvisories(advData);

        // Fetch crop problem reports for this farmer
        const reports = await api.diseases.getAll({ farmerId: currentFarmer.id });
        setProblemReports(reports);
      }

      // Fetch recommendations
      const recData = await api.recommendations.getAll();
      setRecommendations(recData.slice(0, 4));
    } catch (err) {
      console.error('Error loading farmer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmerData();
  }, [user]);

  const handleMarkAdvisoryRead = async (id: string) => {
    try {
      await api.advisories.markRead(id);
      setAdvisories((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark advisory as read', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'REPORTED') {
      return (
        <span
          style={{
            background: 'rgba(245, 158, 11, 0.18)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Clock size={12} /> Reported (Pending Review)
        </span>
      );
    }
    if (s === 'INVESTIGATING') {
      return (
        <span
          style={{
            background: 'rgba(56, 189, 248, 0.18)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          🔬 Under Investigation
        </span>
      );
    }
    if (s === 'CONTAINED' || s === 'RESOLVED') {
      return (
        <span
          style={{
            background: 'rgba(16, 185, 129, 0.18)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle2 size={12} /> {s === 'RESOLVED' ? 'Resolved / Cleared' : 'Contained'}
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(239, 68, 68, 0.18)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ⚠️ Active Case
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Loading Farmer Advisory & Cultivation Portal...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Farmer Welcome Banner */}
      <div className="card-glass" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <Tractor size={18} /> Farmer Advisory & Cultivation Portal
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
              Welcome, {farmer?.fullName || user?.name}!
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '650px', lineHeight: 1.45, marginTop: '4px' }}>
              Welcome to your simple farm care desk. You can monitor your registered plots, report crop problems to your agronomist in 1 minute, and receive expert biological solutions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowProblemModal(true)}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                padding: '11px 22px',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)',
                borderRadius: '10px',
              }}
            >
              <Sprout size={18} /> Report Crop Problem
            </button>
            <button onClick={loadFarmerData} className="btn btn-secondary" title="Refresh portal data">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Farmer Profile Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <MapPin size={15} color="#10b981" />
            <span>{farmer?.village ? `${farmer.village}, ` : ''}{farmer?.district || 'Kanchipuram'}, {farmer?.state || 'Tamil Nadu'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <Phone size={15} color="#06b6d4" />
            <span>{farmer?.phone || user?.phone || '+91-98444-00004'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <Layers size={15} color="#8b5cf6" />
            <span>Farm Acreage: <strong>{farmer?.farmSizeAcres || 12} Acres</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <Sprout size={15} color="#34d399" />
            <span>Primary Crops: <strong>{farmer?.primaryCrops || 'Cotton, Chilli'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <span>Language: <strong>{farmer?.preferredLanguage || 'Tamil'}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: MY REPORTED CROP PROBLEMS & DIAGNOSIS TRACKER    */}
      {/* ========================================================= */}
      <div className="card-glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#38bdf8" /> My Reported Crop Problems ({problemReports.length})
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Track diagnosis status, assigned advisor, and expert recommendations for issues you reported.
            </p>
          </div>

          <button
            onClick={() => setShowProblemModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Report New Issue
          </button>
        </div>

        {problemReports.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
            }}
          >
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>No Active Crop Problems Reported</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '4px auto 14px' }}>
              Your monitored fields are currently healthy! If you see yellow leaves, spots, pests, or wilting, submit a simple 1-minute report to get agronomist advice.
            </p>
            <button
              onClick={() => setShowProblemModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sprout size={15} /> Report Crop Problem Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {problemReports.map((report) => {
              const farmName = report.farm?.farmName || (typeof report.farm === 'string' ? report.farm : 'Farm Field');
              const hasRec = Boolean(report.recommendedTreatment);
              const advisorName = report.assignedAdvisor?.name || 'Priya Sharma (Field Agronomist)';

              return (
                <div
                  key={report.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md, 12px)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top row: Status and Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      {getStatusBadge(report.status)}
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {report.dateObserved ? new Date(report.dateObserved).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {/* Report ID and Problem Type */}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
                      REPORT #{report.id.slice(-8)}
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '3px 0 6px' }}>
                      {report.diseaseName}
                    </h4>

                    {/* Farm, Crop, Affected Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div>
                        📍 <strong>{farmName}</strong> • Crop: <span style={{ color: '#34d399', fontWeight: 600 }}>{report.crop || report.farm?.currentCrop || 'Field Crop'}</span>
                      </div>
                      {report.affectedArea && (
                        <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                          Affected Area: <strong>{report.affectedArea}</strong>
                        </div>
                      )}
                      <div style={{ color: '#94a3b8', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <UserCheck size={13} color="#10b981" /> Assigned Advisor: <strong style={{ color: '#e2e8f0' }}>{advisorName}</strong>
                      </div>
                    </div>

                    {/* Farmer's Symptoms / Notes */}
                    {report.symptoms && (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '0.78rem',
                          color: '#cbd5e1',
                          marginTop: '8px',
                          lineHeight: 1.4,
                        }}
                      >
                        "{report.symptoms}"
                      </div>
                    )}
                  </div>

                  {/* Recommendation Box */}
                  <div
                    style={{
                      background: hasRec
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(56, 189, 248, 0.06)',
                      border: hasRec
                        ? '1px solid rgba(16, 185, 129, 0.25)'
                        : '1px dashed rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: hasRec ? '#34d399' : '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '3px',
                      }}
                    >
                      <Sparkles size={13} />
                      {hasRec ? 'Advisor Diagnosis & Treatment Recommendation' : 'Recommendation Status'}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#e2e8f0', margin: 0, lineHeight: 1.35 }}>
                      {report.recommendedTreatment || '⏳ Your agronomist has been alerted. Recommended biological formulation will appear here once reviewed.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column: My Farm Plots & My Crop Advisories */}
      <div className="grid-2">
        {/* Left Column: My Farm Plots */}
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#06b6d4" /> My Farm Plots ({farms.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Geo-tagged plots</span>
          </div>

          {farms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No farm plots registered yet. Contact your Agronomist to register new plots.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {farms.map((plot) => (
                <div
                  key={plot.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                        {plot.farmName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        📍 {plot.locationAddress}
                      </div>
                    </div>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {plot.totalAreaAcres} Acres
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <div>🌱 Current Crop: <strong style={{ color: '#fff' }}>{plot.currentCrop || 'Cotton'}</strong></div>
                    <div>💧 Irrigation: <strong style={{ color: '#fff' }}>{plot.irrigationType}</strong></div>
                    <div>🌍 Soil Type: <strong style={{ color: '#fff' }}>{plot.soilType}</strong></div>
                    <div>📍 GPS: <strong style={{ color: '#fff' }}>{plot.latitude?.toFixed(4)}, {plot.longitude?.toFixed(4)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Direct Farmer Advisories */}
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquareShare size={18} color="#10b981" /> Expert Advisories ({advisories.length})
            </h3>
            <button
              onClick={() => navigate('/advisories')}
              className="btn btn-secondary btn-sm"
            >
              View All
            </button>
          </div>

          {advisories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No pending advisories. Your farm operations are running smoothly!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {advisories.slice(0, 3).map((adv) => (
                <div
                  key={adv.id}
                  style={{
                    background: adv.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.07)' : 'rgba(255, 255, 255, 0.02)',
                    border: adv.priority === 'URGENT' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PriorityBadge priority={adv.priority} />
                      <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>{adv.category}</span>
                    </div>
                    {!adv.isRead ? (
                      <button
                        onClick={() => handleMarkAdvisoryRead(adv.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                      >
                        Mark Read
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} color="#10b981" /> Read
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '2px 0' }}>
                    {adv.title}
                  </h4>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {adv.message}
                  </p>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Issued by: {adv.advisor?.name || 'Field Agronomist'} • {new Date(adv.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Biotechnology Solutions for Farmer's Crops */}
      <div className="card-glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dna size={18} color="#8b5cf6" /> Biotechnology Prescriptions for Your Crops
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Scientific biofertilizer inoculants, biocontrol parasitoids, and pathogen defenses.
            </p>
          </div>
          <button onClick={() => navigate('/recommendations')} className="btn btn-secondary btn-sm">
            Explore All Solutions
          </button>
        </div>

        <div className="grid-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#8b5cf6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {rec.recommendationType}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    background: rec.isAutomatedSuggestion ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: rec.isAutomatedSuggestion ? '#22d3ee' : '#a78bfa',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>
                    {rec.isAutomatedSuggestion ? '🤖 AI Assisted' : '🧬 Expert Prescribed'}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {rec.title}
                </h4>

                <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>
                  Product: {rec.productName}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                  {rec.reasoning}
                </p>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '0.76rem',
                color: '#d1fae5',
                marginTop: '6px',
              }}>
                <strong>Dosage & Method:</strong> {rec.dosage} • {rec.applicationInstructions}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Farmer Crop Problem Reporting Modal */}
      <FarmerReportProblemModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        onSuccess={loadFarmerData}
        farms={farms}
        farmer={farmer}
      />
    </div>
  );
};
