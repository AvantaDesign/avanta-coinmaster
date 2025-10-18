// Annual Declarations Component
// Comprehensive annual tax declaration interface for ISR and IVA

import { useState, useEffect } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function AnnualDeclarations() {
  // State management
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Period selection
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1); // Previous year for annual declaration
  
  // Summary data
  const [annualSummary, setAnnualSummary] = useState(null);
  
  // Personal deductions
  const [personalDeductions, setPersonalDeductions] = useState([]);
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'history', 'details'
  
  // Selected declaration for details
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);

  // Load declarations on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadDeclarations();
    }
  }, [activeTab]);

  // Load annual summary when in generate tab
  useEffect(() => {
    if (activeTab === 'generate') {
      loadAnnualSummary();
    }
  }, [activeTab, selectedYear]);

  const loadDeclarations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/annual-declarations`);
      
      if (!response.ok) throw new Error('Failed to load declarations');
      
      const data = await response.json();
      setDeclarations(data.declarations || []);
    } catch (err) {
      console.error('Error loading declarations:', err);
      setError('Error al cargar declaraciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnualSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        `${API_BASE}/annual-declarations/summary/${selectedYear}`
      );
      
      if (!response.ok) throw new Error('Failed to load summary');
      
      const data = await response.json();
      setAnnualSummary(data);
    } catch (err) {
      console.error('Error loading annual summary:', err);
      setError('Error al cargar resumen anual: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDeclaration = async (type) => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(`${API_BASE}/annual-declarations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscal_year: selectedYear,
          declaration_type: type,
          personal_deductions: personalDeductions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate declaration');
      }
      
      const data = await response.json();
      setSuccess('Declaración generada exitosamente');
      
      // Reload summary to show the new declaration
      await loadAnnualSummary();
      
      // Switch to details view
      setSelectedDeclaration(data.declaration);
      setActiveTab('details');
      
    } catch (err) {
      console.error('Error generating declaration:', err);
      setError('Error al generar declaración: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const submitDeclaration = async (id) => {
    if (!confirm('¿Estás seguro de que deseas enviar esta declaración?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(
        `${API_BASE}/annual-declarations/submit/${id}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to submit declaration');
      
      setSuccess('Declaración enviada exitosamente');
      await loadDeclarations();
      await loadAnnualSummary();
    } catch (err) {
      console.error('Error submitting declaration:', err);
      setError('Error al enviar declaración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDeclaration = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta declaración?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch(`${API_BASE}/annual-declarations/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete declaration');
      
      setSuccess('Declaración eliminada exitosamente');
      await loadDeclarations();
      await loadAnnualSummary();
    } catch (err) {
      console.error('Error deleting declaration:', err);
      setError('Error al eliminar declaración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPersonalDeduction = () => {
    setPersonalDeductions([
      ...personalDeductions,
      { type: '', description: '', amount: 0 }
    ]);
  };

  const updatePersonalDeduction = (index, field, value) => {
    const updated = [...personalDeductions];
    updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setPersonalDeductions(updated);
  };

  const removePersonalDeduction = (index) => {
    setPersonalDeductions(personalDeductions.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      calculated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    const labels = {
      draft: 'Borrador',
      calculated: 'Calculado',
      submitted: 'Enviado',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      error: 'Error'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || badges.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const deductionTypes = [
    { value: 'medical', label: 'Gastos Médicos' },
    { value: 'education', label: 'Colegiaturas' },
    { value: 'mortgage', label: 'Intereses Hipotecarios' },
    { value: 'retirement', label: 'Aportaciones Voluntarias al Retiro' },
    { value: 'funeral', label: 'Gastos Funerarios' },
    { value: 'donations', label: 'Donativos' },
    { value: 'insurance', label: 'Primas de Seguros' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Declaración Anual
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Genera y gestiona tus declaraciones anuales de ISR e IVA
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

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'generate'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Generar Declaración
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Historial
            </button>
            {selectedDeclaration && (
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Detalles
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Year Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ejercicio Fiscal
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
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

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              )}

              {/* Annual Summary */}
              {!loading && annualSummary && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Ingresos Totales
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(annualSummary.isr?.totalIncome)}
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        Gastos Deducibles
                      </div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(annualSummary.isr?.deductibleExpenses)}
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                        Base Gravable
                      </div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(annualSummary.isr?.taxableIncome)}
                      </div>
                    </div>
                  </div>

                  {/* ISR Calculation */}
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Cálculo de ISR Anual
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">ISR Calculado:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualSummary.isr?.isrCalculated)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">ISR Pagado (Provisional):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualSummary.isr?.isrPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Retenciones ISR:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualSummary.isr?.isrRetention)}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-slate-600 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-900 dark:text-white">Saldo a Favor/Cargo:</span>
                          <span className={annualSummary.isr?.isrBalance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(annualSummary.isr?.isrBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IVA Calculation */}
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Cálculo de IVA Anual
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">IVA Cobrado:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualSummary.iva?.ivaCollected)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">IVA Pagado:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(annualSummary.iva?.ivaPaid)}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-slate-600 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-900 dark:text-white">Saldo a Favor/Cargo:</span>
                          <span className={annualSummary.iva?.ivaBalance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(annualSummary.iva?.ivaBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal Deductions */}
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Deducciones Personales
                      </h3>
                      <button
                        onClick={addPersonalDeduction}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        + Agregar Deducción
                      </button>
                    </div>

                    {personalDeductions.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No has agregado deducciones personales. Las deducciones personales pueden reducir tu ISR anual.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {personalDeductions.map((deduction, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <select
                              value={deduction.type}
                              onChange={(e) => updatePersonalDeduction(index, 'type', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white text-sm"
                            >
                              <option value="">Selecciona tipo</option>
                              {deductionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Descripción"
                              value={deduction.description}
                              onChange={(e) => updatePersonalDeduction(index, 'description', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Monto"
                              value={deduction.amount || ''}
                              onChange={(e) => updatePersonalDeduction(index, 'amount', e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white text-sm"
                            />
                            <button
                              onClick={() => removePersonalDeduction(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <div className="border-t border-gray-300 dark:border-slate-600 pt-3 mt-3">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-900 dark:text-white">Total Deducciones Personales:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatCurrency(personalDeductions.reduce((sum, d) => sum + (d.amount || 0), 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generate Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => generateDeclaration('isr_annual')}
                      disabled={generating}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {generating ? 'Generando...' : 'Generar Declaración ISR Anual'}
                    </button>
                    <button
                      onClick={() => generateDeclaration('combined')}
                      disabled={generating}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {generating ? 'Generando...' : 'Generar Declaración Combinada (ISR + IVA)'}
                    </button>
                  </div>

                  {/* Existing Declaration Notice */}
                  {annualSummary.existingDeclaration && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Ya existe una declaración para este ejercicio
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <p>
                              Estado: {getStatusBadge(annualSummary.existingDeclaration.status)}
                              <span className="ml-2">
                                Creada: {formatDate(annualSummary.existingDeclaration.created_at)}
                              </span>
                            </p>
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
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : declarations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay declaraciones anuales registradas
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ejercicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ISR Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IVA Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {declarations.map((declaration) => (
                        <tr key={declaration.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {declaration.fiscal_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {declaration.declaration_type === 'isr_annual' ? 'ISR Anual' :
                             declaration.declaration_type === 'iva_annual' ? 'IVA Anual' : 'Combinada'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(declaration.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(declaration.isr_balance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(declaration.iva_balance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(declaration.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedDeclaration(declaration);
                                  setActiveTab('details');
                                }}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                Ver
                              </button>
                              {declaration.status === 'calculated' && (
                                <button
                                  onClick={() => submitDeclaration(declaration.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Enviar
                                </button>
                              )}
                              {(declaration.status === 'draft' || declaration.status === 'calculated') && (
                                <button
                                  onClick={() => deleteDeclaration(declaration.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Eliminar
                                </button>
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

          {/* Details Tab */}
          {activeTab === 'details' && selectedDeclaration && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Declaración Anual {selectedDeclaration.fiscal_year}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedDeclaration.declaration_type === 'isr_annual' ? 'ISR Anual' :
                     selectedDeclaration.declaration_type === 'iva_annual' ? 'IVA Anual' : 'Combinada (ISR + IVA)'}
                  </p>
                </div>
                {getStatusBadge(selectedDeclaration.status)}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                    Ingresos Totales
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(selectedDeclaration.total_income)}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                    Gastos Deducibles
                  </div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(selectedDeclaration.deductible_expenses)}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                    Base Gravable
                  </div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(selectedDeclaration.taxable_income)}
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                    Deducciones Personales
                  </div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                    {formatCurrency(selectedDeclaration.personal_deductions)}
                  </div>
                </div>
              </div>

              {/* ISR Details */}
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detalle ISR
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ISR Calculado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.isr_calculated)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ISR Pagado (Provisional):</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.isr_paid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Retenciones Aplicadas:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.isr_retention_applied)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-slate-600 pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-gray-900 dark:text-white">Saldo a Favor/Cargo:</span>
                      <span className={selectedDeclaration.isr_balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(selectedDeclaration.isr_balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IVA Details */}
              <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Detalle IVA
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">IVA Cobrado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.iva_collected)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">IVA Pagado:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.iva_paid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">IVA Acreditable:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDeclaration.iva_accreditable)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-slate-600 pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-gray-900 dark:text-white">Saldo a Favor/Cargo:</span>
                      <span className={selectedDeclaration.iva_balance < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(selectedDeclaration.iva_balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Info */}
              {selectedDeclaration.submission_date && (
                <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información de Envío
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fecha de Envío:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(selectedDeclaration.submission_date)}
                      </span>
                    </div>
                    {selectedDeclaration.sat_response && (
                      <div className="mt-4">
                        <span className="text-gray-600 dark:text-gray-400 block mb-2">Respuesta SAT:</span>
                        <pre className="bg-gray-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">
                          {typeof selectedDeclaration.sat_response === 'string' 
                            ? selectedDeclaration.sat_response 
                            : JSON.stringify(JSON.parse(selectedDeclaration.sat_response), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                {selectedDeclaration.status === 'calculated' && (
                  <button
                    onClick={() => submitDeclaration(selectedDeclaration.id)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Enviar Declaración
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedDeclaration(null);
                    setActiveTab('history');
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Volver al Historial
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
