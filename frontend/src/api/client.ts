import {
  User,
  Farmer,
  Farm,
  CropVariety,
  Disease,
  DiseaseCase,
  FieldObservation,
  BiotechRecommendation,
  FarmerAdvisory,
  NotificationItem,
  ActivityLogItem,
  DashboardKPIs,
  AnalyticsData,
  UserRole,
  FarmerProblemReportPayload,
  FarmerProblemReportResponse,
  DiseaseCaseFollowUp,
  DiseaseCaseAuditEntry,
  WeatherObservation,
  FarmWeatherAdvisory,
  FarmWeatherSummary,
} from '../types';

// Verified production backend deployment URL on Vercel
export const PRODUCTION_BACKEND_URL = 'https://agri-bio-tech-management-platform.vercel.app';

// Resolve API base URL dynamically:
// 1. Checks VITE_API_URL (e.g. "https://agri-bio-tech-management-platform.vercel.app")
// 2. Checks VITE_API_BASE_URL
// 3. Checks localStorage override ('agribio_api_url') for immediate in-browser backend linking
// 4. In production browser environments without build-time VITE_API_URL, falls back to PRODUCTION_BACKEND_URL
//    to avoid sending POST requests to the static frontend domain (which triggers Vercel HTTP 405 Method Not Allowed)
// 5. Defaults to '/api' for local Vite proxy
export const getApiBase = (): string => {
  let envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

  // Runtime fallback via localStorage if set
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('agribio_api_url') || sessionStorage.getItem('agribio_api_url');
    if (override && override.trim()) {
      envUrl = override.trim();
    }

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
      if (!envUrl) return '/api';
    } else {
      // In production on Vercel:
      // If envUrl is missing, or points to the frontend domain itself (e.g. contains current hostname,
      // 'gegu', 'dvdey9bdb', or any non-backend vercel.app domain), override it with PRODUCTION_BACKEND_URL!
      const isLoopbackOrBroken =
        !envUrl ||
        envUrl === '/api' ||
        envUrl.includes(hostname) ||
        envUrl.includes('gegu') ||
        envUrl.includes('dvdey9bdb') ||
        (envUrl.includes('vercel.app') && !envUrl.includes('agri-bio-tech-management-platform.vercel.app'));

      if (isLoopbackOrBroken) {
        envUrl = PRODUCTION_BACKEND_URL;
      }
    }
  }

  if (!envUrl) {
    return '/api';
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API_BASE = getApiBase();

export const getAssetUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = getApiBase();
  const origin = base.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  if (origin && origin !== '/api') {
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('agribio_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'ALL') {
      searchParams.append(key, String(value));
    }
  }
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const currentBase = getApiBase();
  let url = `${currentBase}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    if (!url.startsWith(PRODUCTION_BACKEND_URL)) {
      const fallbackUrl = `${PRODUCTION_BACKEND_URL}/api${endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint}`;
      try {
        response = await fetch(fallbackUrl, { ...options, headers });
        url = fallbackUrl;
      } catch {
        throw netErr;
      }
    } else {
      throw netErr;
    }
  }

  // Automatic transparent failover on 405 Method Not Allowed or 404:
  // If the request hit a static frontend host instead of the Express backend,
  // transparently fail over to the verified production backend.
  if ((response.status === 405 || response.status === 404) && !url.startsWith(PRODUCTION_BACKEND_URL)) {
    console.warn(`[API Client] Endpoint ${url} returned ${response.status}. Automatically failing over to production backend ${PRODUCTION_BACKEND_URL}...`);
    const fallbackUrl = `${PRODUCTION_BACKEND_URL}/api${endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint}`;
    try {
      const fallbackResponse = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
      if (fallbackResponse.ok || fallbackResponse.status === 401 || fallbackResponse.status === 400 || fallbackResponse.status === 403) {
        if (typeof window !== 'undefined' && (fallbackResponse.ok || fallbackResponse.status === 401)) {
          localStorage.setItem('agribio_api_url', PRODUCTION_BACKEND_URL);
        }
        response = fallbackResponse;
        url = fallbackUrl;
      }
    } catch (fallbackErr) {
      console.error('[API Client] Failover attempt failed:', fallbackErr);
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      if (response.status === 405) {
        errorMsg = `HTTP 405 Method Not Allowed at ${url}. Ensure requests are routed to the Express backend (${PRODUCTION_BACKEND_URL}) rather than a static hosting domain.`;
      } else if (response.status === 404) {
        errorMsg = `API Endpoint Not Found (404) at ${url}.`;
      }
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth & User Management
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    demoSession: (role: string) =>
      request<{ token: string; user: User; message: string }>('/auth/demo-session', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    register: (body: any) =>
      request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    registerAdmin: (body: { name: string; email: string; password: string; phone?: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/register-admin', { method: 'POST', body: JSON.stringify(body) }),
    forgotPassword: (body: { email: string }) =>
      request<{ success: boolean; message: string; resetToken?: string; email?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    resetPassword: (body: { token: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getMe: () => request<User>('/auth/me'),
    getUsers: () => request<User[]>('/users'),
  },

  users: {
    getAll: () => request<User[]>('/users'),
    create: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<User> & { password?: string }) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
  },

  // Crop Varieties
  varieties: {
    getAll: (params?: { search?: string; cropType?: string; growingSeason?: string; sortBy?: string; sortOrder?: string }) =>
      request<CropVariety[]>(`/varieties${buildQueryString(params)}`),
    getById: (id: string) => request<CropVariety>(`/varieties/${id}`),
    create: (data: Partial<CropVariety>) =>
      request<CropVariety>('/varieties', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CropVariety>) =>
      request<CropVariety>(`/varieties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/varieties/${id}`, { method: 'DELETE' }),
  },

  // Disease Surveillance
  diseases: {
    getAll: (params?: { severity?: string; status?: string; search?: string; cropVarietyId?: string; farmId?: string; farmerId?: string; reportedById?: string }) =>
      request<DiseaseCase[]>(`/diseases${buildQueryString(params)}`),
    getCases: (params?: { severity?: string; status?: string; search?: string; cropVarietyId?: string; farmId?: string; farmerId?: string; reportedById?: string }) =>
      request<DiseaseCase[]>(`/diseases${buildQueryString(params)}`),
    getCatalog: () => request<Disease[]>('/diseases/catalog'),
    getCaseById: (id: string) => request<DiseaseCase>(`/diseases/${id}`),
    reportCase: (data: Partial<DiseaseCase>) =>
      request<DiseaseCase>('/diseases', { method: 'POST', body: JSON.stringify(data) }),
    reportFarmerProblem: (data: FarmerProblemReportPayload) =>
      request<FarmerProblemReportResponse>('/diseases/farmer-report', { method: 'POST', body: JSON.stringify(data) }),
    updateCase: (id: string, data: Partial<DiseaseCase>) =>
      request<DiseaseCase>(`/diseases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCase: (id: string) =>
      request<{ message: string }>(`/diseases/${id}`, { method: 'DELETE' }),
    syncCoordinates: () =>
      request<{ message: string; updatedCount: number; details: any[]; unresolvable: any[] }>('/diseases/sync-coordinates', { method: 'POST' }),
    submitFollowUp: (id: string, data: any) =>
      request<{ message: string; followUp: DiseaseCaseFollowUp }>(`/diseases/cases/${id}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getFollowUps: (id: string) =>
      request<{ diseaseCaseId: string; pendingReview: boolean; followUps: DiseaseCaseFollowUp[]; auditLogs: DiseaseCaseAuditEntry[] }>(`/diseases/cases/${id}/follow-ups`),
    reviewFollowUp: (id: string, data: { followUpId?: string; newStatus: string; reviewNotes: string; reason?: string }) =>
      request<{ message: string; diseaseCase: DiseaseCase; auditEntry: DiseaseCaseAuditEntry }>(`/diseases/cases/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Biotech Recommendations
  recommendations: {
    getAll: (params?: { recommendationType?: string; status?: string; isAutomated?: string; search?: string; farmId?: string; crop?: string }) =>
      request<BiotechRecommendation[]>(`/recommendations${buildQueryString(params)}`),
    getById: (id: string) => request<BiotechRecommendation>(`/recommendations/${id}`),
    create: (data: Partial<BiotechRecommendation>) =>
      request<BiotechRecommendation>('/recommendations', { method: 'POST', body: JSON.stringify(data) }),
    generateAI: (context: any) =>
      request<{ message: string; recommendations: BiotechRecommendation[] }>('/recommendations/generate-ai', {
        method: 'POST',
        body: JSON.stringify(context),
      }),
    update: (id: string, data: Partial<BiotechRecommendation>) =>
      request<BiotechRecommendation>(`/recommendations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/recommendations/${id}`, { method: 'DELETE' }),
  },

  // Field Observations
  observations: {
    getAll: (params?: { farmId?: string; cropVarietyId?: string; growthStage?: string; search?: string }) =>
      request<FieldObservation[]>(`/observations${buildQueryString(params)}`),
    getById: (id: string) => request<FieldObservation>(`/observations/${id}`),
    record: (data: Partial<FieldObservation>) =>
      request<FieldObservation>('/observations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<FieldObservation>) =>
      request<FieldObservation>(`/observations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/observations/${id}`, { method: 'DELETE' }),
  },

  // Farmers & Farms
  farmers: {
    getAll: (params?: { search?: string; state?: string; language?: string }) =>
      request<Farmer[]>(`/farmers${buildQueryString(params)}`),
    getById: (id: string) => request<Farmer>(`/farmers/${id}`),
    create: (data: any) =>
      request<Farmer>('/farmers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Farmer>) =>
      request<Farmer>(`/farmers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/farmers/${id}`, { method: 'DELETE' }),
    getFarms: () => request<Farm[]>('/farms'),
    addFarmPlot: (data: Partial<Farm>) =>
      request<Farm>('/farms', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Farm Plots
  farms: {
    getAll: () => request<Farm[]>('/farms'),
    create: (data: Partial<Farm>) =>
      request<Farm>('/farms', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Advisories
  advisories: {
    getAll: (params?: { farmerId?: string; category?: string; priority?: string; isRead?: string; search?: string }) =>
      request<FarmerAdvisory[]>(`/advisories${buildQueryString(params)}`),
    create: (data: Partial<FarmerAdvisory>) =>
      request<FarmerAdvisory>('/advisories', { method: 'POST', body: JSON.stringify(data) }),
    markRead: (id: string) =>
      request<FarmerAdvisory>(`/advisories/${id}/read`, { method: 'PATCH' }),
    delete: (id: string) =>
      request<{ message: string }>(`/advisories/${id}`, { method: 'DELETE' }),
  },

  // Notifications & Activities
  notifications: {
    getAll: () => request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) => request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ message: string }>('/notifications/read-all', { method: 'POST' }),
    getActivities: () => request<ActivityLogItem[]>('/activities'),
  },

  // Security Audit & Access Control
  security: {
    logAccessAttempt: (data: {
      attemptedResource: string;
      targetRole?: string;
      requestedRoute: string;
      outcome?: 'denied' | 'allowed';
      details?: string;
      targetUserId?: string;
    }) => request<{ success: boolean; message: string }>('/security/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getEvents: () => request<any[]>('/security/events'),
  },

  // Analytics
  analytics: {
    getKPIs: () => request<DashboardKPIs>('/analytics/kpis'),
    getCharts: () => request<AnalyticsData>('/analytics/charts'),
  },

  // Live Weather System & Weather Advisories
  weather: {
    getCurrent: (lat: number, lng: number, locationName?: string) =>
      request<WeatherObservation>(`/weather/current${buildQueryString({ lat, lng, locationName })}`),
    getFarmWeather: (farmId: string) =>
      request<{ farm: any; weather: WeatherObservation; advisories: FarmWeatherAdvisory[] }>(`/weather/farm/${farmId}`),
    getFarmsWeather: () =>
      request<FarmWeatherSummary[]>('/weather/farms'),
    getAdvisories: () =>
      request<FarmWeatherAdvisory[]>('/weather/advisories'),
    syncAdvisories: () =>
      request<{ message: string; createdCount: number }>('/weather/sync-advisories', { method: 'POST' }),
    getRadarOverlay: () =>
      request<{
        host: string;
        radarTime: number;
        tileUrl: string;
        path?: string;
        colorScheme: number;
        smooth: number;
        maxNativeZoom?: number;
        minZoom?: number;
        maxZoom?: number;
      }>('/weather/radar-overlay'),
  },

  // Standalone image upload
  upload: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('agribio_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${getApiBase()}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  }
};
