import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
      console.log('AuthProvider: Checking authentication...');
      
      if (isAuthenticated()) {
        console.log('AuthProvider: User is authenticated, fetching user info...');
        const userInfo = getUserInfo();
        const formattedUser = getFormattedUserInfo();
        const finalUser = formattedUser || userInfo;
        console.log('AuthProvider: Setting user state:', finalUser);
        setUser(finalUser);

        // Phase 47.5: Initialize demo user if needed
        if (finalUser && finalUser.is_demo) {
          await initializeDemoUser(finalUser);
        }
      } else {
        console.log('AuthProvider: No valid authentication found');
        setUser(null);
      }
    } catch (err) {
      console.error('AuthProvider: Auth check error:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize demo user with default scenario and load demo data
   */
  const initializeDemoUser = async (user) => {
    try {
      console.log('AuthProvider: Initializing demo user...');
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if user already has a current scenario
      const currentResponse = await fetch('/api/demo-data/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        
        // If no current scenario, activate default scenario (ID=1)
        if (!currentData.data) {
          console.log('AuthProvider: No current scenario, activating default scenario...');
          
          // Activate scenario 1 (Negocio Excelente)
          await fetch('/api/demo-scenarios/1/activate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          // Load scenario data
          await fetch('/api/demo-data/load-scenario', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scenario_id: 1 })
          });

          console.log('AuthProvider: Demo user initialized with default scenario');
        } else {
          console.log('AuthProvider: Demo user already has active scenario:', currentData.data.scenario_name);
        }
      }
    } catch (err) {
      console.error('AuthProvider: Error initializing demo user:', err);
      // Don't throw - initialization failure shouldn't block login
    }
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('AuthProvider: Starting login for:', email);

      const response = await authLogin(email, password);
      console.log('AuthProvider: Login response received:', response);
      
      // Immediately update user state with response data
      if (response.user) {
        console.log('AuthProvider: Setting user from login response');
        const formattedUser = getFormattedUserInfo();
        const finalUser = formattedUser || response.user;
        setUser(finalUser);
        console.log('AuthProvider: User state updated:', finalUser);

        // Phase 47.5: Initialize demo user if needed
        if (finalUser.is_demo) {
          await initializeDemoUser(finalUser);
        }
      } else {
        console.warn('AuthProvider: No user in login response, checking stored info');
        // Fallback: check if user info was stored
        const storedUser = getUserInfo();
        if (storedUser) {
          const formattedUser = getFormattedUserInfo();
          const finalUser = formattedUser || storedUser;
          setUser(finalUser);
          
          // Phase 47.5: Initialize demo user if needed
          if (finalUser.is_demo) {
            await initializeDemoUser(finalUser);
          }
        }
      }

      return response;
    } catch (err) {
      console.error('AuthProvider: Login error:', err);
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
      console.log('AuthProvider: Starting Google login');

      const response = await loginWithGoogle(credential);
      console.log('AuthProvider: Google login response received');
      
      // Immediately update user state with response data
      if (response.user) {
        console.log('AuthProvider: Setting user from Google login response');
        const formattedUser = getFormattedUserInfo();
        const finalUser = formattedUser || response.user;
        setUser(finalUser);
        console.log('AuthProvider: User state updated:', finalUser);

        // Phase 47.5: Initialize demo user if needed
        if (finalUser.is_demo) {
          await initializeDemoUser(finalUser);
        }
      } else {
        console.warn('AuthProvider: No user in Google login response, checking stored info');
        // Fallback: check if user info was stored
        const storedUser = getUserInfo();
        if (storedUser) {
          const formattedUser = getFormattedUserInfo();
          const finalUser = formattedUser || storedUser;
          setUser(finalUser);
          
          // Phase 47.5: Initialize demo user if needed
          if (finalUser.is_demo) {
            await initializeDemoUser(finalUser);
          }
        }
      }

      return response;
    } catch (err) {
      console.error('AuthProvider: Google login error:', err);
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
    console.log('AuthProvider: Logging out user');
    setUser(null);
    setError(null);
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Use React Router Navigate instead of window.location to preserve state
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AuthContext;
