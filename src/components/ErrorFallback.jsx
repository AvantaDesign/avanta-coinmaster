/**
 * Error Fallback Component
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Default fallback UI component displayed when an error is caught by ErrorBoundary.
 * Provides user-friendly error message and recovery actions.
 * 
 * Features:
 * - User-friendly error messages
 * - Recovery actions (retry, reload, go home)
 * - Error details for developers (in dev mode)
 * - Responsive design
 * - Dark mode support
 * 
 * Props:
 *   - error: Error object
 *   - errorInfo: React error info with component stack
 *   - onReset: Function to reset error state
 *   - onReload: Function to reload page
 *   - context: Error context string
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorFallback({ error, errorInfo, onReset, onReload, context }) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = import.meta.env.DEV;
  
  const handleGoHome = () => {
    navigate('/');
    if (onReset) {
      onReset();
    }
  };
  
  const handleContactSupport = () => {
    // Navigate to help center with error context
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
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-12">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-danger-50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-800 px-6 py-4">
          <div className="flex items-center">
            <div className="text-4xl mr-4">⚠️</div>
            <div>
              <h1 className="text-2xl font-bold text-danger-900 dark:text-danger-100">
                Algo salió mal
              </h1>
              <p className="text-danger-700 dark:text-danger-300 text-sm mt-1">
                {context ? `Error en: ${context}` : 'Ha ocurrido un error inesperado'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Lo sentimos, ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
              Puedes intentar las siguientes acciones:
            </p>
            
            {/* Error message */}
            {error?.message && (
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {error.message}
                </p>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={onReset}
              className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">🔄</span>
              Intentar nuevamente
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">🏠</span>
              Ir al inicio
            </button>
            
            <button
              onClick={onReload}
              className="flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">↻</span>
              Recargar página
            </button>
            
            <button
              onClick={handleContactSupport}
              className="flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">💬</span>
              Contactar soporte
            </button>
          </div>
          
          {/* Developer details */}
          {isDevelopment && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
              >
                <span className="mr-2">{showDetails ? '▼' : '▶'}</span>
                Detalles técnicos (modo desarrollo)
              </button>
              
              {showDetails && (
                <div className="mt-4 space-y-4">
                  {/* Error stack */}
                  {error?.stack && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Stack Trace:
                      </h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {/* Component stack */}
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Component Stack:
                      </h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Si el problema persiste, por favor contacta a nuestro equipo de soporte.
            Tu experiencia es importante para nosotros.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
