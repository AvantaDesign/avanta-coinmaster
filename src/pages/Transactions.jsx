import { useState, useEffect } from 'react';
import AddTransaction from '../components/AddTransaction';
import TransactionTable from '../components/TransactionTable';
import CSVImport from '../components/CSVImport';
import ExportDialog from '../components/ExportDialog';
import AdvancedFilter from '../components/AdvancedFilter';
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
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Load data on mount
  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, []);

  // Apply advanced filters when they change
  useEffect(() => {
    applyAdvancedFilters();
  }, [advancedFilters]);

  const applyAdvancedFilters = () => {
    // Apply each filter to the store
    if (advancedFilters.search) {
      setFilter('searchTerm', advancedFilters.search);
    }
    if (advancedFilters.transaction_type) {
      setFilter('transactionType', advancedFilters.transaction_type);
    }
    if (advancedFilters.category) {
      setFilter('category', advancedFilters.category);
    }
    if (advancedFilters.type) {
      setFilter('type', advancedFilters.type);
    }
    if (advancedFilters.date_from) {
      setFilter('dateFrom', advancedFilters.date_from);
    }
    if (advancedFilters.date_to) {
      setFilter('dateTo', advancedFilters.date_to);
    }
    if (advancedFilters.account) {
      setFilter('account', advancedFilters.account);
    }
  };

  const handleAdvancedFilterChange = (newFilters) => {
    setAdvancedFilters(newFilters);
  };

  const handleAdvancedFilterReset = () => {
    setAdvancedFilters({});
    clearStoreFilters();
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange('transactionType', 'all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filters.transactionType === 'all'
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterChange('transactionType', 'business')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filters.transactionType === 'business'
                ? 'bg-info-600 dark:bg-info-700 text-white'
                : 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-400 hover:bg-info-200 dark:hover:bg-info-900/50'
            }`}
          >
            💼 Negocio
          </button>
          <button
            onClick={() => handleFilterChange('transactionType', 'personal')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filters.transactionType === 'personal'
                ? 'bg-success-600 dark:bg-success-700 text-white'
                : 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50'
            }`}
          >
            👤 Personal
          </button>
        </div>
      </div>

      {/* Advanced Filter Component */}
      <AdvancedFilter 
        onFilterChange={handleAdvancedFilterChange}
        onReset={handleAdvancedFilterReset}
      />

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Descripción..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="input-field w-full"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-field w-full"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>

          {/* Transaction Type Filter - NEW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Clasificación
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value)}
              className="input-field w-full"
            >
              <option value="all">Todas</option>
              <option value="business">💼 Negocio</option>
              <option value="personal">👤 Personal</option>
              <option value="transfer">🔄 Transferencia</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cuenta
            </label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className="input-field w-full"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="input-field w-full"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Transacciones</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total_transactions}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Ingresos</div>
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">
              {formatCurrency(statistics.total_income)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Gastos</div>
            <div className="text-2xl font-bold text-danger-600 dark:text-danger-400">
              {formatCurrency(statistics.total_expenses)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Neto</div>
            <div className={`text-2xl font-bold transition-colors ${statistics.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
              {formatCurrency(statistics.net)}
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowCSVImport(true)}
          className="bg-success-600 dark:bg-success-700 text-white px-4 py-2 rounded-md hover:bg-success-700 dark:hover:bg-success-600 flex items-center gap-2 transition-colors"
        >
          📥 Importar CSV
        </button>
        <button
          onClick={handleExportCSV}
          disabled={transactions.length === 0}
          className="bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 flex items-center gap-2 transition-colors"
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
          <div className="text-xl text-gray-900 dark:text-white">Cargando transacciones...</div>
        </div>
      )}

      {error && (
        <div className="bg-danger-100 dark:bg-danger-900/20 border border-danger-400 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded transition-colors">
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
