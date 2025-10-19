import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import {
  calculateFinancialHealthScore,
  forecastCashFlow,
  analyzeProfitability,
  calculateBusinessKPIs,
  detectAnomalies
} from '../utils/advancedAnalytics';
import Icon from './icons/IconLibrary';

export default function AdvancedAnalytics({ transactions = [], financialData = {} }) {
  const [activeTab, setActiveTab] = useState('health');
  const [healthScore, setHealthScore] = useState(null);
  const [cashFlowForecast, setCashFlowForecast] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateAnalytics();
  }, [transactions, financialData]);

  const calculateAnalytics = () => {
    setIsLoading(true);
    
    try {
      // Calculate financial health score
      const health = calculateFinancialHealthScore(financialData);
      setHealthScore(health);

      // Forecast cash flow
      const forecast = forecastCashFlow(transactions, 3);
      setCashFlowForecast(forecast);

      // Analyze profitability
      const profit = analyzeProfitability(transactions, 'category');
      setProfitability(profit);

      // Calculate KPIs
      const businessKPIs = calculateBusinessKPIs({
        ...financialData,
        transactions
      });
      setKpis(businessKPIs);

      // Detect anomalies
      const detectedAnomalies = detectAnomalies(transactions);
      setAnomalies(detectedAnomalies);
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Calculando analíticas avanzadas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 dark:from-blue-700 to-purple-600 dark:to-purple-700 p-6 rounded-lg shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Icon name="chart" size="lg" className="text-white" />
          Analítica Avanzada
        </h2>
        <p className="text-blue-100">
          Insights profundos sobre la salud financiera de tu negocio
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 min-w-[150px] px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'health'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <Icon name="check-circle" size="sm" />
            Salud Financiera
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex-1 min-w-[150px] px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'forecast'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <Icon name="trending-up" size="sm" />
            Pronóstico
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={`flex-1 min-w-[150px] px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'profitability'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <Icon name="currency" size="sm" />
            Rentabilidad
          </button>
          <button
            onClick={() => setActiveTab('kpis')}
            className={`flex-1 min-w-[150px] px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'kpis'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <Icon name="chart" size="sm" />
            KPIs
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 min-w-[150px] px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'anomalies'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            🔍 Anomalías
            {anomalies.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {anomalies.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'health' && healthScore && (
        <HealthScoreTab healthScore={healthScore} />
      )}

      {activeTab === 'forecast' && cashFlowForecast && (
        <CashFlowForecastTab forecast={cashFlowForecast} />
      )}

      {activeTab === 'profitability' && profitability && (
        <ProfitabilityTab profitability={profitability} />
      )}

      {activeTab === 'kpis' && kpis && (
        <KPIsTab kpis={kpis} />
      )}

      {activeTab === 'anomalies' && (
        <AnomaliesTab anomalies={anomalies} />
      )}
    </div>
  );
}

// Health Score Tab Component
function HealthScoreTab({ healthScore }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300'
  };

  const scoreColor = getScoreColor(healthScore.score);

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className={`p-8 rounded-lg border-4 ${colorClasses[scoreColor]}`}>
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">{healthScore.score}</div>
          <div className="text-2xl font-bold mb-2">{healthScore.rating}</div>
          <p className="text-lg">{healthScore.message}</p>
        </div>

        {/* Score Breakdown */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScoreBreakdownCard
            title="💧 Liquidez"
            score={healthScore.breakdown.liquidity.score}
            maxScore={healthScore.breakdown.liquidity.maxScore}
            metrics={healthScore.breakdown.liquidity.metrics}
          />
          <ScoreBreakdownCard
            title="Rentabilidad"
            icon="currency"
            score={healthScore.breakdown.profitability.score}
            maxScore={healthScore.breakdown.profitability.maxScore}
            metrics={healthScore.breakdown.profitability.metrics}
          />
          <ScoreBreakdownCard
            title="Solvencia"
            icon="bank"
            score={healthScore.breakdown.solvency.score}
            maxScore={healthScore.breakdown.solvency.maxScore}
            metrics={healthScore.breakdown.solvency.metrics}
          />
          <ScoreBreakdownCard
            title="Eficiencia"
            icon="trending-up"
            score={healthScore.breakdown.efficiency.score}
            maxScore={healthScore.breakdown.efficiency.maxScore}
            metrics={healthScore.breakdown.efficiency.metrics}
          />
          <ScoreBreakdownCard
            title="Crecimiento"
            icon="trending-up"
            score={healthScore.breakdown.growth.score}
            maxScore={healthScore.breakdown.growth.maxScore}
            metrics={healthScore.breakdown.growth.metrics}
          />
        </div>
      </div>

      {/* Recommendations */}
      {healthScore.recommendations && healthScore.recommendations.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">💡 Recomendaciones Personalizadas</h3>
          <div className="space-y-4">
            {healthScore.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
                    : rec.priority === 'high'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-600'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{rec.category}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      rec.priority === 'critical'
                        ? 'bg-red-200 text-red-800 dark:text-red-300'
                        : rec.priority === 'high'
                        ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                        : 'bg-blue-200 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {rec.priority === 'critical'
                      ? 'Crítico'
                      : rec.priority === 'high'
                      ? 'Alta'
                      : 'Media'}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{rec.message}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {rec.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Score Breakdown Card Component
function ScoreBreakdownCard({ title, icon, score, maxScore, metrics }) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
      <h4 className="font-bold mb-3 flex items-center gap-2">
        {icon && <Icon name={icon} size="sm" className="text-blue-600" />}
        {title}
      </h4>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{score}</span>
          <span className="text-gray-500 dark:text-gray-400">/ {maxScore}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              percentage >= 80
                ? 'bg-green-500'
                : percentage >= 60
                ? 'bg-blue-500'
                : percentage >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cash Flow Forecast Tab Component
function CashFlowForecastTab({ forecast }) {
  const trendIcon = {
    improving: 'trending-up',
    declining: 'trending-down',
    stable: 'minus',
    insufficient_data: 'info'
  };

  const trendColor = {
    improving: 'text-green-600',
    declining: 'text-red-600',
    stable: 'text-blue-600',
    insufficient_data: 'text-gray-600'
  };

  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="trending-up" size="md" />
          Tendencia de Flujo de Caja
        </h3>
        <div className="flex items-center gap-4">
          <Icon name={trendIcon[forecast.trend]} size="2xl" className={trendColor[forecast.trend]} />
          <div>
            <p className={`text-2xl font-bold ${trendColor[forecast.trend]}`}>
              {forecast.trend === 'improving'
                ? 'Mejorando'
                : forecast.trend === 'declining'
                ? 'Declinando'
                : forecast.trend === 'stable'
                ? 'Estable'
                : 'Datos insuficientes'}
            </p>
            {forecast.historicalAverage && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Promedio histórico: {formatCurrency(forecast.historicalAverage.income)} ingresos,{' '}
                {formatCurrency(forecast.historicalAverage.expenses)} gastos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Table */}
      {forecast.forecasts && forecast.forecasts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md overflow-x-auto">
          <h3 className="text-xl font-bold mb-4">🔮 Pronóstico Próximos Meses</h3>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Periodo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Ingresos</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Gastos</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Flujo Neto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Balance Proyectado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Confianza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {forecast.forecasts.map((f, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 text-sm font-medium">{f.month}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {formatCurrency(f.income)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {formatCurrency(f.expenses)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                    f.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(f.netCashFlow)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${
                    f.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(f.projectedBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{f.confidence}%</span>
                      <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            f.confidence >= 70
                              ? 'bg-green-500'
                              : f.confidence >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${f.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warning for insufficient data */}
      {forecast.trend === 'insufficient_data' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon name="warning" size="lg" className="text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Datos insuficientes</h3>
              <p className="mt-2 text-sm text-yellow-700">
                Se necesitan más transacciones históricas para generar pronósticos precisos.
                Continúa registrando tus transacciones para obtener mejores insights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Profitability Tab Component
function ProfitabilityTab({ profitability }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 dark:from-green-600 to-green-600 dark:to-green-700 p-6 rounded-lg text-white">
          <div className="text-sm mb-1">Ingresos Totales</div>
          <div className="text-2xl font-bold">{formatCurrency(profitability.totalRevenue)}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 dark:from-red-600 to-red-600 dark:to-red-700 p-6 rounded-lg text-white">
          <div className="text-sm mb-1">Gastos Totales</div>
          <div className="text-2xl font-bold">{formatCurrency(profitability.totalExpenses)}</div>
        </div>
        <div className={`bg-gradient-to-br p-6 rounded-lg text-white ${
          profitability.totalProfit >= 0 ? 'from-blue-500 dark:from-blue-600 to-blue-600 dark:to-blue-700' : 'from-orange-500 to-orange-600'
        }`}>
          <div className="text-sm mb-1">Utilidad Total</div>
          <div className="text-2xl font-bold">{formatCurrency(profitability.totalProfit)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 dark:from-purple-600 to-purple-600 dark:to-purple-700 p-6 rounded-lg text-white">
          <div className="text-sm mb-1">Margen Total</div>
          <div className="text-2xl font-bold">{profitability.totalMargin ? profitability.totalMargin.toFixed(1) : '0.0'}%</div>
        </div>
      </div>

      {/* Top/Worst Performers */}
      {profitability.summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">🏆 Mejor Desempeño</h3>
            <div className="text-2xl font-bold text-green-700">{profitability.summary.topPerformer}</div>
            <div className="text-lg text-green-600">
              {formatCurrency(profitability.summary.topPerformerProfit)} de utilidad
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-2 border-red-200">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
              <Icon name="warning" size="sm" />
              Requiere Atención
            </h3>
            <div className="text-2xl font-bold text-red-700">{profitability.summary.worstPerformer}</div>
            <div className="text-lg text-red-600">
              {formatCurrency(profitability.summary.worstPerformerProfit)} de utilidad
            </div>
          </div>
        </div>
      )}

      {/* Profitability by Group */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Icon name="chart" size="md" />
          Rentabilidad por Categoría
        </h3>
        <div className="space-y-3">
          {profitability.groups.map((group, index) => (
            <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{group.name}</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  (group.margin || 0) >= 20
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : (group.margin || 0) >= 10
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : (group.margin || 0) >= 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {(group.margin || 0).toFixed(1)}% margen
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Ingresos</div>
                  <div className="font-medium text-green-600">{formatCurrency(group.revenue)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{(group.revenueShare || 0).toFixed(1)}% del total</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Gastos</div>
                  <div className="font-medium text-red-600">{formatCurrency(group.expenses)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{(group.expenseShare || 0).toFixed(1)}% del total</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Utilidad</div>
                  <div className={`font-medium ${group.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(group.profit)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Transacciones</div>
                  <div className="font-medium">{group.transactions}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// KPIs Tab Component
function KPIsTab({ kpis }) {
  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <KPISection title="KPIs Financieros" icon="currency" kpis={kpis.financial} />
      
      {/* Liquidity KPIs */}
      <KPISection title="KPIs de Liquidez" icon="banknotes" kpis={kpis.liquidity} />
      
      {/* Efficiency KPIs */}
      <KPISection title="KPIs de Eficiencia" icon="trending-up" kpis={kpis.efficiency} />
      
      {/* Growth KPIs */}
      <KPISection title="KPIs de Crecimiento" icon="trending-up" kpis={kpis.growth} />
      
      {/* Customer KPIs */}
      <KPISection title="KPIs de Clientes" icon="user" kpis={kpis.customer} />
      
      {/* Employee KPIs */}
      <KPISection title="KPIs de Empleados" icon="user" kpis={kpis.employee} />
    </div>
  );
}

// KPI Section Component
function KPISection({ title, icon, kpis }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        {icon && <Icon name={icon} size="md" className="text-blue-600" />}
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(kpis).map(([key, kpi]) => (
          <KPICard key={key} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ kpi }) {
  const performance = kpi.value >= kpi.benchmark ? 'good' : 'poor';
  const performanceColor = performance === 'good' ? 'green' : 'orange';

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kpi.label}</div>
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold">
          {kpi.unit === '$' ? formatCurrency(kpi.value) : (kpi.value || 0).toFixed(2)}
          {kpi.unit !== '$' && <span className="text-sm ml-1">{kpi.unit}</span>}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full bg-${performanceColor}-100 text-${performanceColor}-700`}>
          vs {kpi.benchmark}{kpi.unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-${performanceColor}-500`}
          style={{
            width: `${Math.min(100, (kpi.value / kpi.benchmark) * 100)}%`
          }}
        ></div>
      </div>
    </div>
  );
}

// Anomalies Tab Component
function AnomaliesTab({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-md text-center">
        <span className="text-6xl mb-4 block">✅</span>
        <h3 className="text-xl font-bold text-green-600 mb-2">¡Todo en orden!</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No se detectaron anomalías en tus transacciones recientes.
        </p>
      </div>
    );
  }

  const anomaliesBySeverity = {
    high: anomalies.filter(a => a.severity === 'high'),
    medium: anomalies.filter(a => a.severity === 'medium'),
    low: anomalies.filter(a => a.severity === 'low')
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">🔍</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Se detectaron {anomalies.length} anomalías
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Revisa estas transacciones que presentan patrones inusuales.
            </p>
          </div>
        </div>
      </div>

      {/* High Severity */}
      {anomaliesBySeverity.high.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
            <Icon name="error" size="md" />
            Alta Prioridad ({anomaliesBySeverity.high.length})
          </h3>
          <div className="space-y-3">
            {anomaliesBySeverity.high.map((anomaly, index) => (
              <AnomalyCard key={index} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Severity */}
      {anomaliesBySeverity.medium.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
            <Icon name="warning" size="md" />
            Prioridad Media ({anomaliesBySeverity.medium.length})
          </h3>
          <div className="space-y-3">
            {anomaliesBySeverity.medium.map((anomaly, index) => (
              <AnomalyCard key={index} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}

      {/* Low Severity */}
      {anomaliesBySeverity.low.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-blue-600 mb-4">
            ℹ️ Informativo ({anomaliesBySeverity.low.length})
          </h3>
          <div className="space-y-3">
            {anomaliesBySeverity.low.map((anomaly, index) => (
              <AnomalyCard key={index} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Anomaly Card Component
function AnomalyCard({ anomaly }) {
  const severityColors = {
    high: 'bg-red-50 border-red-300',
    medium: 'bg-orange-50 border-orange-300',
    low: 'bg-blue-50 border-blue-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[anomaly.severity]}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold">{anomaly.transaction.description}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{anomaly.transaction.date}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatCurrency(anomaly.transaction.amount)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{anomaly.transaction.category}</div>
        </div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{anomaly.message}</div>
      {anomaly.expectedRange && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Rango esperado: {formatCurrency(anomaly.expectedRange[0])} -{' '}
          {formatCurrency(anomaly.expectedRange[1])}
        </div>
      )}
    </div>
  );
}
