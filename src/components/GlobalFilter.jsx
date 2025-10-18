import { useEffect } from 'react';
import useFilterStore from '../stores/useFilterStore';
import Icon from './icons/IconLibrary';

/**
 * GlobalFilter Component
 * Provides a segmented control to switch between All, Personal, and Business views
 * Filter state persists across page navigation via Zustand store
 */
export default function GlobalFilter() {
  const { filter, setFilter } = useFilterStore();
  
  const filterOptions = [
    { value: 'all', label: 'Todo', icon: 'chart', color: 'gray' },
    { value: 'personal', label: 'Personal', icon: 'user', color: 'blue' },
    { value: 'business', label: 'Negocio', icon: 'briefcase', color: 'green' },
  ];

  const getButtonClasses = (option) => {
    const baseClasses = 'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200';
    
    if (filter === option.value) {
      // Active state
      const colorMap = {
        gray: 'bg-gray-600 dark:bg-gray-700 text-white shadow-md',
        blue: 'bg-primary-600 dark:bg-primary-700 text-white shadow-md',
        green: 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-md',
      };
      return `${baseClasses} ${colorMap[option.color]}`;
    }
    
    // Inactive state
    return `${baseClasses} bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Icon name="search" size="sm" className="text-gray-500 dark:text-gray-400" />
          <span className="hidden sm:inline">Filtro:</span>
        </div>
        
        <div className="flex flex-1 gap-2 max-w-md">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={getButtonClasses(option)}
              aria-pressed={filter === option.value}
              aria-label={`Filtrar por ${option.label}`}
            >
              <Icon name={option.icon} size="sm" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
        
        {/* Visual indicator */}
        {filter !== 'all' && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full text-xs font-medium text-primary-700 dark:text-primary-300">
            <span>Activo</span>
          </div>
        )}
      </div>
      
      {/* Description text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {filter === 'all' && 'Mostrando todas las transacciones'}
        {filter === 'personal' && 'Mostrando solo transacciones personales'}
        {filter === 'business' && 'Mostrando solo transacciones de negocio'}
      </div>
    </div>
  );
}
