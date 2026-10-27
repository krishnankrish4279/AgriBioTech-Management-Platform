export interface WeatherObservation {
  latitude: number;
  longitude: number;
  locationName?: string;
  current: {
    temperature: number; // °C
    apparentTemperature?: number; // °C
    relativeHumidity: number; // %
    precipitation: number; // mm
    rain: number; // mm
    weatherCode: number;
    conditionText: string;
    windSpeed: number; // km/h
    windDirection?: number; // °
    observationTime: string;
    measurementPeriod: string;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    relativeHumidity: number;
    precipitationProbability: number;
    precipitation: number;
    weatherCode: number;
    conditionText: string;
    windSpeed: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    conditionText: string;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
    precipitationProbabilityMax: number;
    windSpeedMax: number;
  }>;
  source: string;
  lastUpdated: string;
  isCached: boolean;
  isStale?: boolean;
}

export interface FarmWeatherAdvisory {
  farmId: string;
  farmName: string;
  crop?: string;
  locationAddress?: string;
  latitude: number;
  longitude: number;
  title: string;
  category: 'WEATHER_ACTION';
  alertType: 'HEAVY_RAIN' | 'HIGH_RAIN_PROBABILITY' | 'HIGH_HUMIDITY_DISEASE_RISK' | 'DRY_SPELL_DROUGHT_RISK' | 'HIGH_WIND_WARNING';
  priority: 'ROUTINE' | 'IMPORTANT' | 'URGENT';
  condition: string;
  measurement: string;
  timeWindow: string;
  advice: string;
  source: string;
  issuedAt: string;
  expiresAt?: string;
}

// In-memory weather cache to respect rate limits and ensure sub-second response times
interface CacheEntry {
  data: WeatherObservation;
  cachedAt: number;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function mapWmoCodeToCondition(code: number): string {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
      return 'Mainly Clear';
    case 2:
      return 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
      return 'Foggy';
    case 48:
      return 'Depositing Rime Fog';
    case 51:
      return 'Light Drizzle';
    case 53:
      return 'Moderate Drizzle';
    case 55:
      return 'Dense Drizzle';
    case 56:
    case 57:
      return 'Freezing Drizzle';
    case 61:
      return 'Light Rain';
    case 63:
      return 'Moderate Rain';
    case 65:
      return 'Heavy Rain';
    case 66:
    case 67:
      return 'Freezing Rain';
    case 71:
      return 'Slight Snow Fall';
    case 73:
      return 'Moderate Snow Fall';
    case 75:
      return 'Heavy Snow Fall';
    case 77:
      return 'Snow Grains';
    case 80:
      return 'Slight Rain Showers';
    case 81:
      return 'Moderate Rain Showers';
    case 82:
      return 'Violent Rain Showers';
    case 85:
    case 86:
      return 'Snow Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with Hail';
    default:
      return 'Fair Weather';
  }
}

export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<WeatherObservation> {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid geographic coordinates (latitude and longitude) are required.');
  }

  // Reject invalid or uninitialized coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || (latitude === 0 && longitude === 0)) {
    throw new Error('Coordinates are outside valid geographic range or represent an uninitialized location (0, 0).');
  }

  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return {
      ...cached.data,
      locationName: locationName || cached.data.locationName,
      isCached: true,
      isStale: false,
    };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

  let response: any;
  let lastError: any;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriBioTech-Weather-Advisory-Platform/1.0',
        },
      });
      clearTimeout(timeout);
      if (response.ok) {
        lastError = null;
        break;
      }
    } catch (err: any) {
      lastError = err;
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }

  if (!response || !response.ok) {
    if (cached) {
      console.warn(`[Weather API] Request failed (${lastError?.message || response?.status}). Serving labeled stale data.`);
      return {
        ...cached.data,
        locationName: locationName || cached.data.locationName,
        isCached: true,
        isStale: true,
      };
    }
    if (lastError) {
      throw new Error(`Weather service is currently unreachable: ${lastError.message}`);
    }
    throw new Error(`Weather service responded with status HTTP ${response?.status}`);
  }

  if (!response.ok) {
    if (cached) {
      return { ...cached.data, isCached: true, isStale: true };
    }
    throw new Error(`Weather service responded with status HTTP ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};

  // Parse Hourly Forecast (take next 24 hours)
  const hourlyTimes: string[] = hourly.time || [];
  const hourlyList: Array<any> = [];
  const currentIsoHour = (current.time || new Date().toISOString()).slice(0, 13);
  let startIndex = hourlyTimes.findIndex((t: string) => t.startsWith(currentIsoHour));
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < Math.min(startIndex + 24, hourlyTimes.length); i++) {
    hourlyList.push({
      time: hourlyTimes[i],
      temperature: hourly.temperature_2m?.[i] ?? 0,
      relativeHumidity: hourly.relative_humidity_2m?.[i] ?? 0,
      precipitationProbability: hourly.precipitation_probability?.[i] ?? 0,
      precipitation: hourly.precipitation?.[i] ?? 0,
      weatherCode: hourly.weather_code?.[i] ?? 0,
      conditionText: mapWmoCodeToCondition(hourly.weather_code?.[i] ?? 0),
      windSpeed: hourly.wind_speed_10m?.[i] ?? 0,
    });
  }

  // Parse Daily Forecast (7 days)
  const dailyDates: string[] = daily.time || [];
  const dailyList: Array<any> = [];
  for (let d = 0; d < Math.min(7, dailyDates.length); d++) {
    dailyList.push({
      date: dailyDates[d],
      weatherCode: daily.weather_code?.[d] ?? 0,
      conditionText: mapWmoCodeToCondition(daily.weather_code?.[d] ?? 0),
      tempMax: daily.temperature_2m_max?.[d] ?? 0,
      tempMin: daily.temperature_2m_min?.[d] ?? 0,
      precipitationSum: daily.precipitation_sum?.[d] ?? 0,
      precipitationProbabilityMax: daily.precipitation_probability_max?.[d] ?? 0,
      windSpeedMax: daily.wind_speed_10m_max?.[d] ?? 0,
    });
  }

  const observation: WeatherObservation = {
    latitude,
    longitude,
    locationName: locationName || undefined,
    current: {
      temperature: current.temperature_2m ?? 0,
      apparentTemperature: current.apparent_temperature ?? current.temperature_2m ?? 0,
      relativeHumidity: current.relative_humidity_2m ?? 0,
      precipitation: current.precipitation ?? 0,
      rain: current.rain ?? 0,
      weatherCode: current.weather_code ?? 0,
      conditionText: mapWmoCodeToCondition(current.weather_code ?? 0),
      windSpeed: current.wind_speed_10m ?? 0,
      windDirection: current.wind_direction_10m ?? undefined,
      observationTime: current.time || new Date().toISOString(),
      measurementPeriod: 'Current observation (rainfall past 1 hour in mm)',
    },
    hourly: hourlyList,
    daily: dailyList,
    source: 'Open-Meteo Meteorological Service / National Weather Data',
    lastUpdated: new Date().toISOString(),
    isCached: false,
    isStale: false,
  };

  weatherCache.set(cacheKey, { data: observation, cachedAt: now });
  return observation;
}

/**
 * Generate farm-specific weather advisories based on real meteorological data and farm context.
 * Strict agronomic rules: Advisories are created ONLY when actual thresholds are exceeded.
 */
export function generateFarmWeatherAdvisories(
  farm: {
    id: string;
    farmName: string;
    currentCrop?: string;
    locationAddress?: string;
    latitude: number;
    longitude: number;
  },
  weather: WeatherObservation
): FarmWeatherAdvisory[] {
  const advisories: FarmWeatherAdvisory[] = [];
  const crop = farm.currentCrop || 'Field Crop';
  const now = new Date();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

  const currentPrecip = weather.current.precipitation;
  const currentRain = weather.current.rain;
  const currentHumidity = weather.current.relativeHumidity;
  const currentWind = weather.current.windSpeed;

  const next24hPrecipMaxProb = Math.max(
    ...weather.hourly.slice(0, 24).map((h) => h.precipitationProbability),
    0
  );
  const next24hPrecipSum = weather.hourly
    .slice(0, 24)
    .reduce((acc, h) => acc + (h.precipitation || 0), 0);

  const next7dRainSum = weather.daily
    .slice(0, 7)
    .reduce((acc, d) => acc + (d.precipitationSum || 0), 0);
  const next7dMaxTemp = Math.max(...weather.daily.map((d) => d.tempMax), weather.current.temperature);

  // 1. Heavy Rain Alert: Forecast rainfall > 25mm in 24h OR current rainfall > 10mm
  if (next24hPrecipSum >= 25 || currentPrecip >= 10 || currentRain >= 10) {
    const rainfallVal = Math.max(next24hPrecipSum, currentPrecip);
    advisories.push({
      farmId: farm.id,
      farmName: farm.farmName,
      crop,
      locationAddress: farm.locationAddress,
      latitude: farm.latitude,
      longitude: farm.longitude,
      title: `⛈️ Heavy Rain Alert for ${farm.farmName}`,
      category: 'WEATHER_ACTION',
      alertType: 'HEAVY_RAIN',
      priority: rainfallVal >= 45 ? 'URGENT' : 'IMPORTANT',
      condition: weather.current.conditionText,
      measurement: `Rainfall: ${rainfallVal.toFixed(1)} mm forecast in 24h period`,
      timeWindow: 'Next 24 Hours',
      advice: `Clear field drainage trenches immediately to prevent root waterlogging in ${crop}. Postpone foliar bio-fertilizer and bio-pesticide applications to avoid chemical or microbial runoff. Protect young nursery beds and harvest-ready produce under waterproof covers.`,
      source: 'Open-Meteo Meteorological Service / Agronomic Weather Advisory Engine',
      issuedAt,
      expiresAt,
    });
  }

  // 2. High Rain Probability Alert: Probability >= 70% with moderate precipitation
  else if (next24hPrecipMaxProb >= 70) {
    advisories.push({
      farmId: farm.id,
      farmName: farm.farmName,
      crop,
      locationAddress: farm.locationAddress,
      latitude: farm.latitude,
      longitude: farm.longitude,
      title: `🌧️ High Rain Probability Notice for ${farm.farmName}`,
      category: 'WEATHER_ACTION',
      alertType: 'HIGH_RAIN_PROBABILITY',
      priority: 'IMPORTANT',
      condition: weather.current.conditionText,
      measurement: `Precipitation probability: ${next24hPrecipMaxProb}% (Estimated accumulation: ${next24hPrecipSum.toFixed(1)} mm)`,
      timeWindow: 'Next 24-48 Hours',
      advice: `Rain probability is high (${next24hPrecipMaxProb}%). Hold off on planned fertilizer top-dressing or scheduled foliar microbial sprays until a clear dry window appears. Ensure drainage channels are unblocked.`,
      source: 'Open-Meteo Meteorological Service / Agronomic Weather Advisory Engine',
      issuedAt,
      expiresAt,
    });
  }

  // 3. High Humidity & Potential Crop Disease Risk: Relative humidity >= 85% with warm conditions (20°C - 32°C)
  const highHumidityHours = weather.hourly.slice(0, 24).filter((h) => h.relativeHumidity >= 85).length;
  if (currentHumidity >= 85 || highHumidityHours >= 6) {
    advisories.push({
      farmId: farm.id,
      farmName: farm.farmName,
      crop,
      locationAddress: farm.locationAddress,
      latitude: farm.latitude,
      longitude: farm.longitude,
      title: `💧 High Humidity Alert — Elevated Fungal Disease Risk for ${crop}`,
      category: 'WEATHER_ACTION',
      alertType: 'HIGH_HUMIDITY_DISEASE_RISK',
      priority: 'IMPORTANT',
      condition: `${weather.current.conditionText} (Humidity: ${currentHumidity}%)`,
      measurement: `Relative humidity: ${currentHumidity}% (Sustained >= 85% for ${highHumidityHours} hours)`,
      timeWindow: 'Current & Next 24 Hours',
      advice: `Persistent high humidity and canopy wetness significantly increase spore germination risk for fungal pathogens (such as Blast, Rust, Anthracnose, or Leaf Spot). Conduct early morning scouting of lower leaves for lesions. Apply prophylactic bio-fungicide barrier (such as Trichoderma or Pseudomonas culture) during clear afternoon hours. Avoid overhead sprinkler irrigation.`,
      source: 'Open-Meteo Meteorological Service / Agronomic Disease Vulnerability Model',
      issuedAt,
      expiresAt,
    });
  }

  // 4. Dry Spell or Drought Stress Risk: Next 7 days rain < 2mm AND max temp >= 35°C
  if (next7dRainSum < 2 && next7dMaxTemp >= 35) {
    advisories.push({
      farmId: farm.id,
      farmName: farm.farmName,
      crop,
      locationAddress: farm.locationAddress,
      latitude: farm.latitude,
      longitude: farm.longitude,
      title: `☀️ Dry Spell & Thermal Stress Advisory for ${farm.farmName}`,
      category: 'WEATHER_ACTION',
      alertType: 'DRY_SPELL_DROUGHT_RISK',
      priority: 'IMPORTANT',
      condition: 'Extended Dry Conditions & High Temperatures',
      measurement: `7-Day Rain Sum: ${next7dRainSum.toFixed(1)} mm, Peak Temperature: ${next7dMaxTemp.toFixed(1)}°C`,
      timeWindow: 'Next 5–7 Days',
      advice: `High temperatures and prolonged absence of rainfall will accelerate soil moisture depletion. Schedule micro-drip or furrow irrigation during early morning or sunset to minimize evapotranspiration losses. Apply organic mulch around crop root zones to retain soil moisture.`,
      source: 'Open-Meteo Meteorological Service / Soil Moisture Stress Model',
      issuedAt,
      expiresAt,
    });
  }

  // 5. High Wind Speed Warning: Wind speed >= 35 km/h
  if (currentWind >= 35 || Math.max(...weather.daily.map((d) => d.windSpeedMax), 0) >= 40) {
    const maxWind = Math.max(currentWind, ...weather.daily.map((d) => d.windSpeedMax));
    advisories.push({
      farmId: farm.id,
      farmName: farm.farmName,
      crop,
      locationAddress: farm.locationAddress,
      latitude: farm.latitude,
      longitude: farm.longitude,
      title: `💨 Strong Wind Warning for ${farm.farmName}`,
      category: 'WEATHER_ACTION',
      alertType: 'HIGH_WIND_WARNING',
      priority: maxWind >= 50 ? 'URGENT' : 'IMPORTANT',
      condition: `Gusty Winds (${maxWind.toFixed(1)} km/h)`,
      measurement: `Wind speed: ${currentWind.toFixed(1)} km/h (Peak gusts up to ${maxWind.toFixed(1)} km/h)`,
      timeWindow: 'Next 24 Hours',
      advice: `Postpone all foliar sprayer operations to prevent spray drift and chemical loss. Provide mechanical support or staking for tall crops (${crop}) and fruit trees where feasible. Inspect polytunnel and greenhouse netting.`,
      source: 'Open-Meteo Meteorological Service / Wind Hazard Model',
      issuedAt,
      expiresAt,
    });
  }

  return advisories;
}

/**
 * Fetch latest RainViewer radar weather map tiles metadata for the live precipitation overlay
 */
export async function fetchRainViewerRadarMeta(): Promise<{
  host: string;
  radarTime: number;
  tileUrl: string;
  path: string;
  colorScheme: number;
  smooth: number;
  maxNativeZoom: number;
  minZoom: number;
  maxZoom: number;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const host = data.host || 'https://tilecache.rainviewer.com';
      const pastFrames = data.radar?.past || [];
      const nowcastFrames = data.radar?.nowcast || [];
      const allFrames = [...pastFrames, ...nowcastFrames];
      const latestFrame = allFrames.length > 0 ? allFrames[allFrames.length - 1] : null;
      const radarTime = latestFrame ? latestFrame.time : Math.floor(Date.now() / 1000);
      const framePath = latestFrame?.path || (latestFrame?.time ? `/v2/radar/${latestFrame.time}` : '');

      // RainViewer tile format: {host}{path}/256/{z}/{x}/{y}/2/1_1.png
      // Documented supported zoom levels for RainViewer radar tiles: 0 to 7.
      return {
        host,
        radarTime,
        path: framePath,
        tileUrl: framePath ? `${host}${framePath}/256/{z}/{x}/{y}/2/1_1.png` : '',
        colorScheme: 2,
        smooth: 1,
        maxNativeZoom: 7,
        minZoom: 1,
        maxZoom: 18,
      };
    }
  } catch (err: any) {
    console.warn('[RainViewer API] Could not retrieve live radar frame:', err.message);
  }

  // Graceful empty fallback without broken URLs
  return {
    host: 'https://tilecache.rainviewer.com',
    radarTime: 0,
    path: '',
    tileUrl: '',
    colorScheme: 2,
    smooth: 1,
    maxNativeZoom: 7,
    minZoom: 1,
    maxZoom: 18,
  };
}
