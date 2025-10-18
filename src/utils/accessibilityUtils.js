/**
 * Accessibility Utilities
 * Comprehensive utilities for WCAG 2.1 AA compliance
 */

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level: 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  // Create or get existing live region
  let liveRegion = document.getElementById('sr-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }
  
  // Update priority if different
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }
  
  // Clear and set new message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Manage focus for accessibility
 * @param {HTMLElement} element - Element to focus
 * @param {Object} options - Focus options
 */
export function manageFocus(element, options = {}) {
  if (!element) return;
  
  const {
    preventScroll = false,
    selectText = false,
    delay = 0
  } = options;
  
  const focusElement = () => {
    // Make element focusable if not already
    if (!element.hasAttribute('tabindex') && 
        !['a', 'button', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      element.setAttribute('tabindex', '-1');
    }
    
    // Focus the element
    element.focus({ preventScroll });
    
    // Select text if input/textarea
    if (selectText && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      element.select();
    }
  };
  
  if (delay > 0) {
    setTimeout(focusElement, delay);
  } else {
    focusElement();
  }
}

/**
 * Create focus trap for modals
 * @param {HTMLElement} container - Container element to trap focus within
 * @returns {Function} Cleanup function to remove trap
 */
export function createFocusTrap(container) {
  if (!container) return () => {};
  
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Validate color contrast ratio for WCAG compliance
 * @param {string} foreground - Foreground color (hex or rgb)
 * @param {string} background - Background color (hex or rgb)
 * @param {string} level - WCAG level: 'AA' or 'AAA'
 * @param {string} size - Text size: 'normal' or 'large'
 * @returns {Object} Contrast validation result
 */
export function validateColorContrast(foreground, background, level = 'AA', size = 'normal') {
  // Convert colors to RGB
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return {
      valid: false,
      ratio: 0,
      error: 'Invalid color format'
    };
  }
  
  // Calculate relative luminance
  const fgLum = getRelativeLuminance(fgRgb);
  const bgLum = getRelativeLuminance(bgRgb);
  
  // Calculate contrast ratio
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  // Determine required ratio
  const requirements = {
    'AA': { normal: 4.5, large: 3 },
    'AAA': { normal: 7, large: 4.5 }
  };
  
  const required = requirements[level][size];
  
  return {
    valid: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required: required,
    level: level,
    size: size
  };
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color code
 * @returns {Object} RGB object or null
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  if (hex.length !== 6) return null;
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return { r, g, b };
}

/**
 * Calculate relative luminance
 * @param {Object} rgb - RGB color object
 * @returns {number} Relative luminance
 */
function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generate unique accessible ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateAccessibleId(prefix = 'a11y') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get accessible label for element
 * @param {HTMLElement} element - Element to get label for
 * @returns {string} Accessible label
 */
export function getAccessibleLabel(element) {
  if (!element) return '';
  
  // Check aria-label
  if (element.hasAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }
  
  // Check aria-labelledby
  if (element.hasAttribute('aria-labelledby')) {
    const id = element.getAttribute('aria-labelledby');
    const labelElement = document.getElementById(id);
    if (labelElement) {
      return labelElement.textContent.trim();
    }
  }
  
  // Check for label element
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }
  
  // Check title attribute
  if (element.hasAttribute('title')) {
    return element.getAttribute('title');
  }
  
  // Check alt attribute for images
  if (element.tagName === 'IMG' && element.hasAttribute('alt')) {
    return element.getAttribute('alt');
  }
  
  // Return text content as fallback
  return element.textContent.trim();
}

/**
 * Check if element is keyboard accessible
 * @param {HTMLElement} element - Element to check
 * @returns {Object} Accessibility check result
 */
export function checkKeyboardAccessibility(element) {
  if (!element) {
    return { accessible: false, issues: ['Element not found'] };
  }
  
  const issues = [];
  const tagName = element.tagName.toLowerCase();
  
  // Check if interactive element
  const interactiveElements = ['a', 'button', 'input', 'select', 'textarea'];
  const isInteractive = interactiveElements.includes(tagName) ||
                        element.hasAttribute('onclick') ||
                        element.hasAttribute('role');
  
  if (isInteractive) {
    // Check if focusable
    const tabIndex = element.getAttribute('tabindex');
    const isFocusable = element.offsetParent !== null && // is visible
                        (interactiveElements.includes(tagName) || 
                         (tabIndex !== null && tabIndex !== '-1'));
    
    if (!isFocusable) {
      issues.push('Element is interactive but not keyboard focusable');
    }
    
    // Check for accessible label
    const label = getAccessibleLabel(element);
    if (!label) {
      issues.push('Element has no accessible label');
    }
    
    // Check for role
    if (!interactiveElements.includes(tagName) && !element.hasAttribute('role')) {
      issues.push('Custom interactive element missing role attribute');
    }
  }
  
  return {
    accessible: issues.length === 0,
    issues: issues,
    element: element
  };
}

/**
 * Add skip link for keyboard navigation
 * @param {string} targetId - ID of target element to skip to
 * @param {string} label - Skip link label
 * @returns {HTMLElement} Skip link element
 */
export function addSkipLink(targetId, label = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary-600 focus:text-white';
  
  // Insert at beginning of body
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  return skipLink;
}

/**
 * Ensure minimum touch target size (44x44px for WCAG)
 * @param {HTMLElement} element - Element to check/fix
 * @param {number} minSize - Minimum size in pixels (default 44)
 */
export function ensureTouchTargetSize(element, minSize = 44) {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  
  if (rect.width < minSize || rect.height < minSize) {
    // Add padding to meet minimum size
    const currentPadding = parseInt(getComputedStyle(element).padding) || 0;
    const widthDiff = Math.max(0, minSize - rect.width);
    const heightDiff = Math.max(0, minSize - rect.height);
    
    const additionalPaddingX = Math.ceil(widthDiff / 2);
    const additionalPaddingY = Math.ceil(heightDiff / 2);
    
    element.style.paddingLeft = `${currentPadding + additionalPaddingX}px`;
    element.style.paddingRight = `${currentPadding + additionalPaddingX}px`;
    element.style.paddingTop = `${currentPadding + additionalPaddingY}px`;
    element.style.paddingBottom = `${currentPadding + additionalPaddingY}px`;
  }
}

/**
 * Handle keyboard navigation for custom components
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} handlers - Keyboard handlers object
 */
export function handleKeyboardNavigation(event, handlers = {}) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab
  } = handlers;
  
  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter(event);
      }
      break;
    case ' ':
    case 'Spacebar':
      if (onSpace) {
        event.preventDefault();
        onSpace(event);
      }
      break;
    case 'Escape':
    case 'Esc':
      if (onEscape) {
        event.preventDefault();
        onEscape(event);
      }
      break;
    case 'ArrowUp':
    case 'Up':
      if (onArrowUp) {
        event.preventDefault();
        onArrowUp(event);
      }
      break;
    case 'ArrowDown':
    case 'Down':
      if (onArrowDown) {
        event.preventDefault();
        onArrowDown(event);
      }
      break;
    case 'ArrowLeft':
    case 'Left':
      if (onArrowLeft) {
        event.preventDefault();
        onArrowLeft(event);
      }
      break;
    case 'ArrowRight':
    case 'Right':
      if (onArrowRight) {
        event.preventDefault();
        onArrowRight(event);
      }
      break;
    case 'Home':
      if (onHome) {
        event.preventDefault();
        onHome(event);
      }
      break;
    case 'End':
      if (onEnd) {
        event.preventDefault();
        onEnd(event);
      }
      break;
    case 'Tab':
      if (onTab) {
        onTab(event);
      }
      break;
  }
}

/**
 * Initialize accessibility features for the application
 */
export function initializeAccessibility() {
  // Add skip link if main content exists
  const mainContent = document.getElementById('main-content');
  if (mainContent && !document.querySelector('a[href="#main-content"]')) {
    addSkipLink('main-content');
  }
  
  // Create screen reader live region if not exists
  if (!document.getElementById('sr-live-region')) {
    announceToScreenReader('Application loaded', 'polite');
  }
  
  // Add focus visible class for keyboard users
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  document.body.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
}
