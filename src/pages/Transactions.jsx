import { useState, useEffect } from 'react';
import { fetchTransactions, fetchAccounts } from '../utils/api';
import AddTransaction from '../components/AddTransaction';
import TransactionTable from '../components/TransactionTable';
import CSVImport from '../components/CSVImport';
import { exportToCSV, downloadCSV } from '../utils/csvParser';
import { formatCurrency } from '../utils/calculations';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filter, searchTerm, typeFilter, accountFilter, dateFrom, dateTo]);

  const loadAccounts = async () => {
    try {
      const result = await fetchAccounts();
      setAccounts(result.data || result || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        include_stats: true
      };
      
      if (filter !== 'all') params.category = filter;
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (accountFilter !== 'all') params.account = accountFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const result = await fetchTransactions(params);
      // Handle new API response format with data, pagination, filters
      setTransactions(result.data || result);
      setStatistics(result.statistics || null);
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

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setAccountFilter('all');
    setDateFrom('');
    setDateTo('');
    setFilter('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || accountFilter !== 'all' || dateFrom || dateTo || filter !== 'all';

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

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filtros</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta
            </label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total Transacciones</div>
            <div className="text-2xl font-bold">{statistics.total_transactions}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Ingresos</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.total_income)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Gastos</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(statistics.total_expenses)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Neto</div>
            <div className={`text-2xl font-bold ${statistics.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(statistics.net)}
            </div>
          </div>
        </div>
      )}

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
          <TransactionTable
            transactions={transactions}
            onUpdate={loadTransactions}
          />
        </>
      )}
    </div>
  );
}
