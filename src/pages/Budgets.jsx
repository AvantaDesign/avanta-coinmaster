import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BudgetCard from '../components/BudgetCard';
import BudgetForm from '../components/BudgetForm';
import { formatCurrency } from '../utils/calculations';
import { 
  getBudgetStatusColor, 
  getBudgetStatusIcon,
  getClassificationLabel,
  getPeriodLabel,
  generateBudgetAlerts
} from '../utils/budgets';
import { authFetch } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'business', 'personal'
  const [periodFilter, setPeriodFilter] = useState('monthly');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadBudgets();
    loadProgress();
  }, [filter, periodFilter]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('classification', filter);
      params.append('period', periodFilter);

      const response = await authFetch(`${API_URL}/api/budgets?${params}`);
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('classification', filter);
      params.append('period', periodFilter);

      const response = await authFetch(`${API_URL}/api/budgets/progress?${params}`);
      const data = await response.json();
      setProgress(data.progress || []);
      
      // Generate alerts from progress
      const budgetAlerts = generateBudgetAlerts(data.progress || []);
      setAlerts(budgetAlerts);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleCreateBudget = async (budgetData) => {
    try {
      const response = await authFetch(`${API_URL}/api/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });

      if (response.ok) {
        setShowForm(false);
        loadBudgets();
        loadProgress();
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdateBudget = async (budgetId, budgetData) => {
    try {
      const response = await authFetch(`${API_URL}/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingBudget(null);
        loadBudgets();
        loadProgress();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('¿Estás seguro de eliminar este presupuesto?')) return;

    try {
      const response = await authFetch(`${API_URL}/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadBudgets();
        loadProgress();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  // Calculate totals
  const totals = progress.reduce((acc, p) => ({
    budgeted: acc.budgeted + p.amount,
    actual: acc.actual + p.actual,
    remaining: acc.remaining + p.remaining
  }), { budgeted: 0, actual: 0, remaining: 0 });

  const totalPercent = totals.budgeted > 0 ? (totals.actual / totals.budgeted) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-xl text-gray-900 dark:text-white">Cargando presupuestos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Presupuestos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra tus presupuestos mensuales, trimestrales y anuales
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          + Nuevo Presupuesto
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 transition-colors ${
                alert.type === 'critical' ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-500 dark:border-danger-400 text-danger-900 dark:text-danger-300' :
                alert.type === 'warning' ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-500 dark:border-warning-400 text-warning-900 dark:text-warning-300' :
                'bg-info-50 dark:bg-info-900/20 border-info-500 dark:border-info-400 text-info-900 dark:text-info-300'
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">
                  {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <p className="font-semibold">{alert.category}</p>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Presupuestado</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.budgeted)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Gastado</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.actual)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Restante</p>
          <p className={`text-2xl font-bold transition-colors ${totals.remaining >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
            {formatCurrency(totals.remaining)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Uso Promedio</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalPercent.toFixed(1)}%
          </p>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-colors ${
                totalPercent >= 100 ? 'bg-danger-500 dark:bg-danger-600' :
                totalPercent >= 90 ? 'bg-warning-500 dark:bg-warning-600' :
                totalPercent >= 75 ? 'bg-warning-500 dark:bg-warning-600' :
                'bg-success-500 dark:bg-success-600'
              }`}
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clasificación
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 dark:bg-primary-700 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('business')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'business'
                    ? 'bg-info-600 dark:bg-info-700 text-white'
                    : 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-400 hover:bg-info-200 dark:hover:bg-info-900/50'
                }`}
              >
                Negocio
              </button>
              <button
                onClick={() => setFilter('personal')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'personal'
                    ? 'bg-success-600 dark:bg-success-700 text-white'
                    : 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50'
                }`}
              >
                Personal
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevation border border-gray-200 dark:border-slate-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>
              <BudgetForm
                budget={editingBudget}
                onSubmit={(data) => {
                  if (editingBudget) {
                    handleUpdateBudget(editingBudget.id, data);
                  } else {
                    handleCreateBudget(data);
                  }
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingBudget(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {progress.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No hay presupuestos configurados para este período.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Crear Primer Presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progress.map((budgetProgress) => (
            <BudgetCard
              key={budgetProgress.id}
              budget={budgetProgress}
              onEdit={() => handleEditBudget(budgetProgress)}
              onDelete={() => handleDeleteBudget(budgetProgress.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
