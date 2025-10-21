import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './components/AuthProvider';
import { useTheme } from './components/ThemeProvider';
import LoginForm from './components/LoginForm';
import ToastContainer from './components/ToastNotification';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import { initializeErrorMonitoring } from './utils/errorMonitoring';
import { fetchNotifications } from './utils/api';

// Lazy load pages and heavy components for better performance
const Home = lazy(() => import('./pages/Home'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Fiscal = lazy(() => import('./pages/Fiscal'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Categories = lazy(() => import('./pages/Categories'));
const Credits = lazy(() => import('./pages/Credits'));
const Budgets = lazy(() => import('./pages/Budgets'));
const AccountsReceivable = lazy(() => import('./components/AccountsReceivable'));
const AccountsPayable = lazy(() => import('./components/AccountsPayable'));
const InvoiceAutomation = lazy(() => import('./components/InvoiceAutomation'));
const FinancialDashboard = lazy(() => import('./components/FinancialDashboard'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const AdvancedReports = lazy(() => import('./components/AdvancedReports'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
// Phase 34: Admin Panel Components
const AdminPanelDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
// Phase 42: Monitoring Dashboard
const AdminMonitoring = lazy(() => import('./pages/admin/Monitoring'));
const RecurringFreelancersDashboard = lazy(() => import('./components/RecurringFreelancersDashboard'));
const RecurringServicesDashboard = lazy(() => import('./components/RecurringServicesDashboard'));
const CashFlowProjection = lazy(() => import('./components/CashFlowProjection'));
const Debts = lazy(() => import('./components/Debts'));
const Investments = lazy(() => import('./components/Investments'));
const Tasks = lazy(() => import('./pages/Tasks'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const QuickActions = lazy(() => import('./components/QuickActions'));
const OnboardingGuide = lazy(() => import('./components/OnboardingGuide'));
const GlobalFilter = lazy(() => import('./components/GlobalFilter'));
const SavingsGoals = lazy(() => import('./pages/SavingsGoals'));
const Import = lazy(() => import('./pages/Import'));
const Receipts = lazy(() => import('./pages/Receipts'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const DeductibilityRules = lazy(() => import('./pages/DeductibilityRules'));
const Breadcrumbs = lazy(() => import('./components/Breadcrumbs'));
const QuickAddFAB = lazy(() => import('./components/QuickAddFAB'));
const CFDIManager = lazy(() => import('./components/CFDIManager'));
const TaxCalculations = lazy(() => import('./components/TaxCalculations'));
const BankReconciliation = lazy(() => import('./components/BankReconciliation'));
const SATDeclarations = lazy(() => import('./components/SATDeclarations'));
const AnnualDeclarations = lazy(() => import('./components/AnnualDeclarations'));
const FiscalAnalytics = lazy(() => import('./components/FiscalAnalytics'));
const DigitalArchive = lazy(() => import('./components/DigitalArchive'));
const ComplianceMonitoring = lazy(() => import('./components/ComplianceMonitoring'));
const SystemAuditTrail = lazy(() => import('./components/SystemAuditTrail'));
const TagManager = lazy(() => import('./components/TagManager'));
const ComplianceDashboard = lazy(() => import('./components/ComplianceDashboard'));
// Phase 35: Centralized Settings Panel
const Settings = lazy(() => import('./pages/Settings'));
// Phase 37: Advanced Demo Experience
const Demo = lazy(() => import('./pages/Demo'));
import DemoBanner from './components/demo/DemoBanner';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}

// Analytics page tracking component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
}

// Enhanced Navigation bar component with dark mode support
function NavigationBar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications({ unread: true, limit: 5 });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showNotifications]);

  // Close mobile menu when route changes
  const location = useLocation();
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setShowNotifications(false);
  }, [location]);

  // Define navigation modules with icons
  const navigationModules = [
    {
      name: 'Dashboard',
      icon: '🏠',
      path: '/',
      type: 'single'
    },
    {
      name: 'Finanzas',
      icon: '💰',
      type: 'dropdown',
      items: [
        { name: 'Transacciones', icon: '📊', path: '/transactions' },
        { name: 'Cuentas', icon: '🏦', path: '/accounts' },
        { name: 'Categorías', icon: '📂', path: '/categories' },
        { name: 'Etiquetas', icon: '🏷️', path: '/tags' },
        { name: 'Créditos', icon: '💳', path: '/credits' },
        { name: 'Presupuestos', icon: '📋', path: '/budgets' }
      ]
    },
    {
      name: 'Fiscal',
      icon: '📄',
      type: 'dropdown',
      items: [
        { name: 'Fiscal', icon: '🧾', path: '/fiscal' },
        { name: 'Cálculos Fiscales', icon: '🧮', path: '/tax-calculations' },
        { name: 'Declaración Anual', icon: '📊', path: '/annual-declarations' },
        { name: 'Analytics Fiscales', icon: '📈', path: '/fiscal-analytics' },
        { name: 'Conciliación Bancaria', icon: '🏦', path: '/bank-reconciliation' },
        { name: 'Gestor de CFDI', icon: '📋', path: '/cfdi-manager' },
        { name: 'Declaraciones SAT', icon: '📄', path: '/sat-declarations' },
        { name: 'Archivo Digital', icon: '🗄️', path: '/digital-archive' },
        { name: 'Monitoreo de Cumplimiento', icon: '🔍', path: '/compliance-monitoring' },
        { name: 'Panel de Cumplimiento', icon: '🛡️', path: '/compliance-dashboard' },
        { name: 'Auditoría del Sistema', icon: '📝', path: '/system-audit-trail' },
        { name: 'Facturas', icon: '📑', path: '/invoices' },
        { name: 'Recibos', icon: '🧾', path: '/receipts' },
        { name: 'Reglas de Deducibilidad', icon: '⚖️', path: '/deductibility-rules' },
        { name: 'Importar Datos', icon: '📥', path: '/import' },
        { name: 'Cuentas por Cobrar', icon: '📈', path: '/receivables' },
        { name: 'Cuentas por Pagar', icon: '📉', path: '/payables' }
      ]
    },
    {
      name: 'Operaciones',
      icon: '🔄',
      type: 'dropdown',
      items: [
        { name: 'Freelancers Recurrentes', icon: '👥', path: '/recurring-freelancers' },
        { name: 'Servicios Recurrentes', icon: '🔌', path: '/recurring-services' }
      ]
    },
    {
      name: 'Tesorería',
      icon: '💼',
      type: 'dropdown',
      items: [
        { name: 'Proyección de Flujo', icon: '💵', path: '/cash-flow-projection' },
        { name: 'Metas de Ahorro', icon: '🎯', path: '/savings-goals' },
        { name: 'Deudas', icon: '💳', path: '/debts' },
        { name: 'Inversiones', icon: '📈', path: '/investments' }
      ]
    },
    {
      name: 'Automatización',
      icon: '⚙️',
      type: 'dropdown',
      items: [
        { name: 'Automatización', icon: '🤖', path: '/automation' },
        { name: 'Automatización de Facturas', icon: '📄', path: '/invoice-automation' }
      ]
    },
    {
      name: 'Análisis',
      icon: '📊',
      type: 'dropdown',
      items: [
        { name: 'Analytics', icon: '📈', path: '/analytics' },
        { name: 'Reportes', icon: '📋', path: '/reports' }
      ]
    },
    {
      name: 'Ayuda',
      icon: '❓',
      type: 'dropdown',
      items: [
        { name: 'Centro de Ayuda', icon: '📚', path: '/help' },
        { name: 'Centro de Tareas', icon: '📋', path: '/tasks' },
        { name: 'Acciones Rápidas', icon: '⚡', path: '/quick-actions' },
        { name: 'Registro de Auditoría', icon: '🔒', path: '/audit-log' }
      ]
    },
    // Phase 35: Centralized Settings Panel
    {
      name: 'Configuración',
      icon: '⚙️',
      path: '/settings',
      type: 'single'
    }
  ];

  // Phase 34: Add admin navigation if user is admin
  if (user?.role === 'admin') {
    // Insert admin before settings
    const settingsIndex = navigationModules.findIndex(m => m.path === '/settings');
    navigationModules.splice(settingsIndex, 0, {
      name: 'Admin',
      icon: '🎛️',
      type: 'dropdown',
      items: [
        { name: 'Panel Admin', icon: '🎛️', path: '/admin' },
        { name: 'Gestión de Usuarios', icon: '👥', path: '/admin/users' },
        { name: 'Monitoreo del Sistema', icon: '📊', path: '/admin/monitoring' }
      ]
    });
  }

  const toggleDropdown = (moduleName) => {
    setActiveDropdown(activeDropdown === moduleName ? null : moduleName);
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-lg dark:shadow-xl dark:shadow-black/20 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
      <div className="w-full px-4 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200 group">
              <h1 className="text-xl font-black text-primary-500 dark:text-primary-400 tracking-wider" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                AVANTA
              </h1>
              <span className="ml-1 text-xl font-black text-primary-600 dark:text-primary-500 tracking-wider">COIN</span>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden xl:flex xl:items-center xl:space-x-1">
            {navigationModules.map((module) => (
              <div key={module.name} className="relative dropdown-container">
                {module.type === 'single' ? (
                  <Link
                    to={module.path}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-md transition-colors duration-200"
                  >
                    <span className="mr-1.5 text-base">{module.icon}</span>
                    {module.name}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleDropdown(module.name)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-md transition-colors duration-200"
                    >
                      <span className="mr-1.5 text-base">{module.icon}</span>
                      {module.name}
                      <svg className={`ml-1 h-4 w-4 transform transition-transform duration-200 ${activeDropdown === module.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {activeDropdown === module.name && (
                      <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl dark:shadow-black/30 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-50 dropdown-container">
                        <div className="py-2">
                          {module.items.map((item) => (
                            <Link
                              key={item.name}
                              to={item.path}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <span className="mr-3 text-base">{item.icon}</span>
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Right Section - Theme Toggle and User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notifications Bell */}
            {user && (
              <div className="relative notifications-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200 relative"
                  aria-label="Notificaciones"
                  title="Notificaciones"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl dark:shadow-black/30 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 z-50 notifications-container max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Notificaciones
                        </h3>
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/notifications');
                          }}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Ver todas
                        </button>
                      </div>
                    </div>
                    <div className="py-2">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <div className="text-4xl mb-2">📭</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No hay notificaciones nuevas
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              setShowNotifications(false);
                              navigate('/notifications');
                            }}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{notification.type === 'payment_reminder' ? '💰' : notification.type === 'tax_deadline' ? '📋' : '🔔'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {new Date(notification.created_at).toLocaleString('es-MX', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user && (
              <>
                {/* User Profile - Clickable to Admin */}
                <Link
                  to="/admin"
                  className="hidden sm:flex items-center space-x-2 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors duration-200 cursor-pointer group"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-9 w-9 rounded-full ring-2 ring-primary-200 dark:ring-primary-800 group-hover:ring-primary-400 dark:group-hover:ring-primary-600 transition-all"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-200 dark:ring-primary-800 group-hover:ring-primary-400 dark:group-hover:ring-primary-600 transition-all">
                      {user.initials || 'U'}
                    </div>
                  )}
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || 'Usuario'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
                  </div>
                </Link>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-danger-300 dark:hover:border-danger-800 transition-colors duration-200"
                  title="Cerrar sesión"
                >
                  <span className="hidden sm:inline">🚪</span>
                  <span className="hidden sm:inline ml-1">Salir</span>
                  <span className="sm:hidden">🚪</span>
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationModules.map((module) => (
              <div key={module.name}>
                {module.type === 'single' ? (
                  <Link
                    to={module.path}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-2 text-lg">{module.icon}</span>
                    {module.name}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleDropdown(module.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{module.icon}</span>
                        {module.name}
                      </div>
                      <svg className={`h-4 w-4 transform transition-transform ${activeDropdown === module.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeDropdown === module.name && (
                      <div className="pl-4 space-y-1 dropdown-container">
                        {module.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors touch-manipulation dropdown-container"
                            style={{ WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)' }}
                            onClick={(e) => {
                              // Prevent event bubbling to avoid closing dropdown
                              e.stopPropagation();
                              // Only close mobile menu, keep dropdown open for better UX
                              setMobileMenuOpen(false);
                            }}
                          >
                            <span className="mr-2 text-base">{item.icon}</span>
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// Main authenticated app layout
function AuthenticatedApp() {
  const location = useLocation();
  
  // Phase 34: Hide GlobalFilter on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <AnalyticsTracker />
      <ToastContainer />
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
        <NavigationBar />
        {/* Phase 37: Demo Mode Banner - shown when in demo mode */}
        <Suspense fallback={null}>
          <DemoBanner />
        </Suspense>
        <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Global Filter - hidden on admin routes (Phase 34) */}
            {!isAdminRoute && (
              <Suspense fallback={null}>
                <div className="mb-6">
                  <GlobalFilter />
                </div>
              </Suspense>
            )}
            
            {/* Breadcrumbs - contextual navigation */}
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
            
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<FinancialDashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/fiscal" element={<Fiscal />} />
                <Route path="/tax-calculations" element={<TaxCalculations />} />
                <Route path="/annual-declarations" element={<AnnualDeclarations />} />
                <Route path="/fiscal-analytics" element={<FiscalAnalytics />} />
                <Route path="/bank-reconciliation" element={<BankReconciliation />} />
                <Route path="/cfdi-manager" element={<CFDIManager />} />
                <Route path="/sat-declarations" element={<SATDeclarations />} />
                <Route path="/digital-archive" element={<DigitalArchive />} />
                <Route path="/compliance-monitoring" element={<ComplianceMonitoring />} />
                <Route path="/system-audit-trail" element={<SystemAuditTrail />} />
                <Route path="/tags" element={<TagManager />} />
                <Route path="/compliance-dashboard" element={<ComplianceDashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/automation" element={<Home />} />
                <Route path="/receivables" element={<AccountsReceivable />} />
                <Route path="/payables" element={<AccountsPayable />} />
                <Route path="/invoice-automation" element={<InvoiceAutomation />} />
                <Route path="/analytics" element={<AdvancedAnalytics transactions={[]} financialData={{}} />} />
                <Route path="/reports" element={<AdvancedReports data={{}} />} />
                {/* Phase 34: Admin Panel Routes */}
                <Route path="/admin" element={<AdminPanelDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                {/* Phase 42: Monitoring Dashboard */}
                <Route path="/admin/monitoring" element={<AdminMonitoring />} />
                <Route path="/recurring-freelancers" element={<RecurringFreelancersDashboard />} />
                <Route path="/recurring-services" element={<RecurringServicesDashboard />} />
                <Route path="/cash-flow-projection" element={<CashFlowProjection />} />
                <Route path="/savings-goals" element={<SavingsGoals />} />
                <Route path="/debts" element={<Debts />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/financial-tasks" element={<Tasks />} /> {/* Redirect old path */}
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/quick-actions" element={<QuickActions />} />
                <Route path="/onboarding" element={<OnboardingGuide />} />
                <Route path="/import" element={<Import />} />
                <Route path="/audit-log" element={<AuditLog />} />
                <Route path="/deductibility-rules" element={<DeductibilityRules />} />
                {/* Phase 35: Centralized Settings Panel */}
                <Route path="/settings" element={<Settings />} />
                {/* Phase 37: Advanced Demo Experience */}
                <Route path="/demo" element={<Demo />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              © 2025 Avanta Design
            </p>
          </div>
        </footer>
      </div>
      
      {/* Quick Add Floating Action Button */}
      <Suspense fallback={null}>
        <QuickAddFAB />
      </Suspense>
    </>
  );
}

function App() {
  // Initialize analytics and error monitoring on app load
  useEffect(() => {
    initializeAnalytics();
    initializeErrorMonitoring();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
