import React from 'react';
import { DiseaseCase } from '../../types';
import { ShieldAlert, ArrowRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OutbreakTickerProps {
  outbreaks: DiseaseCase[];
}

export const OutbreakTicker: React.FC<OutbreakTickerProps> = ({ outbreaks }) => {
  const navigate = useNavigate();

  if (!outbreaks || outbreaks.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(245, 158, 11, 0.15) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.45)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px',
      boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: '#ef4444',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 14px rgba(239, 68, 68, 0.8)',
        }}>
          <ShieldAlert size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ACTIVE OUTBREAK SURVEILLANCE RADAR</span>
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {outbreaks.length} ACTIVE CASES
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '2px' }}>
            Critical pathogen incidents detected: {outbreaks.map(o => `${o.diseaseName} at ${o.farm?.farmName}`).join(' • ')}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/diseases')}
        className="btn btn-danger btn-sm"
        style={{ boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)' }}
      >
        Open Live GIS Radar <ArrowRight size={14} />
      </button>
    </div>
  );
};
