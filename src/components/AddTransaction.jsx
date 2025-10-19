import { useState, useEffect } from 'react';
import { createTransaction, fetchTransactions, fetchCategories, createCategory, fetchInvoices, fetchSavingsGoals, contributeSavingsGoal, fetchAccounts, evaluateTransactionCompliance } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';
import SmartSuggestions from './SmartSuggestions';
import SmartInput from './SmartInput';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import CFDISuggestions from './CFDISuggestions';
import SelectWithCreate from './SelectWithCreate';
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
    cfdi_usage_code: '',
    // Phase 16: Granular Tax Deductibility
    is_iva_deductible: false,
    is_isr_deductible: false,
    expense_type: 'national',
    // Phase 17: Income-specific fields
    client_type: 'nacional',
    client_rfc: '',
    currency: 'MXN',
    exchange_rate: 1.0,
    payment_method: 'PUE',
    iva_rate: '16',
    isr_retention: 0,
    iva_retention: 0,
    cfdi_uuid: '',
    issue_date: '',
    payment_date: '',
    economic_activity_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  // Phase 28: Compliance feedback
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

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

  // Phase 16: Sync legacy is_deductible with granular fields for backward compatibility
  useEffect(() => {
    // If either ISR or IVA is deductible, set is_deductible to true
    const shouldBeDeductible = formData.is_isr_deductible || formData.is_iva_deductible;
    if (formData.is_deductible !== shouldBeDeductible) {
      setFormData(prev => ({
        ...prev,
        is_deductible: shouldBeDeductible
      }));
    }
  }, [formData.is_isr_deductible, formData.is_iva_deductible]);

  // Phase 28: Real-time compliance evaluation
  useEffect(() => {
    const evaluateCompliance = async () => {
      // Only evaluate if we have minimum required data
      if (!formData.amount || !formData.type || !formData.description) {
        setComplianceStatus(null);
        return;
      }

      setComplianceLoading(true);
      try {
        const transactionData = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          payment_method: formData.account?.toLowerCase().includes('efectivo') ? 'cash' : 'card',
          has_cfdi: !!formData.cfdi_uuid,
          cfdi_uuid: formData.cfdi_uuid,
          client_type: formData.client_type,
          transaction_type: formData.transaction_type,
          is_isr_deductible: formData.is_isr_deductible,
          is_iva_deductible: formData.is_iva_deductible,
          expense_type: formData.expense_type,
          category: formData.description,
          iva_amount: formData.type === 'gasto' && formData.iva_rate === '16' ? parseFloat(formData.amount) * 0.16 : 0
        };

        const result = await evaluateTransactionCompliance(transactionData);
        setComplianceStatus(result);
      } catch (err) {
        console.error('Compliance evaluation error:', err);
        setComplianceStatus(null);
      } finally {
        setComplianceLoading(false);
      }
    };

    // Debounce the evaluation
    const timer = setTimeout(() => {
      evaluateCompliance();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.amount,
    formData.type,
    formData.description,
    formData.account,
    formData.cfdi_uuid,
    formData.client_type,
    formData.transaction_type,
    formData.is_isr_deductible,
    formData.is_iva_deductible,
    formData.expense_type,
    formData.iva_rate
  ]);

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
        cfdi_usage_code: '',
        is_iva_deductible: false,
        is_isr_deductible: false,
        expense_type: 'national',
        // Phase 17: Reset income fields
        client_type: 'nacional',
        client_rfc: '',
        currency: 'MXN',
        exchange_rate: 1.0,
        payment_method: 'PUE',
        iva_rate: '16',
        isr_retention: 0,
        iva_retention: 0,
        cfdi_uuid: '',
        issue_date: '',
        payment_date: '',
        economic_activity_code: ''
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

        {/* Phase 28: Real-time Compliance Feedback */}
        {complianceStatus && (formData.description && formData.amount) && (
          <div className="md:col-span-2">
            <div className={`border rounded-lg p-4 ${
              complianceStatus.compliance_status === 'compliant' 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : complianceStatus.compliance_status === 'needs_review'
                ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {complianceStatus.compliance_status === 'compliant' ? (
                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : complianceStatus.compliance_status === 'needs_review' ? (
                    <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold mb-2 ${
                    complianceStatus.compliance_status === 'compliant' 
                      ? 'text-green-800 dark:text-green-300'
                      : complianceStatus.compliance_status === 'needs_review'
                      ? 'text-yellow-800 dark:text-yellow-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {complianceStatus.compliance_status === 'compliant' 
                      ? '✓ Cumplimiento SAT'
                      : complianceStatus.compliance_status === 'needs_review'
                      ? '⚠ Requiere Revisión'
                      : '✗ No Cumple'}
                  </h4>
                  
                  {/* Show errors */}
                  {complianceStatus.errors?.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {complianceStatus.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-red-700 dark:text-red-300">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Show warnings */}
                  {complianceStatus.warnings?.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {complianceStatus.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                          {warning}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Show info */}
                  {complianceStatus.info?.length > 0 && (
                    <div className="space-y-1">
                      {complianceStatus.info.map((info, idx) => (
                        <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                          {info}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {complianceStatus.matched_rules?.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {complianceStatus.matched_rules.length} regla(s) aplicada(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {complianceLoading && formData.description && formData.amount && (
          <div className="md:col-span-2">
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
              🔍 Evaluando cumplimiento fiscal...
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Cuenta</label>
          <input
            type="text"
            name="account"
            value={formData.account}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          />
        </div>

        {/* Phase 16: Granular Tax Deductibility - Only show for expenses */}
        {formData.type === 'gasto' && (
          <>
            <div className="md:col-span-2 border-t pt-4 mt-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Deducibilidad Fiscal</h3>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_isr_deductible"
                  checked={formData.is_isr_deductible}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Deducible ISR</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Impuesto Sobre la Renta</p>
                </div>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_iva_deductible"
                  checked={formData.is_iva_deductible}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">IVA Acreditable</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Impuesto al Valor Agregado</p>
                </div>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tipo de Gasto</label>
              <select
                name="expense_type"
                value={formData.expense_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="national">Nacional</option>
                <option value="international_with_invoice">Internacional con Factura</option>
                <option value="international_no_invoice">Internacional sin Factura</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Clasificación del gasto según SAT. Gastos internacionales sin factura mexicana no permiten acreditar IVA.
              </p>
            </div>
          </>
        )}

        {/* Keep legacy is_deductible for backward compatibility - hidden but synced */}
        <input type="hidden" name="is_deductible" value={formData.is_deductible} />

        {/* Phase 17: Income-Specific Fields - Only show for income transactions */}
        {formData.type === 'ingreso' && (
          <>
            <div className="md:col-span-2 border-t pt-4 mt-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Información Fiscal del Ingreso</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Complete los datos fiscales para el correcto registro del ingreso según SAT
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tipo de Cliente</label>
              <select
                name="client_type"
                value={formData.client_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="nacional">Nacional</option>
                <option value="extranjero">Extranjero</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cliente nacional o del extranjero</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">RFC del Cliente</label>
              <input
                type="text"
                name="client_rfc"
                value={formData.client_rfc}
                onChange={handleChange}
                placeholder={formData.client_type === 'extranjero' ? 'XEXX010101000' : 'RFC13'}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                maxLength={13}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.client_type === 'extranjero' 
                  ? 'RFC genérico para extranjeros: XEXX010101000' 
                  : 'RFC del cliente nacional'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Moneda</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="CAD">CAD - Dólar Canadiense</option>
                <option value="GBP">GBP - Libra Esterlina</option>
              </select>
            </div>

            {formData.currency !== 'MXN' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tipo de Cambio</label>
                <input
                  type="number"
                  name="exchange_rate"
                  value={formData.exchange_rate}
                  onChange={handleChange}
                  step="0.0001"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tipo de cambio {formData.currency} a MXN al momento del cobro
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Método de Pago</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="PUE">PUE - Pago en Una Exhibición</option>
                <option value="PPD">PPD - Pago en Parcialidades o Diferido</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Método de pago según CFDI</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tasa de IVA</label>
              <select
                name="iva_rate"
                value={formData.iva_rate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              >
                <option value="16">16% - Tasa general</option>
                <option value="0">0% - Tasa cero (exportación/servicios específicos)</option>
                <option value="exento">Exento - Sin IVA</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.client_type === 'extranjero' && formData.iva_rate === '0' 
                  ? 'Tasa 0% aplica para servicios al extranjero con requisitos SAT' 
                  : 'Tasa de IVA aplicada en la factura'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Retención ISR</label>
              <input
                type="number"
                name="isr_retention"
                value={formData.isr_retention}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monto retenido de ISR (si aplica)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Retención IVA</label>
              <input
                type="number"
                name="iva_retention"
                value={formData.iva_retention}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monto retenido de IVA (si aplica, ej: 10.67%)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">UUID del CFDI</label>
              <input
                type="text"
                name="cfdi_uuid"
                value={formData.cfdi_uuid}
                onChange={handleChange}
                placeholder="Folio fiscal del CFDI emitido"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono text-sm"
                maxLength={36}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">UUID/Folio fiscal de la factura emitida</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Fecha de Emisión</label>
              <input
                type="date"
                name="issue_date"
                value={formData.issue_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fecha en que se emitió el CFDI</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Fecha de Cobro</label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fecha en que se recibió el pago efectivo</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Código de Actividad Económica</label>
              <input
                type="text"
                name="economic_activity_code"
                value={formData.economic_activity_code}
                onChange={handleChange}
                placeholder="Código de actividad económica SAT"
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Código de actividad económica según tu registro SAT (opcional)
              </p>
            </div>
          </>
        )}

        {/* Phase 1: Advanced Transaction Classification Fields */}
        <div className="md:col-span-2 border-t pt-4 mt-4 dark:border-slate-700">
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
          <SelectWithCreate
            label="Categoría Personalizada"
            value={formData.category_id || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            options={categories
              .filter(cat => cat.is_active)
              .map(cat => ({ value: cat.id, label: cat.name }))}
            onCreate={async (data) => {
              const newCategory = await createCategory(data);
              await loadCategories(); // Reload categories to include the new one
              showSuccess(`Categoría "${data.name}" creada exitosamente`);
              return newCategory;
            }}
            createLabel="Crear nueva categoría..."
            createFields={[
              { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Tecnología, Marketing...' },
              { name: 'description', label: 'Descripción', type: 'textarea', required: false, placeholder: 'Descripción opcional' },
              { name: 'color', label: 'Color', type: 'color', required: false },
              { 
                name: 'is_deductible', 
                label: 'Es deducible', 
                type: 'select', 
                required: false,
                options: [
                  { value: '0', label: 'No' },
                  { value: '1', label: 'Sí' }
                ]
              }
            ]}
            placeholder="Sin categoría"
            emptyMessage="No hay categorías disponibles. Crea una nueva."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional: Categoría personalizada para organizar tus transacciones</p>
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
