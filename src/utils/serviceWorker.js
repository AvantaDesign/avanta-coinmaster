// Service Worker Registration Utility
// Registers the service worker for PWA support

/**
 * Register the service worker if supported by the browser
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers are not supported in this browser');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[SW] New service worker available');
            
            // Notify user about update
            if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service worker controller changed');
      // Reload page if controller changed
      if (!window.location.pathname.includes('/login')) {
        window.location.reload();
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 * @returns {Promise<boolean>}
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service worker unregistered:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Clear all service worker caches
 * @returns {Promise<void>}
 */
export async function clearServiceWorkerCache() {
  if (!('caches' in window)) {
    console.log('[SW] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Check if the app is running in standalone mode (installed as PWA)
 * @returns {boolean}
 */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Check if the device is online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 * @param {Function} onOnline - Callback when going online
 * @param {Function} onOffline - Callback when going offline
 * @returns {Function} Cleanup function to remove listeners
 */
export function watchOnlineStatus(onOnline, onOffline) {
  const handleOnline = () => {
    console.log('[SW] Device is online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('[SW] Device is offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Prompt user to install the PWA
 * @returns {Promise<boolean>} True if user accepted installation
 */
export async function promptInstall() {
  // Check if beforeinstallprompt event was captured
  if (!window.deferredPrompt) {
    console.log('[SW] Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    window.deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await window.deferredPrompt.userChoice;
    
    console.log('[SW] Install prompt outcome:', outcome);
    
    // Clear the deferredPrompt
    window.deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('[SW] Install prompt error:', error);
    return false;
  }
}

/**
 * Setup install prompt event listener
 * This should be called early in the app lifecycle
 */
export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Store the event so it can be triggered later
    window.deferredPrompt = e;
    
    console.log('[SW] Install prompt event captured');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[SW] PWA installed successfully');
    window.deferredPrompt = null;
  });
}
