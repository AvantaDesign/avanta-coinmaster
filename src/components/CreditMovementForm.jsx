import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import { formatMovementType, validateMovement, formatDateForAPI } from '../utils/credits';

export default function CreditMovementForm({ credit, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'payment',
    date: new Date().toISOString().split('T')[0],
    createTransaction: true
  });
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    
    // Validate
    const validationErrors = validateMovement(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors([error.message || 'Error al registrar el movimiento']);
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Agregar Movimiento - {credit.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Saldo actual: {formatCurrency(credit.current_balance || 0)}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Error de validación</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Movement Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Movimiento *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['payment', 'charge', 'interest'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('type', type)}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <div className="font-semibold">{formatMovementType(type)}</div>
                <div className="text-xs mt-1">
                  {type === 'payment' && 'Reduce el saldo'}
                  {type === 'charge' && 'Aumenta el saldo'}
                  {type === 'interest' && 'Cargo por intereses'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción *
          </label>
          <input
            type="text"
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Ej. Pago mensual, Compra en tienda, Intereses del mes"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description.length}/500 caracteres
          </p>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {formData.amount && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formData.type === 'payment' ? (
                <span className="text-green-600">
                  Nuevo saldo: {formatCurrency((credit.current_balance || 0) - parseFloat(formData.amount || 0))}
                </span>
              ) : (
                <span className="text-orange-600">
                  Nuevo saldo: {formatCurrency((credit.current_balance || 0) + parseFloat(formData.amount || 0))}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha *
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Create Transaction Option (for payments) */}
        {formData.type === 'payment' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.createTransaction}
                onChange={(e) => handleChange('createTransaction', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Crear transacción de gasto
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Se creará automáticamente una transacción de tipo "gasto" en tus cuentas para registrar este pago.
                  Esto mantiene sincronizado el saldo de tu cuenta bancaria.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Movimiento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
