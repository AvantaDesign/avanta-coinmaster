import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './components/AuthProvider';
import { useTheme } from './components/ThemeProvider';
import LoginForm from './components/LoginForm';
import ToastContainer from './components/ToastNotification';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import { initializeErrorMonitoring } from './utils/errorMonitoring';

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
const CustomizableDashboard = lazy(() => import('./components/CustomizableDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

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
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

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
        { name: 'Facturas', icon: '📑', path: '/invoices' },
        { name: 'Cuentas por Cobrar', icon: '📈', path: '/receivables' },
        { name: 'Cuentas por Pagar', icon: '📉', path: '/payables' }
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
        { name: 'Reportes', icon: '📋', path: '/reports' },
        { name: 'Dashboard Personalizado', icon: '🎛️', path: '/dashboard' }
      ]
    }
  ];

  const toggleDropdown = (moduleName) => {
    setActiveDropdown(activeDropdown === moduleName ? null : moduleName);
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-lg dark:shadow-xl dark:shadow-black/20 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
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
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
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
        <div className="lg:hidden bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationModules.map((module) => (
              <div key={module.name}>
                {module.type === 'single' ? (
                  <Link
                    to={module.path}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-2 text-lg">{module.icon}</span>
                    {module.name}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleDropdown(module.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors"
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
                      <div className="pl-4 space-y-1">
                        {module.items.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                            onClick={() => {
                              setActiveDropdown(null);
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
  return (
    <>
      <AnalyticsTracker />
      <ToastContainer />
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
        <NavigationBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/fiscal" element={<Fiscal />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/automation" element={<FinancialDashboard />} />
                <Route path="/receivables" element={<AccountsReceivable />} />
                <Route path="/payables" element={<AccountsPayable />} />
                <Route path="/invoice-automation" element={<InvoiceAutomation />} />
                <Route path="/analytics" element={<AdvancedAnalytics transactions={[]} financialData={{}} />} />
                <Route path="/reports" element={<AdvancedReports data={{}} />} />
                <Route path="/dashboard" element={<CustomizableDashboard dashboardData={{}} />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              © 2025 Avanta Design - Mateo Reyes González - San Andrés Cholula, Puebla
            </p>
          </div>
        </footer>
      </div>
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
