import { useState, useEffect } from 'react';
import { fetchReconciliationData } from '../utils/api';
import { formatCurrency } from '../utils/calculations';
import { showError } from '../utils/notifications';

export default function SATReconciliation() {
  const [loading, setLoading] = useState(false);
  const [reconciliation, setReconciliation] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [expandedSections, setExpandedSections] = useState({});

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadReconciliation();
  }, [selectedYear, selectedMonth]);

  const loadReconciliation = async () => {
    try {
      setLoading(true);
      const data = await fetchReconciliationData(selectedYear, selectedMonth);
      setReconciliation(data);
    } catch (error) {
      console.error('Failed to load reconciliation:', error);
      showError('Error al cargar datos de conciliación');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-300 dark:border-red-700'
      },
      warning: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        border: 'border-yellow-300 dark:border-yellow-700'
      },
      minor: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-300 dark:border-blue-700'
      },
      none: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        border: 'border-green-300 dark:border-green-700'
      }
    };

    return colors[severity] || colors.none;
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplianceRing = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderComparisonField = (fieldName, appValue, satValue, comparison) => {
    const severity = comparison?.severity || 'none';
    const colors = getSeverityColor(severity);
    const hasDiscrepancy = comparison?.status === 'mismatch';

    return (
      <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {fieldName}
          </h4>
          {hasDiscrepancy && (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              {severity === 'critical' ? 'Crítico' : severity === 'warning' ? 'Advertencia' : 'Menor'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Sistema
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(appValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              SAT Declarado
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(satValue)}
            </div>
          </div>
        </div>

        {hasDiscrepancy && (
          <div className="space-y-2 pt-3 border-t border-gray-300 dark:border-slate-600">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Diferencia:</span>
              <span className={`font-semibold ${comparison.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(comparison.difference))}
                {comparison.difference >= 0 ? ' ↑' : ' ↓'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Porcentaje:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {comparison.percentageDiff.toFixed(2)}%
              </span>
            </div>
            {comparison.suggestion && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-2 rounded">
                💡 {comparison.suggestion}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Conciliación SAT
        </h2>
        <button
          onClick={loadReconciliation}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando conciliación...</p>
          </div>
        </div>
      ) : reconciliation ? (
        <div className="space-y-6">
          {/* Compliance Score */}
          {reconciliation.complianceScore !== undefined && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Puntuación de Cumplimiento
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basado en la comparación de tus datos con el SAT
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Compliance Ring */}
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200 dark:text-slate-700"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - reconciliation.complianceScore / 100)}`}
                        className={getComplianceRing(reconciliation.complianceScore)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getComplianceColor(reconciliation.complianceScore)}`}>
                        {reconciliation.complianceScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discrepancy Summary */}
              {reconciliation.comparison && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Discrepancias</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {reconciliation.comparison.totalDiscrepancies || 0}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Críticas</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {reconciliation.comparison.criticalDiscrepancies || 0}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    reconciliation.comparison.overallStatus === 'match'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : reconciliation.comparison.overallStatus === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Estado</div>
                    <div className={`text-xl font-bold ${
                      reconciliation.comparison.overallStatus === 'match'
                        ? 'text-green-600 dark:text-green-400'
                        : reconciliation.comparison.overallStatus === 'critical'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {reconciliation.comparison.overallStatus === 'match'
                        ? '✓ Correcto'
                        : reconciliation.comparison.overallStatus === 'critical'
                        ? '✗ Crítico'
                        : '⚠ Advertencia'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison Details */}
          {reconciliation.comparison ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Comparación Detallada
              </h3>

              <div className="space-y-4">
                {/* Income */}
                {renderComparisonField(
                  'Ingresos',
                  reconciliation.appData?.businessIncome || 0,
                  reconciliation.satDeclaration?.declared_income || 0,
                  reconciliation.comparison.income
                )}

                {/* Expenses */}
                {renderComparisonField(
                  'Gastos Deducibles',
                  reconciliation.appData?.deductibleExpenses || 0,
                  reconciliation.satDeclaration?.declared_expenses || 0,
                  reconciliation.comparison.expenses
                )}

                {/* ISR */}
                {renderComparisonField(
                  'ISR',
                  reconciliation.appData?.isr || 0,
                  reconciliation.satDeclaration?.declared_isr || 0,
                  reconciliation.comparison.isr
                )}

                {/* IVA */}
                {renderComparisonField(
                  'IVA',
                  reconciliation.appData?.iva || 0,
                  reconciliation.satDeclaration?.declared_iva || 0,
                  reconciliation.comparison.iva
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-12">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No hay declaración SAT registrada para este período
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Agrega una declaración para ver la comparación
                </p>
              </div>
            </div>
          )}

          {/* System Data Only */}
          {reconciliation.appData && !reconciliation.satDeclaration && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Datos del Sistema
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(reconciliation.appData.businessIncome || 0)}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gastos Deducibles</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(reconciliation.appData.deductibleExpenses || 0)}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ISR</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {formatCurrency(reconciliation.appData.isr || 0)}
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">IVA</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {formatCurrency(reconciliation.appData.iva || 0)}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Estos son los datos calculados en tu sistema. Agrega tu declaración SAT para comparar.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-12">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No hay datos disponibles para este período
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
