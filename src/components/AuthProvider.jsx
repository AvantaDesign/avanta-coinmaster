import { createContext, useContext, useState, useEffect } from 'react';
import { 
  isAuthenticated, 
  getCurrentUser, 
  verifyToken, 
  logout as logoutUser,
  getAuthToken 
} from '../utils/auth';
import { getUserContext } from '../utils/userContext';

// Create authentication context
const AuthContext = createContext(null);

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication state
   * Checks if user has valid token and loads user data
   */
  async function initializeAuth() {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!isAuthenticated()) {
        setUser(null);
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // Get current user from storage
      const currentUser = getCurrentUser();
      
      // Verify token with server
      const isValid = await verifyToken();
      
      if (isValid && currentUser) {
        setUser(currentUser);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Login user
   * @param {Object} userData - User data from login
   */
  function login(userData) {
    setUser(userData.user);
    setAuthenticated(true);
  }

  /**
   * Logout user
   * Clears authentication state and redirects to login
   */
  async function logout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAuthenticated(false);
    }
  }

  /**
   * Update user data
   * @param {Object} userData - Updated user data
   */
  function updateUser(userData) {
    setUser(userData);
  }

  /**
   * Get user ID
   * @returns {string|null} User ID or null if not authenticated
   */
  function getUserId() {
    return user ? user.id : null;
  }

  /**
   * Get authentication headers for API requests
   * @returns {Object} Headers with Authorization token
   */
  function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Context value
  const value = {
    user,
    authenticated,
    loading,
    login,
    logout,
    updateUser,
    getUserId,
    getAuthHeaders,
    userContext: getUserContext(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
