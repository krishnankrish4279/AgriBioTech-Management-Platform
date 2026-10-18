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
  FarmerProblemReportResponse
} from '../types';

const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore json parse error
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
    register: (body: any) =>
      request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    registerAdmin: (body: { name: string; email: string; password: string; phone?: string }) =>
      request<{ message: string; token: string; user: User }>('/auth/register-admin', { method: 'POST', body: JSON.stringify(body) }),
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
  },

  // Biotech Recommendations
  recommendations: {
    getAll: (params?: { recommendationType?: string; status?: string; isAutomated?: string; search?: string }) =>
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

  // Standalone image upload
  upload: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('agribio_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  }
};
