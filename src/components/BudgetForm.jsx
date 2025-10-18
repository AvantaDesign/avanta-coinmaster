import { useState, useEffect } from 'react';
import { validateBudget, calculatePeriodDates } from '../utils/budgets';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function BudgetForm({ budget, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    classification: 'business',
    category_id: '',
    amount: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
    end_date: '',
    notes: '',
    is_active: true
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    
    if (budget) {
      setFormData({
        classification: budget.classification || 'business',
        category_id: budget.category_id || '',
        amount: budget.amount || '',
        period: budget.period || 'monthly',
        start_date: budget.start_date || new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
        end_date: budget.end_date || '',
        notes: budget.notes || '',
        is_active: budget.is_active !== undefined ? budget.is_active : true
      });
    }
  }, [budget]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        credentials: 'include'
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate end date when start date or period changes
    if (name === 'start_date' || name === 'period') {
      const period = name === 'period' ? value : formData.period;
      const startDate = name === 'start_date' ? value : formData.start_date;
      
      if (startDate && period) {
        const dates = calculatePeriodDates(period, startDate);
        setFormData(prev => ({
          ...prev,
          end_date: dates.endDate
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateBudget(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setLoading(true);

    // Convert amount to number
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      category_id: formData.category_id ? parseInt(formData.category_id) : null
    };

    onSubmit(submitData);
    setLoading(false);
  };

  const filteredCategories = categories.filter(c => c.is_active);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 text-red-800 dark:text-red-300 px-4 py-3 rounded">
          <p className="font-semibold mb-2">Por favor corrige los siguientes errores:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Classification */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Clasificación <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, classification: 'business' }))}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              formData.classification === 'business'
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">💼</div>
              <div className="font-semibold">Negocio</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, classification: 'personal' }))}
            className={`px-4 py-3 rounded-lg border-2 transition-colors ${
              formData.classification === 'personal'
                ? 'border-purple-600 bg-purple-50 text-purple-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">👤</div>
              <div className="font-semibold">Personal</div>
            </div>
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Categoría (opcional)
        </label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="">Sin categoría específica (General)</option>
          {filteredCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Deja vacío para crear un presupuesto general que cubra todas las categorías
        </p>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Monto <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Período <span className="text-red-500">*</span>
        </label>
        <select
          name="period"
          value={formData.period}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option value="monthly">Mensual</option>
          <option value="quarterly">Trimestral</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Fin
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Se calcula automáticamente según el período
          </p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notas (opcional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Agregar notas sobre este presupuesto..."
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Presupuesto activo
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Guardando...' : budget ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
