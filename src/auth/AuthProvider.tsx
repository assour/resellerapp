'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSession } from '@/lib/types';
import { authService } from '@/services/authService';

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  setSession(session: AuthSession | null): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSessionState(authService.getSession());
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    ready,
    setSession(nextSession) {
      if (nextSession) authService.persistSession(nextSession);
      else authService.logout();
      setSessionState(nextSession);
    }
  }), [ready, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
