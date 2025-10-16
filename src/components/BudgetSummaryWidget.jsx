import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { getBudgetStatusIcon } from '../utils/budgets';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function BudgetSummaryWidget({ classification = 'all' }) {
  const [budgets, setBudgets] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetSummary();
  }, [classification]);

  const loadBudgetSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (classification !== 'all') params.append('classification', classification);
      params.append('period', 'monthly');
      params.append('is_active', 'true');

      const [budgetsRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/api/budgets?${params}`, { credentials: 'include' }),
        fetch(`${API_URL}/api/budgets/progress?${params}`, { credentials: 'include' })
      ]);

      const budgetsData = await budgetsRes.json();
      const progressData = await progressRes.json();

      setBudgets(budgetsData.budgets || []);
      setProgress(progressData.progress || []);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-gray-500">Cargando presupuestos...</div>
      </div>
    );
  }

  if (progress.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📊 Presupuestos</h3>
          <Link
            to="/budgets"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver todos
          </Link>
        </div>
        <p className="text-gray-600 text-sm text-center py-4">
          No hay presupuestos activos este mes.
        </p>
        <Link
          to="/budgets"
          className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Crear Presupuesto
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totals = progress.reduce((acc, p) => ({
    budgeted: acc.budgeted + (p.amount || 0),
    actual: acc.actual + (p.actual || 0),
    remaining: acc.remaining + (p.remaining || 0)
  }), { budgeted: 0, actual: 0, remaining: 0 });

  const totalPercent = totals.budgeted > 0 ? (totals.actual / totals.budgeted) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Presupuestos</h3>
        <Link
          to="/budgets"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Ver todos
        </Link>
      </div>

      {/* Overall Progress */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Total Presupuestado</span>
          <span className="font-semibold">{formatCurrency(totals.budgeted)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Total Gastado</span>
          <span className="font-semibold">{formatCurrency(totals.actual)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
          <div
            className={`h-3 rounded-full transition-all ${
              totalPercent >= 100 ? 'bg-red-500' :
              totalPercent >= 90 ? 'bg-orange-500' :
              totalPercent >= 75 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(totalPercent, 100)}%` }}
          />
        </div>
        <div className="text-center mt-1">
          <span className={`text-sm font-semibold ${
            totalPercent >= 100 ? 'text-red-600' :
            totalPercent >= 90 ? 'text-orange-600' :
            totalPercent >= 75 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {totalPercent.toFixed(1)}% utilizado
          </span>
        </div>
      </div>

      {/* Top Budget Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Principales categorías:</h4>
        {progress.slice(0, 3).map((item) => {
          const percent = item.amount > 0 ? (item.actual / item.amount) * 100 : 0;
          return (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 flex-1">
                <span>{getBudgetStatusIcon(item.status)}</span>
                <span className="text-gray-700 truncate">
                  {item.category_name || 'General'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${
                  percent >= 100 ? 'text-red-600' :
                  percent >= 90 ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {percent.toFixed(0)}%
                </span>
                <span className="text-gray-500 text-xs">
                  {formatCurrency(item.actual)}/{formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {progress.some(p => p.status === 'exceeded' || p.status === 'warning') && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Tienes presupuestos que requieren atención
          </p>
        </div>
      )}
    </div>
  );
}
