/**
 * FormField Component
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Enhanced form field component with built-in validation error display.
 * Supports various input types and provides consistent styling.
 * 
 * Props:
 *   - label: Field label
 *   - name: Field name
 *   - type: Input type (text, email, number, etc.)
 *   - value: Field value
 *   - onChange: Change handler
 *   - onBlur: Blur handler
 *   - error: Validation error
 *   - touched: Whether field has been touched
 *   - required: Whether field is required
 *   - disabled: Whether field is disabled
 *   - placeholder: Placeholder text
 *   - helpText: Help text
 *   - className: Additional CSS classes
 * 
 * Usage:
 *   <FormField
 *     label="Email"
 *     name="email"
 *     type="email"
 *     value={values.email}
 *     onChange={handleChange}
 *     onBlur={handleBlur}
 *     error={errors.email}
 *     touched={touched.email}
 *     required
 *   />
 */

import ValidationError from './ValidationError';

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  className = '',
  inputClassName = '',
  ...rest
}) {
  const hasError = error && touched;
  
  const baseInputClasses = `
    w-full px-4 py-2 rounded-lg border
    bg-white dark:bg-slate-800
    text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    transition-colors duration-200
    focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const normalClasses = `
    border-gray-300 dark:border-slate-600
    focus:border-primary-500 dark:focus:border-primary-400
    focus:ring-primary-500/20 dark:focus:ring-primary-400/20
  `;
  
  const errorClasses = `
    border-danger-300 dark:border-danger-600
    focus:border-danger-500 dark:focus:border-danger-400
    focus:ring-danger-500/20 dark:focus:ring-danger-400/20
  `;
  
  const inputClasses = `
    ${baseInputClasses}
    ${hasError ? errorClasses : normalClasses}
    ${inputClassName}
  `.trim();
  
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger-500" aria-label="requerido">
              *
            </span>
          )}
        </label>
      )}
      
      {/* Input */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
        className={inputClasses}
        {...rest}
      />
      
      {/* Help Text */}
      {helpText && !hasError && (
        <p 
          id={`${name}-help`}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </p>
      )}
      
      {/* Validation Error */}
      <div id={`${name}-error`}>
        <ValidationError
          error={error}
          field={name}
          touched={touched}
        />
      </div>
    </div>
  );
}

export default FormField;
