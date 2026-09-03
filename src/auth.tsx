import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SESSION_EVENT, api, getAccessToken, login as apiLogin, logout as apiLogout, type AuthUser } from "./api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  can: (permission?: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener(SESSION_EVENT, expire);
    if (!getAccessToken()) {
      setLoading(false);
      return () => window.removeEventListener(SESSION_EVENT, expire);
    }
    api<{ user: AuthUser }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener(SESSION_EVENT, expire);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      can: (permission) => {
        if (!permission) return true;
        return Boolean(user?.permissions?.includes(permission));
      },
      login: async (username, password) => {
        setUser(await apiLogin(username, password));
      },
      logout: async () => {
        await apiLogout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
