import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import {
  getDaysUntilPayment,
  getPaymentUrgencyColor,
  getPaymentUrgencyBgColor,
  formatDateForDisplay,
  getNextPaymentDueDate,
  calculateMinimumPayment
} from '../utils/credits';

export default function UpcomingPayments({ credits = [], onPaymentClick }) {
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  useEffect(() => {
    if (!credits || credits.length === 0) return;

    // Filter credits with payment due dates and calculate days until payment
    const payments = credits
      .filter(credit => credit.payment_due_day && credit.is_active)
      .map(credit => {
        const daysUntil = getDaysUntilPayment(credit.payment_due_day);
        const nextDate = getNextPaymentDueDate(credit.payment_due_day);
        const minimumPayment = calculateMinimumPayment(credit.current_balance || 0);

        return {
          ...credit,
          daysUntil,
          nextDate,
          minimumPayment,
          urgency: daysUntil < 0 ? 0 : daysUntil <= 3 ? 1 : daysUntil <= 7 ? 2 : 3
        };
      })
      .filter(payment => payment.daysUntil <= 30) // Only show payments due within 30 days
      .sort((a, b) => a.urgency - b.urgency || a.daysUntil - b.daysUntil);

    setUpcomingPayments(payments);
  }, [credits]);

  if (upcomingPayments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Próximos Pagos</h3>
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No tienes pagos próximos en los siguientes 30 días.</p>
      </div>
    );
  }

  // Count by urgency
  const overdue = upcomingPayments.filter(p => p.daysUntil < 0).length;
  const urgent = upcomingPayments.filter(p => p.daysUntil >= 0 && p.daysUntil <= 3).length;
  const soon = upcomingPayments.filter(p => p.daysUntil > 3 && p.daysUntil <= 7).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Próximos Pagos</h3>
          <div className="flex items-center space-x-2">
            {overdue > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-bold rounded-full">
                {overdue} vencido{overdue > 1 ? 's' : ''}
              </span>
            )}
            {urgent > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                {urgent} urgente{urgent > 1 ? 's' : ''}
              </span>
            )}
            {soon > 0 && !overdue && !urgent && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-bold rounded-full">
                {soon} próximo{soon > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {upcomingPayments.map((payment) => {
          const urgencyColor = getPaymentUrgencyColor(payment.daysUntil);
          const urgencyBg = getPaymentUrgencyBgColor(payment.daysUntil);

          return (
            <div
              key={payment.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${urgencyBg} border-l-4`}
              onClick={() => onPaymentClick && onPaymentClick(payment)}
            >
              <div className="flex items-start justify-between">
                {/* Credit Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{payment.name}</h4>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-bold rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recurrente
                    </span>
                    {payment.daysUntil < 0 && (
                      <span className="px-2 py-0.5 bg-red-600 dark:bg-red-700 text-white text-xs font-bold rounded">
                        VENCIDO
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Vence: {formatDateForDisplay(payment.nextDate)}</span>
                  </div>

                  <div className="mt-1 flex items-center text-sm">
                    <span className={`font-semibold ${urgencyColor}`}>
                      {payment.daysUntil < 0 ? (
                        `Atrasado ${Math.abs(payment.daysUntil)} día${Math.abs(payment.daysUntil) > 1 ? 's' : ''}`
                      ) : payment.daysUntil === 0 ? (
                        '¡Vence hoy!'
                      ) : payment.daysUntil === 1 ? (
                        '¡Vence mañana!'
                      ) : (
                        `${payment.daysUntil} días restantes`
                      )}
                    </span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="text-right ml-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Saldo</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(payment.current_balance || 0)}
                  </div>
                  {payment.minimumPayment > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Mínimo: {formatCurrency(payment.minimumPayment)}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaymentClick && onPaymentClick(payment);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar Pago
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total a pagar en 30 días:</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(
              upcomingPayments.reduce((sum, p) => sum + (p.current_balance || 0), 0)
            )}
          </span>
        </div>
        {upcomingPayments.some(p => p.minimumPayment > 0) && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">Pagos mínimos totales:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(
                upcomingPayments.reduce((sum, p) => sum + (p.minimumPayment || 0), 0)
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
