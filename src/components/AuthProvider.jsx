import { createContext, useContext, useState, useEffect } from 'react';
import {
  isAuthenticated,
  getUserInfo,
  login as authLogin,
  loginWithGoogle,
  logout as authLogout,
  refreshToken,
} from '../utils/auth';
import { getFormattedUserInfo } from '../utils/userContext';

// Create authentication context
const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Provides authentication state and methods to entire app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (user) {
      // Refresh token every 23 hours (tokens expire in 24 hours)
      const refreshInterval = setInterval(() => {
        handleRefreshToken();
      }, 23 * 60 * 60 * 1000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  /**
   * Check if user is authenticated
   */
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      if (isAuthenticated()) {
        const userInfo = getUserInfo();
        const formattedUser = getFormattedUserInfo();
        setUser(formattedUser || userInfo);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authLogin(email, password);
      
      // Update user state
      if (response.user) {
        const formattedUser = getFormattedUserInfo();
        setUser(formattedUser || response.user);
      }

      return response;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with Google
   */
  const loginGoogle = async (credential) => {
    try {
      setLoading(true);
      setError(null);

      const response = await loginWithGoogle(credential);
      
      // Update user state
      if (response.user) {
        const formattedUser = getFormattedUserInfo();
        setUser(formattedUser || response.user);
      }

      return response;
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setUser(null);
    authLogout();
  };

  /**
   * Refresh authentication token
   */
  const handleRefreshToken = async () => {
    try {
      await refreshToken();
    } catch (err) {
      console.error('Token refresh error:', err);
      // If refresh fails, logout user
      logout();
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    loginGoogle,
    logout,
    refreshToken: handleRefreshToken,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}

/**
 * Higher-order component to protect routes
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }

  return children;
}

export default AuthContext;
