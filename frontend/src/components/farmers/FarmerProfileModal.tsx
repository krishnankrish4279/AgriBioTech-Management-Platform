import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Farmer } from '../../types';
import { api } from '../../api/client';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { User, MapPin, Phone, Mail, Layers, ShieldAlert, ClipboardList, MessageSquareShare, Sprout, Clock } from 'lucide-react';

interface FarmerProfileModalProps {
  farmerId: string | null;
  onClose: () => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({ farmerId, onClose }) => {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [activeTab, setActiveTab] = useState<'FARMS' | 'DISEASES' | 'OBSERVATIONS' | 'ADVISORIES'>('FARMS');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (farmerId) {
      setLoading(true);
      api.farmers.getById(farmerId)
        .then(setFarmer)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [farmerId]);

  if (!farmerId) return null;

  return (
    <Modal
      isOpen={Boolean(farmerId)}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
          <User size={20} /> Farmer 360° Profile View
        </div>
      }
      maxWidth="880px"
    >
      {loading || !farmer ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading farmer 360 profile...
        </div>
      ) : (
        <div>
          {/* Top Profile Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 800,
              }}>
                {farmer.fullName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{farmer.fullName}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={13} color="#10b981" /> {farmer.village ? `${farmer.village}, ` : ''}{farmer.district}, {farmer.state}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>PHONE</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{farmer.phone}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>ACREAGE</div>
                <div style={{ color: '#34d399', fontWeight: 800 }}>{farmer.farmSizeAcres} Acres</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>LANGUAGE</div>
                <div style={{ color: '#38bdf8', fontWeight: 600 }}>{farmer.preferredLanguage}</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '18px',
            gap: '8px',
          }}>
            {[
              { key: 'FARMS', label: `Farm Plots (${farmer.farms?.length || 0})`, icon: Layers },
              { key: 'DISEASES', label: 'Disease Reports', icon: ShieldAlert },
              { key: 'OBSERVATIONS', label: 'Field Logs', icon: ClipboardList },
              { key: 'ADVISORIES', label: `Advisories (${farmer.advisories?.length || 0})`, icon: MessageSquareShare },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #10b981' : '3px solid transparent',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    padding: '10px 14px',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} color={isActive ? '#10b981' : 'currentColor'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '260px', maxHeight: '400px', overflowY: 'auto' }}>
            {activeTab === 'FARMS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(!farmer.farms || farmer.farms.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No farm plots registered yet.</div>
                ) : (
                  farmer.farms.map(f => (
                    <div
                      key={f.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={16} color="#06b6d4" /> {f.farmName}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
                          {f.totalAreaAcres} Acres
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        📍 {f.locationAddress} • GPS: [{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}]
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>Soil: <strong>{f.soilType}</strong></span>
                        <span>•</span>
                        <span>Irrigation: <strong>{f.irrigationType}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'DISEASES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {farmer.farms?.flatMap(f => f.diseaseCases || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No active disease cases on this farmer's plots.</div>
                ) : (
                  farmer.farms?.flatMap(f => f.diseaseCases || []).map(dc => (
                    <div
                      key={dc.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>{dc.diseaseName}</span>
                        <SeverityBadge severity={dc.severity} />
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Symptoms: {dc.symptoms}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'OBSERVATIONS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {farmer.farms?.flatMap(f => f.observations || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No field visit logs recorded yet.</div>
                ) : (
                  farmer.farms?.flatMap(f => f.observations || []).map(obs => (
                    <div
                      key={obs.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>Stage: {obs.growthStage}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>Health: {obs.plantHealthScore}/10</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {obs.notes}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'ADVISORIES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!farmer.advisories || farmer.advisories.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>No advisories sent to this farmer yet.</div>
                ) : (
                  farmer.advisories.map(adv => (
                    <div
                      key={adv.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>{adv.title}</span>
                        <span className={`badge ${adv.priority === 'URGENT' ? 'badge-critical' : 'badge-low'}`}>{adv.priority}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {adv.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close 360° Profile
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
