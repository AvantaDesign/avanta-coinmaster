import { useState, useEffect } from 'react';
import { 
  calculateMonthlyIVA, 
  getPaymentDeadline, 
  formatIVAStatus,
  getIVATrends 
} from '../utils/ivaCalculation';
import { formatCurrency } from '../utils/calculations';
import Icon from './icons/IconLibrary';

/**
 * IVA Widget Component
 * Displays real-time IVA (Value Added Tax) balance and status
 */
export default function IVAWidget({ transactions = [] }) {
  const [currentIVA, setCurrentIVA] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    calculateIVA();
  }, [transactions]);

  const calculateIVA = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Calculate current month IVA
    const monthlyIVA = calculateMonthlyIVA(transactions, year, month);
    setCurrentIVA(monthlyIVA);

    // Get payment deadline
    const paymentDeadline = getPaymentDeadline(today);
    setDeadline(paymentDeadline);

    // Get trends for last 3 months
    const ivaTrends = getIVATrends(transactions, 3);
    setTrends(ivaTrends);
  };

  if (!currentIVA) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const statusInfo = formatIVAStatus(currentIVA.balance);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Icon name="calculator" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                IVA del Mes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentIVA.period.label}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
          >
            <Icon 
              name={showDetails ? 'chevron-up' : 'chevron-down'} 
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
            />
          </button>
        </div>
      </div>

      {/* Main Status */}
      <div className={`p-6 ${statusInfo.colors.bg} border-b border-gray-200 dark:border-gray-700`}>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Saldo IVA
          </div>
          <div className={`text-4xl font-bold ${statusInfo.colors.text} mb-2`}>
            {formatCurrency(statusInfo.amount)}
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.colors.bg} ${statusInfo.colors.border} border`}>
            <Icon 
              name={statusInfo.status === 'favor' ? 'arrow-down' : statusInfo.status === 'pagar' ? 'arrow-up' : 'minus'} 
              className={`w-4 h-4 ${statusInfo.colors.text}`}
            />
            <span className={`font-semibold ${statusInfo.colors.text}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Payment Deadline */}
        {deadline && statusInfo.status === 'pagar' && (
          <div className={`mt-4 p-3 rounded-lg ${deadline.isUrgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon 
                  name="calendar" 
                  className={`w-4 h-4 ${deadline.isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
                />
                <span className={`text-sm font-medium ${deadline.isUrgent ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}`}>
                  Fecha límite de pago
                </span>
              </div>
              <span className={`text-sm font-bold ${deadline.isUrgent ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>
                {deadline.deadline.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            {deadline.isUrgent && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                <Icon name="exclamation-triangle" className="w-3 h-3" />
                Quedan {deadline.daysUntil} días para el pago
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">IVA Acreditable</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(currentIVA.acreditable)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentIVA.expenses.length} gastos
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">IVA Trasladado</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(currentIVA.trasladado)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentIVA.income.length} ingresos
          </div>
        </div>
      </div>

      {/* Detailed Breakdown (Expandable) */}
      {showDetails && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Tendencia (últimos 3 meses)
          </h4>
          <div className="space-y-3">
            {trends.map((trend, index) => {
              const trendStatus = formatIVAStatus(trend.balance);
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trend.period.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trend.income.length + trend.expenses.length} transacciones
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${trendStatus.colors.text}`}>
                      {formatCurrency(Math.abs(trend.balance))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trendStatus.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/fiscal'}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Ver Declaración
              </button>
              <button
                onClick={() => window.location.href = '/transactions'}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Ver Transacciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
