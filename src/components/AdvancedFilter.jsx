import { useState, useEffect } from 'react';

/**
 * AdvancedFilter Component
 * 
 * Provides advanced filtering capabilities for transactions:
 * - Multiple criteria filtering
 * - Date range filtering
 * - Amount range filtering
 * - Text search
 * - Saved filter presets
 * - Filter history
 */
export default function AdvancedFilter({ onFilterChange, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    transaction_type: '',
    category: '',
    account: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
    type: '', // ingreso/gasto
    is_deductible: '',
  });
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    loadSavedFilters();
  }, []);

  useEffect(() => {
    // Notify parent of filter changes
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('savedFilters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      transaction_type: '',
      category: '',
      account: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
      type: '',
      is_deductible: '',
    };
    setFilters(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a name for this filter');
      return;
    }

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
    setFilterName('');
    setShowSaveDialog(false);
  };

  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
  };

  const deleteSavedFilter = (filterId) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              {hasActiveFilters() && (
                <p className="text-sm text-blue-600">
                  {getActiveFilterCount()} active filter(s)
                </p>
              )}
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <svg 
              className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Filter Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Quick Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔎 Quick Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in descriptions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filters.transaction_type}
                onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="personal">Personal</option>
                <option value="avanta">Avanta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Income/Expense
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="ingreso">Income</option>
                <option value="gasto">Expense</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="From"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💰 Amount Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={filters.amount_min}
                  onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                  placeholder="Min amount"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={filters.amount_max}
                  onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                  placeholder="Max amount"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Deductible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deductible
            </label>
            <select
              value={filters.is_deductible}
              onChange={(e) => handleFilterChange('is_deductible', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear All Filters
            </button>
            {hasActiveFilters() && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💾 Save Filter
              </button>
            )}
          </div>

          {/* Save Filter Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Save Filter Preset</h3>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Enter filter name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCurrentFilter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Filter Presets</h4>
              <div className="space-y-2">
                {savedFilters.map(savedFilter => (
                  <div 
                    key={savedFilter.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={() => loadSavedFilter(savedFilter)}
                      className="flex-1 text-left text-sm font-medium text-gray-900"
                    >
                      📋 {savedFilter.name}
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(savedFilter.id)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
