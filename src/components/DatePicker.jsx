import { useState } from 'react';
import { getQuickDateOptions } from '../utils/smartFormUtils';
import Icon from './icons/IconLibrary';

/**
 * DatePicker Component
 * Enhanced date picker with quick selection options
 */
export default function DatePicker({
  value,
  onChange,
  label = '',
  required = false,
  disabled = false,
  min = '',
  max = '',
  className = '',
  error = '',
  showQuickOptions = true
}) {
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const quickOptions = getQuickDateOptions();

  const handleQuickSelect = (dateValue) => {
    onChange(dateValue);
    setShowQuickPicker(false);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 pr-10
            border rounded-md
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
            ${className}
          `}
        />

        {showQuickOptions && !disabled && (
          <button
            type="button"
            onClick={() => setShowQuickPicker(!showQuickPicker)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Selección rápida"
          >
            <Icon name="calendar" className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Display formatted date */}
      {value && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formatDisplayDate(value)}
        </p>
      )}

      {/* Quick Date Picker Dropdown */}
      {showQuickPicker && showQuickOptions && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg">
          <div className="py-1">
            {quickOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleQuickSelect(option.value)}
                className={`
                  w-full px-4 py-2 text-left text-sm
                  ${option.value === value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                  flex items-center justify-between
                `}
              >
                <span>{option.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDisplayDate(option.value)}
                </span>
              </button>
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="hidden md:block border-t border-gray-200 dark:border-slate-700 px-4 py-2 bg-gray-50 dark:bg-slate-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Atajos de teclado: {quickOptions.map(opt => opt.shortcut.toUpperCase()).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
