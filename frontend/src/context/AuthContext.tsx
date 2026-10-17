'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import LogoutModal from '@/components/modals/LogoutModal';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'GA_ADMIN' | 'USER';
  department?: string;
  company?: {
    id: string;
    code: string;
    name: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  requestLogout: () => void;
  switchUser: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth from localStorage on load
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem('mra_meeting_token');
        const storedUser = localStorage.getItem('mra_meeting_user');

        if (storedToken && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            // Verify token with backend
            const res = await api.getMe();
            if (res.success && res.user) {
              setUser(res.user);
              localStorage.setItem('mra_meeting_user', JSON.stringify(res.user));
            }
          } catch (err) {
            console.warn('Session expired or invalid token:', err);
            localStorage.removeItem('mra_meeting_token');
            localStorage.removeItem('mra_meeting_user');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to parse auth token:', e);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('mra_meeting_token', res.token);
        localStorage.setItem('mra_meeting_user', JSON.stringify(res.user));
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error occurred during login' };
    }
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      localStorage.removeItem('mra_meeting_token');
      localStorage.removeItem('mra_meeting_user');
      setUser(null);
    }
  };

  const requestLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    await logout();
  };

  // Quick switch user for demo & testing convenience
  const switchUser = async (email: string) => {
    const res = await login(email, 'Admin@123');
    return res.success;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, requestLogout, switchUser }}>
      {children}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        user={user}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
