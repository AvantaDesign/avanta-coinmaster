// Compliance Monitoring Component
// Real-time compliance tracking, alerts, and issue management

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function ComplianceMonitoring() {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Period selection
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  // Compliance data
  const [complianceChecks, setComplianceChecks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [runningCheck, setRunningCheck] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'alerts', 'history', 'reports'
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Load data when tab or period changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadAlerts();
      loadRecentChecks();
    } else if (activeTab === 'alerts') {
      loadAlerts();
    } else if (activeTab === 'history') {
      loadComplianceHistory();
    } else if (activeTab === 'reports') {
      loadComplianceReport();
    }
  }, [activeTab, selectedYear, selectedMonth]);

  // Load recent compliance checks
  const loadRecentChecks = async () => {
    try {
      const response = await authFetch(
        `${API_BASE}/compliance-monitoring?year=${selectedYear}&month=${selectedMonth}&limit=5`
      );
      if (!response.ok) return;
      
      const data = await response.json();
      setComplianceChecks(data.checks || []);
    } catch (err) {
      console.error('Error loading recent checks:', err);
    }
  };

  // Load compliance alerts
  const loadAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/compliance-monitoring/alerts`);
      if (!response.ok) throw new Error('Failed to load alerts');
      
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Error al cargar alertas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load compliance history
  const loadComplianceHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/compliance-monitoring?year=${selectedYear}&month=${selectedMonth}&page=${pagination.page}&limit=${pagination.limit}`
      );
      if (!response.ok) throw new Error('Failed to load history');
      
      const data = await response.json();
      setComplianceChecks(data.checks || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Error al cargar historial: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load compliance report
  const loadComplianceReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedMonth && { month: selectedMonth })
      });
      
      const response = await authFetch(
        `${API_BASE}/compliance-monitoring/reports?${params}`
      );
      if (!response.ok) throw new Error('Failed to load report');
      
      const data = await response.json();
      setComplianceReport(data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Error al cargar reporte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run compliance check
  const runComplianceCheck = async () => {
    setRunningCheck(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(`${API_BASE}/compliance-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compliance_type: 'fiscal',
          period_year: selectedYear,
          period_month: selectedMonth
        })
      });

      if (!response.ok) throw new Error('Failed to run compliance check');

      const data = await response.json();
      setSuccess(`Verificación completada. Puntaje: ${Math.round(data.compliance_score)}/100`);
      
      // Reload data
      loadRecentChecks();
      loadAlerts();
    } catch (err) {
      console.error('Error running compliance check:', err);
      setError('Error al ejecutar verificación: ' + err.message);
    } finally {
      setRunningCheck(false);
    }
  };

  // Resolve alert
  const resolveAlert = async (id) => {
    try {
      const response = await authFetch(`${API_BASE}/compliance-monitoring/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved'
        })
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      setSuccess('Alerta resuelta exitosamente');
      loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('Error al resolver alerta: ' + err.message);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      compliant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      non_compliant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      resolved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
    return badges[status] || badges.pending;
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
      critical: '⚠️'
    };
    return icons[severity] || '⚪';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monitoreo de Cumplimiento
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Seguimiento en tiempo real del cumplimiento fiscal y alertas
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

        {/* Period Selector & Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Año
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  {[...Array(5)].map((_, i) => {
                    const year = currentYear - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mes
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="">Anual</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('es-MX', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={runComplianceCheck}
              disabled={runningCheck}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningCheck ? 'Verificando...' : '🔍 Ejecutar Verificación'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📊 Panel General
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              🚨 Alertas
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📋 Historial
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📈 Reportes
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Alertas Activas
                </h3>
                <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
                  {alerts.length}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Requieren atención inmediata
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Verificaciones Recientes
                </h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {complianceChecks.length}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Este período
                </p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Puntaje Promedio
                </h3>
                <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
                  {complianceChecks.length > 0
                    ? Math.round(
                        complianceChecks.reduce((sum, c) => sum + c.compliance_score, 0) /
                        complianceChecks.length
                      )
                    : 0}
                  /100
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Cumplimiento fiscal
                </p>
              </div>
            </div>

            {/* Recent Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Alertas Recientes
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {alerts.slice(0, 5).map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 text-xs font-semibold rounded ${getStatusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.compliance_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white mb-2">
                          Puntaje: {Math.round(alert.compliance_score)}/100
                        </p>
                        {alert.issues_found && alert.issues_found.length > 0 && (
                          <div className="space-y-1">
                            {alert.issues_found.slice(0, 2).map((issue, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span>{getSeverityIcon(issue.severity)}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {issue.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Checks */}
            {complianceChecks.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Verificaciones Recientes
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Período
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Puntaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {complianceChecks.map(check => (
                        <tr key={check.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(check.last_checked)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {check.compliance_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {check.period_month
                              ? `${check.period_year}-${String(check.period_month).padStart(2, '0')}`
                              : check.period_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    check.compliance_score >= 90
                                      ? 'bg-green-500'
                                      : check.compliance_score >= 70
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${check.compliance_score}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {Math.round(check.compliance_score)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(check.status)}`}>
                              {check.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Cargando alertas...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No hay alertas activas</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.compliance_type}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.period_month
                              ? `${alert.period_year}-${String(alert.period_month).padStart(2, '0')}`
                              : alert.period_year}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          Puntaje de Cumplimiento: {Math.round(alert.compliance_score)}/100
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Resolver
                      </button>
                    </div>

                    {/* Issues */}
                    {alert.issues_found && alert.issues_found.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Problemas Detectados:
                        </h3>
                        <div className="space-y-2">
                          {alert.issues_found.map((issue, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded"
                            >
                              <span className="text-xl">{getSeverityIcon(issue.severity)}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {issue.message}
                                </p>
                                {issue.affected_count > 0 && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Afectados: {issue.affected_count}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {alert.recommendations && alert.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Recomendaciones:
                        </h3>
                        <div className="space-y-2">
                          {alert.recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded"
                            >
                              <span className="text-blue-600 dark:text-blue-400">💡</span>
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {rec.action}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Impacto: {rec.impact}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Última verificación: {formatDate(alert.last_checked)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
              </div>
            ) : complianceChecks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">No hay verificaciones en el historial</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Período
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Puntaje
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Problemas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {complianceChecks.map(check => (
                        <tr key={check.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(check.last_checked)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {check.compliance_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {check.period_month
                              ? `${check.period_year}-${String(check.period_month).padStart(2, '0')}`
                              : check.period_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${
                              check.compliance_score >= 90
                                ? 'text-green-600 dark:text-green-400'
                                : check.compliance_score >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {Math.round(check.compliance_score)}/100
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(check.status)}`}>
                              {check.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {check.issues_found?.length || 0}
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
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && complianceReport && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Verificaciones
                </h3>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {complianceReport.summary.total_checks}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasa de Cumplimiento
                </h3>
                <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
                  {complianceReport.summary.compliance_rate}%
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Puntaje Promedio
                </h3>
                <p className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
                  {complianceReport.summary.avg_score}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Problemas Detectados
                </h3>
                <p className="mt-2 text-3xl font-semibold text-orange-600 dark:text-orange-400">
                  {complianceReport.summary.non_compliant + complianceReport.summary.critical}
                </p>
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Cumplimiento por Tipo
              </h2>
              <div className="space-y-4">
                {Object.entries(complianceReport.by_type).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.count} verificaciones
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {Math.round(data.avg_score)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.compliant} cumpliendo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
