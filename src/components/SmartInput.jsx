import { useState, useEffect, useRef } from 'react';
import { fuzzyMatch, debounce } from '../utils/smartFormUtils';
import Icon from './icons/IconLibrary';

/**
 * SmartInput Component
 * Auto-complete input with suggestions, keyboard navigation, and mobile optimization
 */
export default function SmartInput({
  value,
  onChange,
  onSelect,
  getSuggestions,
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  className = '',
  error = '',
  minChars = 2,
  maxSuggestions = 5,
  debounceMs = 300,
  showMetadata = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced suggestion fetcher
  const fetchSuggestions = useRef(
    debounce(async (inputValue) => {
      if (inputValue.length < minChars) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.resolve(getSuggestions(inputValue));
        setSuggestions(results.slice(0, maxSuggestions));
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs)
  ).current;

  useEffect(() => {
    if (value && getSuggestions) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion) => {
    const selectedValue = suggestion.description || suggestion.value || suggestion;
    onChange(selectedValue);
    if (onSelect) {
      onSelect(suggestion);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="font-semibold text-primary-600 dark:text-primary-400">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
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
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= minChars && setSuggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
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

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Icon name="refresh" className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}

        {!loading && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="x-mark" className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const text = suggestion.description || suggestion.value || suggestion;
            return (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`
                  px-4 py-2 cursor-pointer
                  ${index === selectedIndex
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                  border-b border-gray-100 dark:border-slate-700 last:border-b-0
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {highlightMatch(text, value)}
                    </div>
                    {showMetadata && suggestion.category && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.category}
                        </span>
                        {suggestion.count && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            • Usado {suggestion.count} {suggestion.count === 1 ? 'vez' : 'veces'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {suggestion.amount && (
                    <div className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      ${suggestion.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile hint */}
      {showSuggestions && (
        <div className="md:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
          Toca para seleccionar
        </div>
      )}

      {/* Keyboard hint */}
      {showSuggestions && (
        <div className="hidden md:block mt-1 text-xs text-gray-500 dark:text-gray-400">
          Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
        </div>
      )}
    </div>
  );
}
