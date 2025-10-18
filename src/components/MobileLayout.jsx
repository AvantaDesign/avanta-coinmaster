import { useState, useEffect } from 'react';
import { isTouchDevice } from '../utils/touchUtils';
import Icon from './icons/IconLibrary';

/**
 * MobileLayout Component
 * Wrapper component that provides mobile-optimized layout with bottom navigation
 */
export default function MobileLayout({
  children,
  title = '',
  showHeader = true,
  showBackButton = false,
  onBack,
  headerActions = null,
  bottomNav = null,
  className = ''
}) {
  const [isTouch, setIsTouch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 ${className}`}>
      {/* Mobile Header */}
      {showHeader && (
        <header
          className={`
            sticky top-0 z-40
            bg-white dark:bg-slate-900
            border-b border-gray-200 dark:border-slate-700
            transition-shadow duration-200
            ${scrolled ? 'shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
            {/* Back button */}
            {showBackButton && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95"
              >
                <Icon name="arrow-left" className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Title */}
            <h1 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 truncate ${showBackButton ? '' : 'flex-1'}`}>
              {title}
            </h1>

            {/* Header actions */}
            {headerActions && (
              <div className="flex items-center gap-2 ml-auto">
                {headerActions}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`flex-1 ${bottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {bottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {bottomNav}
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * MobileSection Component
 * Section wrapper for mobile layouts
 */
export function MobileSection({
  title,
  subtitle,
  children,
  action,
  collapsible = false,
  defaultCollapsed = false,
  className = ''
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className={`bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 ${className}`}>
      {/* Section header */}
      {title && (
        <div
          className={`px-4 py-3 border-b border-gray-100 dark:border-slate-800 ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {action}
              {collapsible && (
                <Icon
                  name={collapsed ? 'chevron-down' : 'chevron-up'}
                  className="w-5 h-5 text-gray-400"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section content */}
      {!collapsed && (
        <div className="px-4 py-3">
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * MobileList Component
 * List container for mobile layouts
 */
export function MobileList({ children, divided = true, className = '' }) {
  return (
    <div className={`${divided ? 'divide-y divide-gray-100 dark:divide-slate-800' : 'space-y-2'} ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileListItem Component
 * Individual list item for mobile layouts
 */
export function MobileListItem({
  title,
  subtitle,
  value,
  icon,
  rightIcon = 'chevron-right',
  onClick,
  className = ''
}) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 py-3
        ${isClickable ? 'cursor-pointer active:bg-gray-50 dark:active:bg-slate-800' : ''}
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0">
          {typeof icon === 'string' ? (
            <Icon name={icon} className="w-5 h-5 text-gray-400" />
          ) : (
            icon
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {value}
          </div>
        )}
        {isClickable && rightIcon && (
          <Icon name={rightIcon} className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  );
}

/**
 * MobileActionSheet Component
 * Bottom sheet for mobile actions
 */
export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-slate-900
          rounded-t-2xl
          shadow-2xl
          transform transition-transform duration-300
          safe-area-inset-bottom
          ${className}
        `}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * MobileEmptyState Component
 * Empty state display for mobile
 */
export function MobileEmptyState({
  icon = 'folder',
  title = 'Sin datos',
  description,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon name={icon} className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * MobileBottomNavItem Component
 * Individual item for bottom navigation
 */
export function MobileBottomNavItem({
  icon,
  label,
  active = false,
  badge,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center
        py-2 px-1 min-h-[56px]
        transition-colors
        ${active
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `}
    >
      <div className="relative">
        <Icon name={icon} className={`w-6 h-6 ${active ? 'font-bold' : ''}`} />
        {badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-xs mt-1 ${active ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </button>
  );
}
