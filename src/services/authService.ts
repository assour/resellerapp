import { demoAuthSession, demoUser } from '@/lib/seed';
import type { AuthSession, User } from '@/lib/types';
import { uid } from '@/lib/utils';

const SESSION_KEY = 'resellsync.auth.session';

function sessionFor(user: User, provider: AuthSession['provider']): AuthSession {
  return {
    user,
    token: uid(`session_${provider}`),
    provider,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString()
  };
}

export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        window.localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  persistSession(session: AuthSession) {
    if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  loginDemo() {
    return this.persistSession({ ...demoAuthSession, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() });
  },

  loginWithPassword(email: string) {
    const user = { ...demoUser, email, name: email.split('@')[0] || 'Reseller' };
    return this.persistSession(sessionFor(user, 'email'));
  },

  signUp(name: string, email: string) {
    const user = { id: uid('usr'), name: name || 'New Reseller', email, avatarColor: 'bg-coral' };
    return this.persistSession(sessionFor(user, 'email'));
  },

  socialLogin(provider: 'Google' | 'Facebook' | 'Apple') {
    const normalized = provider.toLowerCase() as 'google' | 'facebook' | 'apple';
    const user = { ...demoUser, name: `${provider} Reseller`, email: `${normalized}@resellsync.app` };
    return this.persistSession(sessionFor(user, normalized));
  },

  logout() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
  }
};
