import { createContext, useContext, useState, useEffect } from 'react';
import { ADMIN_PIN, STAFF_PIN } from '../constants';

const AuthContext = createContext(null);

const SESSION_KEY = 'snt_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (pin) => {
    let role = null;
    if (pin === ADMIN_PIN) role = 'admin';
    else if (pin === STAFF_PIN) role = 'staff';
    else return { success: false, error: 'Invalid PIN' };

    const newSession = { role, loggedInAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return { success: true, role };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const isAdmin = session?.role === 'admin';
  const isStaff = session?.role === 'staff';

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, isAdmin, isStaff, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
