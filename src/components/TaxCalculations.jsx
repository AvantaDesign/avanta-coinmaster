// Tax Calculations Component
// Comprehensive tax calculation interface for ISR and IVA

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function TaxCalculations() {
  // State management
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Period selection
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  // View mode
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'annual'
  
  // Report data
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [annualReport, setAnnualReport] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('calculate'); // 'calculate', 'history', 'reports'

  // Load calculations for selected period
  useEffect(() => {
    if (activeTab === 'history') {
      loadCalculations();
    }
  }, [selectedYear, selectedMonth, activeTab]);

  // Load monthly report when in reports tab
  useEffect(() => {
    if (activeTab === 'reports' && viewMode === 'monthly') {
      loadMonthlyReport();
      loadDeclaration();
    } else if (activeTab === 'reports' && viewMode === 'annual') {
      loadAnnualReport();
    }
  }, [activeTab, viewMode, selectedYear, selectedMonth]);

  const loadCalculations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/tax-calculations?year=${selectedYear}&month=${selectedMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to load calculations');
      
      const data = await response.json();
      setCalculations(data.calculations || []);
    } catch (err) {
      console.error('Error loading calculations:', err);
      setError('Error al cargar cálculos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/tax-reports/monthly/${selectedYear}/${selectedMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to load report');
      
      const data = await response.json();
      setMonthlyReport(data.report || null);
    } catch (err) {
      console.error('Error loading monthly report:', err);
      setError('Error al cargar reporte mensual: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/tax-reports/annual/${selectedYear}`
      );
      
      if (!response.ok) throw new Error('Failed to load report');
      
      const data = await response.json();
      setAnnualReport(data.report || null);
    } catch (err) {
      console.error('Error loading annual report:', err);
      setError('Error al cargar reporte anual: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDeclaration = async () => {
    try {
      const response = await authFetch(
        `${API_BASE}/tax-reports/declaration/${selectedYear}/${selectedMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to load declaration');
      
      const data = await response.json();
      setDeclaration(data.declaration || null);
    } catch (err) {
      console.error('Error loading declaration:', err);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(`${API_BASE}/tax-calculations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          calculation_type: 'both'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to calculate taxes');
      }

      const data = await response.json();
      setSuccess(`Cálculos realizados exitosamente para ${getMonthName(selectedMonth)} ${selectedYear}`);
      
      // Reload data
      loadCalculations();
      loadMonthlyReport();
      loadDeclaration();
    } catch (err) {
      console.error('Error calculating taxes:', err);
      setError('Error al calcular impuestos: ' + err.message);
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const getMonthName = (month) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  };

  const getStatusBadge = (status) => {
    const badges = {
      calculated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    const labels = {
      calculated: 'Calculado',
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Vencido'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || badges.calculated}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getCalculationTypeName = (type) => {
    const types = {
      monthly_provisional_isr: 'ISR Provisional Mensual',
      definitive_iva: 'IVA Definitivo',
      annual_isr: 'ISR Anual'
    };
    return types[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cálculos Fiscales
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Calcula y gestiona tus impuestos mensuales (ISR e IVA) con transparencia total
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calculate')}
            className={`${
              activeTab === 'calculate'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Calcular
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Reportes
          </button>
        </nav>
      </div>

      {/* Period Selector */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Seleccionar Período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[...Array(5)].map((_, i) => {
                const year = currentYear - 2 + i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>
          {activeTab === 'reports' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vista
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="monthly">Mensual</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Calculate Tab */}
      {activeTab === 'calculate' && (
        <div className="space-y-6">
          {/* Calculation Action */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Calcular Impuestos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Calcula el ISR provisional e IVA definitivo para {getMonthName(selectedMonth)} {selectedYear}
            </p>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? 'Calculando...' : 'Calcular Impuestos'}
            </button>
          </div>

          {/* Quick Summary */}
          {declaration && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ISR Summary */}
              {declaration.isr && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    ISR Provisional
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos Acumulados</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(declaration.isr.accumulatedIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Deducciones Acumuladas</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(declaration.isr.accumulatedDeductions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Base Gravable</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(declaration.isr.taxableIncome)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">ISR a Pagar</span>
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(declaration.isr.isrToPay)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IVA Summary */}
              {declaration.iva && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    IVA Definitivo
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">IVA Cobrado</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(declaration.iva.ivaCollected)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">IVA Pagado</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(declaration.iva.ivaPaid)}
                      </span>
                    </div>
                    {declaration.iva.previousBalance !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Anterior</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(declaration.iva.previousBalance)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {declaration.iva.ivaToPay > 0 ? 'IVA a Pagar' : 'IVA a Favor'}
                        </span>
                        <span className={`text-lg font-bold ${
                          declaration.iva.ivaToPay > 0 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(declaration.iva.ivaToPay > 0 ? declaration.iva.ivaToPay : Math.abs(declaration.iva.ivaInFavor))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Historial de Cálculos - {getMonthName(selectedMonth)} {selectedYear}
            </h3>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
              </div>
            ) : calculations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay cálculos para este período
                </p>
                <button
                  onClick={() => setActiveTab('calculate')}
                  className="mt-4 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Calcular ahora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {calculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {getCalculationTypeName(calc.calculation_type)}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(calc.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                      {getStatusBadge(calc.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {calc.calculation_type === 'monthly_provisional_isr' ? (
                        <>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Ingresos</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(calc.accumulated_income)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Deducciones</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(calc.accumulated_deductions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ISR Calculado</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(calc.isr_calculated)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ISR a Pagar</p>
                            <p className="font-bold text-primary-600 dark:text-primary-400">
                              {formatCurrency(calc.isr_balance)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">IVA Cobrado</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(calc.iva_collected)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">IVA Pagado</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(calc.iva_paid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Balance</p>
                            <p className={`font-bold ${
                              calc.iva_balance > 0 
                                ? 'text-primary-600 dark:text-primary-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {formatCurrency(calc.iva_balance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">A Pagar</p>
                            <p className="font-bold text-primary-600 dark:text-primary-400">
                              {formatCurrency(Math.max(0, calc.iva_balance))}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {viewMode === 'monthly' && monthlyReport && (
            <>
              {/* Monthly Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen Mensual - {monthlyReport.period.monthName} {monthlyReport.period.year}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(monthlyReport.summary.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gastos Deducibles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(monthlyReport.summary.deductibleExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Base Gravable</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(monthlyReport.summary.taxableBase)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Declaration Summary */}
              {declaration && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Declaración del Período
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Fecha Límite de Pago
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {new Date(declaration.paymentDeadline).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Total de Impuestos a Pagar
                      </span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatCurrency(declaration.totalTaxes)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === 'annual' && annualReport && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumen Anual - {annualReport.year}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Anuales</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(annualReport.summary.annual_income)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deducciones Anuales</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(annualReport.summary.annual_deductions)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ISR Anual</p>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(annualReport.summary.annual_isr)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meses Calculados</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {annualReport.summary.months_calculated} / 12
                  </p>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Desglose Mensual
                </h4>
                <div className="space-y-2">
                  {annualReport.monthlyBreakdown.map((month) => (
                    <div
                      key={month.period}
                      className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getMonthName(month.period_month)} {month.period_year}
                      </span>
                      <div className="flex space-x-6 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">ISR: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(month.isr_due)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">IVA: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Math.max(0, month.iva_balance))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
