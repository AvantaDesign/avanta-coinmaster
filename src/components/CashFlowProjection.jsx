import { useState, useEffect } from 'react';
import { fetchCashFlowProjection } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function CashFlowProjection() {
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scenario, setScenario] = useState('realistic');
  const [days, setDays] = useState(60);
  const [includeHistorical, setIncludeHistorical] = useState(true);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  useEffect(() => {
    loadProjection();
  }, [scenario, days, includeHistorical]);

  const loadProjection = async () => {
    try {
      setLoading(true);
      const result = await fetchCashFlowProjection({ 
        scenario, 
        days, 
        historical: includeHistorical 
      });
      setProjection(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!projection) return;
    
    const headers = ['Fecha', 'Ingresos', 'Egresos', 'Flujo Neto', 'Balance Proyectado'];
    const rows = projection.daily_projections.map(day => [
      day.date,
      day.inflow,
      day.outflow,
      day.net_flow,
      day.projected_balance
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-projection-${scenario}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToJSON = () => {
    if (!projection) return;
    
    const json = JSON.stringify(projection, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-projection-${scenario}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Generando proyección...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          💵 Proyección de Flujo de Efectivo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Proyección de {days} días basada en pagos recurrentes, deudas y datos históricos
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Scenario selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Escenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value="optimistic">Optimista</option>
              <option value="realistic">Realista</option>
              <option value="pessimistic">Pesimista</option>
            </select>
          </div>

          {/* Days selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días a proyectar
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
              <option value="180">180 días</option>
            </select>
          </div>

          {/* Historical data toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Datos históricos
            </label>
            <button
              onClick={() => setIncludeHistorical(!includeHistorical)}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                includeHistorical
                  ? 'bg-primary-500 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
              }`}
            >
              {includeHistorical ? 'Incluidos' : 'Excluidos'}
            </button>
          </div>

          {/* View mode toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-primary-500 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                }`}
              >
                📊 Gráfica
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary-500 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                }`}
              >
                📋 Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={exportToJSON}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📥 Exportar JSON
          </button>
        </div>
      </div>

      {projection && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Inicial</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(projection.starting_balance)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Proyectados</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(projection.summary.total_inflow)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Egresos Proyectados</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(projection.summary.total_outflow)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Final</div>
              <div className={`text-2xl font-bold ${
                projection.summary.final_projected_balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(projection.summary.final_projected_balance)}
              </div>
            </div>
          </div>

          {/* Critical Days Warning */}
          {projection.critical_days && projection.critical_days.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                ⚠️ Días Críticos ({projection.critical_days.length})
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-3">
                Se proyectan {projection.critical_days.length} días con balance negativo
              </p>
              <div className="space-y-2">
                {projection.critical_days.slice(0, 5).map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-red-800 dark:text-red-200">{formatDate(day.date)}</span>
                    <span className="font-semibold text-red-900 dark:text-red-100">
                      Déficit: {formatCurrency(day.shortfall)}
                    </span>
                  </div>
                ))}
                {projection.critical_days.length > 5 && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ... y {projection.critical_days.length - 5} días más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chart View */}
          {viewMode === 'chart' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Proyección de Balance
              </h2>
              <div className="overflow-x-auto">
                <div style={{ minWidth: '800px', height: '400px' }}>
                  <SimpleLineChart data={projection.daily_projections} />
                </div>
              </div>
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ingresos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Egresos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Flujo Neto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {projection.daily_projections
                      .filter((_, idx) => idx % Math.ceil(projection.daily_projections.length / 30) === 0)
                      .map((day, idx) => (
                        <tr key={idx} className={day.projected_balance < 0 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(day.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                            {formatCurrency(day.inflow)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                            {formatCurrency(day.outflow)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                            day.net_flow >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(day.net_flow)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                            day.projected_balance >= 0 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(day.projected_balance)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data Sources */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Fuentes de Datos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.recurring_freelancers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Freelancers Recurrentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.recurring_services}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Servicios Recurrentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.active_debts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Deudas Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.pending_payables}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cuentas por Pagar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.pending_receivables}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cuentas por Cobrar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {projection.data_sources.historical_days}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Días Históricos</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Simple line chart component using SVG
function SimpleLineChart({ data }) {
  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 400;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const maxBalance = Math.max(...data.map(d => d.projected_balance));
  const minBalance = Math.min(...data.map(d => d.projected_balance));
  const balanceRange = maxBalance - minBalance || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.projected_balance - minBalance) / balanceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Zero line position
  const zeroY = minBalance < 0 
    ? padding + chartHeight - ((0 - minBalance) / balanceRange) * chartHeight
    : padding + chartHeight;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="text-gray-900 dark:text-gray-100">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding + chartHeight * (1 - ratio);
        const value = minBalance + balanceRange * ratio;
        return (
          <g key={i}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
            <text
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="currentColor"
              opacity="0.6"
            >
              ${(value / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}

      {/* Zero line */}
      {minBalance < 0 && (
        <line
          x1={padding}
          y1={zeroY}
          x2={width - padding}
          y2={zeroY}
          stroke="red"
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      )}

      {/* Line chart */}
      <polyline
        points={points}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
      />

      {/* Fill area under curve */}
      <polygon
        points={`${padding},${padding + chartHeight} ${points} ${width - padding},${padding + chartHeight}`}
        fill="rgb(59, 130, 246)"
        fillOpacity="0.1"
      />

      {/* Axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="2"
      />

      {/* X-axis labels */}
      {[0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(3 * data.length / 4), data.length - 1].map((i) => {
        if (i >= data.length) return null;
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const date = new Date(data[i].date);
        return (
          <text
            key={i}
            x={x}
            y={height - padding + 20}
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
            opacity="0.6"
          >
            {date.getDate()}/{date.getMonth() + 1}
          </text>
        );
      })}
    </svg>
  );
}
