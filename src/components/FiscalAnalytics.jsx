// Fiscal Analytics Component
// Comprehensive fiscal analytics dashboard with trends, compliance, and optimization

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function FiscalAnalytics() {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Period selection
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  // Analytics data
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [annualSummary, setAnnualSummary] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [fiscalTrends, setFiscalTrends] = useState(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'compliance', 'optimization'

  // Load data when tab or period changes
  useEffect(() => {
    if (activeTab === 'overview') {
      loadMonthlySummary();
      loadAnnualSummary();
    } else if (activeTab === 'trends') {
      loadFiscalTrends();
    } else if (activeTab === 'compliance') {
      loadComplianceStatus();
    } else if (activeTab === 'optimization') {
      loadOptimizationSuggestions();
    }
  }, [activeTab, selectedYear, selectedMonth]);

  const loadMonthlySummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/fiscal-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analytics_type: 'monthly_summary',
          period_year: selectedYear,
          period_month: selectedMonth
        })
      });
      
      if (!response.ok) throw new Error('Failed to load monthly summary');
      
      const data = await response.json();
      setMonthlySummary(data.data);
    } catch (err) {
      console.error('Error loading monthly summary:', err);
      setError('Error al cargar resumen mensual: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualSummary = async () => {
    try {
      const response = await authFetch(`${API_BASE}/fiscal-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analytics_type: 'annual_summary',
          period_year: selectedYear
        })
      });
      
      if (!response.ok) throw new Error('Failed to load annual summary');
      
      const data = await response.json();
      setAnnualSummary(data.data);
    } catch (err) {
      console.error('Error loading annual summary:', err);
    }
  };

  const loadComplianceStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/fiscal-analytics/compliance/${selectedYear}?month=${selectedMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to load compliance status');
      
      const data = await response.json();
      setComplianceStatus(data.compliance);
    } catch (err) {
      console.error('Error loading compliance status:', err);
      setError('Error al cargar estado de cumplimiento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFiscalTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/fiscal-analytics/trends/${selectedYear}`
      );
      
      if (!response.ok) throw new Error('Failed to load fiscal trends');
      
      const data = await response.json();
      setFiscalTrends(data.trends);
    } catch (err) {
      console.error('Error loading fiscal trends:', err);
      setError('Error al cargar tendencias fiscales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptimizationSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/fiscal-analytics/optimization/${selectedYear}`
      );
      
      if (!response.ok) throw new Error('Failed to load optimization suggestions');
      
      const data = await response.json();
      setOptimizationSuggestions(data.optimization);
    } catch (err) {
      console.error('Error loading optimization suggestions:', err);
      setError('Error al cargar sugerencias de optimización: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getComplianceColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getComplianceBackground = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };

    const labels = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[severity] || badges.low}`}>
        {labels[severity] || severity}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };

    const labels = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[priority] || badges.low}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Fiscales
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análisis integral de tu situación fiscal con tendencias, cumplimiento y optimización
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            >
              {[...Array(5)].map((_, i) => {
                const year = currentYear - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {activeTab === 'overview' || activeTab === 'compliance' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Resumen General
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Tendencias Fiscales
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'compliance'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Estado de Cumplimiento
            </button>
            <button
              onClick={() => setActiveTab('optimization')}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'optimization'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Optimización Fiscal
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          )}

          {/* Overview Tab */}
          {!loading && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly Summary */}
              {monthlySummary && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Resumen Mensual - {monthNames[selectedMonth - 1]} {selectedYear}
                    </h2>
                    
                    {/* Transaction Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Ingresos
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {formatCurrency(monthlySummary.transactions?.income)}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {monthlySummary.transactions?.total || 0} transacciones
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                          Gastos
                        </div>
                        <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {formatCurrency(monthlySummary.transactions?.expenses)}
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border ${
                        monthlySummary.transactions?.net >= 0
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className={`text-sm font-medium mb-1 ${
                          monthlySummary.transactions?.net >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Balance Neto
                        </div>
                        <div className={`text-2xl font-bold ${
                          monthlySummary.transactions?.net >= 0
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}>
                          {formatCurrency(monthlySummary.transactions?.net)}
                        </div>
                      </div>
                    </div>

                    {/* Deductibility Stats */}
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Deducibilidad
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Deducible ISR:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(monthlySummary.deductibility?.isrDeductible)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Deducible IVA:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(monthlySummary.deductibility?.ivaDeductible)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Cumplimiento CFDI:
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${monthlySummary.deductibility?.cfdiCompliance?.percentage || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPercentage(monthlySummary.deductibility?.cfdiCompliance?.percentage)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {monthlySummary.deductibility?.cfdiCompliance?.withCFDI || 0} con CFDI, {' '}
                            {monthlySummary.deductibility?.cfdiCompliance?.withoutCFDI || 0} sin CFDI
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tax Summary */}
                    {monthlySummary.taxes && (
                      <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Impuestos del Mes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ISR</div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Calculado:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatCurrency(monthlySummary.taxes.isr?.calculated)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Pagado:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatCurrency(monthlySummary.taxes.isr?.paid)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-gray-900 dark:text-white">Balance:</span>
                                <span className={monthlySummary.taxes.isr?.balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {formatCurrency(monthlySummary.taxes.isr?.balance)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IVA</div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Cobrado:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatCurrency(monthlySummary.taxes.iva?.collected)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Pagado:</span>
                                <span className="text-gray-900 dark:text-white">
                                  {formatCurrency(monthlySummary.taxes.iva?.paid)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-gray-900 dark:text-white">Balance:</span>
                                <span className={monthlySummary.taxes.iva?.balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {formatCurrency(monthlySummary.taxes.iva?.balance)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Compliance Score */}
                    <div className={`p-4 rounded-lg border ${getComplianceBackground(monthlySummary.compliance?.score)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Puntuación de Cumplimiento
                        </h3>
                        <span className={`text-3xl font-bold ${getComplianceColor(monthlySummary.compliance?.score)}`}>
                          {monthlySummary.compliance?.score || 0}/100
                        </span>
                      </div>
                      {monthlySummary.compliance?.issues && monthlySummary.compliance.issues.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Problemas Detectados:
                          </div>
                          {monthlySummary.compliance.issues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-red-500">•</span>
                              <span className="text-gray-700 dark:text-gray-300">{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Annual Summary */}
              {annualSummary && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Resumen Anual {selectedYear}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total Transacciones
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {annualSummary.summary?.totalTransactions || 0}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                        Ingresos Totales
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(annualSummary.summary?.totalIncome)}
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-1">
                        Gastos Totales
                      </div>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(annualSummary.summary?.totalExpenses)}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      annualSummary.summary?.netIncome >= 0
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className={`text-sm mb-1 ${
                        annualSummary.summary?.netIncome >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        Ingresos Netos
                      </div>
                      <div className={`text-2xl font-bold ${
                        annualSummary.summary?.netIncome >= 0
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {formatCurrency(annualSummary.summary?.netIncome)}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Breakdown Chart */}
                  {annualSummary.monthlyBreakdown && annualSummary.monthlyBreakdown.length > 0 && (
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Desglose Mensual
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-300 dark:border-slate-600">
                              <th className="text-left py-2 text-gray-700 dark:text-gray-300">Mes</th>
                              <th className="text-right py-2 text-gray-700 dark:text-gray-300">Ingresos</th>
                              <th className="text-right py-2 text-gray-700 dark:text-gray-300">Gastos</th>
                              <th className="text-right py-2 text-gray-700 dark:text-gray-300">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {annualSummary.monthlyBreakdown.map((month) => {
                              const balance = month.income - month.expenses;
                              return (
                                <tr key={month.month} className="border-b border-gray-200 dark:border-slate-700">
                                  <td className="py-2 text-gray-900 dark:text-white">
                                    {monthNames[parseInt(month.month) - 1]}
                                  </td>
                                  <td className="text-right text-blue-600 dark:text-blue-400">
                                    {formatCurrency(month.income)}
                                  </td>
                                  <td className="text-right text-red-600 dark:text-red-400">
                                    {formatCurrency(month.expenses)}
                                  </td>
                                  <td className={`text-right font-semibold ${
                                    balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {formatCurrency(balance)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {!loading && activeTab === 'trends' && fiscalTrends && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tendencias Fiscales {selectedYear}
              </h2>

              {/* Averages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    Promedio Mensual - Ingresos
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(fiscalTrends.averages?.income)}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                    Promedio Mensual - Gastos
                  </div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(fiscalTrends.averages?.expenses)}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                    Promedio Mensual - ISR
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(fiscalTrends.averages?.isr)}
                  </div>
                </div>
              </div>

              {/* Projections */}
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Proyecciones Anuales (Basado en Promedio)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ingresos Proyectados:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(fiscalTrends.projections?.annualIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gastos Proyectados:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(fiscalTrends.projections?.annualExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ISR Proyectado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(fiscalTrends.projections?.annualISR)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Growth Rates */}
              {fiscalTrends.growthRates && fiscalTrends.growthRates.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tasas de Crecimiento Mensual
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-slate-600">
                          <th className="text-left py-2 text-gray-700 dark:text-gray-300">Mes</th>
                          <th className="text-right py-2 text-gray-700 dark:text-gray-300">Crecimiento Ingresos</th>
                          <th className="text-right py-2 text-gray-700 dark:text-gray-300">Crecimiento Gastos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fiscalTrends.growthRates.map((rate) => (
                          <tr key={rate.month} className="border-b border-gray-200 dark:border-slate-700">
                            <td className="py-2 text-gray-900 dark:text-white">
                              {monthNames[rate.month - 1]}
                            </td>
                            <td className={`text-right font-semibold ${
                              rate.incomeGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {rate.incomeGrowth >= 0 ? '+' : ''}{formatPercentage(rate.incomeGrowth)}
                            </td>
                            <td className={`text-right font-semibold ${
                              rate.expenseGrowth <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {rate.expenseGrowth >= 0 ? '+' : ''}{formatPercentage(rate.expenseGrowth)}
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

          {/* Compliance Tab */}
          {!loading && activeTab === 'compliance' && complianceStatus && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Estado de Cumplimiento - {monthNames[selectedMonth - 1]} {selectedYear}
              </h2>

              {/* Compliance Score Card */}
              <div className={`p-6 rounded-lg border ${getComplianceBackground(complianceStatus.complianceScore)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Puntuación de Cumplimiento
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Estado: <span className="font-semibold capitalize">{complianceStatus.status === 'good' ? 'Bueno' : complianceStatus.status === 'warning' ? 'Advertencia' : 'Crítico'}</span>
                    </p>
                  </div>
                  <div className={`text-6xl font-bold ${getComplianceColor(complianceStatus.complianceScore)}`}>
                    {complianceStatus.complianceScore}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    CFDIs Faltantes
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {complianceStatus.summary?.missingCFDIs || 0}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Impuestos Pendientes
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {complianceStatus.summary?.unpaidTaxes || 0}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Transacciones Sin Conciliar
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {complianceStatus.summary?.unreconciledTransactions || 0}
                  </div>
                </div>
              </div>

              {/* Issues */}
              {complianceStatus.issues && complianceStatus.issues.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Problemas Detectados
                  </h3>
                  <div className="space-y-4">
                    {complianceStatus.issues.map((issue, index) => (
                      <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(issue.severity)}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {issue.message}
                            </span>
                          </div>
                        </div>
                        {issue.recommendation && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Recomendación:</span> {issue.recommendation}
                          </div>
                        )}
                        {issue.count && (
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Cantidad: {issue.count}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complianceStatus.issues && complianceStatus.issues.length === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <div className="text-green-600 dark:text-green-400 text-5xl mb-3">✓</div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                    ¡Excelente Cumplimiento!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    No se detectaron problemas de cumplimiento para este periodo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optimization Tab */}
          {!loading && activeTab === 'optimization' && optimizationSuggestions && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Sugerencias de Optimización Fiscal {selectedYear}
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    Total Sugerencias
                  </div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {optimizationSuggestions.summary?.totalSuggestions || 0}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">
                    Prioridad Alta
                  </div>
                  <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {optimizationSuggestions.summary?.highPriority || 0}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                    Ahorro Potencial
                  </div>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(optimizationSuggestions.summary?.potentialTotalSavings)}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {optimizationSuggestions.suggestions && optimizationSuggestions.suggestions.length > 0 ? (
                <div className="space-y-4">
                  {optimizationSuggestions.suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {suggestion.title}
                          </h3>
                          {getPriorityBadge(suggestion.priority)}
                        </div>
                        {suggestion.potentialSavings > 0 && (
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Ahorro Potencial</div>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(suggestion.potentialSavings)}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {suggestion.description}
                      </p>
                      <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Acción Recomendada:
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.action}
                        </div>
                        {suggestion.recommendedMonthlyPayment && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Pago mensual sugerido:</span>
                            <span className="ml-2 text-primary-600 dark:text-primary-400 font-semibold">
                              {formatCurrency(suggestion.recommendedMonthlyPayment)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay sugerencias de optimización disponibles en este momento
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
