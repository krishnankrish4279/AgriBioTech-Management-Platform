import React, { useState } from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  Clock,
  RefreshCw,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WeatherObservation, FarmWeatherAdvisory } from '../../types';

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95) return '⛈️';
  return '⛅';
}

interface WeatherDetailsPanelProps {
  weather: WeatherObservation | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose?: () => void;
  advisories?: FarmWeatherAdvisory[];
  availableLocations?: { id: string; name: string; lat: number; lng: number }[];
  selectedLocationId?: string;
  onSelectLocation?: (id: string) => void;
}

export const WeatherDetailsPanel: React.FC<WeatherDetailsPanelProps> = ({
  weather,
  loading,
  error,
  onRefresh,
  onClose,
  advisories = [],
  availableLocations = [],
  selectedLocationId,
  onSelectLocation,
}) => {
  const [forecastTab, setForecastTab] = useState<'hourly' | 'daily'>('hourly');
  const [showAllDays, setShowAllDays] = useState(false);

  if (loading) {
    return (
      <div
        className="card-glass"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg, 14px)',
          background: 'rgba(13, 24, 41, 0.95)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '180px' }}>
          <RefreshCw className="spin" size={24} color="#38bdf8" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Fetching meteorological data from Open-Meteo satellites...
          </span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div
        className="card-glass"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg, 14px)',
          background: 'rgba(13, 24, 41, 0.95)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
            <AlertTriangle size={18} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Weather Information Unavailable</h4>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          {error || 'Unable to retrieve meteorological observations for the selected coordinates. Please verify GPS permissions or select a registered farm.'}
        </p>
        <button onClick={onRefresh} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Retry Meteorological Fetch
        </button>
      </div>
    );
  }

  const { current, hourly = [], daily = [] } = weather;
  const isStale = (Date.now() - new Date(weather.lastUpdated).getTime()) > 30 * 60 * 1000;

  // Filter advisories relevant to this farm if farmId is present
  const locationAdvisories = advisories.filter(
    (adv) => !weather.farmId || adv.farmId === weather.farmId
  );

  return (
    <div
      className="card-glass"
      style={{
        padding: '20px 22px',
        borderRadius: 'var(--radius-lg, 14px)',
        background: 'rgba(13, 24, 41, 0.96)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
      }}
    >
      {/* Header with Location Selector and Close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>{getWeatherEmoji(current.weatherCode)}</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              {weather.locationName || 'Observed Location'}
            </h3>
            {isStale && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                }}
              >
                Stale (Cached)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Lat: {weather.latitude.toFixed(4)}°, Lng: {weather.longitude.toFixed(4)}°</span>
            <span>•</span>
            <span>Source: {weather.source}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {availableLocations.length > 0 && onSelectLocation && (
            <select
              value={selectedLocationId || ''}
              onChange={(e) => onSelectLocation(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.78rem',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
              }}
            >
              <option value="">User GPS Location</option>
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh weather data"
            style={{ padding: '6px' }}
          >
            <RefreshCw size={13} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Close weather panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Meteorological Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Temperature & Condition */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.04) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Thermometer size={14} /> Temperature
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {current.temperature}°C
          </div>
          <div style={{ fontSize: '0.74rem', color: '#bae6fd', marginTop: '2px' }}>
            {current.conditionText}
          </div>
        </div>

        {/* Relative Humidity */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Droplets size={14} /> Relative Humidity
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {current.relativeHumidity}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
            {current.relativeHumidity > 80 ? 'High Humidity' : current.relativeHumidity < 35 ? 'Dry Air' : 'Optimal'}
          </div>
        </div>

        {/* Rainfall (mm) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <CloudRain size={14} /> Rainfall ({current.measurementPeriod || 'Past 1h'})
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {current.rain != null ? current.rain : current.precipitation} mm
          </div>
          <div style={{ fontSize: '0.74rem', color: '#c7d2fe', marginTop: '2px' }}>
            {(current.rain || current.precipitation) > 15 ? 'Heavy Rain' : (current.rain || current.precipitation) > 2 ? 'Moderate' : 'None / Trace'}
          </div>
        </div>

        {/* Precipitation Probability from next hour */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.04) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Clock size={14} /> Rain Probability
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {hourly[0]?.precipitationProbability ?? 0}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fde68a', marginTop: '2px' }}>
            {(hourly[0]?.precipitationProbability ?? 0) >= 65 ? 'High Risk' : (hourly[0]?.precipitationProbability ?? 0) >= 35 ? 'Moderate' : 'Low'}
          </div>
        </div>

        {/* Wind Speed */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(147, 51, 234, 0.04) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <Wind size={14} /> Wind Speed
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {current.windSpeed} <span style={{ fontSize: '0.85rem' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#e9d5ff', marginTop: '2px' }}>
            {current.windDirection != null ? `${current.windDirection}° Dir` : 'Steady'}
          </div>
        </div>
      </div>

      {/* Active Farm-Specific Weather Advisories Banner */}
      {locationAdvisories.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.82rem', fontWeight: 700 }}>
            <AlertTriangle size={15} />
            <span>Active Meteorological Advisory for this Location</span>
          </div>
          {locationAdvisories.map((adv, idx) => (
            <div key={idx} style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
              <strong>{adv.title}:</strong> {adv.advice} ({adv.measurement})
            </div>
          ))}
        </div>
      )}

      {/* Forecast Section Toggle (Hourly vs 7-Day Daily) */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setForecastTab('hourly')}
              className={`btn btn-sm ${forecastTab === 'hourly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Clock size={12} style={{ marginRight: '4px' }} /> 24-Hour Hourly
            </button>
            <button
              onClick={() => setForecastTab('daily')}
              className={`btn btn-sm ${forecastTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Calendar size={12} style={{ marginRight: '4px' }} /> 7-Day Forecast
            </button>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Updated: {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Hourly Forecast Strip */}
        {forecastTab === 'hourly' && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin',
            }}
          >
            {hourly.slice(0, 16).map((h, i) => (
              <div
                key={i}
                style={{
                  minWidth: '72px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {h.time.length > 5 ? h.time.substring(11, 16) : h.time}
                </div>
                <div style={{ fontSize: '1rem' }}>{getWeatherEmoji(h.weatherCode)}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  {h.temperature}°
                </div>
                <div style={{ fontSize: '0.68rem', color: '#60a5fa' }}>
                  💧 {h.precipitationProbability}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7-Day Daily Forecast Strip */}
        {forecastTab === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(showAllDays ? daily : daily.slice(0, 4)).map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{getWeatherEmoji(d.weatherCode)}</span>
                  <div>
                    <strong style={{ color: '#fff' }}>{d.date}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.conditionText}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
                    💧 {d.precipitationProbabilityMax}% ({d.precipitationSum} mm)
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                    {d.tempMin}° - {d.tempMax}°C
                  </div>
                </div>
              </div>
            ))}

            {daily.length > 4 && (
              <button
                onClick={() => setShowAllDays(!showAllDays)}
                className="btn btn-secondary btn-sm"
                style={{
                  alignSelf: 'center',
                  marginTop: '4px',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showAllDays ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showAllDays ? 'Show Less' : `Show All ${daily.length} Days`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
