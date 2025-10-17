import { memo } from 'react';
import { formatCurrency } from '../utils/calculations';

function BalanceCard({ title, amount, type = 'neutral', subtitle, badge }) {
  const bgColor = type === 'positive' ? 'bg-success-50 dark:bg-success-900/20' : 
                  type === 'negative' ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-primary-50 dark:bg-primary-900/20';
  const textColor = type === 'positive' ? 'text-success-700 dark:text-success-400' : 
                    type === 'negative' ? 'text-danger-700 dark:text-danger-400' : 'text-primary-700 dark:text-primary-400';
  const borderColor = type === 'positive' ? 'border-success-200 dark:border-success-800' :
                      type === 'negative' ? 'border-danger-200 dark:border-danger-800' : 'border-primary-200 dark:border-primary-800';

  return (
    <div className={`${bgColor} ${borderColor} border p-6 rounded-lg shadow-md dark:shadow-lg dark:shadow-black/10 relative transition-colors`}>
      {badge && (
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full shadow-sm dark:shadow-md">
            {badge}
          </span>
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>
        {formatCurrency(amount)}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}

export default memo(BalanceCard);
