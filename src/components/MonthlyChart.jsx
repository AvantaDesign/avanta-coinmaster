import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import Icon from './icons/IconLibrary';

// Phase 48.5: Memoize expensive chart component to prevent unnecessary re-renders
function MonthlyChart({ data, showFiscal = false }) {
  const navigate = useNavigate();
  const [hoveredMonth, setHoveredMonth] = useState(null);
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
        No hay datos para mostrar
      </div>
    );
  }

  // Format data for display
  const chartData = data.map(item => ({
    label: new Date(item.month + '-01').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
    month: item.month,
    income: item.income || 0,
    expenses: item.expenses || 0,
    taxes: item.taxes || 0
  }));

  // Find max value for scaling
  const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expenses, d.taxes)));

  // Handle bar click for drill-down navigation
  const handleBarClick = (monthData, type) => {
    const [year, month] = monthData.month.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    
    // Navigate to transactions page with pre-applied filters
    navigate(`/transactions?type=${type}&startDate=${startDate}&endDate=${endDate}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Últimos 6 Meses</h3>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Icon name="cursor" size="sm" />
          <span>Click para ver detalles</span>
        </div>
      </div>
      <div className="space-y-4">
        {chartData.map((month, index) => (
          <div 
            key={index} 
            className="space-y-2"
            onMouseEnter={() => setHoveredMonth(index)}
            onMouseLeave={() => setHoveredMonth(null)}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{month.label}</div>
              {hoveredMonth === index && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Balance: <span className={month.income - month.expenses >= 0 ? 'text-success-600' : 'text-danger-600'}>
                    {formatCurrency(month.income - month.expenses)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Income Bar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Icon name="arrowTrendingUp" size="xs" />
                    Ingresos
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-green-500 hover:bg-green-600 h-full flex items-center justify-end pr-2 text-xs text-white transition-all cursor-pointer"
                      style={{ width: `${maxValue > 0 ? (month.income / maxValue) * 100 : 0}%` }}
                      onClick={() => handleBarClick(month, 'ingreso')}
                      title={`Click para ver ingresos de ${month.label}`}
                    >
                      {month.income > 0 && formatCurrency(month.income)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expenses Bar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Icon name="arrowTrendingDown" size="xs" />
                    Gastos
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-red-500 hover:bg-red-600 h-full flex items-center justify-end pr-2 text-xs text-white transition-all cursor-pointer"
                      style={{ width: `${maxValue > 0 ? (month.expenses / maxValue) * 100 : 0}%` }}
                      onClick={() => handleBarClick(month, 'gasto')}
                      title={`Click para ver gastos de ${month.label}`}
                    >
                      {month.expenses > 0 && formatCurrency(month.expenses)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Taxes Bar */}
            {showFiscal && month.taxes > 0 && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-20 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Icon name="document" size="xs" />
                      Impuestos
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-purple-500 hover:bg-purple-600 h-full flex items-center justify-end pr-2 text-xs text-white transition-all cursor-pointer"
                        style={{ width: `${maxValue > 0 ? (month.taxes / maxValue) * 100 : 0}%` }}
                        title={`Impuestos de ${month.label}`}
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
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Gastos</span>
          </div>
          {showFiscal && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Impuestos</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Phase 48.5: Export memoized component for better performance
export default memo(MonthlyChart);
