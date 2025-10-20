import { useState, useEffect } from 'react';
import { fetchFinancialTasks, toggleTaskCompletion, createFinancialTask } from '../utils/api';
import TaskProgressBar from '../components/tasks/TaskProgressBar';
import TaskCard from '../components/tasks/TaskCard';
import CustomTaskManager from '../components/tasks/CustomTaskManager';
import DeclarationGuide from '../components/tasks/DeclarationGuide';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [defaultTasks, setDefaultTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [selectedTaskType, setSelectedTaskType] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);
  const [showDeclarationGuide, setShowDeclarationGuide] = useState(false);
  const [selectedDeclarationType, setSelectedDeclarationType] = useState(null);

  useEffect(() => {
    loadTasks();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchFinancialTasks();
      setTasks(data.tasks || []);
      setStats(data.stats || []);
      setTypeStats(data.typeStats || []);
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

  const handleOpenDeclaration = (declarationType) => {
    setSelectedDeclarationType(declarationType);
    setShowDeclarationGuide(true);
  };

  const frequencies = [
    { key: 'daily', label: 'Diarias', icon: '📅', color: 'blue' },
    { key: 'weekly', label: 'Semanales', icon: '📆', color: 'green' },
    { key: 'monthly', label: 'Mensuales', icon: '📊', color: 'purple' },
    { key: 'quarterly', label: 'Trimestrales', icon: '📈', color: 'orange' },
    { key: 'annual', label: 'Anuales', icon: '📋', color: 'red' }
  ];

  const taskTypes = [
    { key: 'manual', label: 'Manuales', icon: '✍️' },
    { key: 'auto', label: 'Automáticas', icon: '🤖' },
    { key: 'declaration', label: 'Declaraciones', icon: '📑' },
    { key: 'custom', label: 'Personalizadas', icon: '⭐' }
  ];

  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Filter by frequency
    if (selectedFrequency !== 'all') {
      filtered = filtered.filter(t => t.frequency === selectedFrequency);
    }

    // Filter by task type
    if (selectedTaskType !== 'all') {
      filtered = filtered.filter(t => t.task_type === selectedTaskType);
    }

    // Filter by completion
    if (!showCompleted) {
      filtered = filtered.filter(t => !t.is_completed);
    }

    return filtered;
  };

  const groupTasksByStatus = (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return {
      overdue: tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < today),
      dueSoon: tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) <= sevenDaysFromNow),
      inProgress: tasks.filter(t => !t.is_completed && t.progress_percentage > 0 && t.progress_percentage < 100 && (!t.due_date || new Date(t.due_date) > sevenDaysFromNow)),
      notStarted: tasks.filter(t => !t.is_completed && t.progress_percentage === 0 && (!t.due_date || new Date(t.due_date) > sevenDaysFromNow)),
      completed: tasks.filter(t => t.is_completed)
    };
  };

  const getOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress_percentage || 0), 0);
    return Math.round(totalProgress / tasks.length);
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

  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByStatus(filteredTasks);
  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header with Overall Progress */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              📋 Centro de Tareas
            </h1>
            <p className="mt-1 text-sm opacity-90">
              Sistema inteligente de gestión de obligaciones fiscales
            </p>
          </div>
          <div className="text-center bg-white bg-opacity-20 rounded-lg px-6 py-3">
            <div className="text-4xl font-bold">{overallProgress}%</div>
            <div className="text-xs opacity-90 mt-1">Progreso General</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <TaskProgressBar 
            progress={overallProgress}
            showLabel={false}
            height="h-3"
            color="white"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCustomTaskModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            ➕ Nueva Tarea
          </button>
          <button
            onClick={() => handleOpenDeclaration('isr')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📑 Declaración ISR
          </button>
          <button
            onClick={() => handleOpenDeclaration('iva')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📑 Declaración IVA
          </button>
          <button
            onClick={() => handleOpenDeclaration('diot')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            📑 DIOT
          </button>
          <label className="flex items-center gap-2 ml-auto text-sm text-gray-700 dark:text-gray-300">
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

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="space-y-3">
          {/* Frequency Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frecuencia:
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFrequency('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

          {/* Task Type Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Tarea:
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTaskType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTaskType === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                Todos
              </button>
              {taskTypes.map(type => (
                <button
                  key={type.key}
                  onClick={() => setSelectedTaskType(type.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedTaskType === type.key
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Groups */}
      {groupedTasks.overdue.length > 0 && (
        <TaskGroup
          title="⚠️ Vencidas"
          subtitle="Requieren atención inmediata"
          tasks={groupedTasks.overdue}
          color="red"
          onToggleTask={handleToggleTask}
          onOpenDeclaration={handleOpenDeclaration}
        />
      )}

      {groupedTasks.dueSoon.length > 0 && (
        <TaskGroup
          title="⏰ Próximas a Vencer"
          subtitle="Vencen en los próximos 7 días"
          tasks={groupedTasks.dueSoon}
          color="orange"
          onToggleTask={handleToggleTask}
          onOpenDeclaration={handleOpenDeclaration}
        />
      )}

      {groupedTasks.inProgress.length > 0 && (
        <TaskGroup
          title="🔄 En Progreso"
          subtitle="Tareas iniciadas pero no completadas"
          tasks={groupedTasks.inProgress}
          color="blue"
          onToggleTask={handleToggleTask}
          onOpenDeclaration={handleOpenDeclaration}
        />
      )}

      {groupedTasks.notStarted.length > 0 && (
        <TaskGroup
          title="📝 Sin Iniciar"
          subtitle="Tareas pendientes de comenzar"
          tasks={groupedTasks.notStarted}
          color="gray"
          onToggleTask={handleToggleTask}
          onOpenDeclaration={handleOpenDeclaration}
        />
      )}

      {showCompleted && groupedTasks.completed.length > 0 && (
        <TaskGroup
          title="✅ Completadas"
          subtitle="Tareas finalizadas"
          tasks={groupedTasks.completed}
          color="green"
          onToggleTask={handleToggleTask}
          onOpenDeclaration={handleOpenDeclaration}
        />
      )}

      {filteredTasks.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No hay tareas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {showCompleted 
              ? 'No se encontraron tareas con los filtros seleccionados'
              : 'No hay tareas pendientes. ¡Excelente trabajo!'}
          </p>
          <button
            onClick={() => setShowCustomTaskModal(true)}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Crear Primera Tarea
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {typeStats.map(stat => (
          <div key={stat.task_type} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {taskTypes.find(t => t.key === stat.task_type)?.label || stat.task_type}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.count}
                </p>
              </div>
              <div className="text-3xl">
                {taskTypes.find(t => t.key === stat.task_type)?.icon || '📋'}
              </div>
            </div>
            <div className="mt-2">
              <TaskProgressBar progress={Math.round(stat.avg_progress || 0)} height="h-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showCustomTaskModal && (
        <CustomTaskManager
          onClose={() => setShowCustomTaskModal(false)}
          onTaskCreated={() => {
            setShowCustomTaskModal(false);
            loadTasks();
          }}
        />
      )}

      {showDeclarationGuide && selectedDeclarationType && (
        <DeclarationGuide
          declarationType={selectedDeclarationType}
          onClose={() => {
            setShowDeclarationGuide(false);
            setSelectedDeclarationType(null);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}

// Task Group Component
function TaskGroup({ title, subtitle, tasks, color, onToggleTask, onOpenDeclaration }) {
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    gray: 'from-gray-500 to-gray-600',
    green: 'from-green-500 to-green-600'
  };

  const avgProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / tasks.length)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm opacity-90">{subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs opacity-90">tareas</div>
          </div>
        </div>
        <div className="mt-3">
          <TaskProgressBar progress={avgProgress} height="h-2" color="white" showLabel={false} />
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onOpenDeclaration={onOpenDeclaration}
          />
        ))}
      </div>
    </div>
  );
}
