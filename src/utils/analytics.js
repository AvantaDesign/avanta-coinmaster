/**
 * Analytics Tracking Utility
 * 
 * Provides unified analytics tracking for both:
 * - Cloudflare Web Analytics (lightweight, privacy-first)
 * - Custom event tracking for business metrics
 * 
 * Usage:
 *   import { trackPageView, trackEvent } from './utils/analytics';
 *   
 *   trackPageView('/transactions');
 *   trackEvent('transaction_created', { amount: 1000, category: 'avanta' });
 */

// Check if Cloudflare Web Analytics is available
const hasCloudflareAnalytics = typeof window !== 'undefined' && window.__CF$cv$params;

// Custom analytics endpoint (for server-side tracking)
const ANALYTICS_ENDPOINT = '/api/analytics';

/**
 * Track page view
 * @param {string} path - Page path (e.g., '/transactions')
 * @param {object} metadata - Additional metadata
 */
export function trackPageView(path, metadata = {}) {
  if (typeof window === 'undefined') return;

  // Cloudflare Web Analytics automatically tracks page views
  // We just need to send custom metadata if any
  
  if (Object.keys(metadata).length > 0) {
    trackEvent('page_view', {
      path,
      ...metadata
    });
  }

  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Page View:', path, metadata);
  }
}

/**
 * Track custom event
 * @param {string} eventName - Event name (e.g., 'transaction_created')
 * @param {object} properties - Event properties
 */
export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return;

  // Prepare event data
  const eventData = {
    event: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }
  };

  // Send to custom analytics endpoint (async, non-blocking)
  sendAnalytics(eventData);

  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', eventName, properties);
  }
}

/**
 * Track user interaction
 * @param {string} element - Element identifier
 * @param {string} action - Action type (click, submit, etc.)
 * @param {object} data - Additional data
 */
export function trackInteraction(element, action, data = {}) {
  trackEvent('user_interaction', {
    element,
    action,
    ...data
  });
}

/**
 * Track error
 * @param {Error} error - Error object
 * @param {object} context - Error context
 */
export function trackError(error, context = {}) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  };

  trackEvent('error', errorData);

  // Also send to error monitoring endpoint
  sendToErrorMonitoring(errorData);
}

/**
 * Track performance metric
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {object} metadata - Additional metadata
 */
export function trackPerformance(metric, value, metadata = {}) {
  trackEvent('performance', {
    metric,
    value,
    unit: metadata.unit || 'ms',
    ...metadata
  });
}

/**
 * Track conversion event
 * @param {string} conversionType - Type of conversion
 * @param {number} value - Conversion value
 * @param {object} metadata - Additional metadata
 */
export function trackConversion(conversionType, value, metadata = {}) {
  trackEvent('conversion', {
    type: conversionType,
    value,
    ...metadata
  });
}

/**
 * Track financial transaction (for business metrics)
 * @param {string} type - Transaction type (ingreso/gasto)
 * @param {number} amount - Transaction amount
 * @param {string} category - Transaction category
 */
export function trackTransaction(type, amount, category) {
  trackEvent('financial_transaction', {
    type,
    amount,
    category,
    action: 'created'
  });
}

/**
 * Track CSV import
 * @param {string} bankType - Bank type (bbva, azteca, generic)
 * @param {number} count - Number of transactions imported
 * @param {boolean} success - Import success status
 */
export function trackCSVImport(bankType, count, success) {
  trackEvent('csv_import', {
    bankType,
    transactionCount: count,
    success
  });
}

/**
 * Track CFDI import
 * @param {boolean} success - Import success status
 * @param {number} total - Invoice total amount
 */
export function trackCFDIImport(success, total) {
  trackEvent('cfdi_import', {
    success,
    total
  });
}

/**
 * Track export
 * @param {string} format - Export format (csv, pdf, excel)
 * @param {number} recordCount - Number of records exported
 */
export function trackExport(format, recordCount) {
  trackEvent('export', {
    format,
    recordCount
  });
}

/**
 * Track search query
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results
 */
export function trackSearch(query, resultCount) {
  trackEvent('search', {
    query,
    resultCount
  });
}

/**
 * Track filter usage
 * @param {object} filters - Active filters
 * @param {number} resultCount - Number of results after filtering
 */
export function trackFilter(filters, resultCount) {
  trackEvent('filter', {
    filters,
    resultCount
  });
}

/**
 * Send analytics data to server
 * @private
 */
async function sendAnalytics(eventData) {
  try {
    // Use sendBeacon if available (better for page unload events)
    if (navigator.sendBeacon && typeof Blob !== 'undefined') {
      const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
      navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
    } else {
      // Fallback to fetch
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true
      }).catch(() => {
        // Silently fail - analytics should not block user experience
      });
    }
  } catch (error) {
    // Silently fail - analytics should not block user experience
    if (import.meta.env.DEV) {
      console.error('[Analytics] Failed to send:', error);
    }
  }
}

/**
 * Send error data to monitoring service
 * @private
 */
async function sendToErrorMonitoring(errorData) {
  try {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
      keepalive: true
    }).catch(() => {
      // Silently fail
    });
  } catch (error) {
    // Silently fail - error monitoring should not cause more errors
  }
}

/**
 * Initialize analytics
 * Call this once when the app starts
 */
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;

  // Set up global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason || 'Unhandled Promise Rejection'), {
      source: 'unhandledrejection',
      promise: event.promise
    });
  });

  // Track performance metrics
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        const firstPaint = timing.responseStart - timing.navigationStart;

        trackPerformance('page_load_time', loadTime, { unit: 'ms' });
        trackPerformance('dom_ready_time', domReady, { unit: 'ms' });
        trackPerformance('first_paint_time', firstPaint, { unit: 'ms' });
      }, 0);
    });
  }

  // Track Web Vitals if available
  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackPerformance('lcp', lastEntry.renderTime || lastEntry.loadTime, {
          unit: 'ms',
          vital: 'lcp'
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackPerformance('fid', entry.processingStart - entry.startTime, {
            unit: 'ms',
            vital: 'fid'
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report CLS on page unload
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          trackPerformance('cls', clsValue, {
            unit: 'score',
            vital: 'cls'
          });
        }
      });
    } catch (error) {
      // Web Vitals not supported
    }
  }

  if (import.meta.env.DEV) {
    console.log('[Analytics] Initialized');
  }
}

/**
 * Get session ID (for tracking user sessions)
 * @returns {string} Session ID
 */
export function getSessionId() {
  if (typeof window === 'undefined') return null;

  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Get user ID (for tracking returning users)
 * @returns {string} User ID
 */
export function getUserId() {
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem('analytics_user_id');
  
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics_user_id', userId);
  }

  return userId;
}

export default {
  trackPageView,
  trackEvent,
  trackInteraction,
  trackError,
  trackPerformance,
  trackConversion,
  trackTransaction,
  trackCSVImport,
  trackCFDIImport,
  trackExport,
  trackSearch,
  trackFilter,
  initializeAnalytics,
  getSessionId,
  getUserId
};
