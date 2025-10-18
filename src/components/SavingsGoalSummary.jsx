import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSavingsGoals } from '../utils/api';
import useFilterStore from '../stores/useFilterStore';

export default function SavingsGoalSummary() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const globalFilter = useFilterStore((state) => state.filter);

  useEffect(() => {
    loadGoals();
  }, [globalFilter]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const params = { is_active: 'true' };
      if (globalFilter && globalFilter !== 'all') {
        params.type = globalFilter;
      }
      const data = await fetchSavingsGoals(params);
      
      // Filter active and incomplete goals, sort by progress percentage
      const activeGoals = (data || [])
        .filter(g => g.is_active && g.progress_percentage < 100)
        .sort((a, b) => b.progress_percentage - a.progress_percentage)
        .slice(0, 4);
      
      setGoals(activeGoals);
    } catch (error) {
      console.error('Failed to load savings goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSavings = () => {
    return goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🎯 Metas de Ahorro
        </h3>
        <Link
          to="/savings-goals"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Ver todas →
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No tienes metas de ahorro activas
          </p>
          <Link
            to="/savings-goals"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            Crear meta
          </Link>
        </div>
      ) : (
        <>
          {/* Total Savings Summary */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Ahorrado</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${getTotalSavings().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              en {goals.length} {goals.length === 1 ? 'meta activa' : 'metas activas'}
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className="border-l-4 border-primary-500 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {goal.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ${goal.current_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} / ${goal.target_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {goal.progress_percentage.toFixed(0)}%
                    </div>
                    {goal.days_remaining !== null && (
                      <div className={`text-xs ${goal.days_remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {goal.days_remaining < 0 ? `${Math.abs(goal.days_remaining)}d vencido` : `${goal.days_remaining}d`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(goal.progress_percentage)} transition-all duration-500`}
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <Link
              to="/savings-goals"
              className="block w-full text-center py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
            >
              Administrar Metas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
