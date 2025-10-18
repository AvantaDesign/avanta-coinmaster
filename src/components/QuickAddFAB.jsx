import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './icons/IconLibrary';

/**
 * Quick Add Floating Action Button
 * Provides quick access to common actions from anywhere in the app
 */
export default function QuickAddFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fabRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  // Close menu on route change
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  // Don't show on login/auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  // Quick actions definition
  const quickActions = [
    {
      id: 'add-income',
      name: 'Agregar Ingreso',
      icon: 'arrowTrendingUp',
      color: 'bg-success-500 hover:bg-success-600',
      action: () => navigate('/transactions?action=add&type=ingreso')
    },
    {
      id: 'add-expense',
      name: 'Agregar Gasto',
      icon: 'arrowTrendingDown',
      color: 'bg-danger-500 hover:bg-danger-600',
      action: () => navigate('/transactions?action=add&type=gasto')
    },
    {
      id: 'upload-receipt',
      name: 'Subir Recibo',
      icon: 'receipt',
      color: 'bg-info-500 hover:bg-info-600',
      action: () => navigate('/receipts?action=upload')
    },
    {
      id: 'add-savings-goal',
      name: 'Meta de Ahorro',
      icon: 'flag',
      color: 'bg-warning-500 hover:bg-warning-600',
      action: () => navigate('/savings-goals?action=add')
    },
    {
      id: 'create-budget',
      name: 'Crear Presupuesto',
      icon: 'documentCheck',
      color: 'bg-primary-500 hover:bg-primary-600',
      action: () => navigate('/budgets?action=add')
    }
  ];

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div 
      ref={fabRef}
      className="fixed bottom-6 right-6 z-50"
      style={{ 
        bottom: isMobile ? '80px' : '24px' // Adjust for mobile browser UI
      }}
    >
      {/* Quick Action Menu */}
      <div
        className={`absolute bottom-16 right-0 mb-4 space-y-2 transition-all duration-300 ${
          isExpanded 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {quickActions.map((action, index) => (
          <div
            key={action.id}
            className={`transform transition-all duration-300 ${
              isExpanded 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-12 opacity-0'
            }`}
            style={{ 
              transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
            }}
          >
            <button
              onClick={() => handleActionClick(action.action)}
              className={`${action.color} text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 min-w-[200px] group`}
              title={action.name}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Icon name={action.icon} size="md" className="text-white" />
              </div>
              <span className="font-medium text-sm">{action.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={handleToggle}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
        aria-label={isExpanded ? 'Cerrar menú rápido' : 'Abrir menú rápido'}
        aria-expanded={isExpanded}
      >
        <Icon 
          name="plus" 
          size="lg" 
          className="text-white transition-transform duration-300" 
        />
      </button>

      {/* Backdrop for mobile */}
      {isExpanded && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
