import { useState, useEffect } from 'react';
import { fetchDashboard } from '../utils/api';
import { fetchFiscal } from '../utils/api';
import BalanceCard from '../components/BalanceCard';
import MonthlyChart from '../components/MonthlyChart';
import TransactionTable from '../components/TransactionTable';
import AccountBreakdown from '../components/AccountBreakdown';
import PeriodSelector from '../components/PeriodSelector';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';

export default function Home() {
  const [data, setData] = useState(null);
  const [fiscalData, setFiscalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadDashboard();
    loadFiscalSummary();
  }, [period]);

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

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Período</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={data?.trends || []} />
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
