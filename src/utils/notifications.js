// Toast Notification Management System
// Provides a centralized way to manage notifications across the application

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Store for active notifications
let notificationListeners = [];
let notificationId = 0;

// Subscribe to notification events
export function subscribeToNotifications(callback) {
  notificationListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    notificationListeners = notificationListeners.filter(listener => listener !== callback);
  };
}

// Emit notification to all subscribers
function emitNotification(notification) {
  notificationListeners.forEach(listener => {
    try {
      listener(notification);
    } catch (error) {
      console.error('Error in notification listener:', error);
    }
  });
}

// Show a notification
export function showNotification({ type, message, duration = 5000, action = null }) {
  const notification = {
    id: ++notificationId,
    type,
    message,
    duration,
    action,
    timestamp: Date.now()
  };
  
  emitNotification({ type: 'add', notification });
  
  // Auto-dismiss after duration (unless duration is 0)
  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(notification.id);
    }, duration);
  }
  
  return notification.id;
}

// Dismiss a notification
export function dismissNotification(id) {
  emitNotification({ type: 'remove', id });
}

// Convenience methods for different notification types
export function showSuccess(message, options = {}) {
  return showNotification({
    type: NOTIFICATION_TYPES.SUCCESS,
    message,
    ...options
  });
}

export function showError(message, options = {}) {
  return showNotification({
    type: NOTIFICATION_TYPES.ERROR,
    message,
    duration: 7000, // Errors stay longer by default
    ...options
  });
}

export function showWarning(message, options = {}) {
  return showNotification({
    type: NOTIFICATION_TYPES.WARNING,
    message,
    ...options
  });
}

export function showInfo(message, options = {}) {
  return showNotification({
    type: NOTIFICATION_TYPES.INFO,
    message,
    ...options
  });
}

// Clear all notifications
export function clearAllNotifications() {
  emitNotification({ type: 'clear' });
}
