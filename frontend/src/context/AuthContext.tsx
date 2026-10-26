import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  demoSessionLogin: (role: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isAgronomist: boolean;
  isBiotechExpert: boolean;
  isFarmer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = localStorage.getItem('agribio_token');
      if (token) {
        try {
          const profile = await api.auth.getMe();
          if (isMounted) setUser(profile);
        } catch {
          if (isMounted) {
            localStorage.removeItem('agribio_token');
            sessionStorage.clear();
            setUser(null);
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.auth.login({ email, password: pass });
    localStorage.setItem('agribio_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const demoSessionLogin = async (role: string): Promise<User> => {
    const res = await api.auth.demoSession(role);
    localStorage.setItem('agribio_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('agribio_token');
    sessionStorage.clear();
    setUser(null);
  };

  const rawRole = (user?.role || '').toLowerCase();
  const isAdmin = rawRole === 'admin';
  const isAgronomist = rawRole === 'agronomist';
  const isBiotechExpert = rawRole === 'biotech_expert';
  const isFarmer = rawRole === 'farmer';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        demoSessionLogin,
        logout,
        isAdmin,
        isAgronomist,
        isBiotechExpert,
        isFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
