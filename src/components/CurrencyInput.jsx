import { useState, useEffect } from 'react';
import { formatCurrencyInput } from '../utils/smartFormUtils';
import Icon from './icons/IconLibrary';

/**
 * CurrencyInput Component
 * Currency input with real-time formatting and validation
 */
export default function CurrencyInput({
  value,
  onChange,
  label = '',
  placeholder = '0.00',
  required = false,
  disabled = false,
  min = 0,
  max = 999999999.99,
  currency = 'MXN',
  locale = 'es-MX',
  className = '',
  error = '',
  showSymbol = true,
  allowNegative = false
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      // Format display value when not focused
      if (value) {
        const formatted = formatCurrencyInput(String(value), locale);
        setDisplayValue(formatted.display);
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused, locale]);

  const handleChange = (e) => {
    let inputValue = e.target.value;

    // Remove all non-numeric characters except decimal point and minus
    if (allowNegative) {
      inputValue = inputValue.replace(/[^\d.-]/g, '');
    } else {
      inputValue = inputValue.replace(/[^\d.]/g, '');
    }

    // Handle negative sign
    if (allowNegative && inputValue.startsWith('-')) {
      inputValue = '-' + inputValue.slice(1).replace(/-/g, '');
    }

    // Ensure only one decimal point
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      inputValue = parts[0] + '.' + parts[1].slice(0, 2);
    }

    const numericValue = parseFloat(inputValue) || 0;

    // Validate min/max
    if (numericValue < min) {
      setDisplayValue(String(min));
      onChange(min);
      return;
    }
    if (numericValue > max) {
      setDisplayValue(String(max));
      onChange(max);
      return;
    }

    setDisplayValue(inputValue);
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value when focused
    if (value) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format value when blurred
    if (value) {
      const formatted = formatCurrencyInput(String(value), locale);
      setDisplayValue(formatted.display);
    } else {
      setDisplayValue('');
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min((value || 0) + 1, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max((value || 0) - 1, min);
    onChange(newValue);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Currency Symbol */}
        {showSymbol && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            <span className="text-sm font-medium">$</span>
          </div>
        )}

        {/* Input */}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2
            ${showSymbol ? 'pl-8' : ''}
            pr-20
            border rounded-md
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            text-right
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
            ${className}
          `}
        />

        {/* Increment/Decrement Buttons */}
        {!disabled && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
            <button
              type="button"
              onClick={handleIncrement}
              className="px-2 py-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              tabIndex={-1}
            >
              <Icon name="chevron-up" className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleDecrement}
              className="px-2 py-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
              tabIndex={-1}
            >
              <Icon name="chevron-down" className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper text */}
      {!error && (min > 0 || max < 999999999.99) && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {min > 0 && max < 999999999.99 && (
            <>Rango: ${min.toFixed(2)} - ${max.toFixed(2)}</>
          )}
          {min > 0 && max >= 999999999.99 && (
            <>Mínimo: ${min.toFixed(2)}</>
          )}
          {min === 0 && max < 999999999.99 && (
            <>Máximo: ${max.toFixed(2)}</>
          )}
        </p>
      )}
    </div>
  );
}
