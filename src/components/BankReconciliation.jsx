// Bank Reconciliation Component
// Comprehensive interface for bank statement reconciliation

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function BankReconciliation() {
  // State management
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Data state
  const [statements, setStatements] = useState([]);
  const [matches, setMatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [unmatchedStatements, setUnmatchedStatements] = useState([]);
  const [unmatchedTransactions, setUnmatchedTransactions] = useState([]);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Upload state
  const [uploadData, setUploadData] = useState({
    bankName: '',
    accountNumber: '',
    csvData: ''
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'statements', 'matches', 'upload'
  
  // Modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Load data on mount and when filters change
  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'statements') {
      loadStatements();
    } else if (activeTab === 'matches') {
      loadMatches();
    }
  }, [activeTab, statusFilter, dateRange]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        user_id: 'current-user' // This will be replaced with actual user ID
      });

      if (dateRange.start && dateRange.end) {
        queryParams.append('start_date', dateRange.start);
        queryParams.append('end_date', dateRange.end);
      }

      const response = await authFetch(
        `${API_BASE}/bank-reconciliation/summary?${queryParams}`
      );
      
      if (!response.ok) throw new Error('Failed to load summary');
      
      const data = await response.json();
      setSummary(data.summary);
      setUnmatchedStatements(data.unmatchedStatements || []);
      setUnmatchedTransactions(data.unmatchedTransactions || []);
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Error al cargar resumen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        user_id: 'current-user'
      });

      if (statusFilter && statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      if (dateRange.start) {
        queryParams.append('start_date', dateRange.start);
      }

      if (dateRange.end) {
        queryParams.append('end_date', dateRange.end);
      }

      const response = await authFetch(
        `${API_BASE}/bank-reconciliation?${queryParams}`
      );
      
      if (!response.ok) throw new Error('Failed to load statements');
      
      const data = await response.json();
      setStatements(data.statements || []);
    } catch (err) {
      console.error('Error loading statements:', err);
      setError('Error al cargar movimientos bancarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        user_id: 'current-user'
      });

      if (statusFilter && statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      const response = await authFetch(
        `${API_BASE}/bank-reconciliation/matches?${queryParams}`
      );
      
      if (!response.ok) throw new Error('Failed to load matches');
      
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Error al cargar coincidencias: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadData({
        ...uploadData,
        csvData: e.target.result
      });
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(
        `${API_BASE}/bank-reconciliation`,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'current-user',
            bankName: uploadData.bankName,
            accountNumber: uploadData.accountNumber,
            csvData: uploadData.csvData
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setSuccess(`Importados ${data.statementsImported} movimientos. ${data.matchesFound} coincidencias encontradas.`);
      setUploadData({ bankName: '', accountNumber: '', csvData: '' });
      
      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
      
      // Reload data
      loadSummary();
      if (activeTab === 'statements') loadStatements();
      if (activeTab === 'matches') loadMatches();
    } catch (err) {
      console.error('Error uploading statements:', err);
      setError('Error al importar movimientos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedStatement || !selectedTransaction) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/bank-reconciliation/matches`,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: 'current-user',
            bankStatementId: selectedStatement.id,
            transactionId: selectedTransaction.id
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create match');
      }

      setSuccess('Coincidencia manual creada exitosamente');
      setShowMatchModal(false);
      setSelectedStatement(null);
      setSelectedTransaction(null);
      
      // Reload data
      loadSummary();
      if (activeTab === 'statements') loadStatements();
      if (activeTab === 'matches') loadMatches();
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Error al crear coincidencia: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMatch = async (matchId, status) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/bank-reconciliation`,
        {
          method: 'PUT',
          body: JSON.stringify({
            matchId,
            status,
            verifiedBy: 'current-user'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update match');
      }

      setSuccess(`Coincidencia ${status === 'verified' ? 'verificada' : 'rechazada'} exitosamente`);
      
      // Reload data
      loadSummary();
      if (activeTab === 'matches') loadMatches();
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Error al actualizar coincidencia: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      matched: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      unmatched: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    const labels = {
      matched: 'Conciliado',
      verified: 'Verificado',
      unmatched: 'Sin conciliar',
      pending: 'Pendiente',
      rejected: 'Rechazado'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.unmatched}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getConfidenceBadge = (confidence) => {
    const percentage = Math.round(confidence * 100);
    let color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
    if (percentage >= 90) {
      color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    } else if (percentage >= 70) {
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    } else if (percentage >= 50) {
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {percentage}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏦 Conciliación Bancaria
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Reconcilia tus movimientos bancarios con las transacciones del sistema
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'summary', label: 'Resumen', icon: '📊' },
              { id: 'upload', label: 'Importar', icon: '📤' },
              { id: 'statements', label: 'Movimientos Bancarios', icon: '🏦' },
              { id: 'matches', label: 'Coincidencias', icon: '🔗' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Movimientos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {summary?.totalStatements || 0}
                    </p>
                  </div>
                  <div className="text-3xl">🏦</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conciliados</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                      {(summary?.matchedCount || 0) + (summary?.verifiedCount || 0)}
                    </p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sin Conciliar</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                      {summary?.unmatchedCount || 0}
                    </p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Conciliación</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {summary?.reconciliationRate || 0}%
                    </p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
              </div>
            </div>

            {/* Unmatched Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unmatched Bank Statements */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Movimientos Bancarios Sin Conciliar
                  </h3>
                </div>
                <div className="p-6">
                  {unmatchedStatements.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay movimientos sin conciliar
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {unmatchedStatements.slice(0, 5).map(statement => (
                        <div key={statement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {statement.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(statement.transaction_date)} • {statement.bank_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${statement.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(statement.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Unmatched Transactions */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transacciones Sin Conciliar
                  </h3>
                </div>
                <div className="p-6">
                  {unmatchedTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay transacciones sin conciliar
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {unmatchedTransactions.slice(0, 5).map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.date)} • {transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${transaction.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Importar Estado de Cuenta
              </h2>

              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Banco
                  </label>
                  <input
                    type="text"
                    value={uploadData.bankName}
                    onChange={(e) => setUploadData({ ...uploadData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: BBVA, Santander, Banorte"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    value={uploadData.accountNumber}
                    onChange={(e) => setUploadData({ ...uploadData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Últimos 4 dígitos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Archivo CSV del Estado de Cuenta
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    El archivo debe estar en formato CSV con las columnas: Fecha, Descripción, Monto, Saldo
                  </p>
                </div>

                {uploadData.csvData && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      ✅ Archivo cargado ({Math.round(uploadData.csvData.length / 1024)} KB)
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={uploading || !uploadData.csvData}
                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? 'Importando...' : 'Importar Estado de Cuenta'}
                  </button>
                </div>
              </form>

              {/* Format Guide */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  📋 Formato del Archivo CSV
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                  El archivo CSV debe incluir las siguientes columnas (pueden variar los nombres):
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 list-disc list-inside space-y-1">
                  <li><strong>Fecha:</strong> fecha, date, transaction_date, fecha operacion</li>
                  <li><strong>Descripción:</strong> descripcion, description, concepto, detalle</li>
                  <li><strong>Monto:</strong> monto, amount, importe, cargo, abono</li>
                  <li><strong>Saldo:</strong> saldo, balance</li>
                  <li><strong>Referencia:</strong> referencia, reference, folio (opcional)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Statements Tab */}
        {activeTab === 'statements' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="unmatched">Sin conciliar</option>
                    <option value="matched">Conciliados</option>
                    <option value="verified">Verificados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Statements List */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Banco
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Cargando...
                        </td>
                      </tr>
                    ) : statements.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No hay movimientos bancarios
                        </td>
                      </tr>
                    ) : (
                      statements.map(statement => (
                        <tr key={statement.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(statement.transaction_date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {statement.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {statement.bank_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={statement.amount >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                              {formatCurrency(statement.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(statement.reconciliation_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {statement.reconciliation_status === 'unmatched' && (
                              <button
                                onClick={() => {
                                  setSelectedStatement(statement);
                                  setShowMatchModal(true);
                                }}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                              >
                                Conciliar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="verified">Verificadas</option>
                    <option value="rejected">Rechazadas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Cargando coincidencias...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No hay coincidencias</p>
                </div>
              ) : (
                matches.map(match => (
                  <div key={match.id} className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(match.status)}
                        {getConfidenceBadge(match.match_confidence)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {match.match_type === 'automatic' ? '🤖 Automática' : '👤 Manual'}
                        </span>
                      </div>
                      {match.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyMatch(match.id, 'verified')}
                            className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50"
                          >
                            ✓ Verificar
                          </button>
                          <button
                            onClick={() => handleVerifyMatch(match.id, 'rejected')}
                            className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Bank Statement Side */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          🏦 Movimiento Bancario
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                            <p className="text-sm text-gray-900 dark:text-white">{formatDate(match.bank_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                            <p className="text-sm text-gray-900 dark:text-white">{match.bank_description}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Banco</p>
                            <p className="text-sm text-gray-900 dark:text-white">{match.bank_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                            <p className={`text-sm font-semibold ${match.bank_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(match.bank_amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Side */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          📊 Transacción del Sistema
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                            <p className="text-sm text-gray-900 dark:text-white">{formatDate(match.transaction_date)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                            <p className="text-sm text-gray-900 dark:text-white">{match.transaction_description}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {match.transaction_type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                            <p className={`text-sm font-semibold ${match.transaction_type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(match.transaction_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Metrics */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Diferencia de fecha:</span> {match.date_difference} días
                        </div>
                        <div>
                          <span className="font-medium">Diferencia de monto:</span> {formatCurrency(match.amount_difference)}
                        </div>
                        {match.description_similarity && (
                          <div>
                            <span className="font-medium">Similitud de descripción:</span> {Math.round(match.description_similarity * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manual Match Modal */}
        {showMatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conciliar Manualmente
                </h3>
              </div>

              <div className="p-6">
                {selectedStatement && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Movimiento Bancario Seleccionado
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {selectedStatement.description} - {formatCurrency(selectedStatement.amount)} - {formatDate(selectedStatement.transaction_date)}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Selecciona una transacción para conciliar:
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {unmatchedTransactions.map(transaction => (
                      <button
                        key={transaction.id}
                        onClick={() => setSelectedTransaction(transaction)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          selectedTransaction?.id === transaction.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.date)} • {transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                            </p>
                          </div>
                          <p className={`text-sm font-semibold ${transaction.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    setSelectedStatement(null);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateMatch}
                  disabled={!selectedTransaction}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Crear Coincidencia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
