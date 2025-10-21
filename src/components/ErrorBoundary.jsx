/**
 * Error Boundary Component
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * React Error Boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI.
 * 
 * Features:
 * - Catches React render errors
 * - Provides error recovery actions
 * - Reports errors to monitoring service
 * - Customizable fallback UI
 * - Reset error state
 * 
 * Usage:
 *   <ErrorBoundary fallback={<ErrorFallback />}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import { ErrorMonitor, logger } from '../utils/errorMonitoring';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'unknown'
    });
    
    // Track error in error monitor
    ErrorMonitor.track(error, {
      type: 'react-error-boundary',
      context: this.props.context,
      componentStack: errorInfo.componentStack
    });
    
    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Reset error state and try to recover
   */
  handleReset = () => {
    logger.info('Error boundary reset', {
      context: this.props.context,
      errorCount: this.state.errorCount
    });
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  
  /**
   * Reload the page
   */
  handleReload = () => {
    logger.info('Error boundary triggered page reload', {
      context: this.props.context
    });
    
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      // Check if too many errors occurred (possible infinite loop)
      if (this.state.errorCount > 3) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Error Crítico
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Se detectaron múltiples errores. Por favor, recarga la página para continuar.
              </p>
              <button
                onClick={this.handleReload}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Recargar Página
              </button>
            </div>
          </div>
        );
      }
      
      // Use custom fallback if provided, otherwise use default
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
          context={this.props.context}
        />
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
