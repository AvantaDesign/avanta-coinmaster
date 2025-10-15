import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from './components/AuthProvider';
import LoginForm from './components/LoginForm';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Fiscal from './pages/Fiscal';
import Invoices from './pages/Invoices';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Credits from './pages/Credits';
import Budgets from './pages/Budgets';
import AccountsReceivable from './components/AccountsReceivable';
import AccountsPayable from './components/AccountsPayable';
import InvoiceAutomation from './components/InvoiceAutomation';
import FinancialDashboard from './components/FinancialDashboard';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import AdvancedReports from './components/AdvancedReports';
import CustomizableDashboard from './components/CustomizableDashboard';
import ToastContainer from './components/ToastNotification';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import { initializeErrorMonitoring } from './utils/errorMonitoring';

// Analytics page tracking component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
}

// Navigation bar component with user info
function NavigationBar() {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Avanta Finance</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Transacciones
              </Link>
              <Link
                to="/accounts"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Cuentas
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Categorías
              </Link>
              <Link
                to="/credits"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Créditos
              </Link>
              <Link
                to="/budgets"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Presupuestos
              </Link>
              <Link
                to="/fiscal"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Fiscal
              </Link>
              <Link
                to="/invoices"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Facturas
              </Link>
              <Link
                to="/automation"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Automatización
              </Link>
              <Link
                to="/analytics"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Analytics
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                Reportes
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  {user.avatar && (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  {!user.avatar && (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.initials || 'U'}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 font-medium">{user.name || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:border-gray-400"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
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
            </Routes>
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
