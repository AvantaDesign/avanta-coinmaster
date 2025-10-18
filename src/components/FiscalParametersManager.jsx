import { useState, useEffect } from 'react';
import { fetchFiscalParameters, createFiscalParameter, updateFiscalParameter, deleteFiscalParameter } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import { showSuccess, showError } from '../utils/notifications';

export default function FiscalParametersManager() {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParameter, setEditingParameter] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'

  const [formData, setFormData] = useState({
    parameter_type: 'isr_bracket',
    value: '',
    effective_from: '',
    effective_until: '',
    period_type: 'annual',
    description: ''
  });

  const parameterTypes = [
    { value: 'isr_bracket', label: 'Tabla ISR', format: 'json' },
    { value: 'iva_rate', label: 'Tasa IVA', format: 'number' },
    { value: 'iva_retention', label: 'Retención IVA', format: 'number' },
    { value: 'diot_threshold', label: 'Umbral DIOT', format: 'number' },
    { value: 'uma', label: 'UMA', format: 'number' },
    { value: 'minimum_wage', label: 'Salario Mínimo', format: 'number' }
  ];

  const periodTypes = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'annual', label: 'Anual' },
    { value: 'permanent', label: 'Permanente' }
  ];

  useEffect(() => {
    loadParameters();
  }, [typeFilter]);

  const loadParameters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      const data = await fetchFiscalParameters(params);
      setParameters(data || []);
    } catch (error) {
      console.error('Failed to load parameters:', error);
      showError('Error al cargar parámetros fiscales');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate JSON for ISR brackets
      if (formData.parameter_type === 'isr_bracket') {
        try {
          JSON.parse(formData.value);
        } catch (error) {
          showError('Formato JSON inválido para tabla ISR');
          return;
        }
      }

      const data = { ...formData };

      if (editingParameter) {
        await updateFiscalParameter(editingParameter.id, data);
        showSuccess('Parámetro actualizado exitosamente');
      } else {
        await createFiscalParameter(data);
        showSuccess('Parámetro creado exitosamente');
      }

      setShowModal(false);
      resetForm();
      loadParameters();
    } catch (error) {
      console.error('Failed to save parameter:', error);
      showError('Error al guardar parámetro');
    }
  };

  const handleEdit = (parameter) => {
    setEditingParameter(parameter);
    setFormData({
      parameter_type: parameter.parameter_type,
      value: parameter.value,
      effective_from: parameter.effective_from,
      effective_until: parameter.effective_until || '',
      period_type: parameter.period_type,
      description: parameter.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (parameter) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este parámetro?')) return;

    try {
      await deleteFiscalParameter(parameter.id);
      showSuccess('Parámetro eliminado exitosamente');
      loadParameters();
    } catch (error) {
      console.error('Failed to delete parameter:', error);
      showError('Error al eliminar parámetro');
    }
  };

  const resetForm = () => {
    setFormData({
      parameter_type: 'isr_bracket',
      value: '',
      effective_from: '',
      effective_until: '',
      period_type: 'annual',
      description: ''
    });
    setEditingParameter(null);
  };

  const formatValue = (parameter) => {
    const type = parameterTypes.find(t => t.value === parameter.parameter_type);
    
    if (type?.format === 'json') {
      try {
        const json = JSON.parse(parameter.value);
        return `${json.length} tramos`;
      } catch {
        return 'JSON';
      }
    }
    
    if (type?.format === 'number') {
      const num = parseFloat(parameter.value);
      if (parameter.parameter_type === 'iva_rate' || parameter.parameter_type === 'iva_retention') {
        return `${(num * 100).toFixed(2)}%`;
      }
      return formatCurrency(num);
    }
    
    return parameter.value;
  };

  const getStatusBadge = (parameter) => {
    const now = new Date().toISOString().split('T')[0];
    const from = parameter.effective_from;
    const until = parameter.effective_until;

    if (from > now) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">Futuro</span>;
    }
    if (until && until < now) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200">Histórico</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">Vigente</span>;
  };

  const getISRBracketSample = () => {
    return JSON.stringify([
      { lower: 0, upper: 7735.00, fixed: 0, rate: 0.0192 },
      { lower: 7735.01, upper: 65651.07, fixed: 148.51, rate: 0.064 },
      { lower: 65651.08, upper: 115375.90, fixed: 3855.14, rate: 0.1088 }
    ], null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Parámetros Fiscales
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tasas y parámetros fiscales históricos y actuales
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          + Nuevo Parámetro
        </button>
      </div>

      {/* View Toggle and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 dark:border-slate-600 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'timeline'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Línea de Tiempo
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex-1">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Todos los tipos</option>
              {parameterTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Parameters Display */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando parámetros...</p>
          </div>
        </div>
      ) : parameters.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-12">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">No hay parámetros fiscales registrados</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Agregar tu primer parámetro
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        // List View
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                {parameters.map((param) => (
                  <tr key={param.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {parameterTypes.find(t => t.value === param.parameter_type)?.label || param.parameter_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatValue(param)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(param.effective_from)}
                      {param.effective_until && ` - ${formatDate(param.effective_until)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(param)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(param)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(param)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
            {parameters.map((param) => (
              <div key={param.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {parameterTypes.find(t => t.value === param.parameter_type)?.label || param.parameter_type}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatValue(param)}
                    </p>
                  </div>
                  {getStatusBadge(param)}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(param.effective_from)}
                  {param.effective_until && ` - ${formatDate(param.effective_until)}`}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(param)}
                    className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(param)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Timeline View
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
          <div className="space-y-6">
            {parameterTypes.map(type => {
              const typeParams = parameters.filter(p => p.parameter_type === type.value);
              if (typeParams.length === 0) return null;

              return (
                <div key={type.value} className="border-l-4 border-primary-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {type.label}
                  </h3>
                  <div className="space-y-3">
                    {typeParams.sort((a, b) => b.effective_from.localeCompare(a.effective_from)).map(param => (
                      <div key={param.id} className="flex items-start gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatValue(param)}
                            </span>
                            {getStatusBadge(param)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(param.effective_from)}
                            {param.effective_until && ` → ${formatDate(param.effective_until)}`}
                          </div>
                          {param.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              {param.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(param)}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(param)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingParameter ? 'Editar Parámetro' : 'Nuevo Parámetro'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Parámetro *
                </label>
                <select
                  value={formData.parameter_type}
                  onChange={(e) => setFormData({ ...formData, parameter_type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  {parameterTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor *
                </label>
                {formData.parameter_type === 'isr_bracket' ? (
                  <div className="space-y-2">
                    <textarea
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      rows={8}
                      required
                      placeholder={getISRBracketSample()}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formato JSON. Ejemplo con 3 tramos mostrado en placeholder.
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    placeholder={formData.parameter_type.includes('rate') ? '0.16' : '100.00'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                )}
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vigente Desde *
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vigente Hasta
                  </label>
                  <input
                    type="date"
                    value={formData.effective_until}
                    onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Period Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período *
                </label>
                <select
                  value={formData.period_type}
                  onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  {periodTypes.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Notas sobre este parámetro..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingParameter ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
