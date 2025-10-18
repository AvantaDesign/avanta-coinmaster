import { useState, useEffect, useRef } from 'react';
import { handleSwipeGesture } from '../utils/touchUtils';
import Icon from './icons/IconLibrary';

/**
 * MobileCard Component
 * Swipeable card layout optimized for mobile devices
 * Supports swipe actions, tap targets, and touch-friendly interactions
 */
export default function MobileCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onLongPress,
  className = '',
  swipeThreshold = 80,
  showSwipeHint = false,
  leftAction = null,
  rightAction = null
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const callbacks = {};
    
    if (onSwipeLeft || leftAction) {
      callbacks.onSwipeLeft = (e, { deltaX }) => {
        if (leftAction) leftAction();
        if (onSwipeLeft) onSwipeLeft();
      };
    }
    
    if (onSwipeRight || rightAction) {
      callbacks.onSwipeRight = (e, { deltaX }) => {
        if (rightAction) rightAction();
        if (onSwipeRight) onSwipeRight();
      };
    }

    cleanupRef.current = handleSwipeGesture(
      cardRef.current,
      callbacks,
      { threshold: swipeThreshold }
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [onSwipeLeft, onSwipeRight, leftAction, rightAction, swipeThreshold]);

  const handleTouchStart = (e) => {
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const touch = e.touches[0];
    // Visual feedback during swipe
    // This is simplified - full implementation would track initial position
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onTap}
      className={`
        relative
        bg-white dark:bg-slate-900
        rounded-lg
        shadow-sm
        border border-gray-200 dark:border-slate-700
        overflow-hidden
        transition-transform duration-200
        ${onTap ? 'cursor-pointer active:scale-98' : ''}
        ${className}
      `}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        touchAction: 'pan-y' // Allow vertical scrolling but capture horizontal swipes
      }}
    >
      {/* Swipe action indicators */}
      {(leftAction || onSwipeLeft) && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="trash" className="w-6 h-6" />
        </div>
      )}
      
      {(rightAction || onSwipeRight) && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 bg-green-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="check" className="w-6 h-6" />
        </div>
      )}

      {/* Card content */}
      <div className="p-4">
        {children}
      </div>

      {/* Swipe hint */}
      {showSwipeHint && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 dark:from-slate-800 to-transparent p-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Icon name="chevron-left" className="w-3 h-3" />
            Desliza para acciones
            <Icon name="chevron-right" className="w-3 h-3" />
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * MobileCardHeader Component
 * Header section for mobile cards
 */
export function MobileCardHeader({ title, subtitle, action, icon }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {typeof icon === 'string' ? (
              <Icon name={icon} className="w-5 h-5 text-gray-400" />
            ) : (
              icon
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-3">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * MobileCardBody Component
 * Main content area for mobile cards
 */
export function MobileCardBody({ children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileCardFooter Component
 * Footer with actions for mobile cards
 */
export function MobileCardFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileCardAction Component
 * Action button optimized for mobile touch targets
 */
export function MobileCardAction({ 
  label, 
  onClick, 
  icon, 
  variant = 'default',
  disabled = false,
  fullWidth = false,
  className = ''
}) {
  const variants = {
    default: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600',
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'flex-1' : ''}
        flex items-center justify-center gap-2
        px-4 py-2.5
        min-h-[44px]
        rounded-lg
        text-sm font-medium
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variants[variant]}
        ${className}
      `}
    >
      {icon && <Icon name={icon} className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}

/**
 * MobileCardField Component
 * Display field with label and value for mobile cards
 */
export function MobileCardField({ label, value, icon, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <span className={`text-sm font-medium ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * MobileCardBadge Component
 * Badge/tag for mobile cards
 */
export function MobileCardBadge({ label, variant = 'default', icon }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {icon && <Icon name={icon} className="w-3 h-3" />}
      {label}
    </span>
  );
}
