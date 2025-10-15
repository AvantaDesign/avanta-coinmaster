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
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { calculateFinancialHealthScore } from '../utils/advancedAnalytics';

const API_URL = import.meta.env.VITE_API_URL || 'https://avanta-finance.pages.dev';

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [fiscalData, setFiscalData] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'business', 'personal'

  useEffect(() => {
    loadDashboard();
    loadFiscalSummary();
    loadCredits();
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

  const loadCredits = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits?include_balance=true&active_only=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const creditsData = await response.json();
        setCredits(creditsData);
      }
    } catch (err) {
      console.error('Error loading credits:', err);
    }
  };

  const handlePaymentClick = (credit) => {
    navigate('/credits', { state: { openPaymentFor: credit.id } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/transactions"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ver Transacciones
          </Link>
          <Link
            to="/fiscal"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Vista Fiscal
          </Link>
        </div>
      </div>

      {/* Business/Personal View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Vista</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-md text-sm ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setViewMode('business')}
              className={`px-4 py-2 rounded-md text-sm ${
                viewMode === 'business'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              💼 Negocio
            </button>
            <button
              onClick={() => setViewMode('personal')}
              className={`px-4 py-2 rounded-md text-sm ${
                viewMode === 'personal'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              👤 Personal
            </button>
          </div>
        </div>
        
        {/* Info Banner for filtered views */}
        {viewMode !== 'all' && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            viewMode === 'business' 
              ? 'bg-purple-50 text-purple-900 border border-purple-200' 
              : 'bg-green-50 text-green-900 border border-green-200'
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
              className="ml-2 underline hover:no-underline"
            >
              Ver cálculos fiscales →
            </Link>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Período</h3>
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
        
        {/* Health Score Card */}
        {healthScore && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Salud Financiera</h3>
              <button
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Ver detalle →
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${
                healthScore.score >= 80 ? 'text-green-600' :
                healthScore.score >= 60 ? 'text-blue-600' :
                healthScore.score >= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {healthScore.score}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">{healthScore.rating}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      healthScore.score >= 80 ? 'bg-green-500' :
                      healthScore.score >= 60 ? 'bg-blue-500' :
                      healthScore.score >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Resumen Fiscal del Mes</h2>
            <Link
              to="/fiscal"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver detalles →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-xs text-gray-600">Utilidad</div>
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(fiscalData.utilidad)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-xs text-gray-600">ISR</div>
              <div className="text-lg font-bold text-red-700">
                {formatCurrency(fiscalData.isr)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-xs text-gray-600">IVA</div>
              <div className="text-lg font-bold text-orange-700">
                {formatCurrency(fiscalData.iva)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-xs text-gray-600">Total Impuestos</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(fiscalData.isr + fiscalData.iva)}
              </div>
            </div>
          </div>
          {fiscalData.dueDate && (
            <div className="text-xs text-gray-600 mt-3">
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

      {/* Advanced Analytics Banner */}
      {showAdvancedAnalytics && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">📊 Analítica Avanzada Disponible</h3>
              <p className="text-blue-100 mb-4">
                Accede a análisis profundos de tu salud financiera, pronósticos, KPIs y más
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/analytics"
                  className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 font-medium"
                >
                  Ver Analytics Completo
                </Link>
                <Link
                  to="/reports"
                  className="bg-white/20 text-white px-4 py-2 rounded-md hover:bg-white/30 font-medium"
                >
                  Generar Reportes
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowAdvancedAnalytics(false)}
              className="text-white hover:text-blue-100 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Charts with Interactive Features */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">📈 Tendencia de 6 Meses</h3>
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <Link
              to="/transactions"
              className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700"
            >
              Agregar Transacción
            </Link>
            <Link
              to="/invoices"
              className="block w-full text-center bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700"
            >
              Subir Factura
            </Link>
            <Link
              to="/fiscal"
              className="block w-full text-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700"
            >
              Ver Cálculo Fiscal
            </Link>
          </div>
        </div>

        {/* Automation Features Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg shadow-md border border-purple-200">
          <h2 className="text-xl font-bold mb-4 text-purple-900">🤖 Automatización</h2>
          <div className="space-y-2">
            <Link
              to="/automation"
              className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
            >
              Dashboard de Automatización
            </Link>
            <Link
              to="/receivables"
              className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              Cuentas por Cobrar
            </Link>
            <Link
              to="/payables"
              className="block w-full text-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Cuentas por Pagar
            </Link>
            <Link
              to="/invoice-automation"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              Automatizar Facturas
            </Link>
          </div>
        </div>
        
        {/* Category Breakdown */}
        {data?.categoryBreakdown && data.categoryBreakdown.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Por Categoría</h2>
            <div className="space-y-2">
              {data.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{cat.category || 'Sin categoría'}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      cat.type === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cat.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    cat.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
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
        <h2 className="text-2xl font-bold mb-4">Últimas Transacciones</h2>
        <TransactionTable
          transactions={data?.recentTransactions || []}
          onUpdate={loadDashboard}
        />
      </div>
    </div>
  );
}
