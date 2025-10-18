import { useState, useEffect } from 'react';
import { fetchFinancialTasks, toggleTaskCompletion, createFinancialTask } from '../utils/api';

export default function FinancialTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState([]);
  const [defaultTasks, setDefaultTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchFinancialTasks();
      setTasks(data.tasks || []);
      setStats(data.stats || []);
      setDefaultTasks(data.defaultTasks || {});
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await toggleTaskCompletion(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleInitializeTasks = async (frequency) => {
    try {
      const tasksForFrequency = defaultTasks[frequency] || [];
      const today = new Date().toISOString().split('T')[0];
      
      for (const task of tasksForFrequency) {
        // Check if task already exists
        const exists = tasks.some(
          t => t.task_key === task.task_key && t.frequency === frequency
        );
        
        if (!exists) {
          await createFinancialTask({
            ...task,
            frequency,
            due_date: today
          });
        }
      }
      
      await loadTasks();
    } catch (error) {
      console.error('Error initializing tasks:', error);
    }
  };

  const frequencies = [
    { key: 'daily', label: 'Diarias', icon: '📅', color: 'blue' },
    { key: 'weekly', label: 'Semanales', icon: '📆', color: 'green' },
    { key: 'monthly', label: 'Mensuales', icon: '📊', color: 'purple' },
    { key: 'quarterly', label: 'Trimestrales', icon: '📈', color: 'orange' },
    { key: 'annual', label: 'Anuales', icon: '📋', color: 'red' }
  ];

  const getTasksByFrequency = (frequency) => {
    let filtered = tasks.filter(t => t.frequency === frequency);
    if (!showCompleted) {
      filtered = filtered.filter(t => !t.is_completed);
    }
    return filtered;
  };

  const getCompletionStats = (frequency) => {
    const stat = stats.find(s => s.frequency === frequency);
    if (!stat) return { total: 0, completed: 0, percentage: 0 };
    const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
    return { ...stat, percentage };
  };

  const getColorClass = (color, type = 'bg') => {
    const colors = {
      blue: type === 'bg' ? 'bg-blue-500' : type === 'text' ? 'text-blue-600' : 'border-blue-300',
      green: type === 'bg' ? 'bg-green-500' : type === 'text' ? 'text-green-600' : 'border-green-300',
      purple: type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-600' : 'border-purple-300',
      orange: type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-600' : 'border-orange-300',
      red: type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-600' : 'border-red-300'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  const filteredFrequencies = selectedFrequency === 'all' 
    ? frequencies 
    : frequencies.filter(f => f.key === selectedFrequency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              📋 Centro de Tareas Financieras
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona tus actividades financieras regulares
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Mostrar completadas
            </label>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFrequency('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFrequency === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Todas
          </button>
          {frequencies.map(freq => (
            <button
              key={freq.key}
              onClick={() => setSelectedFrequency(freq.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFrequency === freq.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {freq.icon} {freq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Lists by Frequency */}
      {filteredFrequencies.map(freq => {
        const freqTasks = getTasksByFrequency(freq.key);
        const stats = getCompletionStats(freq.key);
        const hasDefaultTasks = defaultTasks[freq.key] && defaultTasks[freq.key].length > 0;

        return (
          <div key={freq.key} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            {/* Frequency Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 p-4 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{freq.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Tareas {freq.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.completed} de {stats.total} completadas ({stats.percentage}%)
                    </p>
                  </div>
                </div>
                {freqTasks.length === 0 && (
                  <button
                    onClick={() => handleInitializeTasks(freq.key)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Inicializar Tareas
                  </button>
                )}
              </div>
              
              {/* Progress Bar */}
              {stats.total > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getColorClass(freq.color, 'bg')}`}
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Tasks List */}
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {freqTasks.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {showCompleted 
                      ? 'No hay tareas para esta frecuencia'
                      : 'No hay tareas pendientes'}
                  </p>
                  <button
                    onClick={() => handleInitializeTasks(freq.key)}
                    className="mt-3 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Inicializar Tareas {freq.label}
                  </button>
                </div>
              ) : (
                freqTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                      task.is_completed ? 'opacity-60' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleTask(task.id)}
                      className={`mt-1 w-5 h-5 rounded border-gray-300 ${getColorClass(freq.color, 'text')} focus:ring-${freq.color}-500`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${
                        task.is_completed 
                          ? 'line-through text-gray-500 dark:text-gray-500' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {task.category && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded">
                            {task.category}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-gray-500 dark:text-gray-400">
                            📅 {new Date(task.due_date).toLocaleDateString('es-MX')}
                          </span>
                        )}
                        {task.completed_at && (
                          <span className="text-green-600 dark:text-green-400">
                            ✓ Completada: {new Date(task.completed_at).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">📊 Resumen General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {frequencies.map(freq => {
            const stats = getCompletionStats(freq.key);
            return (
              <div key={freq.key} className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl mb-2">{freq.icon}</div>
                <div className="text-sm opacity-90">{freq.label}</div>
                <div className="text-2xl font-bold mt-1">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-xs opacity-75 mt-1">{stats.percentage}% completado</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
