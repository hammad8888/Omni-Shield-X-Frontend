export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  status: string;
  roles: string[];
  permissions?: string[];
  phone?: string | null;
  notes?: string | null;
  lastLoginAt?: string | null;
};

const ACCESS = "omnishield.access";
const REFRESH = "omnishield.refresh";
export const SESSION_EVENT = "omnishield:session-expired";

export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function getAccessToken() {
  return localStorage.getItem(ACCESS);
}

function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export async function api<T>(path: string, init: RequestInit & { allowStatuses?: number[] } = {}): Promise<T> {
  const { allowStatuses = [], ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  if (!headers.has("Content-Type") && requestInit.body) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const fullUrl = path.startsWith("http://") || path.startsWith("https://") 
    ? path 
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(fullUrl, { ...requestInit, headers });
  if (response.status === 401 && localStorage.getItem(REFRESH) && path !== "/api/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) return api<T>(path, init);
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
  if (!response.ok && !allowStatuses.includes(response.status)) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { error?: { message?: string } })?.error?.message ?? response.statusText;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const data = await api<{ accessToken: string; refreshToken: string; user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem(ACCESS, data.accessToken);
  localStorage.setItem(REFRESH, data.refreshToken);
  return data.user;
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH);
  try {
    await api("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  } catch {
    /* ignore */
  }
  clearTokens();
}

async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH);
  if (!refreshToken) return false;
  try {
    const data = await api<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    localStorage.setItem(ACCESS, data.accessToken);
    localStorage.setItem(REFRESH, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}
