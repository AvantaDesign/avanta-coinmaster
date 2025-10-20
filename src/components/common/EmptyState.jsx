/**
 * EmptyState Component
 * Phase 39: Final UI/UX and System Coherence Audit
 * 
 * Standardized empty state component for consistent UX across the application
 */

export default function EmptyState({ 
  icon = '📭', 
  title = 'No hay datos', 
  message = 'No se encontraron elementos para mostrar',
  action = null,
  actionLabel = null,
  onAction = null 
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </p>
      {action && actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          {action}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
