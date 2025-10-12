import { useState, useEffect } from 'react';
import { fetchDashboard } from '../utils/api';
import BalanceCard from '../components/BalanceCard';
import MonthlyChart from '../components/MonthlyChart';
import TransactionTable from '../components/TransactionTable';
import { Link } from 'react-router-dom';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await fetchDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={[]} />
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
