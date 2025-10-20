/**
 * LoadingState Component
 * Phase 32B: UI State Consistency
 */

export default function LoadingState({ message = 'Cargando...', size = 'medium' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.medium;
  
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className={`animate-spin rounded-full ${spinnerSize} border-b-2 border-primary-600 dark:border-primary-400`}></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}
