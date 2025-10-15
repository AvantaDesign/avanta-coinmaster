/**
 * Virtualization Utilities
 * 
 * Helper functions and utilities for implementing virtual scrolling
 * with TanStack Virtual for large datasets.
 */

/**
 * Calculate optimal row height based on content
 * @param {Object} item - The item to calculate height for
 * @param {number} baseHeight - Base height for a row
 * @returns {number} Calculated height
 */
export function calculateRowHeight(item, baseHeight = 60) {
  if (!item) return baseHeight;
  
  // Add extra height for long descriptions
  const descriptionLength = item.description?.length || 0;
  if (descriptionLength > 100) {
    return baseHeight + 20;
  }
  if (descriptionLength > 50) {
    return baseHeight + 10;
  }
  
  return baseHeight;
}

/**
 * Get estimated size for virtualization
 * @param {Array} items - Array of items
 * @param {number} defaultSize - Default size per item
 * @returns {Function} Estimator function
 */
export function createSizeEstimator(items, defaultSize = 60) {
  return (index) => {
    if (index >= items.length) return defaultSize;
    return calculateRowHeight(items[index], defaultSize);
  };
}

/**
 * Calculate scroll position to item
 * @param {number} index - Index of item
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @returns {number} Scroll position
 */
export function scrollToIndex(index, itemHeight, containerHeight) {
  const scrollPosition = index * itemHeight;
  const centerOffset = containerHeight / 2 - itemHeight / 2;
  return Math.max(0, scrollPosition - centerOffset);
}

/**
 * Get visible range for current scroll position
 * @param {number} scrollTop - Current scroll position
 * @param {number} containerHeight - Height of container
 * @param {number} itemHeight - Height of each item
 * @param {number} totalItems - Total number of items
 * @param {number} overscan - Number of items to render outside viewport
 * @returns {Object} Range object with start and end indices
 */
export function getVisibleRange(scrollTop, containerHeight, itemHeight, totalItems, overscan = 3) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  return { startIndex, endIndex };
}

/**
 * Calculate total height for virtual list
 * @param {number} itemCount - Number of items
 * @param {number} itemHeight - Height of each item
 * @returns {number} Total height
 */
export function calculateTotalHeight(itemCount, itemHeight) {
  return itemCount * itemHeight;
}

/**
 * Create virtual list configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Virtual list configuration
 */
export function createVirtualConfig({
  itemCount,
  itemHeight = 60,
  containerHeight = 600,
  overscan = 3,
  scrollMargin = 0
} = {}) {
  return {
    count: itemCount,
    getScrollElement: () => null, // Will be set by component
    estimateSize: () => itemHeight,
    overscan,
    scrollMargin
  };
}

/**
 * Optimize scroll event handling
 * @param {Function} callback - Callback function
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced function
 */
export function debounceScroll(callback, delay = 16) {
  let timeoutId;
  let lastCallTime = 0;
  
  return function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    clearTimeout(timeoutId);
    
    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      callback.apply(this, args);
    } else {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        callback.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Create intersection observer for lazy loading
 * @param {Function} callback - Callback when items intersect
 * @param {Object} options - Intersection observer options
 * @returns {IntersectionObserver} Observer instance
 */
export function createLazyLoader(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '100px',
    threshold: 0.01,
    ...options
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, defaultOptions);
}

/**
 * Calculate performance metrics for virtual list
 * @param {number} totalItems - Total number of items
 * @param {number} visibleItems - Number of visible items
 * @param {number} renderTime - Time taken to render in ms
 * @returns {Object} Performance metrics
 */
export function calculatePerformanceMetrics(totalItems, visibleItems, renderTime) {
  const efficiency = visibleItems / totalItems;
  const renderRate = visibleItems / renderTime;
  
  return {
    totalItems,
    visibleItems,
    renderTime,
    efficiency: (efficiency * 100).toFixed(2) + '%',
    renderRate: renderRate.toFixed(2) + ' items/ms',
    savings: ((1 - efficiency) * 100).toFixed(2) + '%'
  };
}

/**
 * Create smooth scroll handler
 * @param {Element} element - Element to scroll
 * @param {number} targetPosition - Target scroll position
 * @param {number} duration - Animation duration in ms
 * @returns {Promise} Promise that resolves when scroll is complete
 */
export function smoothScrollTo(element, targetPosition, duration = 300) {
  return new Promise((resolve) => {
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    
    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const easing = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      element.scrollTop = startPosition + distance * easing;
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animation);
  });
}

/**
 * Memory efficient item cache
 * @param {number} maxSize - Maximum cache size
 * @returns {Object} Cache object with get/set methods
 */
export function createItemCache(maxSize = 100) {
  const cache = new Map();
  const order = [];
  
  return {
    get(key) {
      return cache.get(key);
    },
    
    set(key, value) {
      if (cache.has(key)) {
        // Move to end
        const index = order.indexOf(key);
        if (index > -1) {
          order.splice(index, 1);
        }
      } else if (cache.size >= maxSize) {
        // Remove oldest
        const oldest = order.shift();
        cache.delete(oldest);
      }
      
      cache.set(key, value);
      order.push(key);
    },
    
    clear() {
      cache.clear();
      order.length = 0;
    },
    
    size() {
      return cache.size;
    }
  };
}

/**
 * Measure actual rendered item height
 * @param {Element} element - Element to measure
 * @returns {number} Height in pixels
 */
export function measureItemHeight(element) {
  if (!element) return 0;
  
  const rect = element.getBoundingClientRect();
  return rect.height;
}

/**
 * Create dynamic size estimator based on measurements
 * @param {number} defaultSize - Default size
 * @returns {Object} Size estimator with learn method
 */
export function createDynamicSizeEstimator(defaultSize = 60) {
  const measurements = new Map();
  
  return {
    estimate(index) {
      return measurements.get(index) || defaultSize;
    },
    
    learn(index, size) {
      measurements.set(index, size);
    },
    
    clear() {
      measurements.clear();
    },
    
    getAverage() {
      if (measurements.size === 0) return defaultSize;
      const sum = Array.from(measurements.values()).reduce((a, b) => a + b, 0);
      return sum / measurements.size;
    }
  };
}

/**
 * Handle keyboard navigation in virtual list
 * @param {Event} event - Keyboard event
 * @param {number} currentIndex - Current selected index
 * @param {number} totalItems - Total number of items
 * @param {Function} onNavigate - Callback when navigating
 */
export function handleKeyboardNavigation(event, currentIndex, totalItems, onNavigate) {
  let newIndex = currentIndex;
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      newIndex = Math.max(0, currentIndex - 1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      newIndex = Math.min(totalItems - 1, currentIndex + 1);
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = totalItems - 1;
      break;
    case 'PageUp':
      event.preventDefault();
      newIndex = Math.max(0, currentIndex - 10);
      break;
    case 'PageDown':
      event.preventDefault();
      newIndex = Math.min(totalItems - 1, currentIndex + 10);
      break;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    onNavigate(newIndex);
  }
}

/**
 * Export utilities as default object
 */
export default {
  calculateRowHeight,
  createSizeEstimator,
  scrollToIndex,
  getVisibleRange,
  calculateTotalHeight,
  createVirtualConfig,
  debounceScroll,
  createLazyLoader,
  calculatePerformanceMetrics,
  smoothScrollTo,
  createItemCache,
  measureItemHeight,
  createDynamicSizeEstimator,
  handleKeyboardNavigation
};
