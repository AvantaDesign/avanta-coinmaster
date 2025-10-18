import { useState, useEffect } from 'react';
import { fetchSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeSavingsGoal } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';
import useFilterStore from '../stores/useFilterStore';

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const globalFilter = useFilterStore((state) => state.filter);

  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    type: 'personal',
    category: '',
    description: ''
  });

  useEffect(() => {
    loadGoals();
  }, [globalFilter]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (globalFilter && globalFilter !== 'all') {
        params.type = globalFilter;
      }
      const data = await fetchSavingsGoals(params);
      setGoals(data || []);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
      showError('Error al cargar metas de ahorro');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, formData);
        showSuccess('Meta actualizada exitosamente');
      } else {
        await createSavingsGoal(formData);
        showSuccess('Meta creada exitosamente');
      }
      setShowModal(false);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
      showError('Error al guardar meta de ahorro');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date || '',
      type: goal.type,
      category: goal.category || '',
      description: goal.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (goal) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta meta?')) return;
    
    try {
      await deleteSavingsGoal(goal.id);
      showSuccess('Meta eliminada exitosamente');
      loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      showError('Error al eliminar meta');
    }
  };

  const handleContribute = (goal) => {
    setContributeGoal(goal);
    setContributeAmount('');
    setShowContributeModal(true);
  };

  const submitContribution = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(contributeAmount);
      if (amount <= 0 || isNaN(amount)) {
        showError('Ingresa una cantidad válida');
        return;
      }
      await contributeSavingsGoal(contributeGoal.id, amount);
      showSuccess(`$${amount.toFixed(2)} contribuido a ${contributeGoal.name}`);
      setShowContributeModal(false);
      setContributeGoal(null);
      setContributeAmount('');
      loadGoals();
    } catch (error) {
      console.error('Failed to contribute:', error);
      showError('Error al contribuir a la meta');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
      type: globalFilter && globalFilter !== 'all' ? globalFilter : 'personal',
      category: '',
      description: ''
    });
    setEditingGoal(null);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (goal) => {
    if (goal.progress_percentage >= 100) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completada</span>;
    }
    if (goal.days_remaining !== null && goal.days_remaining < 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Vencida</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En progreso</span>;
  };

  const filteredGoals = goals.filter(goal => {
    switch (statusFilter) {
      case 'completed':
        return goal.progress_percentage >= 100;
      case 'in-progress':
        return goal.progress_percentage < 100 && goal.is_active === 1 && (goal.days_remaining === null || goal.days_remaining >= 0);
      case 'overdue':
        return goal.progress_percentage < 100 && goal.days_remaining !== null && goal.days_remaining < 0;
      default:
        return goal.is_active === 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Metas de Ahorro</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Administra tus objetivos financieros</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Meta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'in-progress', 'completed', 'overdue'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            {status === 'all' && 'Todas'}
            {status === 'in-progress' && 'En progreso'}
            {status === 'completed' && 'Completadas'}
            {status === 'overdue' && 'Vencidas'}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay metas de ahorro</h3>
          <p className="text-gray-600 dark:text-gray-400">Crea tu primera meta para comenzar a ahorrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
                  {getStatusBadge(goal)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(goal)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Category */}
              {goal.category && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">📁 {goal.category}</p>
              )}

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{goal.progress_percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(goal.progress_percentage)} transition-all duration-500`}
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Actual</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${goal.current_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Meta</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${goal.target_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Falta</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">${goal.amount_remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Target Date */}
              {goal.target_date && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  📅 {new Date(goal.target_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {goal.days_remaining !== null && (
                    <span className={`ml-2 font-medium ${goal.days_remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {goal.days_remaining < 0 ? `(${Math.abs(goal.days_remaining)} días vencidos)` : `(${goal.days_remaining} días restantes)`}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{goal.description}</p>
              )}

              {/* Contribute Button */}
              <button
                onClick={() => handleContribute(goal)}
                disabled={goal.progress_percentage >= 100}
                className="w-full py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💰 Contribuir
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingGoal ? 'Editar Meta' : 'Nueva Meta de Ahorro'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la Meta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Ej: Fondo de emergencia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monto Meta *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monto Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha Objetivo
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Negocio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="investment">Inversión</option>
                      <option value="emergency_fund">Fondo de Emergencia</option>
                      <option value="vacation">Vacaciones</option>
                      <option value="equipment">Equipo</option>
                      <option value="education">Educación</option>
                      <option value="retirement">Retiro</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Detalles adicionales..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingGoal ? 'Actualizar' : 'Crear Meta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && contributeGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Contribuir a {contributeGoal.name}
              </h3>
              <form onSubmit={submitContribution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto de Contribución
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Actual</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${contributeGoal.current_amount.toFixed(2)}</span>
                  </div>
                  {contributeAmount && !isNaN(parseFloat(contributeAmount)) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Nuevo Total</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        ${(contributeGoal.current_amount + parseFloat(contributeAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContributeModal(false);
                      setContributeGoal(null);
                      setContributeAmount('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Contribuir
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
