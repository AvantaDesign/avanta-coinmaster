// TaskProgressBar Component
// Phase 36: Visual progress indicator for tasks

export default function TaskProgressBar({ 
  progress = 0, 
  showLabel = true, 
  height = 'h-4', 
  color = 'primary',
  animated = true 
}) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Determine color based on progress
  const getProgressColor = () => {
    if (color !== 'primary') {
      return color === 'white' 
        ? 'bg-white' 
        : `bg-${color}-500`;
    }

    if (clampedProgress === 100) return 'bg-green-500';
    if (clampedProgress >= 75) return 'bg-blue-500';
    if (clampedProgress >= 50) return 'bg-yellow-500';
    if (clampedProgress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (clampedProgress === 100) return 'text-green-600 dark:text-green-400';
    if (clampedProgress >= 75) return 'text-blue-600 dark:text-blue-400';
    if (clampedProgress >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (clampedProgress >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${getTextColor()}`}>
            Progreso
          </span>
          <span className={`text-xs font-bold ${getTextColor()}`}>
            {clampedProgress}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-slate-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full ${getProgressColor()} ${
            animated ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        >
          {clampedProgress > 0 && (
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
          )}
        </div>
      </div>
    </div>
  );
}
