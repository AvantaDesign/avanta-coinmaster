import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './components/AuthProvider';
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
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

// Navigation bar component with dropdowns and improved UI
function NavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
                <h1 className="text-2xl font-black text-blue-600 tracking-wider" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  AVANTA COINMASTER
                </h1>
              </Link>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navigationModules.map((module) => (
                <div key={module.name} className="relative dropdown-container">
                  {module.type === 'single' ? (
                    <Link
                      to={module.path}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                    >
                      <span className="mr-2">{module.icon}</span>
                      {module.name}
                    </Link>
                  ) : (
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => toggleDropdown(module.name)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      >
                        <span className="mr-2">{module.icon}</span>
                        {module.name}
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {activeDropdown === module.name && (
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 dropdown-container">
                          <div className="py-1">
                            {module.items.map((item) => (
                              <Link
                                key={item.name}
                                to={item.path}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <span className="mr-3">{item.icon}</span>
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* User Profile - Clickable to Admin */}
                <div className="flex items-center space-x-3">
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors duration-200 cursor-pointer"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="h-8 w-8 rounded-full ring-2 ring-blue-100"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-100">
                        {user.initials || 'U'}
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'Usuario'}</div>
                      <div className="text-xs text-gray-500">Panel de Administración</div>
                    </div>
                  </Link>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-gray-200 hover:border-red-200 transition-colors duration-200"
                  >
                    <span className="mr-1">🚪</span>
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                    <span className="sm:hidden">Salir</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {navigationModules.map((module) => (
            <div key={module.name}>
              {module.type === 'single' ? (
                <Link
                  to={module.path}
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <span className="mr-2">{module.icon}</span>
                  {module.name}
                </Link>
              ) : (
                <div>
                  <div className="flex items-center px-3 py-2 text-base font-medium text-gray-700">
                    <span className="mr-2">{module.icon}</span>
                    {module.name}
                  </div>
                  <div className="pl-6 space-y-1">
                    {module.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <span className="mr-2">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Main authenticated app layout
function AuthenticatedApp() {
  return (
    <>
      <AnalyticsTracker />
      <ToastContainer />
      <div className="min-h-screen bg-gray-100">
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

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
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
