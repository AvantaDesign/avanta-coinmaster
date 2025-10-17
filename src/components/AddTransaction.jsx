import { useState, useEffect } from 'react';
import { createTransaction, fetchTransactions, fetchCategories, fetchInvoices } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';
import SmartSuggestions from './SmartSuggestions';

export default function AddTransaction({ onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'gasto',
    category: 'personal',
    account: '',
    is_deductible: false,
    economic_activity: '',
    receipt_url: '',
    // Phase 1: Advanced Transaction Classification fields
    transaction_type: 'personal',
    category_id: null,
    linked_invoice_id: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Load transaction history for smart suggestions
  useEffect(() => {
    loadHistory();
    loadCategories();
    loadInvoices();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await fetchTransactions({ limit: 100 });
      setTransactionHistory(result.data || result || []);
    } catch (err) {
      // Silent fail - suggestions will work without history
      console.error('Failed to load history:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await fetchCategories();
      setCategories(result.data || result || []);
    } catch (err) {
      // Silent fail - categories are optional
      console.error('Failed to load categories:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      const result = await fetchInvoices();
      setInvoices(result.data || result || []);
    } catch (err) {
      // Silent fail - invoices are optional
      console.error('Failed to load invoices:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createTransaction({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      showSuccess('Transacción creada exitosamente');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'gasto',
        category: 'personal',
        account: '',
        is_deductible: false,
        economic_activity: '',
        receipt_url: '',
        transaction_type: 'personal',
        category_id: null,
        linked_invoice_id: null,
        notes: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
      showError(`Error al crear transacción: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestedCategory) => {
    setFormData(prev => ({
      ...prev,
      category: suggestedCategory
    }));
    showSuccess(`Categoría cambiada a ${suggestedCategory}`);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Agregar Transacción</h2>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Monto</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="personal">Personal</option>
            <option value="avanta">Avanta</option>
          </select>
        </div>
        
        {/* Smart Suggestions - Show after description and amount are entered */}
        {formData.description && formData.amount && (
          <div className="md:col-span-2">
            <SmartSuggestions
              description={formData.description}
              amount={parseFloat(formData.amount) || 0}
              history={transactionHistory}
              onSelect={handleSuggestionSelect}
              currentCategory={formData.category}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Cuenta</label>
          <input
            type="text"
            name="account"
            value={formData.account}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_deductible"
              checked={formData.is_deductible}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium">Deducible</span>
          </label>
        </div>

        {/* Phase 1: Advanced Transaction Classification Fields */}
        <div className="md:col-span-2 border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Clasificación Avanzada</h3>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Transacción</label>
          <select
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="personal">Personal</option>
            <option value="business">Negocio</option>
            <option value="transfer">Transferencia</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clasificación fiscal de la transacción</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoría Personalizada</label>
          <select
            name="category_id"
            value={formData.category_id || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sin categoría</option>
            {categories.filter(cat => cat.is_active).map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional: Categoría personalizada</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vincular Factura (CFDI)</label>
          <select
            name="linked_invoice_id"
            value={formData.linked_invoice_id || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sin factura</option>
            {invoices.filter(inv => inv.status === 'active').map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.uuid?.substring(0, 8)}... - ${inv.total.toFixed(2)} ({inv.date})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional: Vincular con factura existente</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            maxLength="1000"
            className="w-full px-3 py-2 border rounded-md resize-none"
            placeholder="Notas adicionales sobre esta transacción..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.notes.length}/1000 caracteres
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Guardando...' : 'Agregar Transacción'}
      </button>
    </form>
  );
}
