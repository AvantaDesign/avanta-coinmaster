/**
 * ErrorState Component
 * Phase 39: Final UI/UX and System Coherence Audit
 * 
 * Standardized error state component for consistent error handling UX
 */

export default function ErrorState({ 
  title = 'Error al cargar datos',
  message = 'Ocurrió un error al cargar la información. Por favor, intenta nuevamente.',
  error = null,
  onRetry = null,
  showDetails = false
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </p>
      {showDetails && error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
          <p className="text-sm text-red-800 dark:text-red-300 font-mono">
            {error.message || String(error)}
          </p>
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <span>🔄</span>
          <span>Intentar de nuevo</span>
        </button>
      )}
    </div>
  );
}
