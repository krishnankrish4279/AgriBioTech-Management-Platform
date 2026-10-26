import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BiotechRecommendation, Farm } from '../types';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { CreateRecommendationModal } from '../components/recommendations/CreateRecommendationModal';
import { AIRecommenderModal } from '../components/recommendations/AIRecommenderModal';
import { RecommendationDetailModal } from '../components/recommendations/RecommendationDetailModal';
import { Dna, Sparkles, Plus, Search, Filter, RefreshCw, Beaker, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<BiotechRecommendation[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [engineFilter, setEngineFilter] = useState('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedRecForDetails, setSelectedRecForDetails] = useState<BiotechRecommendation | null>(null);

  const { isBiotechExpert, isAdmin } = useAuth();
  const canPrescribe = isBiotechExpert || isAdmin;

  // Load farms on mount
  useEffect(() => {
    api.farmers.getFarms().then(setFarms).catch(console.error);
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.recommendations.getAll({
        search: search || undefined,
        recommendationType: typeFilter !== 'ALL' ? typeFilter : undefined,
        isAutomated: engineFilter !== 'ALL' ? engineFilter : undefined,
        farmId: farmFilter !== 'ALL' ? farmFilter : undefined,
        crop: cropFilter !== 'ALL' ? cropFilter : undefined,
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
  }, [typeFilter, engineFilter, farmFilter, cropFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.recommendations.update(id, { status: newStatus as any });
      // Update in state immediately
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
      );
      setSelectedRecForDetails((prev) =>
        prev && prev.id === id ? { ...prev, status: newStatus as any } : prev
      );
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

  // Compile list of available crops from farms and recommendations
  const availableCrops = Array.from(
    new Set([
      ...farms.map((f) => f.currentCrop).filter((c): c is string => Boolean(c)),
      ...recommendations.map((r) => r.cropName || r.cropVariety?.cropName).filter((c): c is string => Boolean(c)),
      'Wheat',
      'Maize',
      'Rice',
      'Chilli',
      'Cotton',
      'Tomato',
    ])
  ).sort();

  // Handle farm selection: when farm changes, auto-select its registered crop for a cohesive view
  const handleFarmFilterChange = (selectedFarmId: string) => {
    setFarmFilter(selectedFarmId);
    if (selectedFarmId !== 'ALL') {
      const f = farms.find((fm) => fm.id === selectedFarmId);
      if (f?.currentCrop) {
        setCropFilter(f.currentCrop);
      }
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setEngineFilter('ALL');
    setFarmFilter('ALL');
    setCropFilter('ALL');
  };

  // Client-side strict filtering to guarantee no unrelated Wheat and Maize recommendations mix in farm-specific view
  const filteredRecommendations = recommendations.filter((rec) => {
    // 1. Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const titleMatch = rec.title?.toLowerCase().includes(q);
      const prodMatch = rec.productName?.toLowerCase().includes(q);
      const issueMatch = rec.targetIssue?.toLowerCase().includes(q);
      const reasonMatch = rec.reasoning?.toLowerCase().includes(q);
      const farmMatch = rec.farm?.farmName?.toLowerCase().includes(q);
      const cropMatch = (rec.cropName || rec.cropVariety?.cropName)?.toLowerCase().includes(q);
      if (!titleMatch && !prodMatch && !issueMatch && !reasonMatch && !farmMatch && !cropMatch) {
        return false;
      }
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL' && rec.recommendationType !== typeFilter) {
      return false;
    }

    // 3. Engine Filter
    if (engineFilter !== 'ALL') {
      const isAuto = engineFilter === 'true';
      if (rec.isAutomatedSuggestion !== isAuto) {
        return false;
      }
    }

    // 4. Farm-Specific Filter: STRICT isolation of crops and farm records
    if (farmFilter !== 'ALL') {
      const selectedFarm = farms.find((f) => f.id === farmFilter);
      const recFarmId = rec.farmId || rec.farm?.id;
      const farmCrop = selectedFarm?.currentCrop?.toLowerCase();
      const recCrop = (
        rec.cropName ||
        rec.cropVariety?.cropName ||
        (rec.title?.toLowerCase().includes('maize')
          ? 'maize'
          : rec.title?.toLowerCase().includes('wheat')
          ? 'wheat'
          : rec.title?.toLowerCase().includes('chilli')
          ? 'chilli'
          : rec.title?.toLowerCase().includes('rice') || rec.title?.toLowerCase().includes('paddy')
          ? 'rice'
          : rec.title?.toLowerCase().includes('cotton')
          ? 'cotton'
          : rec.title?.toLowerCase().includes('tomato')
          ? 'tomato'
          : '')
      ).toLowerCase();

      // If recommendation has a distinct farmId that does not match this farm, exclude
      if (recFarmId && recFarmId !== farmFilter) {
        return false;
      }

      // DO NOT mix unrelated Wheat and Maize recommendations in a farm-specific view
      if (farmCrop && recCrop && recCrop !== 'universal') {
        const isCropMatch =
          farmCrop === recCrop ||
          (farmCrop.includes('rice') && recCrop.includes('paddy')) ||
          (farmCrop.includes('paddy') && recCrop.includes('rice'));
        if (!isCropMatch) {
          return false;
        }
      }

      // If recommendation had no explicit farmId, only show if crop strictly matches this farm's crop
      if (!recFarmId) {
        if (!farmCrop || !recCrop) return false;
        const isCropMatch =
          farmCrop === recCrop ||
          (farmCrop.includes('rice') && recCrop.includes('paddy')) ||
          (farmCrop.includes('paddy') && recCrop.includes('rice'));
        if (!isCropMatch) return false;
      }
    }

    // 5. Crop-Specific Filter
    if (cropFilter !== 'ALL') {
      const targetCrop = cropFilter.toLowerCase();
      const recCrop = (
        rec.cropName ||
        rec.cropVariety?.cropName ||
        (rec.title?.toLowerCase().includes('maize')
          ? 'maize'
          : rec.title?.toLowerCase().includes('wheat')
          ? 'wheat'
          : rec.title?.toLowerCase().includes('chilli')
          ? 'chilli'
          : rec.title?.toLowerCase().includes('rice') || rec.title?.toLowerCase().includes('paddy')
          ? 'rice'
          : rec.title?.toLowerCase().includes('cotton')
          ? 'cotton'
          : rec.title?.toLowerCase().includes('tomato')
          ? 'tomato'
          : '')
      ).toLowerCase();

      if (recCrop && recCrop !== targetCrop) {
        const isRiceAlias =
          (targetCrop.includes('rice') && recCrop.includes('paddy')) ||
          (targetCrop.includes('paddy') && recCrop.includes('rice'));
        if (!isRiceAlias) {
          return false;
        }
      }
    }

    return true;
  });

  const selectedFarmObj = farms.find((f) => f.id === farmFilter);
  const isAnyFilterActive =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    engineFilter !== 'ALL' ||
    farmFilter !== 'ALL' ||
    cropFilter !== 'ALL';

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Dna size={28} color="#06b6d4" /> Biotechnology & Bio-Crop Solutions
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
      <div className="filter-bar" style={{ gap: '10px' }}>
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

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Farm Filter */}
          <select
            className="select-field"
            style={{ width: 'auto', minWidth: '190px' }}
            value={farmFilter}
            onChange={(e) => handleFarmFilterChange(e.target.value)}
          >
            <option value="ALL">🏡 All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                🏡 {f.farmName} ({f.currentCrop || 'General'})
              </option>
            ))}
          </select>

          {/* Crop Filter */}
          <select
            className="select-field"
            style={{ width: 'auto', minWidth: '140px' }}
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
          >
            <option value="ALL">🌱 All Crops</option>
            {availableCrops.map((c) => (
              <option key={c} value={c}>
                🌱 {c}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="BIOFERTILIZER">Biofertilizers & Inoculants</option>
            <option value="BIOPESTICIDE">Biopesticides</option>
            <option value="BIOLOGICAL_CONTROL">Biological Control</option>
            <option value="VARIETY_SELECTION">Resilient Seed Selection</option>
            <option value="CROP_MANAGEMENT">Crop Care Practices</option>
            <option value="SOIL_ENHANCEMENT">Soil Enhancers</option>
          </select>

          {/* Recommendation Engine Filter */}
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
          >
            <option value="ALL">All Engines</option>
            <option value="true">🤖 Automated AI Rule Suggestions</option>
            <option value="false">🧬 Expert Scientist Validated</option>
          </select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {isAnyFilterActive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '8px 14px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            color: '#e0f2fe',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Active View:</span>
            {farmFilter !== 'ALL' && (
              <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                🏡 {selectedFarmObj?.farmName || 'Selected Farm'}
              </span>
            )}
            {cropFilter !== 'ALL' && (
              <span style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                🌱 {cropFilter}
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                🔬 {typeFilter}
              </span>
            )}
            <span>• Showing {filteredRecommendations.length} prescription{filteredRecommendations.length === 1 ? '' : 's'}</span>
          </div>

          <button
            onClick={handleClearFilters}
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={12} /> Reset Filters
          </button>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading biotechnology recommendations...
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '50px' }}>
          <Beaker size={44} color="#06b6d4" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Recommendations Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {farmFilter !== 'ALL'
              ? `No specific biotechnology recommendations exist yet for ${selectedFarmObj?.farmName || 'this farm'}. Click below to run AI synthesis.`
              : 'No recommendations matched your current filters. Click below to generate tailored AI suggestions.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setShowAIModal(true)} className="btn btn-biotech">
              <Sparkles size={16} /> Run AI Inference
            </button>
            {isAnyFilterActive && (
              <button onClick={handleClearFilters} className="btn btn-secondary">
                View All Recommendations
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredRecommendations.map((r) => (
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
