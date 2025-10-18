import { useState, useEffect } from 'react';
import { 
  suggestCFDICode, 
  getCFDIDescription, 
  validateCFDIRequirement,
  getCFDIHistory,
  saveCFDIUsage,
  searchCFDICodes,
  getCFDIByCategory
} from '../utils/cfdiUtils';
import Icon from './icons/IconLibrary';

/**
 * CFDI Suggestions Component
 * Provides intelligent CFDI usage code suggestions and validation
 */
export default function CFDISuggestions({ 
  transaction = {}, 
  value = '', 
  onChange,
  disabled = false 
}) {
  const [selectedCode, setSelectedCode] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validation, setValidation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    // Load user's CFDI history
    const userId = 1; // TODO: Get from auth context
    const userHistory = getCFDIHistory(userId);
    setHistory(userHistory);
  }, []);

  useEffect(() => {
    if (value) {
      setSelectedCode(value);
      validateCode(value);
    }
  }, [value]);

  useEffect(() => {
    // Generate suggestions when transaction details change
    if (transaction.category_name || transaction.description) {
      const suggested = suggestCFDICode(
        transaction.category_name || '',
        transaction.amount || 0,
        transaction.transaction_type || 'egreso',
        transaction.description || ''
      );
      setSuggestions(suggested);
    }
  }, [transaction.category_name, transaction.description, transaction.amount, transaction.transaction_type]);

  const validateCode = (code) => {
    if (!code) {
      setValidation(null);
      return;
    }

    const result = validateCFDIRequirement(code, transaction);
    setValidation(result);
  };

  const handleSelect = (code) => {
    setSelectedCode(code);
    validateCode(code);
    setShowSuggestions(false);
    
    // Save to history
    const userId = 1; // TODO: Get from auth context
    saveCFDIUsage(userId, code);
    
    // Notify parent
    if (onChange) {
      onChange(code);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const results = searchCFDICodes(query);
      setSuggestions(results.slice(0, 5).map(cfdi => ({
        ...cfdi,
        confidence: 0.8,
        reason: 'Resultado de búsqueda'
      })));
    } else {
      // Reset to automatic suggestions
      const suggested = suggestCFDICode(
        transaction.category_name || '',
        transaction.amount || 0,
        transaction.transaction_type || 'egreso',
        transaction.description || ''
      );
      setSuggestions(suggested);
    }
  };

  const handleCategoryFilter = (categoryPrefix) => {
    setActiveCategory(categoryPrefix);
    if (categoryPrefix === 'all') {
      const suggested = suggestCFDICode(
        transaction.category_name || '',
        transaction.amount || 0,
        transaction.transaction_type || 'egreso',
        transaction.description || ''
      );
      setSuggestions(suggested);
    } else {
      const filtered = getCFDIByCategory(categoryPrefix);
      setSuggestions(filtered.map(cfdi => ({
        ...cfdi,
        confidence: 0.5,
        reason: 'Categoría seleccionada'
      })));
    }
  };

  const selectedCFDI = selectedCode ? getCFDIDescription(selectedCode) : null;

  const categories = [
    { key: 'all', label: 'Todos', icon: 'view-grid' },
    { key: 'G', label: 'Gastos', icon: 'shopping-cart' },
    { key: 'I', label: 'Inversiones', icon: 'chart-bar' },
    { key: 'D', label: 'Deducciones', icon: 'receipt-tax' }
  ];

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Uso de CFDI
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          (Requerido para factura)
        </span>
      </label>

      {/* Selected Code Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setShowSuggestions(!showSuggestions)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg transition-colors ${
            validation?.valid === false
              ? 'border-red-300 dark:border-red-700'
              : validation?.valid === true
              ? 'border-green-300 dark:border-green-700'
              : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer'
          }`}
        >
          {selectedCFDI ? (
            <div className="flex items-center gap-3 flex-1 text-left">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {selectedCFDI.code}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {selectedCFDI.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedCFDI.description}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Icon name="document-text" className="w-5 h-5" />
              <span>Seleccionar uso de CFDI</span>
            </div>
          )}
          <Icon 
            name={showSuggestions ? 'chevron-up' : 'chevron-down'} 
            className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
          />
        </button>

        {/* Suggestions Dropdown */}
        {showSuggestions && !disabled && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search Box */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Icon 
                  name="search" 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Buscar código CFDI..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryFilter(cat.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon name={cat.icon} className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* History Section */}
            {history.length > 0 && !searchQuery && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                  Usados recientemente
                </div>
                {history.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {item.code}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Usado {item.count} {item.count === 1 ? 'vez' : 'veces'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions List */}
            <div className="max-h-64 overflow-y-auto">
              {suggestions.length > 0 ? (
                <>
                  {!searchQuery && (
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-900">
                      Sugerencias para esta transacción
                    </div>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(suggestion.code)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                          {suggestion.code}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {suggestion.description}
                        </div>
                        {suggestion.confidence > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div 
                                className="bg-primary-600 h-1.5 rounded-full"
                                style={{ width: `${suggestion.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                        )}
                        {suggestion.reason && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                            {suggestion.reason}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Icon name="search" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se encontraron códigos CFDI</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {validation && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <Icon name="exclamation-circle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Icon name="exclamation-triangle" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        El código de uso de CFDI indica el propósito del gasto para fines fiscales
      </p>
    </div>
  );
}
