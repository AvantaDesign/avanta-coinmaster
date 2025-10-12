import { formatCurrency } from '../utils/calculations';

export default function BalanceCard({ title, amount, type = 'neutral' }) {
  const bgColor = type === 'positive' ? 'bg-green-50' : 
                  type === 'negative' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = type === 'positive' ? 'text-green-700' : 
                    type === 'negative' ? 'text-red-700' : 'text-blue-700';

  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-md`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
