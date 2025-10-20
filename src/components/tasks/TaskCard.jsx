// TaskCard Component
// Phase 36: Individual task display with actions

import { useState } from 'react';
import TaskProgressBar from './TaskProgressBar';

export default function TaskCard({ task, onToggle, onOpenDeclaration }) {
  const [showDetails, setShowDetails] = useState(false);

  const getTaskTypeIcon = (type) => {
    const icons = {
      manual: '✍️',
      auto: '🤖',
      declaration: '📑',
      custom: '⭐'
    };
    return icons[type] || '📋';
  };

  const getFrequencyBadge = (frequency) => {
    const badges = {
      daily: { label: 'Diaria', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      weekly: { label: 'Semanal', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      monthly: { label: 'Mensual', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      quarterly: { label: 'Trimestral', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      annual: { label: 'Anual', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    return badges[frequency] || { label: frequency, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = () => {
    if (!task.due_date || task.is_completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.due_date) < today;
  };

  const isDueSoon = () => {
    if (!task.due_date || task.is_completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueDate = new Date(task.due_date);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  const handleOpenDeclaration = () => {
    if (task.task_type === 'declaration' && task.completion_criteria?.declaration_type) {
      onOpenDeclaration(task.completion_criteria.declaration_type);
    }
  };

  const frequencyBadge = getFrequencyBadge(task.frequency);

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
        task.is_completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.is_completed || false}
          onChange={() => onToggle(task.id)}
          className="mt-1.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`font-medium ${
                  task.is_completed 
                    ? 'line-through text-gray-500 dark:text-gray-500' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {getTaskTypeIcon(task.task_type)} {task.title}
                </h4>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${frequencyBadge.color}`}>
                  {frequencyBadge.label}
                </span>
                {isOverdue() && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    ⚠️ Vencida
                  </span>
                )}
                {isDueSoon() && !isOverdue() && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    ⏰ Próxima
                  </span>
                )}
              </div>

              {task.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {task.description}
                </p>
              )}

              {/* Progress Bar */}
              {!task.is_completed && task.progress_percentage !== undefined && (
                <div className="mt-3">
                  <TaskProgressBar 
                    progress={task.progress_percentage} 
                    height="h-2"
                    showLabel={false}
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                {task.category && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded">
                    {task.category}
                  </span>
                )}
                {task.due_date && (
                  <span className={`flex items-center gap-1 ${
                    isOverdue() 
                      ? 'text-red-600 dark:text-red-400 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    📅 Vence: {formatDate(task.due_date)}
                  </span>
                )}
                {task.last_evaluated_at && task.auto_update && (
                  <span className="text-gray-500 dark:text-gray-400">
                    🔄 Actualizado: {formatDate(task.last_evaluated_at)}
                  </span>
                )}
                {task.completed_at && (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Completada: {formatDate(task.completed_at)}
                  </span>
                )}
              </div>

              {/* Expanded Details */}
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {task.task_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Progreso:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {task.progress_percentage || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Actualización auto:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {task.auto_update ? 'Sí' : 'No'}
                      </span>
                    </div>
                    {task.notes && (
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Notas:</strong> {task.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {task.progress_percentage !== undefined && !task.is_completed && (
                <div className="text-center min-w-[3rem]">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {task.progress_percentage}%
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Ver detalles"
              >
                {showDetails ? '▲' : '▼'}
              </button>
              {task.task_type === 'declaration' && !task.is_completed && (
                <button
                  onClick={handleOpenDeclaration}
                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
                  title="Abrir guía de declaración"
                >
                  Guía
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
