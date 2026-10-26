import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CropVariety } from '../types';
import { VarietyCard } from '../components/varieties/VarietyCard';
import { VarietyFormModal } from '../components/varieties/VarietyFormModal';
import { VarietyDetailModal } from '../components/varieties/VarietyDetailModal';
import { Sprout, Search, Plus, LayoutGrid, List, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VarietiesPage: React.FC = () => {
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [search, setSearch] = useState('');
  const [cropType, setCropType] = useState('ALL');
  const [growingSeason, setGrowingSeason] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVariety, setEditingVariety] = useState<CropVariety | null>(null);
  const [viewingVariety, setViewingVariety] = useState<CropVariety | null>(null);

  const { isBiotechExpert, isAdmin } = useAuth();
  const canAdd = isBiotechExpert || isAdmin;

  const loadVarieties = async () => {
    setLoading(true);
    try {
      const data = await api.varieties.getAll({
        search: search || undefined,
        cropType: cropType !== 'ALL' ? cropType : undefined,
        growingSeason: growingSeason !== 'ALL' ? growingSeason : undefined,
        sortBy,
      });
      setVarieties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVarieties();
  }, [cropType, growingSeason, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVarieties();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop variety?')) return;
    try {
      await api.varieties.delete(id);
      loadVarieties();
    } catch (e: any) {
      alert(e.message || 'Failed to delete variety');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sprout size={28} color="#10b981" /> Crop & Seed Varieties
          </h1>
          <p className="page-subtitle">
            Catalog and monitor genetically stacked, drought-resilient, and bio-fortified crop cultivars.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canAdd && (
            <button
              onClick={() => {
                setEditingVariety(null);
                setShowFormModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} /> Register New Variety
            </button>
          )}
          <button onClick={loadVarieties} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search crop name, variety, gene traits (e.g. Cotton, Cry1Ac)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
          >
            <option value="ALL">All Crop Types</option>
            <option value="CEREAL">Cereals (Rice, Wheat, Maize)</option>
            <option value="CASH_CROP">Cash Crops (Cotton)</option>
            <option value="OILSEED">Oilseeds (Soybean)</option>
            <option value="PULSE">Pulses</option>
            <option value="HORTICULTURE">Horticulture (Chilli, Tomato)</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={growingSeason}
            onChange={(e) => setGrowingSeason(e.target.value)}
          >
            <option value="ALL">All Seasons</option>
            <option value="KHARIF">Kharif (Monsoon)</option>
            <option value="RABI">Rabi (Winter)</option>
            <option value="ZAID">Zaid (Summer)</option>
            <option value="YEAR_ROUND">Year-Round</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Sort: Latest</option>
            <option value="yield">Sort: Highest Yield</option>
            <option value="maturity">Sort: Maturity Days</option>
          </select>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
          }}>
            <button
              onClick={() => setViewMode('GRID')}
              style={{
                background: viewMode === 'GRID' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'GRID' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                background: viewMode === 'TABLE' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'TABLE' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading crop varieties...
        </div>
      ) : varieties.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '60px' }}>
          <Sprout size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>No Crop Varieties Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            No cultivars match your search criteria. Try adjusting your filters.
          </p>
          {canAdd && (
            <button
              onClick={() => {
                setEditingVariety(null);
                setShowFormModal(true);
              }}
              className="btn btn-primary"
            >
              Register New Variety
            </button>
          )}
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid-3">
          {varieties.map((v) => (
            <VarietyCard
              key={v.id}
              variety={v}
              onEdit={(variety) => {
                setEditingVariety(variety);
                setShowFormModal(true);
              }}
              onDelete={handleDelete}
              onView={(variety) => setViewingVariety(variety)}
            />
          ))}
        </div>
      ) : (
        <div className="table-container card-glass" style={{ padding: 0 }}>
          <table className="table-modern">
            <thead>
              <tr>
                <th>Crop / Variety</th>
                <th>Category</th>
                <th>Season</th>
                <th>Expected Yield</th>
                <th>Maturity</th>
                <th>Insect Protection & Biotech Traits</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {varieties.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{v.varietyName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{v.cropName}</div>
                  </td>
                  <td>
                    <span className="badge badge-medium">{v.cropType}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{v.growingSeason}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>
                      {v.expectedYieldMin} - {v.expectedYieldMax} {v.yieldUnit.split('/')[0]}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{v.maturityDays} Days</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                      {v.biotechTraits}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setViewingVariety(v)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '6px' }}
                    >
                      Specs
                    </button>
                    {canAdd && (
                      <button
                        onClick={() => {
                          setEditingVariety(v);
                          setShowFormModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <VarietyFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={loadVarieties}
        initialVariety={editingVariety}
      />
      <VarietyDetailModal
        variety={viewingVariety}
        onClose={() => setViewingVariety(null)}
      />
    </div>
  );
};
