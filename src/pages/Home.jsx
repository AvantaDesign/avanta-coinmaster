import { useState, useEffect } from 'react';
import { fetchDashboard } from '../utils/api';
import { fetchFiscal } from '../utils/api';
import BalanceCard from '../components/BalanceCard';
import MonthlyChart from '../components/MonthlyChart';
import TransactionTable from '../components/TransactionTable';
import AccountBreakdown from '../components/AccountBreakdown';
import PeriodSelector from '../components/PeriodSelector';
import InteractiveCharts from '../components/InteractiveCharts';
import UpcomingPayments from '../components/UpcomingPayments';
import BudgetSummaryWidget from '../components/BudgetSummaryWidget';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { calculateFinancialHealthScore } from '../utils/advancedAnalytics';
import useTransactionStore from '../stores/useTransactionStore';
import useAccountStore from '../stores/useAccountStore';
import useCreditStore from '../stores/useCreditStore';

export default function Home() {
  const navigate = useNavigate();
  
  // Zustand stores
  const { loadTransactions } = useTransactionStore();
  const { accounts, loadAccounts } = useAccountStore();
  const { credits, loadCredits, getUpcomingPayments } = useCreditStore();
  
  const [data, setData] = useState(null);
  const [fiscalData, setFiscalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'business', 'personal'

  useEffect(() => {
    loadDashboard();
    loadFiscalSummary();
    loadCreditsData();
    loadAccounts();
    loadTransactions();
  }, [period]);

  useEffect(() => {
    if (data && fiscalData) {
      calculateHealthScore();
    }
  }, [data, fiscalData]);

  const calculateHealthScore = () => {
    try {
      const financialData = {
        currentAssets: data?.totalBalance || 0,
        currentLiabilities: 0,
        totalAssets: data?.totalBalance || 0,
        totalLiabilities: 0,
        revenue: data?.thisMonth?.income || 0,
        expenses: data?.thisMonth?.expenses || 0,
        netIncome: (data?.thisMonth?.income || 0) - (data?.thisMonth?.expenses || 0),
        cashReserves: data?.totalBalance || 0,
        accountsReceivable: 0,
        accountsPayable: 0
      };
      const score = calculateFinancialHealthScore(financialData);
      setHealthScore(score);
    } catch (error) {
      console.error('Error calculating health score:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await fetchDashboard({ period });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFiscalSummary = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const result = await fetchFiscal(currentMonth, currentYear);
      setFiscalData(result);
    } catch (err) {
      console.error('Error loading fiscal summary:', err);
    }
  };

  const loadCreditsData = async () => {
    try {
      await loadCredits(true, true); // include balance and active only
    } catch (err) {
      console.error('Error loading credits:', err);
    }
  };

  const handlePaymentClick = (credit) => {
    navigate('/credits', { state: { openPaymentFor: credit.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-xl text-gray-900 dark:text-white">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-xl text-danger-600 dark:text-danger-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/transactions"
            className="bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            Ver Transacciones
          </Link>
          <Link
            to="/fiscal"
            className="bg-success-600 dark:bg-success-700 text-white px-4 py-2 rounded-md hover:bg-success-700 dark:hover:bg-success-600 transition-colors"
          >
            Vista Fiscal
          </Link>
        </div>
      </div>

      {/* Business/Personal View Toggle */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'all'
                  ? 'bg-primary-600 dark:bg-primary-700 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setViewMode('business')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'business'
                  ? 'bg-info-600 dark:bg-info-700 text-white'
                  : 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-400 hover:bg-info-200 dark:hover:bg-info-900/50'
              }`}
            >
              💼 Negocio
            </button>
            <button
              onClick={() => setViewMode('personal')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === 'personal'
                  ? 'bg-success-600 dark:bg-success-700 text-white'
                  : 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50'
              }`}
            >
              👤 Personal
            </button>
          </div>
        </div>
        
        {/* Info Banner for filtered views */}
        {viewMode !== 'all' && (
          <div className={`mt-3 p-3 rounded-md text-sm transition-colors ${
            viewMode === 'business' 
              ? 'bg-info-50 dark:bg-info-900/20 text-info-900 dark:text-info-300 border border-info-200 dark:border-info-800' 
              : 'bg-success-50 dark:bg-success-900/20 text-success-900 dark:text-success-300 border border-success-200 dark:border-success-800'
          }`}>
            <span className="font-medium">
              {viewMode === 'business' ? '💼 Vista de Negocio: ' : '👤 Vista Personal: '}
            </span>
            {viewMode === 'business' 
              ? 'Mostrando solo transacciones clasificadas como "Negocio". Los cálculos fiscales se basan en esta clasificación.'
              : 'Mostrando solo transacciones clasificadas como "Personal". Estas no afectan los cálculos fiscales.'
            }
            <Link 
              to="/fiscal" 
              className="ml-2 underline hover:no-underline text-inherit"
            >
              Ver cálculos fiscales →
            </Link>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Período</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <BalanceCard
          title="Balance Total"
          amount={data?.totalBalance || 0}
          type="neutral"
        />
        <BalanceCard
          title="Ingresos del Mes"
          amount={data?.thisMonth?.income || 0}
          type="positive"
        />
        <BalanceCard
          title="Gastos del Mes"
          amount={data?.thisMonth?.expenses || 0}
          type="negative"
        />
        
        {/* Health Score Card - Updated colors */}
        {healthScore && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Salud Financiera</h3>
              <button
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-xs transition-colors"
              >
                Ver detalle →
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${
                healthScore.score >= 80 ? 'text-success-600 dark:text-success-400' :
                healthScore.score >= 60 ? 'text-primary-600 dark:text-primary-400' :
                healthScore.score >= 40 ? 'text-warning-600 dark:text-warning-400' :
                'text-danger-600 dark:text-danger-400'
              }`}>
                {healthScore.score}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{healthScore.rating}</div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      healthScore.score >= 80 ? 'bg-success-500 dark:bg-success-600' :
                      healthScore.score >= 60 ? 'bg-primary-500 dark:bg-primary-600' :
                      healthScore.score >= 40 ? 'bg-warning-500 dark:bg-warning-600' :
                      'bg-danger-500 dark:bg-danger-600'
                    }`}
                    style={{ width: `${healthScore.score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fiscal Summary Cards */}
      {fiscalData && (
        <div className="bg-gradient-to-r from-primary-50 to-info-50 dark:from-primary-900/20 dark:to-info-900/20 p-6 rounded-lg shadow-default border border-primary-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resumen Fiscal del Mes</h2>
            <Link
              to="/fiscal"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Ver detalles →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">Utilidad</div>
              <div className="text-lg font-bold text-primary-700 dark:text-primary-400">
                {formatCurrency(fiscalData.utilidad)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">ISR</div>
              <div className="text-lg font-bold text-danger-700 dark:text-danger-400">
                {formatCurrency(fiscalData.isr)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">IVA</div>
              <div className="text-lg font-bold text-warning-700 dark:text-warning-400">
                {formatCurrency(fiscalData.iva)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm dark:shadow-md border border-gray-200 dark:border-slate-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Impuestos</div>
              <div className="text-lg font-bold text-info-700 dark:text-info-400">
                {formatCurrency(fiscalData.isr + fiscalData.iva)}
              </div>
            </div>
          </div>
          {fiscalData.dueDate && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-3">
              Fecha límite: {new Date(fiscalData.dueDate).toLocaleDateString('es-MX', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Payments Widget */}
      {credits.length > 0 && (
        <UpcomingPayments credits={credits} onPaymentClick={handlePaymentClick} />
      )}

      {/* Budget Summary Widget */}
      <BudgetSummaryWidget classification={viewMode !== 'all' ? viewMode : 'all'} />

      {/* Advanced Analytics Banner */}
      {showAdvancedAnalytics && (
        <div className="bg-gradient-to-r from-primary-600 to-info-600 dark:from-primary-700 dark:to-info-700 p-6 rounded-lg shadow-elevation text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">📊 Analítica Avanzada Disponible</h3>
              <p className="text-primary-100 dark:text-primary-200 mb-4">
                Accede a análisis profundos de tu salud financiera, pronósticos, KPIs y más
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/analytics"
                  className="bg-white text-primary-600 dark:text-primary-700 px-4 py-2 rounded-md hover:bg-primary-50 dark:hover:bg-gray-100 font-medium transition-colors"
                >
                  Ver Analytics Completo
                </Link>
                <Link
                  to="/reports"
                  className="bg-white/20 text-white px-4 py-2 rounded-md hover:bg-white/30 font-medium transition-colors"
                >
                  Generar Reportes
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowAdvancedAnalytics(false)}
              className="text-white hover:text-primary-100 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Charts with Interactive Features */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">📈 Tendencia de 6 Meses</h3>
          {data?.trends && data.trends.length > 0 ? (
            <InteractiveCharts
              data={data.trends.map(t => ({
                label: new Date(t.month + '-01').toLocaleDateString('es-MX', { month: 'short' }),
                value: (t.income || 0) - (t.expenses || 0)
              }))}
              type="line"
            />
          ) : (
            <MonthlyChart data={data?.trends || []} />
          )}
        </div>
        <AccountBreakdown accounts={data?.accounts || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Acciones Rápidas</h2>
          <div className="space-y-3">
            <Link
              to="/transactions"
              className="block w-full text-center bg-primary-600 dark:bg-primary-700 text-white px-4 py-3 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Agregar Transacción
            </Link>
            <Link
              to="/invoices"
              className="block w-full text-center bg-info-600 dark:bg-info-700 text-white px-4 py-3 rounded-md hover:bg-info-700 dark:hover:bg-info-600 transition-colors"
            >
              Subir Factura
            </Link>
            <Link
              to="/fiscal"
              className="block w-full text-center bg-success-600 dark:bg-success-700 text-white px-4 py-3 rounded-md hover:bg-success-700 dark:hover:bg-success-600 transition-colors"
            >
              Ver Cálculo Fiscal
            </Link>
          </div>
        </div>

        {/* Automation Features Card */}
        <div className="bg-gradient-to-br from-info-50 to-primary-50 dark:from-info-900/20 dark:to-primary-900/20 p-6 rounded-lg shadow-default border border-info-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-info-900 dark:text-info-300">🤖 Automatización</h2>
          <div className="space-y-2">
            <Link
              to="/automation"
              className="block w-full text-center bg-info-600 dark:bg-info-700 text-white px-4 py-2 rounded-md hover:bg-info-700 dark:hover:bg-info-600 text-sm transition-colors"
            >
              Dashboard de Automatización
            </Link>
            <Link
              to="/receivables"
              className="block w-full text-center bg-success-600 dark:bg-success-700 text-white px-4 py-2 rounded-md hover:bg-success-700 dark:hover:bg-success-600 text-sm transition-colors"
            >
              Cuentas por Cobrar
            </Link>
            <Link
              to="/payables"
              className="block w-full text-center bg-danger-600 dark:bg-danger-700 text-white px-4 py-2 rounded-md hover:bg-danger-700 dark:hover:bg-danger-600 text-sm transition-colors"
            >
              Cuentas por Pagar
            </Link>
            <Link
              to="/invoice-automation"
              className="block w-full text-center bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 text-sm transition-colors"
            >
              Automatizar Facturas
            </Link>
          </div>
        </div>
        
        {/* Category Breakdown */}
        {data?.categoryBreakdown && data.categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Por Categoría</h2>
            <div className="space-y-2">
              {data.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.category || 'Sin categoría'}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded transition-colors ${
                      cat.type === 'ingreso' ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                    }`}>
                      {cat.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${
                    cat.type === 'ingreso' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    ${cat.total?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Últimas Transacciones</h2>
        <TransactionTable
          transactions={data?.recentTransactions || []}
          onUpdate={loadDashboard}
        />
      </div>
    </div>
  );
}
