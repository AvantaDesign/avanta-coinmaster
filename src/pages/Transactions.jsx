import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import AddTransaction from '../components/AddTransaction';
import TransactionTable from '../components/TransactionTable';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { category: filter } : {};
      const result = await fetchTransactions(params);
      setTransactions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`px-4 py-2 rounded-md ${
              filter === 'personal'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setFilter('avanta')}
            className={`px-4 py-2 rounded-md ${
              filter === 'avanta'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Avanta
          </button>
        </div>
      </div>

      <AddTransaction onSuccess={loadTransactions} />

      {loading && (
        <div className="text-center py-8">
          <div className="text-xl">Cargando transacciones...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="text-sm text-gray-600">
            Total de transacciones: {transactions.length}
          </div>
          <TransactionTable
            transactions={transactions}
            onUpdate={loadTransactions}
          />
        </>
      )}
    </div>
  );
}
