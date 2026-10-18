import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Farmer } from '../types';
import { FarmerCard } from '../components/farmers/FarmerCard';
import { AddFarmerModal } from '../components/farmers/AddFarmerModal';
import { AddFarmPlotModal } from '../components/farmers/AddFarmPlotModal';
import { FarmerProfileModal } from '../components/farmers/FarmerProfileModal';
import { Users, Plus, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FarmersPage: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPlotModal, setShowAddPlotModal] = useState(false);
  const [selectedFarmerIdForPlot, setSelectedFarmerIdForPlot] = useState<string | null>(null);
  const [viewing360FarmerId, setViewing360FarmerId] = useState<string | null>(null);

  const { isAgronomist, isAdmin } = useAuth();
  const canAdd = isAgronomist || isAdmin;

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const data = await api.farmers.getAll({
        search: search || undefined,
        state: stateFilter !== 'ALL' ? stateFilter : undefined,
        language: languageFilter !== 'ALL' ? languageFilter : undefined,
      });
      setFarmers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [stateFilter, languageFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this farmer profile and all their plots?')) return;
    try {
      await api.farmers.delete(id);
      loadFarmers();
    } catch (e: any) {
      alert(e.message || 'Failed to delete farmer');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} color="#10b981" /> Farmer & Farm Plot Directory
          </h1>
          <p className="page-subtitle">
            Farmer 360° management, multi-farm plot linkage, GPS coordinates, and historical advisory records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Register New Farmer
            </button>
          )}
          <button onClick={loadFarmers} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={(e) => { e.preventDefault(); loadFarmers(); }} className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search farmer name, phone number, district, primary crops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="ALL">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Punjab">Punjab</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Telangana">Telangana</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
          >
            <option value="ALL">All Languages</option>
            <option value="Tamil">Tamil</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Telugu">Telugu</option>
          </select>
        </div>
      </div>

      {/* Farmers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading farmer profiles...
        </div>
      ) : farmers.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '50px' }}>
          <Users size={44} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Farmer Profiles Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            No farmers match the current filter.
          </p>
          {canAdd && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              Register Farmer
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {farmers.map((farmer) => (
            <FarmerCard
              key={farmer.id}
              farmer={farmer}
              onView360={(f) => setViewing360FarmerId(f.id)}
              onAddFarm={(fId) => {
                setSelectedFarmerIdForPlot(fId);
                setShowAddPlotModal(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddFarmerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadFarmers}
      />
      <AddFarmPlotModal
        farmerId={selectedFarmerIdForPlot}
        isOpen={showAddPlotModal}
        onClose={() => {
          setShowAddPlotModal(false);
          setSelectedFarmerIdForPlot(null);
        }}
        onSuccess={loadFarmers}
      />
      <FarmerProfileModal
        farmerId={viewing360FarmerId}
        onClose={() => setViewing360FarmerId(null)}
      />
    </div>
  );
};
