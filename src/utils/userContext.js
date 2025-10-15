// User context utilities for multi-tenancy
// Provides helpers for filtering and managing user-specific data

import { getUserId, getUserInfo, setUserInfo } from './auth';

/**
 * Get current user's ID
 * @returns {string|null} User ID
 */
export function getCurrentUserId() {
  return getUserId();
}

/**
 * Get current user's full information
 * @returns {object|null} User information
 */
export function getCurrentUser() {
  return getUserInfo();
}

/**
 * Filter data array by user_id
 * @param {Array} data - Array of data objects
 * @param {string} userId - User ID to filter by (optional, defaults to current user)
 * @returns {Array} Filtered data array
 */
export function filterByUserId(data, userId = null) {
  if (!data || !Array.isArray(data)) return [];
  
  const targetUserId = userId || getCurrentUserId();
  if (!targetUserId) return [];
  
  return data.filter(item => item.user_id === targetUserId);
}

/**
 * Check if data item belongs to current user
 * @param {object} item - Data item with user_id
 * @returns {boolean} True if item belongs to current user
 */
export function belongsToCurrentUser(item) {
  if (!item) return false;
  
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  return item.user_id === userId;
}

/**
 * Add user_id to data object
 * @param {object} data - Data object
 * @returns {object} Data object with user_id added
 */
export function addUserIdToData(data) {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return {
    ...data,
    user_id: userId,
  };
}

/**
 * Validate user has access to data
 * @param {object} item - Data item with user_id
 * @throws {Error} If user doesn't have access
 */
export function validateUserAccess(item) {
  if (!item) {
    throw new Error('Item not found');
  }
  
  if (!belongsToCurrentUser(item)) {
    throw new Error('Unauthorized access to resource');
  }
}

/**
 * Get user's display name
 * @returns {string} User display name or email
 */
export function getUserDisplayName() {
  const user = getCurrentUser();
  if (!user) return 'Guest';
  
  return user.name || user.email || 'User';
}

/**
 * Get user's email
 * @returns {string|null} User email
 */
export function getUserEmail() {
  const user = getCurrentUser();
  return user?.email || null;
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(role) {
  const user = getCurrentUser();
  if (!user || !user.roles) return false;
  
  return user.roles.includes(role);
}

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
export function isAdmin() {
  return hasRole('admin');
}

/**
 * Format user-specific query parameters
 * @param {object} params - Query parameters
 * @returns {object} Parameters with user_id if needed
 */
export function addUserIdToParams(params = {}) {
  // User ID will be added by backend from JWT token
  // This is just for client-side reference
  return params;
}

/**
 * Create user-scoped cache key
 * @param {string} key - Base cache key
 * @returns {string} User-scoped cache key
 */
export function getUserScopedCacheKey(key) {
  const userId = getCurrentUserId();
  return userId ? `${userId}:${key}` : key;
}

/**
 * Clear user-specific cached data
 */
export function clearUserCache() {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Clear localStorage items that start with user ID
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(userId)) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get user preferences
 * @returns {object} User preferences
 */
export function getUserPreferences() {
  const user = getCurrentUser();
  return user?.preferences || {};
}

/**
 * Save user preferences
 * @param {object} preferences - User preferences to save
 */
export function saveUserPreferences(preferences) {
  const user = getCurrentUser();
  if (!user) return;
  
  const updatedUser = {
    ...user,
    preferences: {
      ...user.preferences,
      ...preferences,
    },
  };
  
  // Update in localStorage
  setUserInfo(updatedUser);
}

/**
 * Format user info for display
 * @returns {object} Formatted user info
 */
export function getFormattedUserInfo() {
  const user = getCurrentUser();
  if (!user) return null;
  
  return {
    id: user.id || user.sub,
    name: getUserDisplayName(),
    email: getUserEmail(),
    initials: getInitials(user.name || user.email),
    avatar: user.picture || user.avatar_url || null,
  };
}

/**
 * Get user initials from name
 * @param {string} name - User name
 * @returns {string} User initials
 */
function getInitials(name) {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default {
  getCurrentUserId,
  getCurrentUser,
  filterByUserId,
  belongsToCurrentUser,
  addUserIdToData,
  validateUserAccess,
  getUserDisplayName,
  getUserEmail,
  hasRole,
  isAdmin,
  addUserIdToParams,
  getUserScopedCacheKey,
  clearUserCache,
  getUserPreferences,
  saveUserPreferences,
  getFormattedUserInfo,
};
