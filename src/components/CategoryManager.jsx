import { useState, useEffect } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../utils/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Expanded color palette with 24 colors
  const colors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Azul Claro', value: '#60A5FA' },
    { name: 'Azul Oscuro', value: '#1E40AF' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Verde Claro', value: '#34D399' },
    { name: 'Verde Lima', value: '#84CC16' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Rojo Oscuro', value: '#DC2626' },
    { name: 'Naranja', value: '#F97316' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Ámbar', value: '#FBBF24' },
    { name: 'Morado', value: '#8B5CF6' },
    { name: 'Morado Oscuro', value: '#7C3AED' },
    { name: 'Índigo', value: '#6366F1' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Rosa Claro', value: '#F472B6' },
    { name: 'Fucsia', value: '#D946EF' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Esmeralda', value: '#059669' },
    { name: 'Gris', value: '#6B7280' },
    { name: 'Gris Claro', value: '#9CA3AF' },
    { name: 'Gris Oscuro', value: '#4B5563' },
    { name: 'Slate', value: '#64748B' }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
      } else {
        await createCategory(formData);
      }
      await loadCategories();
      resetForm();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
    
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setEditingId(null);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            + Nueva Categoría
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  required
                  placeholder="ej. Servicios Profesionales"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-10 h-10 rounded-md border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                rows="3"
                placeholder="Descripción opcional de la categoría"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
            No hay categorías registradas
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 text-sm text-blue-600 hover:text-blue-900 font-medium"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 text-sm text-red-600 hover:text-red-900 font-medium"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {categories.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Total de categorías:</span>
            <span className="text-lg font-bold text-blue-900">{categories.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
