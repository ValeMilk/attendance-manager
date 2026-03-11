import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'expectador';
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { username: string; password: string; role: string; supervisorId?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) as User : null;
    } catch { return null; }
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try { return localStorage.getItem('accessToken'); } catch { return null; }
  });

  useEffect(() => {
    try { if (user) localStorage.setItem('auth_user', JSON.stringify(user)); else localStorage.removeItem('auth_user'); } catch {}
  }, [user]);

  useEffect(() => {
    try { if (accessToken) localStorage.setItem('accessToken', accessToken); else localStorage.removeItem('accessToken'); } catch {}
  }, [accessToken]);

  // If there is an accessToken but the stored user is missing or legacy-shaped,
  // try to fetch the profile from the backend to populate `user` correctly.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!accessToken) return;
      if (user && (user as any).role) return; // already has role
      try {
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!mounted) return;
        if (!res.ok) return;
        const body = await res.json();
        if (!mounted) return;
        // Normalize backend profile -> local User shape
        const normalized: User = {
          id: body._id || body.id || String(body.id || ''),
          username: body.email || body.name || body.username || '',
          role: body.role || 'expectador',
        };
        setUser(normalized);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [accessToken]);

  async function login(username: string, password: string) {
    const email = username.includes('@') ? username : `${username}@attendance.com`;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let message = 'Login failed';
      try {
        const err = await res.json();
        if (err?.message) message = err.message;
      } catch {}
      throw new Error(message);
    }
    const body = await res.json();
    setAccessToken(body.accessToken);
    setUser(body.user);
  }

  function logout() {
    setAccessToken(null);
    setUser(null);
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('auth_user'); } catch {}
  }

  async function register(data: { username: string; password: string; role: string; supervisorId?: string }) {
    // requires admin access token in header (handled by caller)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed' }));
      throw new Error(err.message || 'Register failed');
    }
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
