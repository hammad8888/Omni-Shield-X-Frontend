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

export const PRODUCTION_API_URL = "https://omni-shield-x-backend.onrender.com";

export function resolveApiBase(): string {
  // 1. Explicit Vite env variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }
  // 2. Custom local storage override if configured
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("omnishield.api_url");
    if (custom) return custom.replace(/\/+$/, "");
  }
  // 3. In Vite development mode on localhost, keep relative/empty for Vite dev proxy
  if (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "";
  }
  // 4. Default to live Render backend in production / on Vercel
  return PRODUCTION_API_URL;
}

export const API_BASE = resolveApiBase();

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

  const baseUrl = resolveApiBase();
  const fullUrl = path.startsWith("http://") || path.startsWith("https://") 
    ? path 
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, { ...requestInit, headers });
  } catch (fetchErr) {
    throw new Error(
      `Failed to connect to OmniShield API at ${fullUrl}: ${fetchErr instanceof Error ? fetchErr.message : "Network error"}`,
    );
  }

  if (response.status === 401 && localStorage.getItem(REFRESH) && path !== "/api/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) return api<T>(path, init);
    window.dispatchEvent(new Event(SESSION_EVENT));
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok && !allowStatuses.includes(response.status)) {
    let message = `HTTP ${response.status} ${response.statusText}`;
    if (isJson) {
      const body = await response.json().catch(() => ({}));
      message = (body as { error?: { message?: string } })?.error?.message ?? message;
    } else {
      const text = await response.text().catch(() => "");
      if (text.includes("<!doctype html>") || text.includes("<html")) {
        message = `API at ${fullUrl} returned HTML (HTTP ${response.status}). Ensure backend is active.`;
      } else if (text) {
        message = text.slice(0, 200);
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;

  if (!isJson) {
    const text = await response.text().catch(() => "");
    if (text.includes("<!doctype html>") || text.includes("<html")) {
      throw new Error(`Expected JSON from API at ${fullUrl}, but received HTML. The backend URL may be misconfigured.`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

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
