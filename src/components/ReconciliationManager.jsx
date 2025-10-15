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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Filtrar por confianza
            </p>
          </div>

          <div className="flex items-end">
            <button
              onClick={runReconciliation}
              disabled={loading || transactions.length === 0}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Ejecutar Conciliación'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Total Transacciones</div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.totalTransactions}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Transferencias</div>
              <div className="text-2xl font-bold text-green-700">
                {stats.totalTransfers}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Sin Coincidir</div>
              <div className="text-2xl font-bold text-yellow-700">
                {stats.totalUnmatched}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">% Conciliado</div>
              <div className="text-2xl font-bold text-purple-700">
                {stats.matchedPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Tabs */}
      {(matches.length > 0 || duplicates.length > 0) && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
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
          </div>

          <div className="p-6">
            {/* Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No se encontraron transferencias con la confianza mínima establecida
                  </p>
                ) : (
                  matches.map((match, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🔄</span>
                          <div>
                            <div className="font-medium">Transferencia Detectada</div>
                            <div className="text-sm text-gray-500">
                              Diferencia: {match.daysDiff.toFixed(1)} días, 
                              {formatCurrency(match.amountDiff)}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(match.confidence)}`}>
                          {match.confidence.toFixed(0)}% confianza
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Transaction 1 */}
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <div className="text-xs text-gray-600 mb-2">Origen</div>
                          <div className="space-y-1">
                            <div className="font-medium">{match.tx1.description}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(match.tx1.date)} • {match.tx1.account || 'Sin cuenta'}
                            </div>
                            <div className="text-lg font-bold text-red-700">
                              {formatCurrency(match.tx1.amount)}
                            </div>
                          </div>
                        </div>

                        {/* Transaction 2 */}
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <div className="text-xs text-gray-600 mb-2">Destino</div>
                          <div className="space-y-1">
                            <div className="font-medium">{match.tx2.description}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(match.tx2.date)} • {match.tx2.account || 'Sin cuenta'}
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {formatCurrency(match.tx2.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Duplicates Tab */}
            {activeTab === 'duplicates' && (
              <div className="space-y-4">
                {duplicates.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
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
                            <div className="text-sm text-gray-500">
                              {group.duplicates.length} coincidencia(s) encontrada(s)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Original Transaction */}
                      <div className="bg-blue-50 p-3 rounded mb-3 border border-blue-200">
                        <div className="text-xs text-gray-600 mb-2">Transacción Original</div>
                        <div className="space-y-1">
                          <div className="font-medium">{group.original.description}</div>
                          <div className="text-sm text-gray-600">
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
                          <div key={dupIdx} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 flex-1">
                                <div className="font-medium">{dup.tx.description}</div>
                                <div className="text-sm text-gray-600">
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
                            <div className="text-xs text-gray-500 mt-2">
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
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">
                      No hay transacciones vinculadas a facturas (CFDIs)
                    </p>
                    <p className="text-sm text-gray-500">
                      Usa la tabla de transacciones para vincular facturas a tus pagos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoiceLinks.map((link) => (
                      <div key={link.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {link.transaction_description}
                            </p>
                            <p className="text-sm text-gray-600">
                              Fecha: {formatDate(link.transaction_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(link.transaction_amount)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              link.transaction_type === 'ingreso' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {link.transaction_type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Factura: {link.invoice_uuid}
                          </p>
                          <div className="flex justify-between text-sm text-blue-800">
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
                          <p className="text-sm text-gray-600 mt-2">
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
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No hay transacciones para conciliar</p>
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
