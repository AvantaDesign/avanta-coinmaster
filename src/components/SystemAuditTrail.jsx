// System Audit Trail Component
// Comprehensive system-wide activity logging viewer with filtering and export

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function SystemAuditTrail() {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Audit data
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    security_level: '',
    compliance_relevant: '',
    start_date: '',
    end_date: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Active tab
  const [activeTab, setActiveTab] = useState('activities'); // 'activities', 'summary', 'export'
  
  // Selected entry for details
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load data when filters or pagination changes
  useEffect(() => {
    if (activeTab === 'activities') {
      loadEntries();
    } else if (activeTab === 'summary') {
      loadSummary();
    }
  }, [activeTab, filters, pagination.page]);

  // Load audit entries
  const loadEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      // Remove empty filters
      for (const [key, value] of params.entries()) {
        if (!value) params.delete(key);
      }

      const response = await authFetch(`${API_BASE}/audit-trail?${params}`);
      if (!response.ok) throw new Error('Failed to load entries');
      
      const data = await response.json();
      setEntries(data.entries || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Error loading entries:', err);
      setError('Error al cargar registros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load summary
  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);

      const response = await authFetch(`${API_BASE}/audit-trail/summary?${params}`);
      if (!response.ok) throw new Error('Failed to load summary');
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Error al cargar resumen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export audit trail
  const exportAuditTrail = async (format = 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        ...filters
      });

      // Remove empty filters
      for (const [key, value] of params.entries()) {
        if (!value) params.delete(key);
      }

      const response = await authFetch(`${API_BASE}/audit-trail/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setSuccess('Exportación completada exitosamente');
    } catch (err) {
      console.error('Error exporting audit trail:', err);
      setError('Error al exportar registros: ' + err.message);
    }
  };

  // View entry details
  const viewEntryDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get action icon
  const getActionIcon = (actionType) => {
    const icons = {
      create: '➕',
      read: '👁️',
      update: '✏️',
      delete: '🗑️',
      export: '📤',
      submit: '📨',
      approve: '✅',
      reject: '❌',
      archive: '📦',
      restore: '♻️'
    };
    return icons[actionType] || '📝';
  };

  // Get security level badge
  const getSecurityBadge = (level) => {
    const badges = {
      normal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      elevated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return badges[level] || badges.normal;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Auditoría del Sistema
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registro completo de actividades y eventos del sistema
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📋 Actividades
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📤 Exportar
            </button>
          </nav>
        </div>

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Acción
                  </label>
                  <select
                    value={filters.action_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, action_type: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    <option value="create">Crear</option>
                    <option value="read">Leer</option>
                    <option value="update">Actualizar</option>
                    <option value="delete">Eliminar</option>
                    <option value="export">Exportar</option>
                    <option value="submit">Enviar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Entidad
                  </label>
                  <select
                    value={filters.entity_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, entity_type: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    <option value="transaction">Transacción</option>
                    <option value="cfdi">CFDI</option>
                    <option value="declaration">Declaración</option>
                    <option value="document">Documento</option>
                    <option value="compliance">Cumplimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nivel de Seguridad
                  </label>
                  <select
                    value={filters.security_level}
                    onChange={(e) => setFilters(prev => ({ ...prev, security_level: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="normal">Normal</option>
                    <option value="elevated">Elevado</option>
                    <option value="critical">Crítico</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Cargando registros...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No se encontraron registros</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Fecha/Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Acción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Entidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Seguridad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            IP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.map(entry => (
                          <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(entry.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span>{getActionIcon(entry.action_type)}</span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {entry.action_type}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="text-gray-900 dark:text-white">{entry.entity_type}</div>
                              {entry.entity_id && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {entry.entity_id}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getSecurityBadge(entry.security_level)}`}>
                                {entry.security_level}
                              </span>
                              {entry.compliance_relevant === 1 && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                  📌
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {entry.ip_address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => viewEntryDetails(entry)}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.pages}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && summary && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Actividades
                </h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {summary.summary.total_activities}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Relevantes para Cumplimiento
                </h3>
                <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
                  {summary.summary.compliance_relevant}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Eventos de Seguridad
                </h3>
                <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
                  {summary.summary.security_events}
                </p>
              </div>
            </div>

            {/* By Action Type */}
            {summary.by_action_type && summary.by_action_type.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Por Tipo de Acción
                </h2>
                <div className="space-y-2">
                  {summary.by_action_type.map(item => (
                    <div key={item.action_type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded">
                      <div className="flex items-center gap-2">
                        <span>{getActionIcon(item.action_type)}</span>
                        <span className="text-gray-900 dark:text-white">{item.action_type}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Exportar Auditoría
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.compliance_relevant === 'true'}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      compliance_relevant: e.target.checked ? 'true' : '' 
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Solo registros relevantes para cumplimiento
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => exportAuditTrail('json')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  📥 Exportar JSON
                </button>
                <button
                  onClick={() => exportAuditTrail('csv')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  📊 Exportar CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entry Details Modal */}
        {showDetails && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalles del Registro
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha/Hora
                    </label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedEntry.timestamp)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tipo de Acción
                      </label>
                      <p className="text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{getActionIcon(selectedEntry.action_type)}</span>
                        {selectedEntry.action_type}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tipo de Entidad
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedEntry.entity_type}</p>
                    </div>
                  </div>

                  {selectedEntry.entity_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        ID de Entidad
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedEntry.entity_id}</p>
                    </div>
                  )}

                  {selectedEntry.action_details && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Detalles de Acción
                      </label>
                      <pre className="p-3 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-900 dark:text-white overflow-x-auto">
                        {JSON.stringify(selectedEntry.action_details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Nivel de Seguridad
                      </label>
                      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${getSecurityBadge(selectedEntry.security_level)}`}>
                        {selectedEntry.security_level}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Relevante para Cumplimiento
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedEntry.compliance_relevant === 1 ? 'Sí' : 'No'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Dirección IP
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedEntry.ip_address}</p>
                  </div>

                  {selectedEntry.user_agent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        User Agent
                      </label>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {selectedEntry.user_agent}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
