import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BiotechRecommendation } from '../types';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { CreateRecommendationModal } from '../components/recommendations/CreateRecommendationModal';
import { AIRecommenderModal } from '../components/recommendations/AIRecommenderModal';
import { RecommendationDetailModal } from '../components/recommendations/RecommendationDetailModal';
import { Dna, Sparkles, Plus, Search, Filter, RefreshCw, Beaker } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<BiotechRecommendation[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [engineFilter, setEngineFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedRecForDetails, setSelectedRecForDetails] = useState<BiotechRecommendation | null>(null);

  const { isBiotechExpert, isAdmin } = useAuth();
  const canPrescribe = isBiotechExpert || isAdmin;

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.recommendations.getAll({
        search: search || undefined,
        recommendationType: typeFilter !== 'ALL' ? typeFilter : undefined,
        isAutomated: engineFilter !== 'ALL' ? engineFilter : undefined,
      });
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [typeFilter, engineFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.recommendations.update(id, { status: newStatus as any });
      setSelectedRecForDetails((prev) => (prev && prev.id === id ? { ...prev, status: newStatus as any } : prev));
      loadRecommendations();
    } catch (e: any) {
      alert(e.message || 'Failed to update recommendation status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) return;
    try {
      await api.recommendations.delete(id);
      loadRecommendations();
    } catch (e: any) {
      alert(e.message || 'Failed to delete recommendation');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Dna size={28} color="#06b6d4" /> Biotechnology Recommendations Engine
          </h1>
          <p className="page-subtitle">
            Microbial biofertilizers, biocontrol parasitoids, biopesticides, and genetically resilient seed prescriptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAIModal(true)}
            className="btn btn-biotech"
          >
            <Sparkles size={16} /> Run AI Recommender
          </button>
          {canPrescribe && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Prescribe Expert Protocol
            </button>
          )}
          <button onClick={loadRecommendations} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={(e) => { e.preventDefault(); loadRecommendations(); }} className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search recommendation title, product formulation, biological mechanism..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="BIOFERTILIZER">Biofertilizers & Inoculants</option>
            <option value="BIOPESTICIDE">Biopesticides</option>
            <option value="BIOLOGICAL_CONTROL">Biological Control & Parasitoids</option>
            <option value="VARIETY_SELECTION">Resilient Seed Selection</option>
            <option value="CROP_MANAGEMENT">Crop Practices</option>
            <option value="SOIL_ENHANCEMENT">Soil Enhancers</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
          >
            <option value="ALL">All Recommendation Engines</option>
            <option value="true">🤖 Automated AI Rule Suggestions</option>
            <option value="false">🧬 Expert Scientist Validated</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading biotechnology recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '50px' }}>
          <Beaker size={44} color="#06b6d4" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Recommendations Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Click below to generate tailored AI suggestions based on your crop and disease surveillance data.
          </p>
          <button onClick={() => setShowAIModal(true)} className="btn btn-biotech">
            <Sparkles size={16} /> Run AI Inference
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {recommendations.map((r) => (
            <RecommendationCard
              key={r.id}
              rec={r}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onViewDetails={(rec) => setSelectedRecForDetails(rec)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RecommendationDetailModal
        rec={selectedRecForDetails}
        isOpen={selectedRecForDetails !== null}
        onClose={() => setSelectedRecForDetails(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
      <CreateRecommendationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadRecommendations}
      />
      <AIRecommenderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={loadRecommendations}
      />
    </div>
  );
};
