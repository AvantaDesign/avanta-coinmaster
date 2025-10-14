import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import { 
  matchTransactions, 
  findDuplicates, 
  getReconciliationStats,
  formatCurrency,
  formatDate
} from '../utils/reconciliation';

export default function ReconciliationManager() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [toleranceDays, setToleranceDays] = useState(3);
  const [toleranceAmount, setToleranceAmount] = useState(1);
  const [minConfidence, setMinConfidence] = useState(70);

  useEffect(() => {
    loadTransactions();
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
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && !loading && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No hay transacciones para conciliar</p>
        </div>
      )}
    </div>
  );
}
