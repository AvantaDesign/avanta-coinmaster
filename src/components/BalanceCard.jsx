import { formatCurrency } from '../utils/calculations';

export default function BalanceCard({ title, amount, type = 'neutral', subtitle, badge }) {
  const bgColor = type === 'positive' ? 'bg-green-50' : 
                  type === 'negative' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = type === 'positive' ? 'text-green-700' : 
                    type === 'negative' ? 'text-red-700' : 'text-blue-700';

  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-md relative`}>
      {badge && (
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 bg-white rounded-full shadow-sm">
            {badge}
          </span>
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>
        {formatCurrency(amount)}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
