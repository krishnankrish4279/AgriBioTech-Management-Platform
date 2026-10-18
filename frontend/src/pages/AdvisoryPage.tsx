import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FarmerAdvisory } from '../types';
import { AdvisoryCard } from '../components/advisory/AdvisoryCard';
import { CreateAdvisoryModal } from '../components/advisory/CreateAdvisoryModal';
import { MessageSquareShare, Plus, Search, Filter, RefreshCw, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdvisoryPage: React.FC = () => {
  const [advisories, setAdvisories] = useState<FarmerAdvisory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const { isAgronomist, isBiotechExpert, isAdmin } = useAuth();
  const canSend = isAgronomist || isBiotechExpert || isAdmin;

  const loadAdvisories = async () => {
    setLoading(true);
    try {
      const data = await api.advisories.getAll({
        search: search || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        isRead: readFilter !== 'ALL' ? readFilter : undefined,
      });
      setAdvisories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, [categoryFilter, priorityFilter, readFilter]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.advisories.markRead(id);
      loadAdvisories();
    } catch (e: any) {
      alert(e.message || 'Failed to mark advisory as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this advisory message?')) return;
    try {
      await api.advisories.delete(id);
      loadAdvisories();
    } catch (e: any) {
      alert(e.message || 'Failed to delete advisory');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MessageSquareShare size={28} color="#10b981" /> Farmer Advisory Services
          </h1>
          <p className="page-subtitle">
            Personalized crop advisories, seasonal weather guidance, and urgent outbreak containment instructions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {canSend && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Dispatch Farmer Advisory
            </button>
          )}
          <button onClick={loadAdvisories} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={(e) => { e.preventDefault(); loadAdvisories(); }} className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search advisory title, message body, farmer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="DISEASE_ALERT">Disease Outbreak Alerts</option>
            <option value="IRRIGATION">Irrigation Guidance</option>
            <option value="NUTRIENT_MANAGEMENT">Nutrient Schedules</option>
            <option value="BIOTECH_INPUT">Biotech Inputs & Seeds</option>
            <option value="WEATHER_ACTION">Weather Action Alerts</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">🚨 Urgent</option>
            <option value="IMPORTANT">⚠️ Important</option>
            <option value="ROUTINE">ℹ️ Routine</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto' }}
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
          >
            <option value="ALL">All Read States</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
      </div>

      {/* Advisory Feed Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading advisories feed...
        </div>
      ) : advisories.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '50px' }}>
          <MessageSquareShare size={44} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Farmer Advisories Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            No messages match your selected filters.
          </p>
          {canSend && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Dispatch Advisory
            </button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {advisories.map((adv) => (
            <AdvisoryCard
              key={adv.id}
              advisory={adv}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateAdvisoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAdvisories}
      />
    </div>
  );
};
