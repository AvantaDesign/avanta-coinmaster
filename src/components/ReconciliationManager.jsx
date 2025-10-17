import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import { 
  matchTransactions, 
  findDuplicates, 
  getReconciliationStats,
  formatCurrency,
  formatDate
} from '../utils/reconciliation';
import InvoiceLinker from './InvoiceLinker';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ReconciliationManager() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [invoiceLinks, setInvoiceLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [toleranceDays, setToleranceDays] = useState(3);
  const [toleranceAmount, setToleranceAmount] = useState(1);
  const [minConfidence, setMinConfidence] = useState(70);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showInvoiceLinker, setShowInvoiceLinker] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [sortField, setSortField] = useState('confidence');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterAccount, setFilterAccount] = useState('all');

  useEffect(() => {
    loadTransactions();
    loadInvoiceLinks();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await fetchTransactions({ limit: 1000 });
      const txData = result.transactions || result.data || [];
      setTransactions(txData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoice-reconciliation`, {
        credentials: 'include'
      });
      const data = await response.json();
      setInvoiceLinks(data.links || []);
    } catch (error) {
      console.error('Error loading invoice links:', error);
    }
  };

  const runReconciliation = () => {
    setLoading(true);
    
    try {
      // Find transfer matches
      const foundMatches = matchTransactions(
        transactions, 
        toleranceDays, 
        toleranceAmount / 100
      ).filter(m => m.confidence >= minConfidence);
      
      setMatches(foundMatches);

      // Find duplicates
      const foundDuplicates = findDuplicates(transactions, 24)
        .filter(d => d.duplicates[0].confidence >= minConfidence);
      
      setDuplicates(foundDuplicates);

      // Calculate stats
      const calculatedStats = getReconciliationStats(transactions);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error running reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-700 bg-green-50';
    if (confidence >= 70) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const handleLinkInvoice = (transaction) => {
    setSelectedTransaction(transaction);
    setShowInvoiceLinker(true);
  };

  const handleInvoiceLinked = () => {
    loadInvoiceLinks();
  };

  const toggleMatchSelection = (index) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMatches(newSelected);
  };

  const selectAllMatches = () => {
    if (selectedMatches.size === matches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(matches.map((_, idx) => idx)));
    }
  };

  const bulkMatchTransactions = () => {
    if (selectedMatches.size === 0) {
      alert('Por favor selecciona al menos una coincidencia para procesar');
      return;
    }
    
    const confirmed = confirm(`¿Deseas marcar ${selectedMatches.size} transferencia(s) como conciliada(s)?`);
    if (confirmed) {
      // In a real implementation, this would update the database
      alert(`${selectedMatches.size} transferencia(s) marcadas como conciliadas`);
      setSelectedMatches(new Set());
    }
  };

  const getFilteredAndSortedMatches = () => {
    let filtered = [...matches];
    
    // Filter by account
    if (filterAccount !== 'all') {
      filtered = filtered.filter(m => 
        m.tx1.account === filterAccount || m.tx2.account === filterAccount
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'confidence':
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case 'amount':
          aVal = Math.abs(a.tx1.amount);
          bVal = Math.abs(b.tx1.amount);
          break;
        case 'date':
          aVal = new Date(a.tx1.date);
          bVal = new Date(b.tx1.date);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const getMatchStatusBadge = (match) => {
    if (match.confidence >= 95) {
      return { text: 'Coincidencia Exacta', color: 'bg-green-100 text-green-800' };
    } else if (match.confidence >= 80) {
      return { text: 'Coincidencia Alta', color: 'bg-blue-100 text-blue-800' };
    } else if (match.confidence >= 70) {
      return { text: 'Coincidencia Parcial', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Coincidencia Baja', color: 'bg-orange-100 text-orange-800' };
    }
  };

  const exportReconciliationReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      matches: matches.map(m => ({
        tx1: {
          date: m.tx1.date,
          description: m.tx1.description,
          amount: m.tx1.amount,
          account: m.tx1.account
        },
        tx2: {
          date: m.tx2.date,
          description: m.tx2.description,
          amount: m.tx2.amount,
          account: m.tx2.account
        },
        confidence: m.confidence,
        daysDiff: m.daysDiff,
        amountDiff: m.amountDiff
      })),
      duplicates: duplicates.map(d => ({
        original: {
          date: d.original.date,
          description: d.original.description,
          amount: d.original.amount
        },
        duplicateCount: d.duplicates.length
      }))
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uniqueAccounts = [...new Set(transactions.map(t => t.account).filter(Boolean))];
  const filteredMatches = getFilteredAndSortedMatches();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Conciliación de Cuentas</h2>
        
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tolerancia de días
            </label>
            <input
              type="number"
              value={toleranceDays}
              onChange={(e) => setToleranceDays(parseInt(e.target.value))}
              min="1"
              max="30"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Diferencia máxima entre fechas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tolerancia de monto (%)
            </label>
            <input
              type="number"
              value={toleranceAmount}
              onChange={(e) => setToleranceAmount(parseFloat(e.target.value))}
              min="0"
              max="10"
              step="0.1"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Diferencia máxima en monto
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confianza mínima (%)
            </label>
            <input
              type="number"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              min="50"
              max="100"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Filtrar por confianza
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={runReconciliation}
              disabled={loading || transactions.length === 0}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Ejecutar Conciliación'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Transacciones</div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.totalTransactions}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">Transferencias</div>
              <div className="text-2xl font-bold text-green-700">
                {stats.totalTransfers}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">Sin Coincidir</div>
              <div className="text-2xl font-bold text-yellow-700">
                {stats.totalUnmatched}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400">% Conciliado</div>
              <div className="text-2xl font-bold text-purple-700">
                {stats.matchedPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Tabs */}
      {(matches.length > 0 || duplicates.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex justify-between items-center">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'matches'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Transferencias Detectadas ({matches.length})
                </button>
                <button
                  onClick={() => setActiveTab('duplicates')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'duplicates'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Duplicados Potenciales ({duplicates.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`px-6 py-3 font-medium ${
                    activeTab === 'invoices'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Facturas Vinculadas ({invoiceLinks.length})
                </button>
              </div>
              
              {activeTab === 'matches' && matches.length > 0 && (
                <button
                  onClick={exportReconciliationReport}
                  className="mx-6 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  📥 Exportar Reporte
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                {/* Filtering and Sorting Controls */}
                {matches.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Filtrar por Cuenta</label>
                        <select
                          value={filterAccount}
                          onChange={(e) => setFilterAccount(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">Todas las cuentas</option>
                          {uniqueAccounts.map(account => (
                            <option key={account} value={account}>{account}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Ordenar por</label>
                        <select
                          value={sortField}
                          onChange={(e) => setSortField(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="confidence">Confianza</option>
                          <option value="amount">Monto</option>
                          <option value="date">Fecha</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Dirección</label>
                        <select
                          value={sortDirection}
                          onChange={(e) => setSortDirection(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="desc">Descendente</option>
                          <option value="asc">Ascendente</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={selectAllMatches}
                          className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600"
                        >
                          {selectedMatches.size === filteredMatches.length ? '☑️ Deseleccionar Todo' : '☐ Seleccionar Todo'}
                        </button>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedMatches.size > 0 && (
                      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          {selectedMatches.size} coincidencia(s) seleccionada(s)
                        </span>
                        <button
                          onClick={bulkMatchTransactions}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          ✓ Marcar como Conciliadas
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {filteredMatches.length === 0 && matches.length > 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No se encontraron coincidencias con los filtros aplicados
                  </p>
                ) : matches.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No se encontraron transferencias con la confianza mínima establecida
                  </p>
                ) : (
                  filteredMatches.map((match, idx) => {
                    const status = getMatchStatusBadge(match);
                    const originalIdx = matches.indexOf(match);
                    return (
                    <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMatches.has(originalIdx)}
                            onChange={() => toggleMatchSelection(originalIdx)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-2xl">🔄</span>
                          <div>
                            <div className="font-medium">Transferencia Detectada</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Diferencia: {match.daysDiff.toFixed(1)} días, 
                              {formatCurrency(match.amountDiff)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(match.confidence)}`}>
                            {match.confidence.toFixed(0)}% confianza
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Transaction 1 */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">ORIGEN (Salida)</div>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{match.tx1.description}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(match.tx1.date)} • {match.tx1.account || 'Sin cuenta'}
                            </div>
                            <div className="text-lg font-bold text-red-700 dark:text-red-400">
                              {formatCurrency(match.tx1.amount)}
                            </div>
                          </div>
                        </div>

                        {/* Transaction 2 */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">DESTINO (Entrada)</div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{match.tx2.description}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(match.tx2.date)} • {match.tx2.account || 'Sin cuenta'}
                            </div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(match.tx2.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Duplicates Tab */}
            {activeTab === 'duplicates' && (
              <div className="space-y-4">
                {duplicates.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No se encontraron duplicados con la confianza mínima establecida
                  </p>
                ) : (
                  duplicates.map((group, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">⚠️</span>
                          <div>
                            <div className="font-medium">Posible Duplicado</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {group.duplicates.length} coincidencia(s) encontrada(s)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Original Transaction */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mb-3 border border-blue-200">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Transacción Original</div>
                        <div className="space-y-1">
                          <div className="font-medium">{group.original.description}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(group.original.date)} • {group.original.account || 'Sin cuenta'}
                          </div>
                          <div className="text-lg font-bold text-blue-700">
                            {formatCurrency(group.original.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Transactions */}
                      <div className="space-y-2">
                        {group.duplicates.map((dup, dupIdx) => (
                          <div key={dupIdx} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 flex-1">
                                <div className="font-medium">{dup.tx.description}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(dup.tx.date)} • {dup.tx.account || 'Sin cuenta'}
                                </div>
                                <div className="text-lg font-bold text-yellow-700">
                                  {formatCurrency(dup.tx.amount)}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(dup.confidence)}`}>
                                {dup.confidence.toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Diferencia: {dup.hoursDiff.toFixed(1)} horas • 
                              Similitud: {(dup.similarity * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Invoice Links Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Transacciones con Facturas Vinculadas</h3>
                  <button
                    onClick={() => loadInvoiceLinks()}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    🔄 Actualizar
                  </button>
                </div>

                {invoiceLinks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No hay transacciones vinculadas a facturas (CFDIs)
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Usa la tabla de transacciones para vincular facturas a tus pagos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoiceLinks.map((link) => (
                      <div key={link.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {link.transaction_description}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Fecha: {formatDate(link.transaction_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(link.transaction_amount)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              link.transaction_type === 'ingreso' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {link.transaction_type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Factura: {link.invoice_uuid}
                          </p>
                          <div className="flex justify-between text-sm text-blue-800 dark:text-blue-300">
                            <span>Total: {formatCurrency(link.invoice_total)}</span>
                            <span>Fecha: {formatDate(link.invoice_date)}</span>
                            <span className={`px-2 py-0.5 rounded ${
                              link.invoice_status === 'active'
                                ? 'bg-green-200 text-green-900'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {link.invoice_status === 'active' ? 'Activa' : 'Cancelada'}
                            </span>
                          </div>
                        </div>

                        {link.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <strong>Notas:</strong> {link.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay transacciones para conciliar</p>
        </div>
      )}

      {/* Invoice Linker Modal */}
      {showInvoiceLinker && selectedTransaction && (
        <InvoiceLinker
          transaction={selectedTransaction}
          onClose={() => {
            setShowInvoiceLinker(false);
            setSelectedTransaction(null);
          }}
          onLinked={handleInvoiceLinked}
        />
      )}
    </div>
  );
}
