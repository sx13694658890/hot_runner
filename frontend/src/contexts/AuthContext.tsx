import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, apiFetch, formatApiDetail, getToken, setToken } from "@/lib/api";
import type { PermissionsResponse, TokenResponse, UserBrief } from "@/lib/types";

type AuthContextValue = {
  user: UserBrief | null;
  permissions: string[];
  token: string | null;
  ready: boolean;
  error: string | null;
  clearError: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  can: (code: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<UserBrief | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (t: string) => {
    setToken(t);
    setTokenState(t);
    const me = await apiFetch<UserBrief>("/auth/me");
    const perm = await apiFetch<PermissionsResponse>("/auth/me/permissions");
    setUser(me);
    setPermissions(perm.codes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = getToken();
      if (!t) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        await loadSession(t);
      } catch {
        setToken(null);
        setTokenState(null);
        setUser(null);
        setPermissions([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  const loginRequest = useCallback(async (username: string, password: string) => {
    setToken(null);
    setTokenState(null);
    const res = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    await loadSession(res.access_token);
  }, [loadSession]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      await loginRequest(username, password);
    } catch (e) {
      const msg =
        e instanceof ApiError ? formatApiDetail(e.detail) : e instanceof Error ? e.message : "登录失败";
      setError(msg);
      throw e;
    }
  }, [loginRequest]);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setPermissions([]);
  }, []);

  const refreshSession = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    await loadSession(t);
  }, [loadSession]);

  const can = useCallback(
    (code: string) => {
      if (permissions.includes("*")) return true;
      return permissions.includes(code);
    },
    [permissions],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      token,
      ready,
      error,
      clearError,
      login,
      logout,
      refreshSession,
      can,
    }),
    [user, permissions, token, ready, error, clearError, login, logout, refreshSession, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return ctx;
}
