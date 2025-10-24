import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/**
 * SearchBar Component - Phase 50: Advanced Search & Filtering
 * 
 * Provides a search input with autocomplete suggestions and search history
 * Debounces input to avoid excessive API calls
 */
export default function SearchBar({ 
  onSearch, 
  placeholder = 'Buscar transacciones, facturas, cuentas...',
  autoFocus = false,
  showHistory = true,
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Load search history on mount
  useEffect(() => {
    if (showHistory) {
      loadSearchHistory();
    }
  }, [showHistory]);

  // Debounced suggestions fetch
  useEffect(() => {
    if (query.length >= 2) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300); // 300ms debounce

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadSearchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/search/history?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const fetchSuggestions = async (searchQuery) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to search page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    // Reload history after search
    if (showHistory) {
      setTimeout(loadSearchHistory, 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.query);
    handleSearch(suggestion.query);
  };

  const handleInputFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    } else if (showHistory && searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Current query suggestions */}
          {suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sugerencias
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group"
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900 dark:text-gray-100">{suggestion.query}</span>
                  </div>
                  {suggestion.frequency > 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.frequency} búsquedas
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search history */}
          {showHistory && searchHistory.length > 0 && query.length < 2 && (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Búsquedas recientes
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick({ query: item.search_query })}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group"
                >
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900 dark:text-gray-100">{item.search_query}</span>
                  </div>
                  {item.search_count > 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.search_count}x
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* No suggestions */}
          {query.length >= 2 && suggestions.length === 0 && !isLoading && (
            <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
              <p>No hay sugerencias disponibles</p>
              <p className="text-sm mt-1">Presiona Enter para buscar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
