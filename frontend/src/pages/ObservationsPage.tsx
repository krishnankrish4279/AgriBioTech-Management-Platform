import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FieldObservation } from '../types';
import { ObservationCard } from '../components/observations/ObservationCard';
import { RecordObservationModal } from '../components/observations/RecordObservationModal';
import { ClipboardList, Plus, Search, Filter, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ObservationsPage: React.FC = () => {
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [showRecordModal, setShowRecordModal] = useState(false);

  const { isAgronomist, isAdmin } = useAuth();
  const canRecord = isAgronomist || isAdmin;

  const loadObservations = async () => {
    setLoading(true);
    try {
      const data = await api.observations.getAll({
        search: search || undefined,
        growthStage: stageFilter !== 'ALL' ? stageFilter : undefined,
      });
      setObservations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [stageFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this observation log?')) return;
    try {
      await api.observations.delete(id);
      loadObservations();
    } catch (e: any) {
      alert(e.message || 'Failed to delete observation');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardList size={28} color="#10b981" /> Field Observation Management
          </h1>
          <p className="page-subtitle">
            Agronomist on-site field visits, crop growth stage timelines, soil health, and plant vitality ratings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canRecord && (
            <button
              onClick={() => setShowRecordModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Log Field Observation
            </button>
          )}
          <button onClick={loadObservations} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={(e) => { e.preventDefault(); loadObservations(); }} className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search farm name, farmer, pest symptoms, agronomist notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="ALL">All Growth Stages</option>
            <option value="SEEDLING">Seedling</option>
            <option value="VEGETATIVE">Vegetative</option>
            <option value="FLOWERING">Flowering</option>
            <option value="GRAIN_FILLING">Grain Filling</option>
            <option value="MATURITY">Maturity</option>
          </select>
        </div>
      </div>

      {/* Observations Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading field observation logs...
        </div>
      ) : observations.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '50px' }}>
          <ClipboardList size={44} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Field Observations Recorded</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Click below to record your first field visit observation.
          </p>
          {canRecord && (
            <button onClick={() => setShowRecordModal(true)} className="btn btn-primary">
              Log Field Visit
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {observations.map((obs) => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Record Modal */}
      <RecordObservationModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSuccess={loadObservations}
      />
    </div>
  );
};
