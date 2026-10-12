import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { bankingApi, authStorage } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify session on mount with backend GET /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await bankingApi.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
          authStorage.setUser(currentUser);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        if (isMounted) {
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    // Listen to global 401 session-expired event
    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth:session-expired', handleExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:session-expired', handleExpired);
    };
  }, []);

  const login = async (username: string, password: string, remember: boolean = true): Promise<AuthUser> => {
    const data = await bankingApi.login(username, password);
    authStorage.setToken(data.access_token, remember);
    authStorage.setUser(data.user, remember);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await bankingApi.logout();
    } finally {
      authStorage.clear();
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    authStorage.setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
