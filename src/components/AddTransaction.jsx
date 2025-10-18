import { useState, useEffect } from 'react';
import { createTransaction, fetchTransactions, fetchCategories, fetchInvoices, fetchSavingsGoals, contributeSavingsGoal, fetchAccounts } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';
import SmartSuggestions from './SmartSuggestions';
import SmartInput from './SmartInput';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import CFDISuggestions from './CFDISuggestions';
import { getDescriptionSuggestions, getAccountSuggestions, validateTransactionData } from '../utils/smartFormUtils';

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
    notes: '',
    // Phase 7: Savings Goals
    savings_goal_id: null,
    // Phase 14: CFDI Usage Code
    cfdi_usage_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Load transaction history for smart suggestions
  useEffect(() => {
    loadHistory();
    loadCategories();
    loadInvoices();
    loadSavingsGoals();
    loadAccounts();
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

  const loadSavingsGoals = async () => {
    try {
      const result = await fetchSavingsGoals({ is_active: 'true' });
      setSavingsGoals(result || []);
    } catch (err) {
      // Silent fail - savings goals are optional
      console.error('Failed to load savings goals:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await fetchAccounts();
      setAccounts(result.accounts || result || []);
    } catch (err) {
      // Silent fail - accounts are optional
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form data
    const validation = validateTransactionData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Por favor corrige los errores en el formulario');
      setLoading(false);
      return;
    }
    setValidationErrors({});

    try {
      const amount = parseFloat(formData.amount);
      await createTransaction({
        ...formData,
        amount
      });
      
      // If linked to savings goal and it's an income/deposit, contribute to the goal
      if (formData.savings_goal_id && formData.type === 'ingreso') {
        try {
          await contributeSavingsGoal(formData.savings_goal_id, amount);
          showSuccess('Transacción creada y contribución agregada a la meta de ahorro');
        } catch (goalErr) {
          console.error('Failed to contribute to savings goal:', goalErr);
          showSuccess('Transacción creada, pero hubo un error al actualizar la meta de ahorro');
        }
      } else {
        showSuccess('Transacción creada exitosamente');
      }
      
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
        notes: '',
        savings_goal_id: null,
        cfdi_usage_code: ''
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
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDescriptionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      description: suggestion.description,
      category: suggestion.category || prev.category,
      transaction_type: suggestion.transaction_type || prev.transaction_type,
    }));
  };

  const handleAmountChange = (numericValue) => {
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }));
    
    // Clear validation error
    if (validationErrors.amount) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  const handleDateChange = (dateValue) => {
    setFormData(prev => ({
      ...prev,
      date: dateValue
    }));
    
    // Clear validation error
    if (validationErrors.date) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }
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
          <DatePicker
            label="Fecha"
            value={formData.date}
            onChange={handleDateChange}
            required
            error={validationErrors.date}
            showQuickOptions={true}
          />
        </div>

        <div>
          <CurrencyInput
            label="Monto"
            value={formData.amount}
            onChange={handleAmountChange}
            required
            min={0}
            error={validationErrors.amount}
            currency="MXN"
            locale="es-MX"
          />
        </div>

        <div className="md:col-span-2">
          <SmartInput
            label="Descripción"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            onSelect={handleDescriptionSelect}
            getSuggestions={(partial) => getDescriptionSuggestions(partial, transactionHistory, 5)}
            placeholder="Ej: Uber, Comida, Servicio de diseño..."
            required
            error={validationErrors.description}
            minChars={2}
            showMetadata={true}
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

        <div>
          <label className="block text-sm font-medium mb-1">Meta de Ahorro</label>
          <select
            name="savings_goal_id"
            value={formData.savings_goal_id || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sin meta</option>
            {savingsGoals.filter(goal => goal.is_active && goal.progress_percentage < 100).map(goal => (
              <option key={goal.id} value={goal.id}>
                🎯 {goal.name} ({goal.progress_percentage.toFixed(0)}%)
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional: Vincular ingreso con meta de ahorro</p>
        </div>

        {/* Phase 14: CFDI Usage Code Selector */}
        <div className="md:col-span-2">
          <CFDISuggestions
            transaction={{
              category_name: categories.find(c => c.id === formData.category_id)?.name || '',
              description: formData.description,
              amount: parseFloat(formData.amount) || 0,
              transaction_type: formData.type
            }}
            value={formData.cfdi_usage_code}
            onChange={(code) => setFormData(prev => ({ ...prev, cfdi_usage_code: code }))}
            disabled={formData.type === 'ingreso'}
          />
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
