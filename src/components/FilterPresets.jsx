import { useState, useEffect } from 'react';
import { 
  BookmarkIcon, 
  PlusIcon, 
  TrashIcon, 
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useFilterStore from '../stores/useFilterStore';
import { showSuccess, showError } from '../utils/notifications';

/**
 * FilterPresets Component - Phase 50: Advanced Search & Filtering
 * 
 * Manages saved filter presets for quick access to common filter combinations
 */
export default function FilterPresets({ onApplyPreset }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    savedPresets,
    activePreset,
    advancedFilters,
    loadPresets,
    applyPreset,
    saveAsPreset,
    deletePreset,
    togglePresetFavorite,
  } = useFilterStore();

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      showError('El nombre del preset es requerido');
      return;
    }

    if (Object.keys(advancedFilters).length === 0) {
      showError('No hay filtros para guardar');
      return;
    }

    setIsLoading(true);
    try {
      await saveAsPreset(presetName, presetDescription, isFavorite);
      showSuccess('Preset guardado exitosamente');
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
      setIsFavorite(false);
    } catch (error) {
      showError('Error al guardar el preset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async (presetId) => {
    await applyPreset(presetId);
    if (onApplyPreset) {
      onApplyPreset();
    }
  };

  const handleDeletePreset = async (presetId, e) => {
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de que deseas eliminar este preset?')) {
      return;
    }

    try {
      await deletePreset(presetId);
      showSuccess('Preset eliminado exitosamente');
    } catch (error) {
      showError('Error al eliminar el preset');
    }
  };

  const handleToggleFavorite = async (presetId, e) => {
    e.stopPropagation();
    
    try {
      await togglePresetFavorite(presetId);
    } catch (error) {
      showError('Error al actualizar el preset');
    }
  };

  // Sort presets: favorites first, then by usage count
  const sortedPresets = [...savedPresets].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return b.usage_count - a.usage_count;
  });

  const hasActiveFilters = Object.keys(advancedFilters).length > 0;

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <BookmarkIcon className="h-5 w-5 mr-2 text-gray-400" />
          Filtros Guardados
        </h3>
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Guardar Filtros
          </button>
        )}
      </div>

      {/* Presets List */}
      {sortedPresets.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
          <BookmarkIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No hay filtros guardados</p>
          <p className="text-xs mt-1">Aplica filtros y guárdalos para acceso rápido</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors group ${
                activePreset === preset.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {preset.name}
                    </p>
                    {preset.is_favorite && (
                      <StarIconSolid className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  {preset.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {preset.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{preset.usage_count} usos</span>
                    <span>•</span>
                    <span>{Object.keys(preset.filter_config).length} filtros</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleFavorite(preset.id, e)}
                    className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors"
                    title={preset.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {preset.is_favorite ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar preset"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Guardar Filtros
              </h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Ej: Gastos del mes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Describe estos filtros..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="favorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="favorite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Marcar como favorito
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
