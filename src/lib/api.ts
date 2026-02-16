/** Client-side API helper */

const API_BASE = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin-token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ---- Tabs ----
export interface Tab {
  id: string;
  name_cn: string;
  name_en: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export const fetchTabs = () => request<Tab[]>('/tabs');
export const createTab = (data: Partial<Tab>) => request<Tab>('/tabs', { method: 'POST', body: JSON.stringify(data) });
export const updateTab = (id: string, data: Partial<Tab>) => request<Tab>(`/tabs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTab = (id: string) => request<void>(`/tabs/${id}`, { method: 'DELETE' });

// ---- Demos ----
export interface Demo {
  id: string;
  tab_id: string;
  model_name: string;
  model_key: string;
  file_r2_key: string;
  thumbnail_r2_key: string | null;
  demo_type: 'html' | 'python' | 'markdown';
  comment: string | null;
  created_at: string;
}

export const fetchDemos = (tabId?: string) =>
  request<Demo[]>(`/demos${tabId ? `?tab=${tabId}` : ''}`);

export const deleteDemo = (id: string) =>
  request<void>(`/demos/${id}`, { method: 'DELETE' });

// ---- Upload ----
export interface UploadPayload {
  tab_id: string;
  model_key: string;
  model_name: string;
  demo_type: 'html' | 'python' | 'markdown';
  code: string;
  thumbnail?: string; // base64
  comment?: string;
}

export const uploadDemo = (data: UploadPayload) =>
  request<Demo>('/demos', { method: 'POST', body: JSON.stringify(data) });

export interface UpdateDemoPayload {
  tab_id?: string;
  model_key?: string;
  model_name?: string;
  demo_type?: 'html' | 'python' | 'markdown';
  code?: string;
  comment?: string;
}

export const updateDemo = (id: string, data: UpdateDemoPayload) =>
  request<Demo>(`/demos/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// ---- Models Registry ----
export interface ModelRegistryEntry {
  key: string;
  name: string;
  brand_key: string;
  brand_name: string;
  logo_filename: string;
  color: string;
}

export const fetchModels = () => request<ModelRegistryEntry[]>('/models');
export const createModel = (data: { brand_key: string; name: string }) =>
  request<ModelRegistryEntry>('/models', { method: 'POST', body: JSON.stringify(data) });
export const deleteModel = (key: string) =>
  request<void>(`/models/${key}`, { method: 'DELETE' });

// ---- Brands ----
export interface Brand {
  key: string;
  name: string;
  logo_filename: string;
}

export const fetchBrands = () => request<Brand[]>('/brands');
export const createBrand = (data: Brand) =>
  request<Brand>('/brands', { method: 'POST', body: JSON.stringify(data) });
export const deleteBrand = (key: string) =>
  request<void>(`/brands/${key}`, { method: 'DELETE' });

// ---- SVG Logos (R2) ----
export const fetchLogos = () => request<string[]>('/logos');
export const uploadLogo = (data: { name: string; content: string }) =>
  request<{ name: string }>('/logos', { method: 'POST', body: JSON.stringify(data) });
export const deleteLogo = (name: string) =>
  request<void>(`/logos/${name}`, { method: 'DELETE' });

// ---- Auth ----
export interface LoginResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  message?: string;
  locked?: boolean;
  remainingMinutes?: number;
}

export const login = (password: string) =>
  request<LoginResponse>('/login', { method: 'POST', body: JSON.stringify({ password }) });

export const verifyToken = async (): Promise<boolean> => {
  try {
    const data = await request<{ valid: boolean }>('/verify', { method: 'POST' });
    return data.valid;
  } catch {
    return false;
  }
};

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = sessionStorage.getItem('admin-token');
  const expiry = sessionStorage.getItem('admin-token-expiry');
  if (!token || !expiry) return false;
  if (Date.now() > parseInt(expiry, 10)) {
    logoutAdmin();
    return false;
  }
  return true;
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('admin-token');
  sessionStorage.removeItem('admin-token-expiry');
}

// ---- Likes ----
export interface LikeInfo {
  count: number;
  liked: boolean;
}

export const fetchLikes = (tabId?: string) =>
  request<Record<string, LikeInfo>>(`/likes${tabId ? `?tab=${tabId}` : ''}`);

export const toggleLike = (demoId: string) =>
  request<{ liked: boolean; count: number }>(`/demos/${demoId}/like`, { method: 'POST' });

// ---- Leaderboard ----
export interface LeaderboardEntry {
  demo_id: string;
  model_name: string;
  model_key: string;
  brand_name: string | null;
  color: string;
  like_count: number;
  tab_id: string;
}

export const fetchLeaderboard = (tabId?: string) =>
  request<LeaderboardEntry[]>(`/leaderboard${tabId ? `?tab=${tabId}` : ''}`);

/** Get the URL to load a demo's HTML content */
export function getDemoUrl(demo: Demo): string {
  return `/api/file/${demo.file_r2_key}`;
}

/** Get the URL for a demo's thumbnail */
export function getThumbnailUrl(demo: Demo): string | null {
  if (!demo.thumbnail_r2_key) return null;
  return `/api/file/${demo.thumbnail_r2_key}`;
}
