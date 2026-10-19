import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DiseaseCase, Disease } from '../types';
import { DiseaseMap } from '../components/disease/DiseaseMap';
import { ReportDiseaseModal } from '../components/disease/ReportDiseaseModal';
import { DiseaseDetailModal } from '../components/disease/DiseaseDetailModal';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { ShieldAlert, Plus, MapPin, Calendar, Sprout, Search, RefreshCw, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DiseasePage: React.FC = () => {
  const [cases, setCases] = useState<DiseaseCase[]>([]);
  const [catalog, setCatalog] = useState<Disease[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dataSourceFilter, setDataSourceFilter] = useState<'ALL' | 'REAL' | 'DEMO'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DiseaseCase | null>(null);

  const { isAgronomist, isAdmin, isBiotechExpert } = useAuth();
  const canReport = isAgronomist || isAdmin || isBiotechExpert;

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, catalogData] = await Promise.all([
        api.diseases.getAll(),
        api.diseases.getCatalog(),
      ]);
      setCases(casesData);
      setCatalog(catalogData);
    } catch (e: any) {
      console.error('Error fetching disease surveillance data:', e);
      setError('Unable to load disease surveillance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.diseases.updateCase(id, { status: newStatus as any });
      loadCases();
    } catch (e: any) {
      alert(e.message || 'Failed to update disease status');
    }
  };

  // Filter grid cases dynamically
  const filteredGridCases = cases.filter((c) => {
    const matchSeverity =
      severityFilter === 'ALL' ||
      (c.severity || '').toUpperCase() === severityFilter.toUpperCase();
    const matchStatus =
      statusFilter === 'ALL' ||
      (c.status || '').toUpperCase() === statusFilter.toUpperCase();
    const matchDataSource =
      dataSourceFilter === 'ALL' ||
      (dataSourceFilter === 'REAL' && !c.isDemo) ||
      (dataSourceFilter === 'DEMO' && Boolean(c.isDemo));

    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      (c.diseaseName && c.diseaseName.toLowerCase().includes(q)) ||
      (c.symptoms && c.symptoms.toLowerCase().includes(q)) ||
      (c.crop && c.crop.toLowerCase().includes(q)) ||
      (c.cropVariety?.cropName && c.cropVariety.cropName.toLowerCase().includes(q)) ||
      (c.cropVariety?.varietyName && c.cropVariety.varietyName.toLowerCase().includes(q)) ||
      (c.farm?.farmName && c.farm.farmName.toLowerCase().includes(q)) ||
      (c.locationAddress && c.locationAddress.toLowerCase().includes(q)) ||
      (c.farm?.farmer?.fullName && c.farm.farmer.fullName.toLowerCase().includes(q));

    return matchSeverity && matchStatus && matchDataSource && matchSearch;
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldAlert size={28} color="#ef4444" /> Disease Surveillance & Outbreak Radar
          </h1>
          <p className="page-subtitle">
            Geospatial epidemiological monitoring, early warning triggers, and immediate biocontrol protocols.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-danger"
          >
            <Plus size={16} /> Report Disease Outbreak
          </button>
          <button onClick={loadCases} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Interactive GIS Map */}
      <div style={{ marginBottom: '28px' }}>
        <DiseaseMap
          cases={cases}
          loading={loading}
          error={error}
          onSelectCase={(c) => {
            setSelectedCase(c);
            setShowDetailModal(true);
          }}
          onRetry={loadCases}
          onOpenReportModal={() => setShowReportModal(true)}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search pathogen name, symptoms, farm location, farmer, crop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (Quarantine)</option>
            <option value="HIGH">High (Spreading)</option>
            <option value="MEDIUM">Medium (Moderate)</option>
            <option value="LOW">Low (Isolated)</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Case Statuses</option>
            <option value="REPORTED">Reported (Farmer Submission)</option>
            <option value="ACTIVE">Active Outbreak</option>
            <option value="INVESTIGATING">Under Investigation</option>
            <option value="CONTAINED">Contained / Treated</option>
            <option value="RESOLVED">Resolved / Clear</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={dataSourceFilter}
            onChange={(e) => setDataSourceFilter(e.target.value as any)}
          >
            <option value="ALL">All Sources (Demo & Field)</option>
            <option value="REAL">Real Field Reports Only</option>
            <option value="DEMO">Demo Baseline Data</option>
          </select>
        </div>
      </div>

      {/* Disease Case Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading disease surveillance data...
        </div>
      ) : error ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Unable to load disease surveillance data.</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            There was a problem communicating with the disease surveillance API.
          </p>
          <button onClick={loadCases} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Retry Loading Data
          </button>
        </div>
      ) : filteredGridCases.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '40px' }}>
          <ShieldAlert size={40} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Disease Cases Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All farms within the selected criteria are healthy and pathogen-free.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredGridCases.map((c) => {
            const cropName = c.crop || c.cropVariety?.cropName || c.farm?.currentCrop;
            const varietyName = c.cropVariety?.varietyName;
            const farmName = c.farm?.farmName || (typeof c.farm === 'string' ? c.farm : 'Farm Plot');
            const farmerName = c.farm?.farmer?.fullName;
            const locationAddress = c.locationAddress || c.farm?.locationAddress;

            return (
              <div
                key={c.id}
                className="card-glass card-glass-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft:
                    c.severity === 'CRITICAL'
                      ? '4px solid #ef4444'
                      : c.severity === 'HIGH'
                      ? '4px solid #f97316'
                      : c.severity === 'MEDIUM'
                      ? '4px solid #eab308'
                      : '4px solid #10b981',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <SeverityBadge severity={c.severity} />
                    <StatusBadge status={c.status} />
                    {c.isDemo ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(148, 163, 184, 0.15)',
                          color: '#cbd5e1',
                          border: '1px solid rgba(148, 163, 184, 0.35)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Demo Record
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Field Report
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {c.dateObserved ? new Date(c.dateObserved).toLocaleDateString() : ''}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  {c.diseaseName}
                </h3>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#10b981',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <MapPin size={14} /> {farmName} {farmerName ? `(${farmerName})` : ''}
                </div>

                {locationAddress && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-dim)',
                      marginBottom: '8px',
                    }}
                  >
                    📍 {locationAddress}
                  </div>
                )}

                {(cropName || varietyName) && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <Sprout size={14} color="#34d399" />
                    <span>
                      {cropName ? <strong>{cropName}</strong> : null}
                      {varietyName ? ` • ${varietyName}` : null}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    marginBottom: '12px',
                    flex: 1,
                  }}
                >
                  <strong>Symptoms:</strong> {c.symptoms}
                </div>

                {c.recommendedTreatment && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      color: '#d1fae5',
                      marginBottom: '14px',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Prescribed Treatment:</strong> {c.recommendedTreatment}
                  </div>
                )}

                {/* Status Update Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Reporter: {c.reportedBy?.name || 'Surveillance Unit'}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setSelectedCase(c);
                        setShowDetailModal(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      title="View full report and epidemiological notes"
                    >
                      <Eye size={13} /> Details
                    </button>
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'CONTAINED')}
                        className="btn btn-secondary btn-sm"
                      >
                        Mark Contained
                      </button>
                    )}
                    {c.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle2 size={13} /> Resolve Case
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      <ReportDiseaseModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={loadCases}
      />

      {/* Disease Detail & Edit Modal */}
      <DiseaseDetailModal
        diseaseCase={selectedCase}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdated={loadCases}
      />
    </div>
  );
};

export default DiseasePage;
