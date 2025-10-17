import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import {
  formatCreditType,
  formatMovementType,
  formatDateForDisplay,
  calculateCreditUtilization,
  getCreditStatusColor,
  getNextPaymentDueDate,
  getDaysUntilPayment
} from '../utils/credits';

export default function CreditDetails({ credit, movements = [], onClose, onAddMovement, onEdit }) {
  const [filteredMovements, setFilteredMovements] = useState(movements);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let filtered = [...movements];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredMovements(filtered);
  }, [movements, filterType, sortBy, sortOrder]);

  const balance = credit.current_balance || 0;
  const limit = credit.credit_limit || 0;
  const available = credit.available_credit || 0;
  const utilization = calculateCreditUtilization(balance, limit);
  const utilizationColor = getCreditStatusColor(utilization);

  const nextPaymentDate = getNextPaymentDueDate(credit.payment_due_day);
  const daysUntilPayment = getDaysUntilPayment(credit.payment_due_day);

  // Calculate totals
  const totalPayments = movements.filter(m => m.type === 'payment').reduce((sum, m) => sum + m.amount, 0);
  const totalCharges = movements.filter(m => m.type === 'charge').reduce((sum, m) => sum + m.amount, 0);
  const totalInterest = movements.filter(m => m.type === 'interest').reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{credit.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{formatCreditType(credit.type)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance */}
            <div className="bg-gradient-to-br from-blue-500 dark:from-blue-600 to-blue-600 dark:to-blue-700 rounded-lg p-4 text-white">
              <div className="text-sm opacity-90 mb-1">Saldo Actual</div>
              <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
            </div>

            {/* Limit & Available */}
            {credit.type === 'credit_card' && limit > 0 && (
              <>
                <div className="bg-gradient-to-br from-green-500 dark:from-green-600 to-green-600 dark:to-green-700 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Crédito Disponible</div>
                  <div className="text-3xl font-bold">{formatCurrency(available)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 dark:from-purple-600 to-purple-600 dark:to-purple-700 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90 mb-1">Límite Total</div>
                  <div className="text-3xl font-bold">{formatCurrency(limit)}</div>
                  <div className="text-sm opacity-90 mt-2">
                    Utilización: {utilization.toFixed(1)}%
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Details Grid */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {credit.interest_rate && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Interés</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {(credit.interest_rate * 100).toFixed(2)}% anual
                  </div>
                </div>
              )}
              {credit.statement_day && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Día de Corte</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Día {credit.statement_day} de cada mes
                  </div>
                </div>
              )}
              {credit.payment_due_day && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Día de Pago</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Día {credit.payment_due_day} de cada mes
                  </div>
                </div>
              )}
              {nextPaymentDate && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Próximo Pago</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatDateForDisplay(nextPaymentDate)}
                    {daysUntilPayment !== null && (
                      <span className="text-sm ml-2">
                        ({daysUntilPayment >= 0 ? `${daysUntilPayment} días` : '¡Vencido!'})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex space-x-3">
            <button
              onClick={() => onAddMovement(credit)}
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Movimiento
            </button>
            <button
              onClick={() => onEdit(credit)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          </div>

          {/* Movements Section */}
          <div className="px-6 pb-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
              {/* Movements Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Movimientos ({movements.length})
                </h3>
                <div className="flex items-center space-x-3">
                  {/* Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-slate-600 rounded px-3 py-1"
                  >
                    <option value="all">Todos</option>
                    <option value="payment">Pagos</option>
                    <option value="charge">Cargos</option>
                    <option value="interest">Intereses</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [by, order] = e.target.value.split('-');
                      setSortBy(by);
                      setSortOrder(order);
                    }}
                    className="text-sm border border-gray-300 dark:border-slate-600 rounded px-3 py-1"
                  >
                    <option value="date-desc">Fecha (más reciente)</option>
                    <option value="date-asc">Fecha (más antigua)</option>
                    <option value="amount-desc">Monto (mayor)</option>
                    <option value="amount-asc">Monto (menor)</option>
                  </select>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Pagos</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(totalPayments)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Cargos</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {formatCurrency(totalCharges)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Intereses</div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrency(totalInterest)}
                  </div>
                </div>
              </div>

              {/* Movements List */}
              <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                {filteredMovements.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay movimientos que mostrar
                  </div>
                ) : (
                  filteredMovements.map((movement) => (
                    <div key={movement.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              movement.type === 'payment' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              movement.type === 'charge' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {formatMovementType(movement.type)}
                            </span>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {formatDateForDisplay(movement.date)}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                            {movement.description}
                          </div>
                        </div>
                        <div className={`text-right ml-4 font-semibold ${
                          movement.type === 'payment' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {movement.type === 'payment' ? '-' : '+'}{formatCurrency(movement.amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
