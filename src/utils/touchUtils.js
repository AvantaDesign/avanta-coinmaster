/**
 * Touch Utilities
 * Provides gesture handlers and touch optimization utilities
 */

/**
 * Detect if device supports touch
 * @returns {boolean} True if touch is supported
 */
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Handle swipe gestures on an element
 * @param {HTMLElement} element - Element to attach gesture handler
 * @param {Object} callbacks - Swipe direction callbacks
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function to remove listeners
 */
export function handleSwipeGesture(
  element,
  callbacks = {},
  options = {}
) {
  const {
    threshold = 50, // Minimum distance for swipe
    timeout = 300,  // Maximum time for swipe
    preventScroll = false
  } = options;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
  };

  const handleTouchMove = (e) => {
    if (preventScroll) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    // Check if swipe is within timeout
    if (deltaTime > timeout) return;

    // Determine if horizontal or vertical swipe
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0 && callbacks.onSwipeRight) {
        callbacks.onSwipeRight(e, { deltaX, deltaY, deltaTime });
      } else if (deltaX < 0 && callbacks.onSwipeLeft) {
        callbacks.onSwipeLeft(e, { deltaX, deltaY, deltaTime });
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0 && callbacks.onSwipeDown) {
        callbacks.onSwipeDown(e, { deltaX, deltaY, deltaTime });
      } else if (deltaY < 0 && callbacks.onSwipeUp) {
        callbacks.onSwipeUp(e, { deltaX, deltaY, deltaTime });
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Handle pull-to-refresh gesture
 * @param {HTMLElement} element - Scrollable element
 * @param {Function} callback - Refresh callback
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export function handlePullToRefresh(
  element,
  callback,
  options = {}
) {
  const {
    threshold = 80, // Distance to trigger refresh
    resistance = 2.5 // Pull resistance factor
  } = options;

  let touchStartY = 0;
  let pulling = false;
  let refreshing = false;

  const handleTouchStart = (e) => {
    // Only trigger if at top of scroll
    if (element.scrollTop === 0) {
      touchStartY = e.touches[0].clientY;
      pulling = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = (touchY - touchStartY) / resistance;

    if (pullDistance > 0) {
      // Visual feedback could be added here
      if (pullDistance > threshold) {
        // Ready to refresh
        element.style.transform = `translateY(${threshold}px)`;
      } else {
        element.style.transform = `translateY(${pullDistance}px)`;
      }
    }
  };

  const handleTouchEnd = async (e) => {
    if (!pulling) return;

    pulling = false;
    const touchY = e.changedTouches[0].clientY;
    const pullDistance = (touchY - touchStartY) / resistance;

    if (pullDistance > threshold && !refreshing) {
      refreshing = true;
      try {
        await callback();
      } finally {
        refreshing = false;
        element.style.transform = '';
      }
    } else {
      element.style.transform = '';
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Handle long press gesture
 * @param {HTMLElement} element - Element to attach handler
 * @param {Function} callback - Long press callback
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export function handleLongPress(
  element,
  callback,
  options = {}
) {
  const {
    duration = 500, // Duration in ms to trigger long press
    moveThreshold = 10 // Max movement allowed during long press
  } = options;

  let longPressTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    longPressTimer = setTimeout(() => {
      callback(e);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, duration);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Cancel if moved too much
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

  return () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchEnd);
  };
}

/**
 * Optimize tap targets for touch
 * @param {HTMLElement} element - Element to optimize
 * @param {Object} options - Configuration options
 */
export function optimizeTapTarget(element, options = {}) {
  const {
    minSize = 44, // Minimum touch target size in pixels
    padding = 8 // Additional padding
  } = options;

  const rect = element.getBoundingClientRect();
  
  if (rect.width < minSize || rect.height < minSize) {
    element.style.minWidth = `${minSize}px`;
    element.style.minHeight = `${minSize}px`;
    element.style.padding = `${padding}px`;
  }

  // Add visual feedback
  element.style.cursor = 'pointer';
  element.style.userSelect = 'none';
  element.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
}

/**
 * Create swipeable list item
 * @param {HTMLElement} element - List item element
 * @param {Object} actions - Swipe action callbacks
 * @returns {Function} Cleanup function
 */
export function createSwipeableListItem(element, actions = {}) {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  const threshold = 100; // Threshold to trigger action

  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
    element.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;

    // Apply transform with resistance
    const resistance = Math.abs(deltaX) > threshold ? 2 : 1;
    element.style.transform = `translateX(${deltaX / resistance}px)`;

    // Visual feedback for actions
    if (deltaX > threshold && actions.onSwipeRight) {
      element.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Green
    } else if (deltaX < -threshold && actions.onSwipeLeft) {
      element.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; // Red
    } else {
      element.style.backgroundColor = '';
    }
  };

  const handleTouchEnd = async (e) => {
    if (!isDragging) return;

    isDragging = false;
    element.style.transition = 'transform 0.3s ease, background-color 0.3s ease';

    const deltaX = currentX - startX;

    if (deltaX > threshold && actions.onSwipeRight) {
      await actions.onSwipeRight(e);
    } else if (deltaX < -threshold && actions.onSwipeLeft) {
      await actions.onSwipeLeft(e);
    }

    // Reset position
    element.style.transform = '';
    element.style.backgroundColor = '';
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Add haptic feedback
 * @param {string} type - Type of feedback ('light', 'medium', 'heavy')
 */
export function hapticFeedback(type = 'medium') {
  if (!navigator.vibrate) return;

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 50,
    success: [10, 50, 10],
    error: [50, 100, 50]
  };

  navigator.vibrate(patterns[type] || patterns.medium);
}

/**
 * Prevent default scroll behavior during gesture
 * @param {HTMLElement} element - Element to prevent scroll on
 * @returns {Function} Cleanup function
 */
export function preventScrollDuringGesture(element) {
  const preventDefault = (e) => {
    e.preventDefault();
  };

  element.addEventListener('touchmove', preventDefault, { passive: false });

  return () => {
    element.removeEventListener('touchmove', preventDefault);
  };
}
