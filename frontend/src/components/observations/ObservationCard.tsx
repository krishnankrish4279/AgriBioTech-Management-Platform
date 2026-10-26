import React from 'react';
import { FieldObservation } from '../../types';
import { ClipboardCheck, MapPin, Calendar, Sun, CloudRain, Droplets, Sprout, User, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ObservationCardProps {
  observation: FieldObservation;
  onView?: (obs: FieldObservation) => void;
  onDelete?: (id: string) => void;
}

export const ObservationCard: React.FC<ObservationCardProps> = ({
  observation,
  onView,
  onDelete,
}) => {
  const { isAgronomist, isAdmin } = useAuth();
  const canManage = isAgronomist || isAdmin;

  // Health color score
  const score = observation.plantHealthScore;
  const scoreColor = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

  const weatherIcons: Record<string, any> = {
    SUNNY: Sun,
    HUMID_OVERCAST: CloudRain,
    RAINY: CloudRain,
    DRY_WINDY: Sun,
  };
  const WeatherIcon = weatherIcons[observation.weatherCondition] || Sun;

  return (
    <div className="card-glass card-glass-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '3px 10px',
            fontSize: '0.74rem',
            fontWeight: 700,
          }}>
            {observation.growthStage}
          </span>

          <span style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-muted)',
            borderRadius: '9999px',
            padding: '3px 8px',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <WeatherIcon size={12} color="#f59e0b" /> {observation.weatherCondition.replace('_', ' ')}
          </span>
        </div>

        {/* Plant Health Score Meter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: `${scoreColor}15`,
          border: `1px solid ${scoreColor}40`,
          borderRadius: '9999px',
          padding: '3px 10px',
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>HEALTH:</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: scoreColor }}>
            {score}/10
          </span>
        </div>
      </div>

      {/* Target Farm & Variety */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="#10b981" /> {observation.farm?.farmName}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
          Owner: {observation.farm?.farmer?.fullName} {observation.cropVariety ? `• Crop: ${observation.cropVariety.varietyName}` : ''}
        </div>
      </div>

      {/* Notes & Observations */}
      <div style={{
        flex: 1,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        lineHeight: 1.4,
        marginBottom: '12px',
      }}>
        {observation.notes}
      </div>

      {/* Soil moisture & Pest Symptoms */}
      <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}>
          <Droplets size={13} /> Soil: {observation.soilMoisture}
        </div>
        {observation.pestSymptoms && (
          <div style={{ color: '#fbbf24' }}>
            ⚠️ Pest Symptoms: {observation.pestSymptoms}
          </div>
        )}
      </div>

      {/* Photo Preview if available */}
      {observation.photoUrl && (
        <div style={{ height: '90px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
          <img
            src={observation.photoUrl}
            alt="Field observation log"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Footer Meta & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.72rem',
        color: 'var(--text-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={12} /> {observation.observer?.name || 'Field Officer'}
        </div>
        <div>
          {new Date(observation.observationDate).toLocaleDateString()}
        </div>

        {canManage && onDelete && (
          <button
            onClick={() => onDelete(observation.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Delete observation"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
