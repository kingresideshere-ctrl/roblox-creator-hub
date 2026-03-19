'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  signOut: () => void;
  user: { name: string } | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  signOut: () => {},
  user: null,
});

const AUTH_KEY = 'rch_auth_token';
const TEAM_PASSWORD = process.env.NEXT_PUBLIC_TEAM_PASSWORD || 'roblox2026';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem(AUTH_KEY);
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (password: string): boolean => {
    if (password === TEAM_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, signOut, user: isAuthenticated ? { name: 'Team' } : null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
