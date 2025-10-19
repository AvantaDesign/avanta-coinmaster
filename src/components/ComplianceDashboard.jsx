import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  getComplianceSuggestions,
  getComplianceRules,
  getRuleExecutionLog
} from '../utils/api';

/**
 * ComplianceDashboard - Displays compliance status and suggestions
 * Shows real-time compliance monitoring, rule execution history, and suggestions
 */
export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState([]);
  const [rules, setRules] = useState([]);
  const [executionLog, setExecutionLog] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0
  });
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadData();
  }, [showResolved]);

  async function loadData() {
    setLoading(true);
    try {
      // Load suggestions
      const suggestionsData = await getComplianceSuggestions({ 
        resolved: showResolved,
        limit: 100 
      });
      setSuggestions(suggestionsData.suggestions || []);

      // Calculate stats
      const newStats = {
        total: suggestionsData.suggestions?.length || 0,
        errors: suggestionsData.suggestions?.filter(s => s.severity === 'error').length || 0,
        warnings: suggestionsData.suggestions?.filter(s => s.severity === 'warning').length || 0,
        info: suggestionsData.suggestions?.filter(s => s.severity === 'info').length || 0
      };
      setStats(newStats);

      // Load rules
      const rulesData = await getComplianceRules({ active: true });
      setRules(rulesData.rules || []);

      // Load execution log
      const logData = await getRuleExecutionLog({ limit: 50 });
      setExecutionLog(logData.logs || []);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityColor(severity) {
    switch (severity) {
      case 'error':
      case 'blocking':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }

  function getSeverityIcon(severity) {
    switch (severity) {
      case 'error':
      case 'blocking':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getRuleTypeLabel(ruleType) {
    const labels = {
      'cfdi_requirement': 'CFDI Requerido',
      'cash_limit': 'Límite Efectivo',
      'iva_accreditation': 'IVA Acreditable',
      'isr_deduction': 'Deducción ISR',
      'foreign_client': 'Cliente Extranjero',
      'vehicle_deduction': 'Deducción Vehículos',
      'payment_method': 'Método de Pago',
      'expense_classification': 'Clasificación Gasto',
      'receipt_validation': 'Validación Recibo',
      'general_validation': 'Validación General'
    };
    return labels[ruleType] || ruleType;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Cumplimiento SAT
              </h1>
              <p className="text-sm text-gray-600">
                Monitoreo inteligente de cumplimiento fiscal
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sugerencias</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Errores</p>
                <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.warnings}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Información</p>
                <p className="text-2xl font-bold text-blue-700">{stats.info}</p>
              </div>
              <InformationCircleIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sugerencias
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reglas Activas
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'log'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial de Ejecución
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sugerencias de Cumplimiento
                </h3>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Mostrar resueltas</span>
                </label>
              </div>

              {suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p className="text-gray-500">
                    {showResolved 
                      ? 'No hay sugerencias resueltas' 
                      : '¡Excelente! No hay sugerencias pendientes'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`border rounded-lg p-4 ${getSeverityColor(suggestion.severity)}`}
                    >
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(suggestion.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                              {suggestion.suggestion_type}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{suggestion.description}</p>
                          {suggestion.suggested_action && (
                            <p className="text-xs italic">
                              💡 {suggestion.suggested_action}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>{formatDate(suggestion.created_at)}</span>
                            </span>
                            {suggestion.entity_type && (
                              <span>
                                {suggestion.entity_type} #{suggestion.entity_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reglas de Cumplimiento Activas
              </h3>

              {rules.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay reglas activas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {rule.rule_name}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(rule.severity)}`}>
                              {rule.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <ChartBarIcon className="h-3 w-3" />
                              <span>Prioridad: {rule.priority}</span>
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {getRuleTypeLabel(rule.rule_type)}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {rule.applies_to === 'all' ? 'Todos' : rule.applies_to}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Execution Log Tab */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historial de Ejecución de Reglas
              </h3>

              {executionLog.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay registros de ejecución</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Regla
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {executionLog.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(log.executed_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {log.rule_name || `Regla #${log.rule_id}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                              {getRuleTypeLabel(log.rule_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.entity_type} #{log.entity_id}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {log.rule_matched ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircleIcon className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={log.rule_matched ? 'text-green-600' : 'text-gray-500'}>
                                {log.rule_matched ? 'Coincide' : 'No coincide'}
                              </span>
                              {log.actions_applied && (
                                <span className="text-xs text-blue-600">(Aplicado)</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
