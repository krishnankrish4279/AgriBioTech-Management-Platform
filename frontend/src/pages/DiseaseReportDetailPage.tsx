import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { DiseaseCase, DiseaseCaseFollowUp } from '../types';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { TermHelper } from '../components/common/TermHelper';
import { useAuth } from '../context/AuthContext';
import { DiseaseDetailModal } from '../components/disease/DiseaseDetailModal';
import { FarmerFollowUpModal } from '../components/disease/FarmerFollowUpModal';
import { AgronomistReviewModal } from '../components/disease/AgronomistReviewModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Calendar,
  Sprout,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Copy,
  Check,
  Navigation,
  FlaskConical,
  Printer,
  Compass,
  FileCheck,
  Building,
  Info,
  Dna,
  Clock,
  History,
  Stethoscope,
  Send,
  MessageSquare,
} from 'lucide-react';
import { formatInsectProtection, DISEASE_RESISTANCE_STANDARD_EXPLANATION } from '../utils/traitHelper';

export const DiseaseReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isAgronomist, isBiotechExpert, isFarmer } = useAuth();
  const canEdit = isAdmin || isAgronomist || isBiotechExpert;
  const canReview = isAdmin || isAgronomist || isBiotechExpert;

  const [diseaseCase, setDiseaseCase] = useState<DiseaseCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [selectedFollowUpForReview, setSelectedFollowUpForReview] = useState<DiseaseCaseFollowUp | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await api.diseases.getCaseById(id);
      if (!data || !data.id) {
        setNotFound(true);
      } else {
        setDiseaseCase(data);
      }
    } catch (err: any) {
      console.error('Error fetching disease surveillance report:', err);
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('not found'))) {
        setNotFound(true);
      } else {
        setError(err.message || 'Unable to retrieve surveillance report from the database.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleCopyId = () => {
    if (diseaseCase?.id) {
      navigator.clipboard.writeText(diseaseCase.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!diseaseCase) return;
    setUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      const updated = await api.diseases.updateCase(diseaseCase.id, {
        status: newStatus as any,
        resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : undefined,
      });
      setDiseaseCase({
        ...diseaseCase,
        status: (updated.status || newStatus) as any,
        resolvedAt: updated.resolvedAt || (newStatus === 'RESOLVED' ? new Date().toISOString() : undefined),
      });
      setStatusFeedback(`Status successfully updated to ${newStatus}.`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update disease case status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#10b981',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Loading Surveillance Report</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Retrieving epidemiological case records from database...</p>
      </div>
    );
  }

  if (notFound || !diseaseCase) {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/diseases')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Disease Map
          </button>
        </div>

        <div
          className="card-glass"
          style={{
            maxWidth: '620px',
            margin: '40px auto',
            textAlign: 'center',
            padding: '48px 32px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Surveillance Report Not Found
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
            The disease surveillance report ID <strong style={{ color: '#fff' }}>"{id}"</strong> could not be located in the database. It may have been archived, resolved, or removed.
          </p>
          <button
            onClick={() => navigate('/diseases')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
          >
            <ArrowLeft size={16} /> Return to Disease Outbreak Radar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/diseases')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Disease Map
          </button>
        </div>

        <div className="card-glass" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={42} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Failed to Load Disease Report
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchReport} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
            <RefreshCw size={15} /> Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  // Safe field extractions
  const cropName = diseaseCase.crop || diseaseCase.cropVariety?.cropName || diseaseCase.farm?.currentCrop;
  const varietyName = diseaseCase.cropVariety?.varietyName;
  const biotechTraits = diseaseCase.cropVariety?.biotechTraits;
  const diseaseResistanceTraits = diseaseCase.cropVariety?.diseaseResistanceTraits;
  const protectionInfo = formatInsectProtection(biotechTraits);
  const farmName = diseaseCase.farm?.farmName || (typeof diseaseCase.farm === 'string' ? diseaseCase.farm : 'Farm Plot');
  const farmerName = diseaseCase.farm?.farmer?.fullName;
  const farmerPhone = diseaseCase.farm?.farmer?.phone;
  const farmerLanguage = diseaseCase.farm?.farmer?.preferredLanguage;
  const locationAddress = diseaseCase.locationAddress || diseaseCase.farm?.locationAddress;
  const lat = typeof diseaseCase.latitude === 'number' && !isNaN(diseaseCase.latitude)
    ? diseaseCase.latitude
    : (diseaseCase.lat !== undefined ? Number(diseaseCase.lat) : null);
  const lng = typeof diseaseCase.longitude === 'number' && !isNaN(diseaseCase.longitude)
    ? diseaseCase.longitude
    : (diseaseCase.lng !== undefined ? Number(diseaseCase.lng) : null);
  const hasCoordinates = lat !== null && lng !== null && !(lat === 0 && lng === 0) && !isNaN(lat) && !isNaN(lng);

  const reporterName = diseaseCase.reportedBy?.name || 'Surveillance Unit';
  const reporterRole = diseaseCase.reportedBy?.role || 'Field Agronomist';
  const advisorName = diseaseCase.assignedAdvisor?.name;
  const advisorEmail = diseaseCase.assignedAdvisor?.email;
  const dateFormatted = diseaseCase.dateObserved ? new Date(diseaseCase.dateObserved).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Observation Date Not Recorded';

  // Custom pinpoint icon for mini-map
  const markerColor =
    diseaseCase.severity === 'CRITICAL'
      ? '#ef4444'
      : diseaseCase.severity === 'HIGH'
      ? '#f97316'
      : diseaseCase.severity === 'MEDIUM'
      ? '#eab308'
      : '#10b981';

  const pinpointIcon = L.divIcon({
    className: 'custom-leaflet-marker-pinpoint',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${markerColor};
        border: 3px solid #ffffff;
        box-shadow: 0 0 14px ${markerColor};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

  return (
    <div className="page-wrapper">
      {/* Top Navigation & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          onClick={() => navigate('/diseases')}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
          title="Return to GIS Disease Surveillance Radar"
        >
          <ArrowLeft size={16} /> Back to Disease Map
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Print or Export Case Summary"
          >
            <Printer size={14} /> Print Report
          </button>

          {/* Farmer Follow-Up Action */}
          <button
            onClick={() => setShowFollowUpModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
            }}
            title="Submit field follow-up observation on treatment response"
          >
            <Sprout size={15} /> Submit Follow-Up
          </button>

          {/* Agronomist Review Action */}
          {canReview && (
            <button
              onClick={() => {
                setSelectedFollowUpForReview(null);
                setShowReviewModal(true);
              }}
              className="btn btn-biotech btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
              title="Record official agronomic assessment and evidence-based status change"
            >
              <Stethoscope size={15} /> Agronomist Review
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Edit2 size={14} /> Edit Case
            </button>
          )}
        </div>
      </div>

      {statusFeedback && (
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} /> {statusFeedback}
        </div>
      )}

      {/* Main Report Card Header */}
      <div
        className="card-glass"
        style={{
          padding: '24px 28px',
          marginBottom: '24px',
          borderLeft: `5px solid ${markerColor}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <SeverityBadge severity={diseaseCase.severity} />
              <StatusBadge status={diseaseCase.status} />
              {diseaseCase.pendingFollowUpReview && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <Clock size={12} /> Pending Agronomist Review
                </span>
              )}
              {diseaseCase.resolvedAt && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> Resolved on {new Date(diseaseCase.resolvedAt).toLocaleDateString()}
                </span>
              )}
              {diseaseCase.isDemo ? (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'rgba(148, 163, 184, 0.15)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Demo Record
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Verified Field Report
                </span>
              )}
              {diseaseCase.problemType && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Type: {diseaseCase.problemType}
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              {diseaseCase.diseaseName}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--brand-emerald)" /> {dateFormatted}
              </span>
              <span
                onClick={handleCopyId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                }}
                title="Click to copy full Case ID"
              >
                Case #{diseaseCase.id.slice(-8).toUpperCase()}
                {copiedId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </span>
            </div>
          </div>

          {/* Quick Status Action Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {diseaseCase.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateStatus('CONTAINED')}
                disabled={updatingStatus}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Mark as Contained
              </button>
            )}
            {diseaseCase.status !== 'RESOLVED' && (
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={updatingStatus}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={14} /> Resolve Case
              </button>
            )}
            {diseaseCase.status === 'RESOLVED' && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#10b981',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={16} /> Resolved & Cleared
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Details Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Farm, Owner & Geographic Location */}
        <div className="card-glass" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Farm & Location</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Georeferenced field plot monitoring</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                Farm Location
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#10b981" /> {farmName}
              </div>
            </div>

            {farmerName && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                  Farm Owner / Farmer
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} color="var(--brand-emerald)" /> {farmerName}
                  {farmerLanguage && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({farmerLanguage})</span>
                  )}
                </div>
                {farmerPhone && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Contact: {farmerPhone}
                  </div>
                )}
              </div>
            )}

            {locationAddress && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                  Geographic Address
                </div>
                <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  📍 {locationAddress}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                GPS Coordinates
              </div>
              {hasCoordinates ? (
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    width: 'fit-content',
                  }}
                >
                  <Navigation size={13} /> {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                </div>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14} /> Coordinates unmapped in database
                </span>
              )}
            </div>

            {/* Embedded Mini Map */}
            {hasCoordinates && (
              <div
                style={{
                  marginTop: '6px',
                  height: '190px',
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <MapContainer
                  center={[lat, lng]}
                  zoom={12}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%', background: '#0a0f1d' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]} icon={pinpointIcon}>
                    <Popup>
                      <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
                        {diseaseCase.diseaseName}
                        <br />
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{farmName}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Host Crop & Variety Genetics */}
        <div className="card-glass" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprout size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Crop & Variety Details</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Host plant profile, insect protection, and disease resistance</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                Crop Name
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sprout size={18} color="#34d399" /> {cropName || 'Unspecified Crop'}
              </div>
            </div>

            {varietyName && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                  Crop Variety
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#38bdf8' }}>
                  {varietyName}
                </div>
              </div>
            )}

            {diseaseResistanceTraits && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  🛡️ Disease Resistance Information
                </div>
                <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                  {diseaseResistanceTraits}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '4px' }}>
                  {DISEASE_RESISTANCE_STANDARD_EXPLANATION}
                </div>
              </div>
            )}

            {biotechTraits && (
              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Dna size={14} /> Insect Protection Features
                </div>
                {protectionInfo.insectProtectionExplanation && (
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                    {protectionInfo.insectProtectionExplanation}
                  </p>
                )}
                {protectionInfo.technicalDetails && (
                  <div style={{ fontSize: '0.74rem', color: '#c084fc', fontFamily: 'var(--font-mono, monospace)' }}>
                    {protectionInfo.technicalDetails}
                  </div>
                )}
                {protectionInfo.otherTraits && (
                  <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px' }}>
                    Additional traits: {protectionInfo.otherTraits}
                  </div>
                )}
              </div>
            )}

            {diseaseCase.affectedArea && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>
                  Field Inspection Details
                </div>
                <div style={{ fontSize: '0.88rem', color: '#f59e0b', fontWeight: 600 }}>
                  📐 Estimated Affected Area: {diseaseCase.affectedArea}
                </div>
              </div>
            )}

            {/* Reporter & Advisor Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginTop: '4px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                Field Inspection Personnel
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Reported By: <strong style={{ color: '#fff' }}>{reporterName}</strong> ({reporterRole})
              </div>
              {advisorName && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Assigned Advisor: <strong style={{ color: '#10b981' }}>{advisorName}</strong> {advisorEmail ? `(${advisorEmail})` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Symptoms & Prescribed Treatment Protocol */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Symptoms */}
        <div className="card-glass" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Field Symptoms & Observations</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Field diagnostic observations and indicators</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '0.9rem',
              color: '#e2e8f0',
              lineHeight: 1.6,
            }}
          >
            {diseaseCase.symptoms || 'No specific symptom description recorded for this case.'}
          </div>

          {diseaseCase.imageUrl && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                Field Photo Evidence
              </div>
              <img
                src={diseaseCase.imageUrl}
                alt={diseaseCase.diseaseName}
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              />
            </div>
          )}
        </div>

        {/* Prescribed Treatment */}
        <div className="card-glass" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Prescribed Treatment & Recommended Care</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Recommended remediation protocols</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '0.9rem',
              color: '#d1fae5',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}
          >
            {diseaseCase.recommendedTreatment || 'Standard biosecurity quarantine protocol and bio-fungicide barrier application.'}
          </div>

          {/* Linked Biotech Recommendations if available */}
          {diseaseCase.recommendations && diseaseCase.recommendations.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
                Linked Advisory Recommendations ({diseaseCase.recommendations.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diseaseCase.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {rec.title}
                    </div>
                    {rec.productName && (
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '2px' }}>
                        Product: <strong>{rec.productName}</strong> {rec.dosage ? `(Dosage: ${rec.dosage})` : ''}
                      </div>
                    )}
                    {rec.applicationInstructions && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Instructions: {rec.applicationInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODULE 1: Follow-Up Reports & Case Progression History */}
      <div className="card-glass" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Farmer Follow-Up Submissions & Agronomist Reviews ({diseaseCase.followUps?.length || 0})
              </h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                Field treatment observations, symptom progressions, and certified expert review evaluations
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowFollowUpModal(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
            }}
          >
            <Sprout size={14} /> Submit New Follow-Up
          </button>
        </div>

        {diseaseCase.followUps && diseaseCase.followUps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {diseaseCase.followUps.map((fu, idx) => {
              const conditionColor =
                fu.currentCondition === 'Improved'
                  ? '#34d399'
                  : fu.currentCondition === 'Worsened'
                  ? '#f87171'
                  : '#fbbf24';
              const conditionBg =
                fu.currentCondition === 'Improved'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : fu.currentCondition === 'Worsened'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)';

              return (
                <div
                  key={fu.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md, 10px)',
                    padding: '18px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: conditionBg,
                          color: conditionColor,
                          border: `1px solid ${conditionColor}40`,
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {fu.currentCondition === 'Improved' ? '🌿' : fu.currentCondition === 'Worsened' ? '⚠️' : '⚖️'} Condition: {fu.currentCondition}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Treatment Date: <strong style={{ color: '#fff' }}>{new Date(fu.treatmentDate).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {fu.status === 'REVIEWED' ? (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Reviewed by Agronomist
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          ⏳ Pending Review
                        </span>
                      )}

                      {canReview && fu.status !== 'REVIEWED' && (
                        <button
                          onClick={() => {
                            setSelectedFollowUpForReview(fu);
                            setShowReviewModal(true);
                          }}
                          className="btn btn-biotech btn-sm"
                          style={{ padding: '3px 9px', fontSize: '0.74rem', fontWeight: 700 }}
                        >
                          Review Now
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.84rem', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Intervention Applied
                      </div>
                      <div style={{ color: '#38bdf8', fontWeight: 600 }}>
                        {fu.treatmentApplied}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Reported Symptoms
                      </div>
                      <div style={{ color: '#e2e8f0' }}>
                        {fu.currentSymptoms}
                      </div>
                    </div>

                    {fu.pestActivity && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Pest / Vector Activity
                        </div>
                        <div style={{ color: '#f59e0b' }}>
                          {fu.pestActivity}
                        </div>
                      </div>
                    )}

                    {fu.additionalObservations && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                          Additional Observations
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {fu.additionalObservations}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo attachment if available */}
                  {fu.photoUrl && (
                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <img
                        src={fu.photoUrl}
                        alt="Follow-up field photo"
                        style={{ maxHeight: '140px', borderRadius: '6px', border: '1px solid var(--border-subtle)', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Agronomist Review Feedback */}
                  {fu.reviewNotes && (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Stethoscope size={13} /> Agronomist Evaluation ({fu.reviewerName || 'Field Agronomist'})
                        </div>
                        {fu.reviewedAt && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {new Date(fu.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.45 }}>
                        {fu.reviewNotes}
                      </div>
                      {fu.caseStatusAfterReview && (
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                          Decision: Official status updated to <strong style={{ color: '#fff' }}>{fu.caseStatusAfterReview}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.86rem',
            }}
          >
            No follow-up reports submitted yet. If you have applied treatment, please submit a follow-up report to inform the agronomist.
          </div>
        )}
      </div>

      {/* Case Audit Trail Section */}
      {diseaseCase.auditTrail && diseaseCase.auditTrail.length > 0 && (
        <div className="card-glass" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Surveillance Audit Trail & Decision History
              </h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                Immutable historical record of all case actions, reviews, and status changes
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diseaseCase.auditTrail.map((entry, idx) => (
              <div
                key={entry.id || idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#fff', marginRight: '8px' }}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    by <strong style={{ color: '#38bdf8' }}>{entry.performedByName || 'Staff'}</strong> ({entry.performedByRole || 'User'})
                  </span>
                  {entry.notes && (
                    <div style={{ color: '#cbd5e1', fontSize: '0.78rem', marginTop: '2px' }}>
                      {entry.notes}
                    </div>
                  )}
                  {entry.details && (
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '2px' }}>
                      {entry.details}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <DiseaseDetailModal
        diseaseCase={diseaseCase}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdated={fetchReport}
      />

      {/* Farmer Follow-Up Submission Modal */}
      <FarmerFollowUpModal
        diseaseCase={diseaseCase}
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        onSubmitted={() => {
          fetchReport();
          setStatusFeedback('Follow-up report submitted successfully and queued for agronomist review.');
          setTimeout(() => setStatusFeedback(null), 4000);
        }}
      />

      {/* Agronomist Review & Evidence Decision Modal */}
      <AgronomistReviewModal
        diseaseCase={diseaseCase}
        selectedFollowUp={selectedFollowUpForReview}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReviewed={() => {
          fetchReport();
          setStatusFeedback('Official case status and review assessment recorded successfully.');
          setTimeout(() => setStatusFeedback(null), 4000);
        }}
      />
    </div>
  );
};

export default DiseaseReportDetailPage;
