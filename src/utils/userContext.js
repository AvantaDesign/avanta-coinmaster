// User context utilities for multi-tenant data filtering
// Provides helpers to work with user-specific data

import { getCurrentUser } from './auth';

/**
 * Get current user ID
 * @returns {string|null} User ID or null if not authenticated
 */
export function getUserId() {
  const user = getCurrentUser();
  return user ? user.id : null;
}

/**
 * Get current user email
 * @returns {string|null} User email or null if not authenticated
 */
export function getUserEmail() {
  const user = getCurrentUser();
  return user ? user.email : null;
}

/**
 * Get current user name
 * @returns {string|null} User name or null if not authenticated
 */
export function getUserName() {
  const user = getCurrentUser();
  return user ? user.name : null;
}

/**
 * Filter data array by current user
 * @param {Array} data - Array of data objects
 * @param {string} userIdField - Field name containing user ID (default: 'user_id')
 * @returns {Array} Filtered array containing only current user's data
 */
export function filterByCurrentUser(data, userIdField = 'user_id') {
  const userId = getUserId();
  if (!userId || !Array.isArray(data)) {
    return [];
  }
  return data.filter(item => item[userIdField] === userId);
}

/**
 * Check if data item belongs to current user
 * @param {Object} item - Data item to check
 * @param {string} userIdField - Field name containing user ID (default: 'user_id')
 * @returns {boolean} True if item belongs to current user
 */
export function belongsToCurrentUser(item, userIdField = 'user_id') {
  const userId = getUserId();
  if (!userId || !item) {
    return false;
  }
  return item[userIdField] === userId;
}

/**
 * Add user ID to data object
 * @param {Object} data - Data object to augment
 * @returns {Object} Data object with user_id added
 */
export function addUserIdToData(data) {
  const userId = getUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  return {
    ...data,
    user_id: userId,
  };
}

/**
 * Validate that user has access to data item
 * @param {Object} item - Data item to validate
 * @param {string} userIdField - Field name containing user ID (default: 'user_id')
 * @throws {Error} If user doesn't have access to item
 */
export function validateUserAccess(item, userIdField = 'user_id') {
  if (!belongsToCurrentUser(item, userIdField)) {
    throw new Error('Unauthorized: You do not have access to this resource');
  }
}

/**
 * Get user context for API requests
 * @returns {Object} User context object
 */
export function getUserContext() {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

/**
 * Format user display name
 * @returns {string} Formatted user name or email
 */
export function getUserDisplayName() {
  const user = getCurrentUser();
  if (!user) {
    return 'Guest';
  }
  return user.name || user.email || 'User';
}
