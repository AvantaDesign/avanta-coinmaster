import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { showError } from '../utils/notifications';

/**
 * SearchPage Component - Phase 50: Advanced Search & Filtering
 * 
 * Dedicated search page with full-text search across all entities
 */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [entityType, setEntityType] = useState(searchParams.get('type') || 'all');

  // Perform search when query param changes
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlType = searchParams.get('type') || 'all';
    
    if (urlQuery) {
      setQuery(urlQuery);
      setEntityType(urlType);
      performSearch(urlQuery, urlType);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery, type = 'all') => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      showError('La búsqueda debe tener al menos 2 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      showError('Error al realizar la búsqueda');
      setResults({ total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (searchQuery) => {
    setSearchParams({ q: searchQuery, type: entityType });
  };

  const handleTypeChange = (newType) => {
    setEntityType(newType);
    if (query) {
      setSearchParams({ q: query, type: newType });
    }
  };

  const entityTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'transactions', label: 'Transacciones' },
    { value: 'invoices', label: 'Facturas' },
    { value: 'accounts', label: 'Cuentas' },
    { value: 'categories', label: 'Categorías' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Búsqueda
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Busca en transacciones, facturas, cuentas y categorías
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            autoFocus={!query}
            showHistory={true}
          />
        </div>

        {/* Entity Type Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {entityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  entityType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <SearchResults
          results={results}
          query={query}
          isLoading={isLoading}
        />

        {/* Search Tips */}
        {!query && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Consejos de búsqueda
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Busca por palabras clave en descripciones, números de factura, nombres de cuentas</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Usa el filtro de tipo para buscar solo en transacciones, facturas, cuentas o categorías</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Las sugerencias aparecen automáticamente mientras escribes</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Tu historial de búsquedas recientes está disponible para acceso rápido</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
