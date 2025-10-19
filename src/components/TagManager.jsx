import { useState, useEffect } from 'react';
import { 
  TagIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { fetchTags, createTag, updateTag, deleteTag } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';

/**
 * TagManager Component - Phase 27: Advanced Usability Enhancements
 * 
 * Comprehensive interface for managing tags with search, filtering, and analytics.
 */
export default function TagManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    category: ''
  });

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'general', label: 'General' },
    { value: 'provider', label: 'Proveedores' },
    { value: 'account', label: 'Cuentas' },
    { value: 'budget', label: 'Presupuestos' },
    { value: 'transaction', label: 'Transacciones' }
  ];

  const colorPresets = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Morado', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Naranja', value: '#F97316' },
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Gris', value: '#6B7280' }
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await fetchTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
      showError('Error al cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        description: tag.description || '',
        color: tag.color,
        category: tag.category || ''
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        category: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      category: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTag) {
        await updateTag(editingTag.id, formData);
        showSuccess('Etiqueta actualizada exitosamente');
      } else {
        await createTag(formData);
        showSuccess('Etiqueta creada exitosamente');
      }
      
      await loadTags();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving tag:', error);
      showError(error.message || 'Error al guardar la etiqueta');
    }
  };

  const handleDelete = async (tagId, tagName) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la etiqueta "${tagName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteTag(tagId);
      showSuccess('Etiqueta eliminada exitosamente');
      await loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      showError('Error al eliminar la etiqueta');
    }
  };

  // Filter tags based on search and category
  const filteredTags = tags.filter(tag => {
    const matchesSearch = !searchQuery || 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || 
      tag.category === categoryFilter ||
      (!tag.category && categoryFilter === 'general');

    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const totalTags = tags.length;
  const totalUsage = tags.reduce((sum, tag) => sum + (tag.usage_count || 0), 0);
  const averageUsage = totalTags > 0 ? (totalUsage / totalTags).toFixed(1) : 0;
  const unusedTags = tags.filter(tag => !tag.usage_count || tag.usage_count === 0).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestión de Etiquetas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organiza y gestiona etiquetas para categorizar tus datos
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Etiquetas</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTags}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usos Totales</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsage}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Promedio de Uso</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageUsage}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Etiquetas Sin Usar</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{unusedTags}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar etiquetas..."
              className="w-full pl-10 pr-3 py-2 border rounded-md 
                bg-white dark:bg-slate-700 
                border-gray-300 dark:border-slate-600 
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md 
              bg-white dark:bg-slate-700 
              border-gray-300 dark:border-slate-600 
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Create Button */}
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md 
              hover:bg-blue-700 
              flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Etiqueta
          </button>
        </div>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando etiquetas...</p>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || categoryFilter !== 'all' 
              ? 'No se encontraron etiquetas con los filtros aplicados' 
              : 'No hay etiquetas creadas'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear primera etiqueta
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map(tag => (
            <div
              key={tag.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 
                hover:shadow-md transition-shadow"
            >
              {/* Tag Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {tag.name}
                  </h3>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleOpenModal(tag)}
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tag Description */}
              {tag.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {tag.description}
                </p>
              )}

              {/* Tag Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {tag.category ? 
                    categories.find(c => c.value === tag.category)?.label || tag.category 
                    : 'General'}
                </span>
                <span className="font-medium">
                  {tag.usage_count || 0} {(tag.usage_count || 0) === 1 ? 'uso' : 'usos'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-md 
                      bg-white dark:bg-slate-700 
                      border-gray-300 dark:border-slate-600 
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md 
                      bg-white dark:bg-slate-700 
                      border-gray-300 dark:border-slate-600 
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                        className={`w-10 h-10 rounded-full border-2 transition-all
                          ${formData.color === preset.value 
                            ? 'border-gray-900 dark:border-white scale-110' 
                            : 'border-gray-300 dark:border-slate-600 hover:scale-105'}`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md 
                      bg-white dark:bg-slate-700 
                      border-gray-300 dark:border-slate-600 
                      text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">General</option>
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md 
                    text-gray-700 dark:text-gray-300 
                    hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTag ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
