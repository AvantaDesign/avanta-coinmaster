/**
 * Error Recovery Component
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Component that provides error recovery actions for common error scenarios.
 * Can be used within error fallback UIs or as standalone recovery widget.
 * 
 * Features:
 * - Retry actions for transient errors
 * - Refresh/reload actions
 * - Navigation to safe routes
 * - Error reporting to support
 * - Context-aware recovery suggestions
 * 
 * Props:
 *   - error: Error object
 *   - onRetry: Retry function
 *   - context: Error context (e.g., 'transactions', 'fiscal')
 *   - showNavigation: Whether to show navigation options
 *   - className: Additional CSS classes
 * 
 * Usage:
 *   <ErrorRecovery
 *     error={error}
 *     onRetry={handleRetry}
 *     context="transactions"
 *   />
 */

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function ErrorRecovery({ 
  error, 
  onRetry, 
  context,
  showNavigation = true,
  className = '' 
}) {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);
  
  /**
   * Handle retry action
   */
  const handleRetry = async () => {
    if (!onRetry) return;
    
    setRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };
  
  /**
   * Handle reload action
   */
  const handleReload = () => {
    window.location.reload();
  };
  
  /**
   * Handle go home action
   */
  const handleGoHome = () => {
    navigate('/');
  };
  
  /**
   * Handle contact support action
   */
  const handleContactSupport = () => {
    navigate('/help', {
      state: {
        errorContext: {
          message: error?.message,
          context,
          timestamp: new Date().toISOString()
        }
      }
    });
  };
  
  /**
   * Get recovery suggestions based on error type
   */
  const getRecoverySuggestions = () => {
    if (!error) return [];
    
    const suggestions = [];
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    // Network/Connection errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorCode.includes('net_')
    ) {
      suggestions.push({
        icon: '📶',
        title: 'Verifica tu conexión',
        description: 'Asegúrate de estar conectado a internet e intenta nuevamente.'
      });
    }
    
    // Authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('unauthorized') ||
      errorCode.includes('auth_')
    ) {
      suggestions.push({
        icon: '🔐',
        title: 'Inicia sesión nuevamente',
        description: 'Tu sesión puede haber expirado. Intenta cerrar sesión e iniciar nuevamente.'
      });
    }
    
    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorCode.includes('val_')
    ) {
      suggestions.push({
        icon: '📝',
        title: 'Verifica los datos',
        description: 'Algunos campos pueden contener información inválida. Revisa y corrige los datos.'
      });
    }
    
    // Database/Server errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('server') ||
      errorCode.includes('db_') ||
      errorCode.includes('srv_')
    ) {
      suggestions.push({
        icon: '🔧',
        title: 'Problema temporal',
        description: 'Estamos experimentando problemas técnicos. Intenta nuevamente en unos momentos.'
      });
    }
    
    // Default suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        icon: '🔄',
        title: 'Intenta nuevamente',
        description: 'Refresca la página o intenta la operación nuevamente.'
      });
    }
    
    return suggestions;
  };
  
  const suggestions = getRecoverySuggestions();
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recovery Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ¿Qué puedes hacer?
          </h3>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <span className="text-2xl mr-3 flex-shrink-0">
                  {suggestion.icon}
                </span>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Acciones rápidas
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Retry button */}
          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">{retrying ? '⏳' : '🔄'}</span>
              {retrying ? 'Reintentando...' : 'Intentar nuevamente'}
            </button>
          )}
          
          {/* Reload button */}
          <button
            onClick={handleReload}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            <span className="mr-2">↻</span>
            Recargar página
          </button>
          
          {/* Navigation buttons */}
          {showNavigation && (
            <>
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                <span className="mr-2">🏠</span>
                Ir al inicio
              </button>
              
              <button
                onClick={handleContactSupport}
                className="flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                <span className="mr-2">💬</span>
                Contactar soporte
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Error details (for developers) */}
      {import.meta.env.DEV && error && (
        <details className="text-xs text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer font-medium">
            Detalles técnicos (modo desarrollo)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-slate-800 rounded overflow-x-auto">
            {JSON.stringify({
              message: error.message,
              code: error.code,
              name: error.name,
              context
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default ErrorRecovery;
