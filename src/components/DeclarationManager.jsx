import { useState, useEffect } from 'react';
import { saveSATDeclaration, updateSATDeclaration, fetchReconciliationData } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import { showSuccess, showError } from '../utils/notifications';

export default function DeclarationManager() {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeclaration, setEditingDeclaration] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    declaration_type: 'ISR',
    status: 'pending',
    declared_income: '',
    declared_expenses: '',
    declared_isr: '',
    declared_iva: '',
    filed_date: '',
    notes: ''
  });

  const declarationTypes = [
    { value: 'ISR', label: 'ISR (Impuesto Sobre la Renta)' },
    { value: 'IVA', label: 'IVA (Impuesto al Valor Agregado)' },
    { value: 'DIOT', label: 'DIOT (Declaración Informativa)' },
    { value: 'annual', label: 'Declaración Anual' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pendiente', color: 'yellow' },
    { value: 'filed', label: 'Presentada', color: 'blue' },
    { value: 'accepted', label: 'Aceptada', color: 'green' },
    { value: 'rejected', label: 'Rechazada', color: 'red' },
    { value: 'amended', label: 'Complementaria', color: 'purple' }
  ];

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadDeclarations();
  }, []);

  const loadDeclarations = async () => {
    try {
      setLoading(true);
      // Load declarations from multiple periods
      const currentYear = new Date().getFullYear();
      const declarations = [];
      
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
          try {
            const data = await fetchReconciliationData(year, month);
            if (data?.satDeclaration) {
              declarations.push({
                ...data.satDeclaration,
                year,
                month
              });
            }
          } catch (error) {
            // Silent fail for missing declarations
          }
        }
      }
      
      setDeclarations(declarations);
    } catch (error) {
      console.error('Failed to load declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        declared_income: parseFloat(formData.declared_income) || 0,
        declared_expenses: parseFloat(formData.declared_expenses) || 0,
        declared_isr: parseFloat(formData.declared_isr) || 0,
        declared_iva: parseFloat(formData.declared_iva) || 0,
      };

      if (editingDeclaration) {
        await updateSATDeclaration(editingDeclaration.id, data);
        showSuccess('Declaración actualizada exitosamente');
      } else {
        await saveSATDeclaration(data);
        showSuccess('Declaración guardada exitosamente');
      }

      setShowModal(false);
      resetForm();
      loadDeclarations();
    } catch (error) {
      console.error('Failed to save declaration:', error);
      showError('Error al guardar declaración');
    }
  };

  const handleEdit = (declaration) => {
    setEditingDeclaration(declaration);
    setFormData({
      year: declaration.year,
      month: declaration.month,
      declaration_type: declaration.declaration_type,
      status: declaration.status,
      declared_income: declaration.declared_income || '',
      declared_expenses: declaration.declared_expenses || '',
      declared_isr: declaration.declared_isr || '',
      declared_iva: declaration.declared_iva || '',
      filed_date: declaration.filed_date || '',
      notes: declaration.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      declaration_type: 'ISR',
      status: 'pending',
      declared_income: '',
      declared_expenses: '',
      declared_isr: '',
      declared_iva: '',
      filed_date: '',
      notes: ''
    });
    setEditingDeclaration(null);
  };

  const getStatusBadge = (status) => {
    const statusInfo = statuses.find(s => s.value === status) || statuses[0];
    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[statusInfo.color]}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredDeclarations = declarations.filter(dec => {
    if (statusFilter !== 'all' && dec.status !== statusFilter) return false;
    if (typeFilter !== 'all' && dec.declaration_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Declaraciones SAT
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          + Nueva Declaración
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Todos</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Todos</option>
              {declarationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Declarations List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando declaraciones...</p>
          </div>
        ) : filteredDeclarations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No hay declaraciones registradas</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              + Agregar tu primera declaración
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ISR Declarado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IVA Declarado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredDeclarations.map((dec) => (
                    <tr key={dec.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {months[dec.month - 1]} {dec.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {declarationTypes.find(t => t.value === dec.declaration_type)?.label || dec.declaration_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dec.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(dec.declared_isr || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(dec.declared_iva || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(dec)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {filteredDeclarations.map((dec) => (
                <div key={dec.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {months[dec.month - 1]} {dec.year}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {declarationTypes.find(t => t.value === dec.declaration_type)?.label || dec.declaration_type}
                      </p>
                    </div>
                    {getStatusBadge(dec.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">ISR:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(dec.declared_isr || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(dec.declared_iva || 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(dec)}
                    className="w-full px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingDeclaration ? 'Editar Declaración' : 'Nueva Declaración'}
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
              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Año *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2020"
                    max="2030"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mes *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    required
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

              {/* Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.declaration_type}
                    onChange={(e) => setFormData({ ...formData, declaration_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  >
                    {declarationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ingresos Declarados
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.declared_income}
                    onChange={(e) => setFormData({ ...formData, declared_income: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gastos Declarados
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.declared_expenses}
                    onChange={(e) => setFormData({ ...formData, declared_expenses: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ISR Declarado *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.declared_isr}
                    onChange={(e) => setFormData({ ...formData, declared_isr: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IVA Declarado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.declared_iva}
                    onChange={(e) => setFormData({ ...formData, declared_iva: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Filed Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Presentación
                </label>
                <input
                  type="date"
                  value={formData.filed_date}
                  onChange={(e) => setFormData({ ...formData, filed_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Notas adicionales sobre esta declaración..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingDeclaration ? 'Actualizar' : 'Guardar'}
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
