import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import {
  formatCreditType,
  calculateCreditUtilization,
  getCreditStatusColor,
  getNextPaymentDueDate,
  getDaysUntilPayment,
  getPaymentUrgencyColor,
  formatDateForDisplay
} from '../utils/credits';

export default function CreditCard({ credit, onEdit, onDelete, onAddMovement, onViewDetails }) {
  const [showActions, setShowActions] = useState(false);
  
  const balance = credit.current_balance || 0;
  const limit = credit.credit_limit || 0;
  const available = credit.available_credit || 0;
  const utilization = calculateCreditUtilization(balance, limit);
  
  const nextPaymentDate = getNextPaymentDueDate(credit.payment_due_day);
  const daysUntilPayment = getDaysUntilPayment(credit.payment_due_day);
  
  // Get colors based on status
  const utilizationColor = getCreditStatusColor(utilization);
  const paymentUrgencyColor = daysUntilPayment !== null ? getPaymentUrgencyColor(daysUntilPayment) : '';
  
  // Get card gradient based on type
  const getCardGradient = (type) => {
    const gradients = {
      credit_card: 'from-blue-500 to-blue-700',
      loan: 'from-green-500 to-green-700',
      mortgage: 'from-purple-500 to-purple-700'
    };
    return gradients[type] || 'from-gray-500 to-gray-700';
  };

  return (
    <div className="relative">
      {/* Credit Card Visual */}
      <div className={`bg-gradient-to-br ${getCardGradient(credit.type)} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full"></div>
        </div>
        
        {/* Card Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold">{credit.name}</h3>
              <p className="text-sm opacity-90">{formatCreditType(credit.type)}</p>
            </div>
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <p className="text-sm opacity-75 mb-1">Saldo Actual</p>
            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          </div>

          {/* Credit Limit and Available */}
          {credit.type === 'credit_card' && limit > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs opacity-75 mb-1">Límite</p>
                <p className="text-lg font-semibold">{formatCurrency(limit)}</p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">Disponible</p>
                <p className="text-lg font-semibold">{formatCurrency(available)}</p>
              </div>
            </div>
          )}

          {/* Utilization Bar */}
          {credit.type === 'credit_card' && limit > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs opacity-75 mb-1">
                <span>Utilización</span>
                <span>{utilization.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Payment Due Date */}
          {credit.payment_due_day && (
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-75">Próximo Pago:</span>
              <span className="font-semibold">
                {nextPaymentDate ? formatDateForDisplay(nextPaymentDate) : 'N/A'}
                {daysUntilPayment !== null && daysUntilPayment >= 0 && (
                  <span className="ml-2 text-xs">({daysUntilPayment} días)</span>
                )}
                {daysUntilPayment !== null && daysUntilPayment < 0 && (
                  <span className="ml-2 text-xs text-red-300">(¡Vencido!)</span>
                )}
              </span>
            </div>
          )}

          {/* Interest Rate */}
          {credit.interest_rate && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="opacity-75">Tasa de Interés:</span>
              <span className="font-semibold">{(credit.interest_rate * 100).toFixed(2)}% anual</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Menu */}
      {showActions && (
        <div className="absolute right-0 top-16 z-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48">
          <button
            onClick={() => {
              setShowActions(false);
              onViewDetails(credit);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver Detalles
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              onAddMovement(credit);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Movimiento
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              onEdit(credit);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              if (confirm(`¿Estás seguro de eliminar el crédito "${credit.name}"?`)) {
                onDelete(credit.id);
              }
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      )}

      {/* Warning Badge */}
      {daysUntilPayment !== null && daysUntilPayment <= 3 && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${daysUntilPayment < 0 ? 'bg-red-600' : 'bg-orange-500'}`}>
            {daysUntilPayment < 0 ? '¡Vencido!' : `${daysUntilPayment} días`}
          </div>
        </div>
      )}
    </div>
  );
}
