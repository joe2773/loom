import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { exchangeGoogleIdToken, type AuthUser } from '../services/auth';
import { setUnauthenticatedHandler } from '../services/apiClient';

const TOKEN_KEY = 'loom.auth.token';
const USER_KEY = 'loom.auth.user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  login: (googleIdToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStored<T>(key: string, parse: (raw: string) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStored(TOKEN_KEY, (s) => s));
  const [user, setUser] = useState<AuthUser | null>(() =>
    readStored(USER_KEY, (s) => JSON.parse(s) as AuthUser),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(logout);
    return () => setUnauthenticatedHandler(null);
  }, [logout]);

  const login = useCallback(async (googleIdToken: string) => {
    const { token: t, user: u } = await exchangeGoogleIdToken(googleIdToken);
    setToken(t);
    setUser(u);
    try {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      // ignore quota errors
    }
  }, []);

  const value = useMemo<AuthState>(() => ({ token, user, ready, login, logout }), [token, user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
