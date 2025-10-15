import { useState, useEffect } from 'react';
import AddTransaction from '../components/AddTransaction';
import TransactionTable from '../components/TransactionTable';
import CSVImport from '../components/CSVImport';
import ExportDialog from '../components/ExportDialog';
import { formatCurrency } from '../utils/calculations';
import { showSuccess, showError } from '../utils/notifications';
import useTransactionStore from '../stores/useTransactionStore';
import useAccountStore from '../stores/useAccountStore';

export default function Transactions() {
  // Zustand stores
  const {
    transactions,
    statistics,
    loading,
    error,
    filters,
    setFilter,
    clearFilters: clearStoreFilters,
    loadTransactions
  } = useTransactionStore();
  
  const { accounts, loadAccounts } = useAccountStore();
  
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilter(key, value);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showError('No hay transacciones para exportar');
      return;
    }
    setShowExportDialog(true);
  };
  
  const handleExportDialogClose = (success) => {
    setShowExportDialog(false);
    if (success) {
      showSuccess('Transacciones exportadas exitosamente');
    }
  };
  
  // Prepare current filters for export metadata
  const getCurrentFilters = () => {
    const exportFilters = {};
    if (filters.category !== 'all') exportFilters.categoria = filters.category;
    if (filters.searchTerm) exportFilters.busqueda = filters.searchTerm;
    if (filters.type !== 'all') exportFilters.tipo = filters.type;
    if (filters.account !== 'all') exportFilters.cuenta = filters.account;
    if (filters.transactionType !== 'all') exportFilters.clasificacion = filters.transactionType;
    if (filters.dateFrom) exportFilters.desde = filters.dateFrom;
    if (filters.dateTo) exportFilters.hasta = filters.dateTo;
    return exportFilters;
  };

  const clearFilters = () => {
    clearStoreFilters();
  };

  const hasActiveFilters = filters.searchTerm || filters.type !== 'all' || filters.account !== 'all' || filters.transactionType !== 'all' || filters.dateFrom || filters.dateTo || filters.category !== 'all';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange('transactionType', 'all')}
            className={`px-4 py-2 rounded-md ${
              filters.transactionType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('transactionType', 'business')}
            className={`px-4 py-2 rounded-md ${
              filters.transactionType === 'business'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            💼 Negocio
          </button>
          <button
            onClick={() => handleFilterChange('transactionType', 'personal')}
            className={`px-4 py-2 rounded-md ${
              filters.transactionType === 'personal'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            👤 Personal
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Descripción..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>

          {/* Transaction Type Filter - NEW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clasificación
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="business">💼 Negocio</option>
              <option value="personal">👤 Personal</option>
              <option value="transfer">🔄 Transferencia</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta
            </label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
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
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
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
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
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
      <div className="flex gap-2 flex-wrap">
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
          📤 Exportar
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

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          transactions={transactions}
          filters={getCurrentFilters()}
          onClose={handleExportDialogClose}
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
