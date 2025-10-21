/**
 * ValidationError Component
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Component for displaying field-level validation errors.
 * Provides user-friendly error messages with recovery suggestions.
 * 
 * Props:
 *   - error: Error object or string
 *   - field: Field name
 *   - touched: Whether field has been touched
 *   - show: Whether to show the error
 *   - className: Additional CSS classes
 * 
 * Usage:
 *   <ValidationError 
 *     error={errors.email} 
 *     field="email"
 *     touched={touched.email}
 *   />
 */

import { formatFieldError } from '../utils/validation-errors';

function ValidationError({ 
  error, 
  field, 
  touched = true, 
  show = true,
  className = '' 
}) {
  // Don't show if no error or not touched
  if (!error || !touched || !show) {
    return null;
  }
  
  // Format error message
  const message = typeof error === 'string' 
    ? error 
    : formatFieldError(error);
  
  return (
    <div 
      className={`mt-1 text-sm text-danger-600 dark:text-danger-400 flex items-start ${className}`}
      role="alert"
      aria-live="polite"
    >
      <span className="mr-1 flex-shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

export default ValidationError;
