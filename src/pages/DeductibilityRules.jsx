import { useState, useEffect } from 'react';
import { showSuccess, showError } from '../utils/notifications';
import Icon from '../components/icons/IconLibrary';

export default function DeductibilityRules() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 0,
    is_active: true,
    match_category_id: null,
    match_keywords: '',
    match_amount_min: '',
    match_amount_max: '',
    match_transaction_type: '',
    match_expense_type: '',
    set_is_iva_deductible: null,
    set_is_isr_deductible: null,
    set_expense_type: '',
    notes: ''
  });

  useEffect(() => {
    loadRules();
    loadCategories();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/deductibility-rules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar reglas');
      
      const result = await response.json();
      setRules(result.data || []);
    } catch (error) {
      showError(`Error al cargar reglas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data || result || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one action is specified
    if (formData.set_is_iva_deductible === null && 
        formData.set_is_isr_deductible === null && 
        !formData.set_expense_type) {
      showError('Debes especificar al menos una acción (IVA, ISR o tipo de gasto)');
      return;
    }

    try {
      // Convert keywords string to array
      const keywords = formData.match_keywords 
        ? formData.match_keywords.split(',').map(k => k.trim()).filter(k => k)
        : null;

      const payload = {
        ...formData,
        match_keywords: keywords,
        match_amount_min: formData.match_amount_min ? parseFloat(formData.match_amount_min) : null,
        match_amount_max: formData.match_amount_max ? parseFloat(formData.match_amount_max) : null,
        match_category_id: formData.match_category_id || null,
        match_transaction_type: formData.match_transaction_type || null,
        match_expense_type: formData.match_expense_type || null,
        set_expense_type: formData.set_expense_type || null
      };

      const url = editingRule 
        ? `/api/deductibility-rules/${editingRule.id}`
        : '/api/deductibility-rules';
      
      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar regla');
      }

      showSuccess(editingRule ? 'Regla actualizada' : 'Regla creada exitosamente');
      resetForm();
      loadRules();
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;

    try {
      const response = await fetch(`/api/deductibility-rules/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar regla');

      showSuccess('Regla eliminada exitosamente');
      loadRules();
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  };

  const startEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      priority: rule.priority,
      is_active: rule.is_active === 1,
      match_category_id: rule.match_category_id,
      match_keywords: rule.match_keywords ? JSON.parse(rule.match_keywords).join(', ') : '',
      match_amount_min: rule.match_amount_min || '',
      match_amount_max: rule.match_amount_max || '',
      match_transaction_type: rule.match_transaction_type || '',
      match_expense_type: rule.match_expense_type || '',
      set_is_iva_deductible: rule.set_is_iva_deductible,
      set_is_isr_deductible: rule.set_is_isr_deductible,
      set_expense_type: rule.set_expense_type || '',
      notes: rule.notes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 0,
      is_active: true,
      match_category_id: null,
      match_keywords: '',
      match_amount_min: '',
      match_amount_max: '',
      match_transaction_type: '',
      match_expense_type: '',
      set_is_iva_deductible: null,
      set_is_isr_deductible: null,
      set_expense_type: '',
      notes: ''
    });
    setEditingRule(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reglas de Deducibilidad</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura reglas automáticas para clasificar la deducibilidad de tus gastos según SAT
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Icon name="plus" className="w-5 h-5" />
            Nueva Regla
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingRule ? 'Editar Regla' : 'Nueva Regla'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Nombre de la Regla *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Ej: Gastos de oficina deducibles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Prioridad
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mayor prioridad se evalúa primero
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Descripción de la regla..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Regla activa</span>
                </label>
              </div>
            </div>

            {/* Matching Criteria */}
            <div className="border-t pt-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Criterios de Coincidencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Categoría
                  </label>
                  <select
                    value={formData.match_category_id || ''}
                    onChange={(e) => setFormData({ ...formData, match_category_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Palabras clave (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={formData.match_keywords}
                    onChange={(e) => setFormData({ ...formData, match_keywords: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="Ej: uber, gasolina, transporte"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Monto mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.match_amount_min}
                    onChange={(e) => setFormData({ ...formData, match_amount_min: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Monto máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.match_amount_max}
                    onChange={(e) => setFormData({ ...formData, match_amount_max: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    placeholder="9999999.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Tipo de transacción
                  </label>
                  <select
                    value={formData.match_transaction_type}
                    onChange={(e) => setFormData({ ...formData, match_transaction_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="business">Negocio</option>
                    <option value="personal">Personal</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Tipo de gasto
                  </label>
                  <select
                    value={formData.match_expense_type}
                    onChange={(e) => setFormData({ ...formData, match_expense_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="national">Nacional</option>
                    <option value="international_with_invoice">Internacional con Factura</option>
                    <option value="international_no_invoice">Internacional sin Factura</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Acciones *</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    ISR Deducible
                  </label>
                  <select
                    value={formData.set_is_isr_deductible === null ? '' : formData.set_is_isr_deductible ? '1' : '0'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      set_is_isr_deductible: e.target.value === '' ? null : e.target.value === '1' 
                    })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Sin cambio</option>
                    <option value="1">Sí, deducible</option>
                    <option value="0">No deducible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    IVA Acreditable
                  </label>
                  <select
                    value={formData.set_is_iva_deductible === null ? '' : formData.set_is_iva_deductible ? '1' : '0'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      set_is_iva_deductible: e.target.value === '' ? null : e.target.value === '1' 
                    })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Sin cambio</option>
                    <option value="1">Sí, acreditable</option>
                    <option value="0">No acreditable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                    Establecer tipo de gasto
                  </label>
                  <select
                    value={formData.set_expense_type}
                    onChange={(e) => setFormData({ ...formData, set_expense_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="">Sin cambio</option>
                    <option value="national">Nacional</option>
                    <option value="international_with_invoice">Internacional con Factura</option>
                    <option value="international_no_invoice">Internacional sin Factura</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                * Debes especificar al menos una acción
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder="Notas sobre esta regla..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                {editingRule ? 'Actualizar Regla' : 'Crear Regla'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-800 dark:text-white px-6 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando reglas...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <Icon name="document-text" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No hay reglas configuradas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Crea tu primera regla para automatizar la clasificación de deducibilidad
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Crear Primera Regla
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.sort((a, b) => b.priority - a.priority).map((rule) => (
            <div
              key={rule.id}
              className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${
                rule.is_active === 0 ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {rule.name}
                    </h3>
                    {rule.is_active === 0 && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        Inactiva
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      Prioridad: {rule.priority}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {rule.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(rule)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="Editar"
                  >
                    <Icon name="pencil" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    title="Eliminar"
                  >
                    <Icon name="trash" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Criteria */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Criterios:</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    {rule.match_category_id && (
                      <li>• Categoría ID: {rule.match_category_id}</li>
                    )}
                    {rule.match_keywords && (
                      <li>• Palabras: {JSON.parse(rule.match_keywords).join(', ')}</li>
                    )}
                    {rule.match_amount_min && (
                      <li>• Monto mín: ${parseFloat(rule.match_amount_min).toFixed(2)}</li>
                    )}
                    {rule.match_amount_max && (
                      <li>• Monto máx: ${parseFloat(rule.match_amount_max).toFixed(2)}</li>
                    )}
                    {rule.match_transaction_type && (
                      <li>• Tipo: {rule.match_transaction_type}</li>
                    )}
                    {rule.match_expense_type && (
                      <li>• Tipo gasto: {rule.match_expense_type}</li>
                    )}
                    {!rule.match_category_id && !rule.match_keywords && !rule.match_amount_min && 
                     !rule.match_amount_max && !rule.match_transaction_type && !rule.match_expense_type && (
                      <li className="text-gray-400">Sin criterios específicos</li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Acciones:</h4>
                  <div className="space-y-1">
                    {rule.set_is_isr_deductible !== null && (
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        rule.set_is_isr_deductible === 1 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        ISR: {rule.set_is_isr_deductible === 1 ? 'Deducible' : 'No deducible'}
                      </span>
                    )}
                    {rule.set_is_iva_deductible !== null && (
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        rule.set_is_iva_deductible === 1 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        IVA: {rule.set_is_iva_deductible === 1 ? 'Acreditable' : 'No acreditable'}
                      </span>
                    )}
                    {rule.set_expense_type && (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                        Tipo: {rule.set_expense_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {rule.notes && (
                <div className="mt-4 pt-4 border-t dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📝 {rule.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
