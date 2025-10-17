import { memo } from 'react';
import { formatCurrency } from '../utils/calculations';
import { 
  getBudgetStatusColor, 
  getBudgetStatusIcon,
  getClassificationLabel,
  formatBudgetPeriod
} from '../utils/budgets';

function BudgetCard({ budget, onEdit, onDelete }) {
  const percentUsed = budget.percent_used || 0;
  const status = budget.status || 'unknown';
  const statusColor = getBudgetStatusColor(status);
  const statusIcon = getBudgetStatusIcon(status);

  const getStatusBgColor = (color) => {
    const colors = {
      red: 'bg-red-50 border-red-500',
      orange: 'bg-orange-50 border-orange-500',
      yellow: 'bg-yellow-50 border-yellow-500',
      green: 'bg-green-50 border-green-500',
      gray: 'bg-gray-50 border-gray-500'
    };
    return colors[color] || colors.gray;
  };

  const getProgressBarColor = (color) => {
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      gray: 'bg-gray-500'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${getStatusBgColor(statusColor)} overflow-hidden transition-all hover:shadow-lg`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{statusIcon}</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {budget.category_name || 'General'}
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <span className={`px-2 py-1 rounded-full ${
                budget.classification === 'business' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
              }`}>
                {getClassificationLabel(budget.classification)}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {formatBudgetPeriod(budget)}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-300 p-2"
              title="Editar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 dark:text-red-300 p-2"
              title="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Presupuestado:</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(budget.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Gastado:</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(budget.actual)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Restante:</span>
            <span className={`text-lg font-semibold ${
              budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(budget.remaining)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uso del presupuesto</span>
            <span className={`text-sm font-bold ${
              percentUsed >= 100 ? 'text-red-600' :
              percentUsed >= 90 ? 'text-orange-600' :
              percentUsed >= 75 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {percentUsed.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(statusColor)}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {status === 'exceeded' && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 text-red-800 dark:text-red-300 px-3 py-2 rounded text-sm">
            ⚠️ Presupuesto excedido por {formatCurrency(Math.abs(budget.remaining))}
          </div>
        )}
        {status === 'warning' && (
          <div className="bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded text-sm">
            ⚠️ Se acerca al límite del presupuesto
          </div>
        )}
        {status === 'caution' && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 text-yellow-800 dark:text-yellow-300 px-3 py-2 rounded text-sm">
            ℹ️ Monitorear el gasto en esta categoría
          </div>
        )}
        {status === 'good' && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 text-green-800 dark:text-green-300 px-3 py-2 rounded text-sm">
            ✓ Presupuesto bajo control
          </div>
        )}
      </div>

      {/* Footer with Transaction Count */}
      <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 border-t border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {budget.transaction_count || 0} transacciones
          </span>
          {budget.notes && (
            <button
              className="text-blue-600 hover:text-blue-800 dark:text-blue-300"
              title={budget.notes}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(BudgetCard);
