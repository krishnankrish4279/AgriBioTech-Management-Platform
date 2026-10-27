import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DiseaseCase } from '../../types';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import {
  ShieldAlert,
  MapPin,
  Calendar,
  Sprout,
  User,
  Eye,
  RefreshCw,
  AlertTriangle,
  Navigation,
  LocateFixed,
  Radio,
  Radar,
  Bell,
  BellOff,
  Crosshair,
  Compass,
  CheckCircle2,
  X,
  Layers,
  ChevronRight,
  ExternalLink,
  Save,
  Clock,
  Plus,
  CloudRain,
  Sun,
  CloudLightning,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';
import { api } from '../../api/client';
import { WeatherObservation, FarmWeatherSummary, FarmWeatherAdvisory } from '../../types';
import { WeatherDetailsPanel, getWeatherEmoji } from '../weather/WeatherDetailsPanel';

export interface MappableDiseaseCase extends DiseaseCase {
  normalizedLat: number;
  normalizedLng: number;
}

export interface NearbyDiseaseAlert extends MappableDiseaseCase {
  distanceKm: number;
}

export interface DiseaseMapProps {
  cases: DiseaseCase[];
  loading?: boolean;
  error?: string | null;
  onSelectCase?: (c: DiseaseCase) => void;
  onRetry?: () => void;
  onOpenReportModal?: () => void;
}

const STORAGE_CACHE_KEY = 'agribio_gis_location_cache';

interface CachedLocationState {
  lat: number;
  lng: number;
  timestamp: number;
  dateString: string;
  radiusKm: number;
  permissionGranted: boolean;
}

/**
 * Check whether a timestamp was refreshed on today's calendar date
 */
export function isRefreshedToday(timestamp: number | null | undefined): boolean {
  if (!timestamp) return false;
  const savedDate = new Date(timestamp);
  const today = new Date();
  return (
    savedDate.getFullYear() === today.getFullYear() &&
    savedDate.getMonth() === today.getMonth() &&
    savedDate.getDate() === today.getDate()
  );
}

/**
 * Accurately calculate distance between two coordinates in kilometers using the Haversine formula
 * R = 6371 km
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Controller component to smoothly fit map bounds to displayed disease markers
 */
const MapBoundsController: React.FC<{
  markers: MappableDiseaseCase[];
  center: [number, number];
  defaultZoom: number;
  userLocation: { lat: number; lng: number } | null;
}> = ({ markers, center, defaultZoom, userLocation }) => {
  const map = useMap();

  useEffect(() => {
    // If user location is active, user location focus takes precedence
    if (userLocation) return;

    if (markers.length > 0) {
      const latLngs: [number, number][] = markers.map((m) => [m.normalizedLat, m.normalizedLng]);
      const bounds = L.latLngBounds(latLngs);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 10,
          animate: true,
        });
        return;
      }
    }
    map.setView(center, defaultZoom);
  }, [markers, map, center, defaultZoom, userLocation]);

  return null;
};

/**
 * Controller component to fly to a target coordinate (user location or selected nearby alert)
 */
const MapFocusController: React.FC<{
  target: [number, number] | null;
  zoom?: number;
}> = ({ target, zoom = 12 }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [target, zoom, map]);

  return null;
};

/**
 * Normalize and validate coordinates strictly according to requirement 3, 4, 5.
 * Safely accepts direct coordinates (latitude/longitude, lat/lng) or nested verified farm coordinates.
 */
export function parseCoordinates(report: any): { lat: number; lng: number } | null {
  if (!report) return null;
  let rawLat = report.latitude ?? report.lat ?? report.farm?.latitude ?? report.farm?.lat;
  let rawLng = report.longitude ?? report.lng ?? report.farm?.longitude ?? report.farm?.lng;

  // Also support GeoJSON [longitude, latitude] format if present
  if ((rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) &&
      report.location?.coordinates && Array.isArray(report.location.coordinates) &&
      report.location.coordinates.length >= 2) {
    rawLng = report.location.coordinates[0];
    rawLat = report.location.coordinates[1];
  }

  if (
    rawLat === undefined ||
    rawLat === null ||
    rawLat === '' ||
    rawLng === undefined ||
    rawLng === null ||
    rawLng === ''
  ) {
    return null;
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  // Reject uninitialized (0, 0) coordinates
  if (lat === 0 && lng === 0) {
    return null;
  }

  return { lat, lng };
}

export const DiseaseMap: React.FC<DiseaseMapProps> = ({
  cases = [],
  loading = false,
  error = null,
  onSelectCase,
  onRetry,
  onOpenReportModal,
}) => {
  const navigate = useNavigate();

  const handleOpenReport = (c: DiseaseCase, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (onSelectCase) {
      onSelectCase(c);
    } else {
      navigate(`/disease-surveillance/${c.id}`);
    }
  };

  // Severity filter for disease markers
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // User Geolocation State (never hardcoded, requested only upon user action)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLiveLocation, setIsLiveLocation] = useState<boolean>(false);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>('');
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Synchronizing unmapped database records state
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Search Radius configuration: 5km, 10km (default), 25km, 50km
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [showRadiusCircle, setShowRadiusCircle] = useState<boolean>(true);

  // In-App Notifications configuration
  const [enableNearbyNotifications, setEnableNearbyNotifications] = useState<boolean>(true);
  const [inAppAlert, setInAppAlert] = useState<{
    id: string;
    count: number;
    cases: NearbyDiseaseAlert[];
  } | null>(null);
  const notifiedCaseIdsRef = useRef<Set<string>>(new Set());

  // Sorting preference for nearby alerts: 'NEAREST' | 'SEVERITY'
  const [sortOrder, setSortOrder] = useState<'NEAREST' | 'SEVERITY'>('NEAREST');

  // Target coordinates to focus map
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Weather Layer States
  const [showDiseaseLayer, setShowDiseaseLayer] = useState<boolean>(true);
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(true);
  const [showWeatherPanel, setShowWeatherPanel] = useState<boolean>(false);
  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null);
  const [registeredFarmsWeather, setRegisteredFarmsWeather] = useState<FarmWeatherSummary[]>([]);
  const [activeWeatherObservation, setActiveWeatherObservation] = useState<WeatherObservation | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherAdvisories, setWeatherAdvisories] = useState<FarmWeatherAdvisory[]>([]);
  const [selectedWeatherLocationId, setSelectedWeatherLocationId] = useState<string>('');

  const loadWeatherRadar = async () => {
    try {
      const meta = await api.weather.getRadarOverlay();
      if (meta?.tileUrl) {
        setRadarTileUrl(meta.tileUrl);
      }
    } catch (e) {
      console.warn('Weather radar overlay unavailable:', e);
    }
  };

  const loadRegisteredFarmsWeather = async () => {
    try {
      const data = await api.weather.getFarmsWeather();
      setRegisteredFarmsWeather(data);
    } catch (e) {
      console.warn('Registered farms weather unavailable:', e);
    }
  };

  const loadWeatherAdvisories = async () => {
    try {
      const data = await api.weather.getAdvisories();
      setWeatherAdvisories(data);
    } catch (e) {
      console.warn('Weather advisories unavailable:', e);
    }
  };

  const loadWeatherForLocation = async (lat: number, lng: number, locName: string, farmId?: string) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      if (farmId) {
        const obs = await api.weather.getFarmWeather(farmId);
        setActiveWeatherObservation(obs.weather);
      } else {
        const obs = await api.weather.getCurrent(lat, lng, locName);
        setActiveWeatherObservation(obs);
      }
    } catch (e: any) {
      setWeatherError(e.message || 'Failed to fetch weather observation');
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherRadar();
    loadRegisteredFarmsWeather();
    loadWeatherAdvisories();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadWeatherForLocation(userLocation.lat, userLocation.lng, 'Your Location');
    }
  }, [userLocation]);

  // Default Center: Chennai, Tamil Nadu, India
  const defaultPosition: [number, number] = [13.0827, 80.2707];
  const defaultZoom = 10;

  // Filter and deduplicate all valid cases from MongoDB
  const mappableCases: MappableDiseaseCase[] = useMemo(() => {
    const rawList = (cases || [])
      .map((c) => {
        const coords = parseCoordinates(c);
        if (!coords) return null;
        return {
          ...c,
          normalizedLat: coords.lat,
          normalizedLng: coords.lng,
        };
      })
      .filter((c): c is MappableDiseaseCase => c !== null);

    // Deduplicate by MongoDB unique ID
    const uniqueMap = new Map<string, MappableDiseaseCase>();
    rawList.forEach((c) => {
      if (!uniqueMap.has(c.id)) {
        uniqueMap.set(c.id, c);
      }
    });
    return Array.from(uniqueMap.values());
  }, [cases]);

  // Calculate distances from user's current location using Haversine formula
  const casesWithDistance: NearbyDiseaseAlert[] = useMemo(() => {
    if (!userLocation) return [];
    return mappableCases.map((c) => {
      const distanceKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        c.normalizedLat,
        c.normalizedLng
      );
      return {
        ...c,
        distanceKm,
      };
    });
  }, [mappableCases, userLocation]);

  // Filter nearby alerts within the selected radius, sorted nearest & most severe first
  const nearbyAlerts: NearbyDiseaseAlert[] = useMemo(() => {
    if (!userLocation) return [];
    const filtered = casesWithDistance.filter((c) => c.distanceKm <= radiusKm);

    const severityRank: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...filtered].sort((a, b) => {
      if (sortOrder === 'SEVERITY') {
        const sDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        if (sDiff !== 0) return sDiff;
        return a.distanceKm - b.distanceKm;
      }
      // Default: Nearest first; if distances are equal, most severe first
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    });
  }, [casesWithDistance, radiusKm, sortOrder, userLocation]);

  /**
   * REQUIREMENT 1 & 3:
   * When userLocation is active, ONLY display markers within radiusKm!
   * Distant markers outside the radius are strictly removed from both map and list.
   * If userLocation is not active, all mapped cases matching severity filter are shown.
   */
  const displayedCases = useMemo(() => {
    let list: MappableDiseaseCase[] = mappableCases;

    if (userLocation) {
      // Strictly restrict to disease reports within the selected radius
      list = casesWithDistance.filter((c) => c.distanceKm <= radiusKm);
    }

    if (selectedFilter !== 'ALL') {
      list = list.filter(
        (c) => (c.severity || '').toUpperCase() === selectedFilter.toUpperCase()
      );
    }

    // Deduplicate by unique MongoDB ID
    const uniqueMap = new Map<string, MappableDiseaseCase>();
    list.forEach((c) => {
      if (!uniqueMap.has(c.id)) {
        uniqueMap.set(c.id, c);
      }
    });

    const deduped = Array.from(uniqueMap.values());

    if (userLocation) {
      const severityRank: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      deduped.sort((a, b) => {
        const distA = (a as any).distanceKm ?? 999999;
        const distB = (b as any).distanceKm ?? 999999;
        if (sortOrder === 'SEVERITY') {
          const sDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
          if (sDiff !== 0) return sDiff;
          return distA - distB;
        }
        if (distA !== distB) {
          return distA - distB;
        }
        return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      });
    }

    return deduped;
  }, [mappableCases, userLocation, casesWithDistance, radiusKm, selectedFilter, sortOrder]);

  const handleSyncCoordinates = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await api.diseases.syncCoordinates();
      setSyncFeedback(res.message);
      if (onRetry) {
        onRetry();
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'Failed to synchronize coordinates with farm locations.');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Save successful location to localStorage
   */
  const saveLocationCache = useCallback((lat: number, lng: number, rKm: number) => {
    try {
      const cacheData: CachedLocationState = {
        lat,
        lng,
        timestamp: Date.now(),
        dateString: new Date().toDateString(),
        radiusKm: rKm,
        permissionGranted: true,
      };
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // ignore localStorage quota errors
    }
  }, []);

  /**
   * Request live location from Browser Geolocation API
   */
  const requestLocation = useCallback(
    (isAutomaticNewDay = false) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your web browser.');
        return;
      }

      setLocating(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setIsLiveLocation(true);
          const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastUpdatedText(`Live GPS (${timeFormatted})`);
          setLocating(false);
          setLocationError(null);
          setFocusTarget([lat, lng]);

          // Save to localStorage with today's timestamp
          saveLocationCache(lat, lng, radiusKm);
        },
        (geoError) => {
          setLocating(false);
          if (isAutomaticNewDay) {
            // If automatic new day refresh failed, inform user gently
            setLocationError('Daily location update could not acquire GPS. Click "Refresh Location" to retry.');
            return;
          }
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              setLocationError(
                'Location permission was denied. Please allow location access in your browser to discover nearby outbreak alerts.'
              );
              break;
            case geoError.POSITION_UNAVAILABLE:
              setLocationError(
                'Location information is currently unavailable. Please check your network or GPS connection.'
              );
              break;
            case geoError.TIMEOUT:
              setLocationError('Location request timed out. Please try again.');
              break;
            default:
              setLocationError(geoError.message || 'Unable to retrieve your current location.');
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    },
    [radiusKm, saveLocationCache]
  );

  /**
   * REQUIREMENT 2 & 4:
   * Startup / Page Navigation Logic:
   * Check whether location was already refreshed today.
   * If refreshed today, reuse saved location without requesting geolocation again.
   * If from a previous calendar day, automatically refresh location for the new day.
   */
  useEffect(() => {
    try {
      const cachedStr = localStorage.getItem(STORAGE_CACHE_KEY);
      if (!cachedStr) return;

      const cached: CachedLocationState = JSON.parse(cachedStr);
      if (!cached || typeof cached.lat !== 'number' || typeof cached.lng !== 'number') return;

      if (isRefreshedToday(cached.timestamp)) {
        // Re-use saved location without requesting geolocation again!
        setUserLocation({ lat: cached.lat, lng: cached.lng });
        setIsLiveLocation(false); // Explicitly do NOT claim it is live
        const savedTime = new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastUpdatedText(`Saved (Cached today at ${savedTime})`);
        if (cached.radiusKm) {
          setRadiusKm(cached.radiusKm);
        }
        setFocusTarget([cached.lat, cached.lng]);
      } else {
        // Last update was on a previous calendar day! Refresh location and alerts for the new day
        if (cached.permissionGranted) {
          requestLocation(true);
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, [requestLocation]);

  // Update cached radius when user switches radius
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    if (userLocation) {
      saveLocationCache(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  // Trigger In-App Notifications for nearby Critical and High severity active disease reports without duplicates
  useEffect(() => {
    if (!userLocation || !enableNearbyNotifications || nearbyAlerts.length === 0) {
      return;
    }

    // Do not treat resolved cases as active outbreak alerts!
    const severeAlerts = nearbyAlerts.filter(
      (c) =>
        (c.severity === 'CRITICAL' || c.severity === 'HIGH') &&
        (c.status || '').toUpperCase() !== 'RESOLVED' &&
        !notifiedCaseIdsRef.current.has(c.id)
    );

    if (severeAlerts.length > 0) {
      severeAlerts.forEach((c) => notifiedCaseIdsRef.current.add(c.id));
      setInAppAlert({
        id: Date.now().toString(),
        count: severeAlerts.length,
        cases: severeAlerts,
      });
    }
  }, [nearbyAlerts, userLocation, enableNearbyNotifications]);

  const handleClearLocation = () => {
    setUserLocation(null);
    setIsLiveLocation(false);
    setLastUpdatedText('');
    setLocationError(null);
    setInAppAlert(null);
    setFocusTarget(defaultPosition);
    try {
      localStorage.removeItem(STORAGE_CACHE_KEY);
    } catch {
      // ignore
    }
  };

  const handleFindNearbyAlerts = () => {
    if (!userLocation) {
      requestLocation(false);
    } else {
      if (onRetry) {
        onRetry();
      }
      setFocusTarget([userLocation.lat, userLocation.lng]);
    }
  };

  const handleFocusOnAlert = (alertCase: NearbyDiseaseAlert) => {
    setFocusTarget([alertCase.normalizedLat, alertCase.normalizedLng]);
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // User Location Marker Icon: Distinct glowing blue marker labelled "Your Location"
  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'custom-leaflet-marker-user',
      html: `
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div class="pulse-user-location" style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
            border: 3px solid #ffffff;
            box-shadow: 0 0 18px rgba(14, 165, 233, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -22px;
            background: #0284c7;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.45);
            letter-spacing: 0.02em;
            pointer-events: none;
          ">
            Your Location
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -22],
    });
  };

  // Weather marker icon: clean pill badge displaying weather emoji and live temperature in °C
  const createFarmWeatherIcon = (summary: FarmWeatherSummary) => {
    const temp = summary.weather?.temperature != null ? summary.weather.temperature : '--';
    const icon = summary.weather ? getWeatherEmoji(summary.weather.weatherCode) : '⛅';
    const rainfall = summary.weather?.precipitation || 0;
    const isRain = rainfall > 0;

    return L.divIcon({
      className: 'custom-leaflet-marker-weather',
      html: `
        <div style="
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(13, 24, 41, 0.94);
          border: 1.5px solid ${isRain ? '#38bdf8' : '#34d399'};
          border-radius: 9999px;
          padding: 2px 7px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
          cursor: pointer;
          white-space: nowrap;
          transform: translate(-50%, -50%);
        ">
          <span style="font-size: 13px;">${icon}</span>
          <span style="color: #ffffff; font-weight: 800; font-size: 11px;">${temp}°C</span>
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
      popupAnchor: [0, -14],
    });
  };

  // Severity & status marker styling (CRITICAL: red, HIGH: orange, MEDIUM: yellow, LOW: green, RESOLVED: calm checkmark)
  const createCustomIcon = (severity: string, status?: string) => {
    const isResolved = (status || '').toUpperCase() === 'RESOLVED';
    const sev = (severity || '').toUpperCase();
    let color = '#10b981';
    let pulseClass = '';
    let size = 28;

    if (isResolved) {
      // Resolved case: calm emerald indicator with checkmark and no alarm pulsing
      color = '#10b981';
      size = 26;
      pulseClass = '';
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
            cursor: pointer;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    if (sev === 'CRITICAL') {
      color = '#ef4444';
      pulseClass = 'pulse-critical';
      size = 34;
    } else if (sev === 'HIGH') {
      color = '#f97316';
      pulseClass = 'pulse-warning';
      size = 30;
    } else if (sev === 'MEDIUM') {
      color = '#eab308';
      size = 28;
    } else {
      color = '#10b981';
      size = 28;
    }

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 0 16px ${color};
          cursor: pointer;
        " class="${pulseClass}">
          <svg width="${size - 14}" height="${size - 14}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Subheader summary text
  const getSubheaderText = () => {
    if (loading) {
      return 'Loading disease surveillance data from MongoDB...';
    }
    if (error) {
      return 'Unable to load disease surveillance data.';
    }
    if (userLocation) {
      return `${lastUpdatedText || 'Location Set'} • ${displayedCases.length} outbreak alert${
        displayedCases.length === 1 ? '' : 's'
      } within ${radiusKm} km radius`;
    }
    return `Live geospatial surveillance across active agricultural plots (${displayedCases.length} mapped ${
      displayedCases.length === 1 ? 'case' : 'cases'
    })`;
  };

  return (
    <div
      ref={mapContainerRef}
      className="card-glass"
      style={{
        padding: '0',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Map Header Controls */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(7, 10, 20, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: userLocation ? 'rgba(14, 165, 233, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              color: userLocation ? '#38bdf8' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: userLocation ? '0 0 12px rgba(14, 165, 233, 0.4)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {userLocation ? <Radar size={20} /> : <ShieldAlert size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              GIS Disease Outbreak Radar
              {userLocation && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: isLiveLocation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                    color: isLiveLocation ? '#34d399' : '#38bdf8',
                    border: '1px solid ' + (isLiveLocation ? 'rgba(16, 185, 129, 0.4)' : 'rgba(14, 165, 233, 0.4)'),
                    fontWeight: 700,
                  }}
                >
                  {isLiveLocation ? 'LIVE LOCATION' : 'SAVED LOCATION'}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: error ? '#f87171' : userLocation ? '#7dd3fc' : loading ? '#38bdf8' : 'var(--text-dim)',
                fontWeight: error || loading || userLocation ? 600 : 400,
              }}
            >
              {getSubheaderText()}
            </div>
          </div>
        </div>

        {/* Right side controls: Layer Toggles, Location & Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Layer Visibility Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.04)', padding: '3px 6px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setShowDiseaseLayer(!showDiseaseLayer)}
              style={{
                background: showDiseaseLayer ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                color: showDiseaseLayer ? '#34d399' : 'var(--text-muted)',
                border: showDiseaseLayer ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle Disease Surveillance Outbreak Layer"
            >
              <ShieldAlert size={13} /> Disease Radar {showDiseaseLayer ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setShowWeatherLayer(!showWeatherLayer)}
              style={{
                background: showWeatherLayer ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: showWeatherLayer ? '#38bdf8' : 'var(--text-muted)',
                border: showWeatherLayer ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle Live Weather Radar & Observations Layer"
            >
              <CloudRain size={13} /> Weather {showWeatherLayer ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={() => setShowWeatherPanel(!showWeatherPanel)}
              style={{
                background: showWeatherPanel ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                color: showWeatherPanel ? '#22d3ee' : 'var(--text-muted)',
                border: showWeatherPanel ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle Weather Forecast & Meteorological Panel"
            >
              <Thermometer size={13} /> Forecast
            </button>
          </div>

          {/* Location Actions: Enable or Refresh */}
          {!userLocation ? (
            <button
              onClick={() => requestLocation(false)}
              disabled={locating}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: locating ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 16px rgba(14, 165, 233, 0.35)',
                transition: 'all 0.2s ease',
              }}
              title="Acquire coordinates from browser Geolocation API"
            >
              <Navigation size={14} className={locating ? 'spin-animation' : ''} />
              {locating ? 'Detecting Location...' : 'Use My Current Location'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => requestLocation(false)}
                disabled={locating}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: locating ? 'not-allowed' : 'pointer',
                }}
                title="Explicitly refresh GPS location from browser"
              >
                <RefreshCw size={13} className={locating ? 'spin-animation' : ''} />
                {locating ? 'Updating...' : 'Refresh Location'}
              </button>
              <button
                onClick={() => setFocusTarget([userLocation.lat, userLocation.lng])}
                className="btn btn-sm"
                style={{
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
                title="Pan map to your coordinates"
              >
                <LocateFixed size={14} /> Center
              </button>
              <button
                onClick={handleClearLocation}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                }}
                title="Clear saved location"
              >
                Reset
              </button>
            </div>
          )}

          {/* Severity Legend / Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => {
              const isSelected = selectedFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setSelectedFilter(s)}
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    border:
                      '1px solid ' +
                      (isSelected ? 'rgba(255,255,255,0.3)' : 'var(--border-subtle)'),
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* In-App Notification Banner for Nearby Severe Alerts */}
      {inAppAlert && enableNearbyNotifications && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(249, 115, 22, 0.2) 100%)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.45)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: 1.4 }}>
              <strong style={{ color: '#ffffff' }}>Severe Outbreak Warning:</strong> Detected{' '}
              <strong>{inAppAlert.count}</strong> critical/high-severity pathogen
              {inAppAlert.count === 1 ? '' : 's'} within {radiusKm} km of your location!
              {inAppAlert.cases[0] && (
                <span style={{ color: '#fef08a', marginLeft: '6px' }}>
                  ({inAppAlert.cases[0].diseaseName} • {inAppAlert.cases[0].distanceKm} km away)
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {inAppAlert.cases[0] && (
              <button
                onClick={() => handleFocusOnAlert(inAppAlert.cases[0])}
                className="btn btn-sm"
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Focus Outbreak
              </button>
            )}
            <button
              onClick={() => setInAppAlert(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Dismiss Notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Geolocation Permission / Error Banner */}
      {locationError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.14)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{locationError}</span>
          </div>
          <button
            onClick={() => setLocationError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height: '480px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={defaultPosition}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#0a0f1d' }}
        >
          {/* OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Live Weather Radar Overlay (RainViewer) */}
          {showWeatherLayer && radarTileUrl && (
            <TileLayer
              attribution='&copy; <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a> Radar'
              url={radarTileUrl}
              opacity={0.6}
              zIndex={300}
            />
          )}

          {/* Controller to auto-fit disease markers or default */}
          <MapBoundsController
            markers={displayedCases}
            center={defaultPosition}
            defaultZoom={defaultZoom}
            userLocation={userLocation}
          />

          {/* Controller to fly smoothly to selected focus target */}
          <MapFocusController target={focusTarget} zoom={12} />

          {/* User Location Marker & Radius Circle */}
          {userLocation && (
            <>
              {showRadiusCircle && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={radiusKm * 1000} // Leaflet circle radius in meters
                  pathOptions={{
                    color: '#0284c7',
                    fillColor: '#38bdf8',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '5, 8',
                  }}
                />
              )}
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserLocationIcon()}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: '220px',
                      fontFamily: 'var(--font-sans)',
                      color: '#0f172a',
                      fontSize: '0.82rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.96rem',
                        color: '#0284c7',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Navigation size={16} /> Your Location
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                      Coordinates:{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                      </strong>
                    </div>
                    <div
                      style={{
                        background: '#f0f9ff',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        fontSize: '0.75rem',
                        color: '#0369a1',
                        marginBottom: '8px',
                      }}
                    >
                      Search Radius: <strong>{radiusKm} km</strong>
                      <br />
                      Nearby Alerts: <strong>{displayedCases.length}</strong>
                      <br />
                      Status: <strong>{isLiveLocation ? 'Live GPS' : 'Saved (Cached Today)'}</strong>
                    </div>
                    <button
                      onClick={() => requestLocation(false)}
                      style={{
                        width: '100%',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Refresh Location
                    </button>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Registered Farms Weather Markers */}
          {showWeatherLayer && registeredFarmsWeather.map((summary) => (
            <Marker
              key={`weather-farm-${summary.farmId}`}
              position={[summary.latitude, summary.longitude]}
              icon={createFarmWeatherIcon(summary)}
            >
              <Popup>
                <div style={{ minWidth: '220px', fontFamily: 'var(--font-sans)', color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0284c7', marginBottom: '4px' }}>
                    🏡 {summary.farmName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '8px' }}>
                    Crop: <strong>{summary.currentCrop || 'Field Crop'}</strong>
                  </div>
                  <div style={{ background: '#f0f9ff', padding: '8px', borderRadius: '6px', border: '1px solid #bae6fd', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Condition:</span>
                      <strong>{summary.weather?.conditionText || 'Clear'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Temperature:</span>
                      <strong>{summary.weather?.temperature != null ? `${summary.weather.temperature}°C` : 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Humidity:</span>
                      <strong>{summary.weather?.relativeHumidity != null ? `${summary.weather.relativeHumidity}%` : 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rainfall:</span>
                      <strong>{summary.weather?.precipitation != null ? `${summary.weather.precipitation} mm` : '0 mm'}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWeatherLocationId(summary.farmId);
                      loadWeatherForLocation(summary.latitude, summary.longitude, summary.farmName, summary.farmId);
                      setShowWeatherPanel(true);
                    }}
                    style={{
                      width: '100%',
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📊 View Detailed Weather & Forecast
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Disease Outbreak Markers (Rendered when Disease Layer is active) */}
          {showDiseaseLayer && displayedCases.map((c) => {
            const isCritical = (c.severity || '').toUpperCase() === 'CRITICAL' && (c.status || '').toUpperCase() !== 'RESOLVED';
            const farmName =
              c.farm?.farmName ||
              (typeof c.farm === 'string' ? c.farm : 'Farm Plot');
            const locationAddress =
              c.locationAddress || c.farm?.locationAddress || 'N/A';
            const cropName =
              c.crop || c.cropVariety?.cropName || c.farm?.currentCrop || 'N/A';
            const varietyName =
              c.cropVariety?.varietyName ||
              (typeof c.cropVariety === 'string' ? c.cropVariety : 'Standard Variety');
            const farmerName = c.farm?.farmer?.fullName;
            const dateString = c.dateObserved
              ? new Date(c.dateObserved).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A';

            // Calculate distance to this case if user location is active
            const caseDistance = userLocation
              ? calculateHaversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  c.normalizedLat,
                  c.normalizedLng
                )
              : null;

            return (
              <React.Fragment key={c.id}>
                {isCritical && (
                  <Circle
                    center={[c.normalizedLat, c.normalizedLng]}
                    radius={35000} // 35km quarantine / buffer zone
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.15,
                      dashArray: '4, 8',
                    }}
                  />
                )}
                <Marker
                  position={[c.normalizedLat, c.normalizedLng]}
                  icon={createCustomIcon(c.severity, c.status)}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: '250px',
                        maxWidth: '310px',
                        fontFamily: 'var(--font-sans)',
                        color: '#0f172a',
                        fontSize: '0.82rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <SeverityBadge severity={c.severity} />
                          {c.isDemo ? (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                background: '#f1f5f9',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              DEMO RECORD
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              FIELD REPORT
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                          }}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.98rem',
                          color: '#0f172a',
                          marginBottom: '6px',
                          lineHeight: 1.3,
                        }}
                      >
                        {c.diseaseName}
                      </div>

                      {caseDistance !== null && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '8px',
                          }}
                        >
                          <Navigation size={13} /> {caseDistance} km away from your location
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          marginBottom: '8px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#334155' }}>Crop:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{cropName}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#334155' }}>Variety:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{varietyName}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#334155' }}>Farm:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{farmName}</span>
                          {farmerName && (
                            <span style={{ color: '#64748b' }}> ({farmerName})</span>
                          )}
                        </div>
                        <div>
                          <strong style={{ color: '#334155' }}>Location:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{locationAddress}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#334155' }}>Observed:</strong>{' '}
                          <span style={{ color: '#0f172a' }}>{dateString}</span>
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          marginBottom: '8px',
                        }}
                      >
                        <strong style={{ color: '#1e293b' }}>Symptoms:</strong> {c.symptoms}
                      </div>

                      {c.recommendedTreatment && (
                        <div
                          style={{
                            background: '#ecfdf5',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            marginBottom: '8px',
                          }}
                        >
                          <strong>Prescribed Treatment:</strong> {c.recommendedTreatment}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleOpenReport(c, e)}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
                      >
                        <Eye size={12} /> View Full Surveillance Report
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Loading Overlay */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(10, 15, 29, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.15)',
                borderTopColor: '#10b981',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Loading disease surveillance data...
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {!loading && error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(10, 15, 29, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={36} color="#ef4444" />
            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#fff' }}>
              Unable to load disease surveillance data.
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
              Failed to connect to the disease reports API. Please check your network or server status.
            </div>
            {onRetry && (
              <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                <RefreshCw size={14} /> Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Empty State Overlay */}
        {!loading && !error && showDiseaseLayer && displayedCases.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 32px',
              textAlign: 'center',
              maxWidth: '420px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
          >
            <ShieldAlert size={36} color={cases.length > 0 && mappableCases.length === 0 ? '#f59e0b' : '#10b981'} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '6px' }}>
              {userLocation
                ? `No disease alerts found within ${radiusKm} km.`
                : cases.length > 0 && mappableCases.length === 0
                ? 'Unmapped Outbreak Reports'
                : mappableCases.length === 0
                ? 'No Mapped Outbreak Data'
                : `No ${selectedFilter} Outbreaks`}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: (cases.length > 0 && mappableCases.length === 0) || (cases.length === 0 && onOpenReportModal) ? '14px' : '0' }}>
              {userLocation
                ? `Disease surveillance only: No active pathogen outbreaks detected in MongoDB within ${radiusKm} km. (Meteorological observations and rain radar are tracked separately via the Weather Layer).`
                : cases.length > 0 && mappableCases.length === 0
                ? `Found ${cases.length} disease report${cases.length === 1 ? '' : 's'} in the database, but geographic coordinates are missing. You can safely synchronize them using verified farm locations.`
                : mappableCases.length === 0
                ? 'No disease reports with valid geographic coordinates were found in the database.'
                : `No disease outbreaks currently match the ${selectedFilter} severity level.`}
            </div>

            {/* Action buttons inside empty state */}
            {!userLocation && cases.length > 0 && mappableCases.length === 0 && (
              <button
                onClick={handleSyncCoordinates}
                disabled={syncing}
                className="btn btn-primary btn-sm"
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  padding: '7px 14px',
                }}
              >
                <RefreshCw size={13} className={syncing ? 'spin-animation' : ''} />
                {syncing ? 'Synchronizing Farm Locations...' : 'Sync with Verified Farm Locations'}
              </button>
            )}

            {!userLocation && cases.length === 0 && onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="btn btn-danger btn-sm"
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  padding: '7px 14px',
                }}
              >
                <Plus size={14} /> Report Disease Outbreak
              </button>
            )}

            {syncFeedback && (
              <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
                {syncFeedback}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weather Details Panel (Collapsible Drawer / Panel) */}
      {showWeatherPanel && (
        <div style={{ padding: '16px 20px', background: 'rgba(9, 14, 26, 0.98)', borderTop: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <WeatherDetailsPanel
            weather={activeWeatherObservation}
            loading={weatherLoading}
            error={weatherError}
            advisories={weatherAdvisories}
            availableLocations={registeredFarmsWeather.map((f) => ({
              id: f.farmId,
              name: f.farmName,
              lat: f.latitude,
              lng: f.longitude,
            }))}
            selectedLocationId={selectedWeatherLocationId}
            onSelectLocation={(locId) => {
              setSelectedWeatherLocationId(locId);
              if (!locId) {
                if (userLocation) {
                  loadWeatherForLocation(userLocation.lat, userLocation.lng, 'Your Location');
                }
              } else {
                const target = registeredFarmsWeather.find((f) => f.farmId === locId);
                if (target) {
                  loadWeatherForLocation(target.latitude, target.longitude, target.farmName, target.farmId);
                  setFocusTarget([target.latitude, target.longitude]);
                }
              }
            }}
            onRefresh={() => {
              if (selectedWeatherLocationId) {
                const target = registeredFarmsWeather.find((f) => f.farmId === selectedWeatherLocationId);
                if (target) {
                  loadWeatherForLocation(target.latitude, target.longitude, target.farmName, target.farmId);
                }
              } else if (userLocation) {
                loadWeatherForLocation(userLocation.lat, userLocation.lng, 'Your Location');
              } else {
                loadWeatherRadar();
                loadRegisteredFarmsWeather();
              }
            }}
            onClose={() => setShowWeatherPanel(false)}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: NEARBY DISEASE ALERTS PANEL & CONTROLS                */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          padding: '18px 22px',
          background: 'rgba(11, 17, 33, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radar size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Nearby Disease Alerts
                {userLocation && (
                  <span
                    style={{
                      background: displayedCases.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: displayedCases.length > 0 ? '#ef4444' : '#10b981',
                      border: displayedCases.length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '1px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {displayedCases.length} within {radiusKm} km
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
                {userLocation
                  ? `Calculated using Haversine formula from [${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}] • ${lastUpdatedText || 'Today'}`
                  : 'Click "Use My Current Location" to calculate distances and filter out distant cases'}
              </div>
            </div>
          </div>

          {/* Radius Filters & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Radius selection pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '3px',
                gap: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  padding: '2px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Radius:
              </span>
              {[5, 10, 25, 50].map((r) => {
                const isActive = radiusKm === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRadiusChange(r)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 9px',
                      fontSize: '0.73rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 0 10px rgba(14, 165, 233, 0.4)' : 'none',
                    }}
                  >
                    {r} km
                  </button>
                );
              })}
            </div>

            {/* Find Nearby Alerts Action */}
            <button
              onClick={handleFindNearbyAlerts}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
              }}
              title="Refresh and recalculate nearby disease outbreaks"
            >
              <RefreshCw size={13} /> Find Nearby Alerts
            </button>

            {/* Circle overlay toggle */}
            {userLocation && (
              <button
                onClick={() => setShowRadiusCircle(!showRadiusCircle)}
                style={{
                  background: showRadiusCircle ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: showRadiusCircle ? '#38bdf8' : 'var(--text-dim)',
                  border: '1px solid ' + (showRadiusCircle ? 'rgba(14, 165, 233, 0.4)' : 'var(--border-subtle)'),
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Toggle search radius circle overlay on map"
              >
                {showRadiusCircle ? 'Circle: Visible' : 'Circle: Hidden'}
              </button>
            )}

            {/* In-app notification toggle */}
            <button
              onClick={() => setEnableNearbyNotifications(!enableNearbyNotifications)}
              style={{
                background: enableNearbyNotifications ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: enableNearbyNotifications ? '#34d399' : 'var(--text-dim)',
                border: '1px solid ' + (enableNearbyNotifications ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'),
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
              title="Toggle in-app outbreak alert notifications"
            >
              {enableNearbyNotifications ? <Bell size={13} /> : <BellOff size={13} />}
              {enableNearbyNotifications ? 'Alerts: ON' : 'Alerts: OFF'}
            </button>

            {/* Sort Toggle */}
            {userLocation && displayedCases.length > 0 && (
              <select
                className="select-field"
                style={{
                  width: 'auto',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  height: '32px',
                  borderRadius: '8px',
                }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="NEAREST">Sort: Nearest First</option>
                <option value="SEVERITY">Sort: Highest Severity</option>
              </select>
            )}
          </div>
        </div>

        {/* Nearby Alerts Content */}
        {!userLocation ? (
          locationError ? (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px dashed rgba(239, 68, 68, 0.3)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff' }}>
                Location Permission Required
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.4 }}>
                {locationError}
              </div>
              <button
                onClick={() => requestLocation(false)}
                disabled={locating}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <RefreshCw size={14} className={locating ? 'spin-animation' : ''} />
                {locating ? 'Requesting Permission...' : 'Retry Location Access'}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Navigation size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff' }}>
                Current Location Not Activated
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.4 }}>
                Click <strong>"Use My Current Location"</strong> to detect your coordinates using the browser Geolocation API and instantly discover outbreaks within your selected search radius.
              </div>
              <button
                onClick={() => requestLocation(false)}
                disabled={locating}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                  color: '#fff',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                <Navigation size={14} className={locating ? 'spin-animation' : ''} />
                {locating ? 'Requesting Location...' : 'Use My Current Location'}
              </button>
            </div>
          )
        ) : displayedCases.length === 0 ? (
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={36} color="#10b981" />
            <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff' }}>
              No disease alerts found within {radiusKm} km.
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '460px', lineHeight: 1.4 }}>
              Your agricultural perimeter appears clear. Distant disease reports elsewhere in the state are removed from the map and list to prevent false proximity warnings.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {radiusKm < 25 && (
                <button
                  onClick={() => handleRadiusChange(25)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem' }}
                >
                  Expand to 25 km
                </button>
              )}
              {radiusKm < 50 && (
                <button
                  onClick={() => handleRadiusChange(50)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem' }}
                >
                  Expand to 50 km
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '12px',
            }}
          >
            {displayedCases.map((alert) => {
              const cropName =
                alert.crop || alert.cropVariety?.cropName || alert.farm?.currentCrop || 'Crop Plot';
              const varietyName = alert.cropVariety?.varietyName;
              const farmName =
                alert.farm?.farmName || (typeof alert.farm === 'string' ? alert.farm : 'Farm Plot');
              const dateStr = alert.dateObserved
                ? new Date(alert.dateObserved).toLocaleDateString()
                : 'N/A';
              const isSevere = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
              const dist = (alert as any).distanceKm !== undefined ? (alert as any).distanceKm : null;

              return (
                <div
                  key={alert.id}
                  style={{
                    background: isSevere ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                    border:
                      '1px solid ' +
                      (alert.severity === 'CRITICAL'
                        ? 'rgba(239, 68, 68, 0.4)'
                        : alert.severity === 'HIGH'
                        ? 'rgba(249, 115, 22, 0.35)'
                        : 'var(--border-subtle)'),
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Header: Severity, Status & Distance */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SeverityBadge severity={alert.severity} />
                        {alert.isDemo ? (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: 'rgba(148, 163, 184, 0.15)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(148, 163, 184, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            DEMO
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            FIELD REPORT
                          </span>
                        )}
                        <StatusBadge status={alert.status} />
                      </div>
                      {dist !== null && (
                        <div
                          style={{
                            background: 'rgba(14, 165, 233, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(14, 165, 233, 0.35)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Navigation size={11} /> {dist} km away
                        </div>
                      )}
                    </div>

                    {/* Pathogen Title */}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        color: '#fff',
                        marginBottom: '6px',
                        lineHeight: 1.3,
                      }}
                    >
                      {alert.diseaseName}
                    </div>

                    {/* Meta details */}
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Sprout size={13} color="#34d399" />
                        <span>
                          <strong style={{ color: '#e2e8f0' }}>{cropName}</strong>
                          {varietyName && ` • ${varietyName}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} color="#94a3b8" />
                        <span style={{ color: '#cbd5e1' }}>
                          {farmName} ({alert.locationAddress || 'N/A'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} color="#64748b" />
                        <span style={{ color: 'var(--text-dim)' }}>Observed: {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                    }}
                  >
                    <button
                      onClick={() => handleFocusOnAlert(alert as any)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        fontSize: '0.72rem',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                      title="Center and zoom map to this case location"
                    >
                      <Crosshair size={13} /> Focus on Map
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleOpenReport(alert, e)}
                      className="btn btn-primary btn-sm"
                      style={{
                        flex: 1,
                        fontSize: '0.72rem',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Eye size={13} /> View Full Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
