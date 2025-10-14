import { formatCurrency } from '../utils/calculations';

export default function MonthlyChart({ data, showFiscal = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  // Format data for display
  const chartData = data.map(item => ({
    label: new Date(item.month + '-01').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
    income: item.income || 0,
    expenses: item.expenses || 0,
    taxes: item.taxes || 0
  }));

  // Find max value for scaling
  const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expenses, d.taxes)));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Últimos 6 Meses</h3>
      <div className="space-y-4">
        {chartData.map((month, index) => (
          <div key={index} className="space-y-2">
            <div className="text-sm font-medium">{month.label}</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-600">Ingresos</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-green-500 h-full flex items-center justify-end pr-2 text-xs text-white"
                      style={{ width: `${maxValue > 0 ? (month.income / maxValue) * 100 : 0}%` }}
                    >
                      {month.income > 0 && formatCurrency(month.income)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-600">Gastos</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-red-500 h-full flex items-center justify-end pr-2 text-xs text-white"
                      style={{ width: `${maxValue > 0 ? (month.expenses / maxValue) * 100 : 0}%` }}
                    >
                      {month.expenses > 0 && formatCurrency(month.expenses)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {showFiscal && month.taxes > 0 && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 text-xs text-gray-600">Impuestos</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full flex items-center justify-end pr-2 text-xs text-white"
                        style={{ width: `${maxValue > 0 ? (month.taxes / maxValue) * 100 : 0}%` }}
                      >
                        {formatCurrency(month.taxes)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
