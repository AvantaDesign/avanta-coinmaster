import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import AddTransaction from '../components/AddTransaction';
import TransactionTable from '../components/TransactionTable';
import CSVImport from '../components/CSVImport';
import { exportToCSV, downloadCSV } from '../utils/csvParser';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCSVImport, setShowCSVImport] = useState(false);

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

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(transactions);
      const filename = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
    } catch (err) {
      alert('Error al exportar: ' + err.message);
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

      {/* Import/Export Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCSVImport(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          📥 Importar CSV
        </button>
        <button
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
        >
          📤 Exportar CSV
        </button>
      </div>

      <AddTransaction onSuccess={loadTransactions} />

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImport
          onSuccess={loadTransactions}
          onClose={() => setShowCSVImport(false)}
        />
      )}

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
