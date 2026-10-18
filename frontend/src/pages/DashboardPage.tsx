import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardKPIs, AnalyticsData, ActivityLogItem } from '../types';
import { StatCard } from '../components/common/StatCard';
import { OutbreakTicker } from '../components/dashboard/OutbreakTicker';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { ReportDiseaseModal } from '../components/disease/ReportDiseaseModal';
import { RecordObservationModal } from '../components/observations/RecordObservationModal';
import { CreateAdvisoryModal } from '../components/advisory/CreateAdvisoryModal';
import { AIRecommenderModal } from '../components/recommendations/AIRecommenderModal';
import { UserManagementSection } from '../components/admin/UserManagementSection';
import { FarmerPortalView } from '../components/farmer/FarmerPortalView';
import {
  Users,
  Layers,
  Sprout,
  ShieldAlert,
  Dna,
  ClipboardList,
  MessageSquareShare,
  Plus,
  Sparkles,
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC<{ role?: string }> = ({ role }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const effectiveRole = (role || user?.role || '').toLowerCase();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, analyticsRes, actRes] = await Promise.all([
        api.analytics.getKPIs(),
        api.analytics.getCharts(),
        api.notifications.getActivities(),
      ]);
      setKpis(kpiRes);
      setAnalytics(analyticsRes);
      setActivities(actRes);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const accessDeniedBanner = location.state?.accessDenied && (
    <div style={{
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle color="#ef4444" size={20} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem' }}>
            Access Denied: Restricted Role Resource
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
            You lack authorization for <strong style={{ color: '#fff' }}>{location.state.attempted || 'this restricted dashboard'}</strong>.
            The security event has been recorded and an administrative alert dispatched.
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate(location.pathname, { replace: true, state: {} })}
        style={{
          background: 'none',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  );

  // If user is a Farmer, show the personalized Farmer Portal
  if (effectiveRole === 'farmer') {
    return (
      <div className="page-wrapper">
        {accessDeniedBanner}
        <FarmerPortalView />
      </div>
    );
  }

  const roleTitle = effectiveRole === 'admin'
    ? 'Administrator Command Console'
    : effectiveRole === 'biotech_expert'
    ? 'Biotechnology & Genomics R&D Hub'
    : 'Agronomist Field Surveillance Center';

  return (
    <div className="page-wrapper">
      {/* Access Denied Warning Alert Banner if redirected from unauthorized route */}
      {accessDeniedBanner}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.78rem',
              color: effectiveRole === 'admin' ? '#8b5cf6' : effectiveRole === 'biotech_expert' ? '#06b6d4' : '#10b981',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Shield size={14} /> {roleTitle}
            </span>
          </div>
          <h1 className="page-title">
            AgriBioTech Management Dashboard
          </h1>
          <p className="page-subtitle">
            Welcome back, {user?.name}. Real-time crop surveillance, biotech recommendation matrix & farmer extension outreach.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(effectiveRole === 'admin' || effectiveRole === 'biotech_expert') && (
            <button
              onClick={() => setShowAIModal(true)}
              className="btn btn-biotech"
            >
              <Sparkles size={16} /> AI Biotech Synthesizer
            </button>
          )}
          <button
            onClick={() => setShowDiseaseModal(true)}
            className="btn btn-danger"
          >
            <ShieldAlert size={16} /> Report Outbreak
          </button>
          {(effectiveRole === 'admin' || effectiveRole === 'agronomist') && (
            <button
              onClick={() => setShowObservationModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Log Field Visit
            </button>
          )}
          <button
            onClick={loadDashboardData}
            className="btn btn-secondary"
            title="Refresh metrics"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Outbreak Radar Ticker */}
      {kpis && <OutbreakTicker outbreaks={kpis.activeOutbreaks} />}

      {/* 8 Full KPI Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '14px' }}>
        <StatCard
          title="Total Platform Users"
          value={kpis?.totalUsers ?? '4'}
          subtitle="Admins, Scientists, Officers & Farmers"
          icon={Shield}
          color="purple"
          onClick={() => {
            const el = document.getElementById('user-management-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Registered Farmers"
          value={kpis?.totalFarmers ?? '—'}
          subtitle="Across agro-climatic zones"
          icon={Users}
          color="emerald"
          onClick={() => navigate('/farmers')}
        />
        <StatCard
          title="Monitored Farm Plots"
          value={kpis?.totalFarms ?? '—'}
          subtitle="Active geo-tagged acreage"
          icon={Layers}
          color="cyan"
          onClick={() => navigate('/farmers')}
        />
        <StatCard
          title="Engineered Crop Varieties"
          value={kpis?.totalVarieties ?? '—'}
          subtitle="Bt, drought & bio-fortified lines"
          icon={Sprout}
          color="purple"
          onClick={() => navigate('/varieties')}
        />
      </div>

      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Surveillance Disease Cases"
          value={kpis?.totalDiseaseCases ?? '—'}
          subtitle={`${kpis?.criticalDiseaseCases ?? 0} High / Critical active`}
          icon={ShieldAlert}
          color="red"
          onClick={() => navigate('/diseases')}
        />
        <StatCard
          title="Active Disease Outbreaks"
          value={kpis?.activeOutbreaks?.length ?? (kpis?.criticalDiseaseCases ?? '—')}
          subtitle="Live outbreak containment"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/diseases')}
        />
        <StatCard
          title="Active Biotech Solutions"
          value={kpis?.totalRecommendations ?? '—'}
          subtitle="Biofertilizers & Biocontrol stacks"
          icon={Dna}
          color="cyan"
          onClick={() => navigate('/recommendations')}
        />
        <StatCard
          title="Field Observation Visits"
          value={kpis?.totalObservations ?? '—'}
          subtitle="Agronomist field logs recorded"
          icon={ClipboardList}
          color="amber"
          onClick={() => navigate('/observations')}
        />
      </div>

      {/* Admin User Management Section (Requirement 4) */}
      {effectiveRole === 'admin' && <UserManagementSection />}

      {/* Analytical Charts */}
      <DashboardCharts analytics={analytics} />

      {/* Activity Trail & Quick Advisory Trigger */}
      <div className="grid-2">
        <RecentActivityFeed activities={activities} />

        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquareShare size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Farmer Advisory & Extension Portal</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '16px' }}>
              Deliver critical bio-spray timings, irrigation guidance, and pathogen alerts directly to registered farmers in their preferred native language.
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                🌾 Personalized Advisory Metrics:
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Total Advisories Issued: <strong>{kpis?.totalAdvisories ?? 0}</strong> • Broadcast reach across 100% active farm plots.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAdvisoryModal(true)}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <MessageSquareShare size={16} /> Dispatch New Advisory
            </button>
            <button
              onClick={() => navigate('/advisories')}
              className="btn btn-secondary"
            >
              View Feed
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportDiseaseModal
        isOpen={showDiseaseModal}
        onClose={() => setShowDiseaseModal(false)}
        onSuccess={loadDashboardData}
      />
      <RecordObservationModal
        isOpen={showObservationModal}
        onClose={() => setShowObservationModal(false)}
        onSuccess={loadDashboardData}
      />
      <CreateAdvisoryModal
        isOpen={showAdvisoryModal}
        onClose={() => setShowAdvisoryModal(false)}
        onSuccess={loadDashboardData}
      />
      <AIRecommenderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
