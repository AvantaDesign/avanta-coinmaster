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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando presupuestos...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-600 mt-2">
            Administra tus presupuestos mensuales, trimestrales y anuales
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'critical' ? 'bg-red-50 border-red-500 text-red-900' :
                alert.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-900' :
                'bg-blue-50 border-blue-500 text-blue-900'
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">Total Presupuestado</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totals.budgeted)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">Total Gastado</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totals.actual)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">Total Restante</p>
          <p className={`text-2xl font-bold ${totals.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.remaining)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">Uso Promedio</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalPercent.toFixed(1)}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                totalPercent >= 100 ? 'bg-red-500' :
                totalPercent >= 90 ? 'bg-orange-500' :
                totalPercent >= 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clasificación
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('business')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'business'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Negocio
              </button>
              <button
                onClick={() => setFilter('personal')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'personal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Personal
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
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
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">
            No hay presupuestos configurados para este período.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
