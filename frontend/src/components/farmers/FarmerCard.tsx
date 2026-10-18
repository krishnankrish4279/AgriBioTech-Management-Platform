import React from 'react';
import { Farmer } from '../../types';
import { User, Phone, MapPin, Layers, Award, Sprout, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FarmerCardProps {
  farmer: Farmer;
  onView360?: (f: Farmer) => void;
  onEdit?: (f: Farmer) => void;
  onDelete?: (id: string) => void;
  onAddFarm?: (farmerId: string) => void;
}

export const FarmerCard: React.FC<FarmerCardProps> = ({
  farmer,
  onView360,
  onEdit,
  onDelete,
  onAddFarm,
}) => {
  const { isAgronomist, isAdmin } = useAuth();
  const canManage = isAgronomist || isAdmin;

  const cropList = farmer.primaryCrops
    ? farmer.primaryCrops.split(',').map(c => c.trim())
    : [];

  return (
    <div className="card-glass card-glass-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}>
            {farmer.fullName.charAt(0)}
          </div>
          <div>
            <h3
              onClick={() => onView360 && onView360(farmer)}
              style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', cursor: onView360 ? 'pointer' : 'default' }}
            >
              {farmer.fullName}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} color="#10b981" /> {farmer.district}, {farmer.state}
            </div>
          </div>
        </div>

        <span style={{
          background: 'rgba(255,255,255,0.05)',
          color: '#38bdf8',
          borderRadius: '9999px',
          padding: '3px 10px',
          fontSize: '0.72rem',
          fontWeight: 700,
        }}>
          {farmer.preferredLanguage}
        </span>
      </div>

      {/* Farm Stats & Experience */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        marginBottom: '14px',
      }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Land Holding</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
            {farmer.farmSizeAcres} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Acres</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Experience</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
            {farmer.farmingExperienceYears} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Years</span>
          </div>
        </div>
      </div>

      {/* Phone & Contact */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Phone size={13} color="#10b981" /> {farmer.phone}
      </div>

      {/* Primary Crops */}
      <div style={{ flex: 1, marginBottom: '14px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
          Cultivated Crops:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {cropList.map((c, idx) => (
            <span key={idx} className="badge badge-low" style={{ textTransform: 'none', fontSize: '0.7rem' }}>
              🌾 {c}
            </span>
          ))}
        </div>
      </div>

      {/* Registered Farm Plots summary */}
      {farmer.farms && farmer.farms.length > 0 && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '0.75rem',
        }}>
          <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={13} /> {farmer.farms.length} Registered Plot(s):
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {farmer.farms.map(f => f.farmName).join(' • ')}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={() => onView360 && onView360(farmer)}
          className="btn btn-secondary btn-sm"
          style={{ gap: '4px' }}
        >
          360° Profile <ArrowRight size={13} />
        </button>

        {canManage && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {onAddFarm && (
              <button
                onClick={() => onAddFarm(farmer.id)}
                className="btn btn-secondary btn-sm"
                title="Add farm plot"
              >
                + Plot
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(farmer.id)}
                className="btn btn-danger btn-sm"
                title="Delete farmer profile"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
