import { useState, useEffect } from 'react';
import Icon from './icons/IconLibrary';
import DatePicker from './DatePicker';
import CurrencyInput from './CurrencyInput';

/**
 * TableFilters Component
 * Advanced filtering interface for data tables
 */
export default function TableFilters({
  onFiltersChange,
  availableFilters = [],
  initialFilters = {},
  showSavePreset = true,
  presets = [],
  onSavePreset,
  onLoadPreset,
  onClearFilters
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [expanded, setExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [presetName, setPresetName] = useState('');
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  useEffect(() => {
    // Count active filters
    const count = Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== '');
      }
      return value !== null && value !== '';
    }).length;
    setActiveFilterCount(count);

    // Notify parent of filter changes
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleClearAll = () => {
    setFilters({});
    if (onClearFilters) onClearFilters();
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName,
        filters: { ...filters }
      });
      setPresetName('');
      setShowPresetDialog(false);
    }
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset.filters);
    if (onLoadPreset) onLoadPreset(preset);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Filter Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Icon name="adjustments-horizontal" className="w-5 h-5" />
          <span className="font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            className="w-4 h-4 text-gray-400"
          />
        </button>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Limpiar todo
            </button>
          )}
          {showSavePreset && (
            <button
              onClick={() => setShowPresetDialog(true)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              Guardar filtro
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Saved Presets */}
          {presets && presets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtros guardados
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadPreset(preset)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Icon name="bookmark" className="w-3 h-3" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFilters.map((filter) => (
              <FilterField
                key={filter.key}
                filter={filter}
                value={filters[filter.key]}
                onChange={(value) => handleFilterChange(filter.key, value)}
              />
            ))}
          </div>

          {/* No filters message */}
          {availableFilters.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay filtros disponibles
            </p>
          )}
        </div>
      )}

      {/* Save Preset Dialog */}
      {showPresetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Guardar filtro personalizado
            </h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nombre del filtro..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPresetDialog(false);
                  setPresetName('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * FilterField Component
 * Renders appropriate input based on filter type
 */
function FilterField({ filter, value, onChange }) {
  const { type, label, options, placeholder, min, max } = filter;

  switch (type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'multiselect':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-800">
            {options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const newValue = value || [];
                    if (e.target.checked) {
                      onChange([...newValue, option.value]);
                    } else {
                      onChange(newValue.filter(v => v !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 dark:border-slate-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'date':
      return (
        <DatePicker
          label={label}
          value={value || ''}
          onChange={onChange}
          showQuickOptions={true}
        />
      );

    case 'daterange':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              placeholder="Desde"
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              placeholder="Hasta"
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      );

    case 'number':
      return (
        <CurrencyInput
          label={label}
          value={value || 0}
          onChange={onChange}
          min={min}
          max={max}
        />
      );

    case 'numberrange':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={value?.min || ''}
              onChange={(e) => onChange({ ...value, min: parseFloat(e.target.value) || null })}
              placeholder="Mínimo"
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="number"
              value={value?.max || ''}
              onChange={(e) => onChange({ ...value, max: parseFloat(e.target.value) || null })}
              placeholder="Máximo"
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-600"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </label>
        </div>
      );

    default:
      return null;
  }
}
