import { useState, useEffect } from 'react';
import { 
  fetchReceivables, 
  fetchPayables, 
  fetchAutomationRules, 
  fetchAccounts,
  fetchDebts,
  fetchPortfolioSummary,
  fetchCashFlowProjection,
  fetchNotifications,
  fetchFinancialTasks
} from '../utils/api';
import { calculateCollectionMetrics } from '../utils/receivables';
import { calculatePaymentMetrics } from '../utils/payables';
import { calculateCashFlowForecast, calculateFinancialHealthIndicators, generateAutomatedAlerts, calculateAutomationMetrics } from '../utils/automation';
import { formatCurrency } from '../utils/calculations';
import AccountBreakdown from './AccountBreakdown';
import BudgetSummaryWidget from './BudgetSummaryWidget';
import UpcomingPayments from './UpcomingPayments';
import Icon from './icons/IconLibrary';

export default function FinancialDashboard() {
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [debts, setDebts] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [cashFlowSummary, setCashFlowSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        receivablesData, 
        payablesData, 
        rulesData, 
        accountsData,
        debtsData,
        portfolioData,
        cashFlowData,
        notificationsData,
        tasksData
      ] = await Promise.all([
        fetchReceivables(),
        fetchPayables(),
        fetchAutomationRules(),
        fetchAccounts(),
        fetchDebts({ status: 'active' }).catch(() => []),
        fetchPortfolioSummary().catch(() => null),
        fetchCashFlowProjection({ days: 30, scenario: 'realistic' }).catch(() => null),
        fetchNotifications({ unread: true }).catch(() => ({ notifications: [], unreadCount: 0 })),
        fetchFinancialTasks().catch(() => ({ tasks: [], stats: [] }))
      ]);
      setReceivables(receivablesData);
      setPayables(payablesData);
      setAutomationRules(rulesData);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setDebts(debtsData);
      setPortfolio(portfolioData);
      setCashFlowSummary(cashFlowData);
      setNotifications(notificationsData.notifications || []);
      setUnreadCount(notificationsData.unreadCount || 0);
      setTasks(tasksData.tasks || []);
      setTaskStats(tasksData.stats || []);
      
      // Extract credits from accounts (credit cards)
      const creditCards = Array.isArray(accountsData) 
        ? accountsData.filter(acc => acc.type === 'tarjeta') 
        : [];
      setCredits(creditCards);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  const receivablesMetrics = calculateCollectionMetrics(receivables);
  const payablesMetrics = calculatePaymentMetrics(payables);
  const cashFlowForecast = calculateCashFlowForecast(receivables, payables, forecastDays);
  const healthIndicators = calculateFinancialHealthIndicators(receivablesMetrics, payablesMetrics, cashFlowForecast);
  const alerts = generateAutomatedAlerts(receivables, payables, healthIndicators);
  const automationMetrics = calculateAutomationMetrics(automationRules);

  const getHealthColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return <Icon name="error" size="md" className="text-red-600" />;
      case 'warning': return <Icon name="warning" size="md" className="text-warning-600" />;
      case 'info': return <Icon name="info" size="md" className="text-info-600" />;
      default: return <Icon name="bell" size="md" className="text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-500 text-red-900';
      case 'warning': return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'info': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Financiero</h1>
        <div className="flex items-center gap-3">
          <a
            href="/quick-actions"
            className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center gap-2"
          >
            <Icon name="plus" size="sm" />
            Acciones Rápidas
          </a>
          <button
            onClick={loadData}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2"
          >
            <Icon name="refresh" size="sm" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Account Balances and Budget Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountBreakdown accounts={accounts} />
        <BudgetSummaryWidget />
      </div>

      {/* Notifications and Tasks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notifications Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Icon name="bell" size="md" />
              Notificaciones
            </h3>
            <a 
              href="/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Ver todas →
            </a>
          </div>
          
          {unreadCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  Tienes {unreadCount} {unreadCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}
                </span>
              </div>
              
              {notifications.slice(0, 3).map((notif, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="mt-0.5">
                    {notif.type === 'payment_reminder' && <Icon name="currency" size="md" className="text-green-600" />}
                    {notif.type === 'tax_deadline' && <Icon name="document" size="md" className="text-blue-600" />}
                    {notif.type === 'financial_task' && <Icon name="check-circle" size="md" className="text-success-600" />}
                    {notif.type === 'system_alert' && <Icon name="warning" size="md" className="text-warning-600" />}
                    {notif.type === 'low_cash_flow' && <Icon name="trending-down" size="md" className="text-red-600" />}
                    {notif.type === 'budget_overrun' && <Icon name="error" size="md" className="text-danger-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Icon name="check-circle" size="2xl" className="text-success-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No tienes notificaciones pendientes
              </p>
            </div>
          )}
        </div>

        {/* Tasks Summary Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
              <Icon name="document" size="md" />
              Tareas Pendientes
            </h3>
            <a 
              href="/financial-tasks"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Ver todas →
            </a>
          </div>
          
          {taskStats.length > 0 ? (
            <div className="space-y-3">
              {taskStats.map((stat, idx) => {
                const pending = stat.total - stat.completed;
                const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                const frequencyLabels = {
                  daily: { label: 'Diarias', icon: 'calendar' },
                  weekly: { label: 'Semanales', icon: 'calendar' },
                  monthly: { label: 'Mensuales', icon: 'chart' },
                  quarterly: { label: 'Trimestrales', icon: 'trending-up' },
                  annual: { label: 'Anuales', icon: 'document' }
                };
                const freqInfo = frequencyLabels[stat.frequency] || { label: stat.frequency, icon: 'clock' };
                
                return (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Icon name={freqInfo.icon} size="sm" className="text-gray-600" />
                        {freqInfo.label}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {stat.completed}/{stat.total} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {pending > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {pending} {pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}
                      </p>
                    )}
                  </div>
                );
              })}
              
              {taskStats.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No hay tareas registradas
                  </p>
                  <a 
                    href="/financial-tasks"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mt-2 inline-block"
                  >
                    Inicializar tareas →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Organiza tus actividades financieras
              </p>
              <a 
                href="/financial-tasks"
                className="inline-block px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                Ir al Centro de Tareas
              </a>
            </div>
          )}
        </div>
      </div>

      {/* AP/AR Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
            <Icon name="trending-up" size="md" />
            Cuentas por Cobrar
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(receivablesMetrics.totalOutstanding)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Facturas Pendientes</span>
              <span className="text-lg font-semibold">
                {receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Vencidas</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {receivables.filter(r => {
                  const today = new Date().toISOString().split('T')[0];
                  return r.due_date < today && r.status !== 'paid' && r.status !== 'cancelled';
                }).length}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
              <a 
                href="/receivables"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Ver detalles →
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
            <Icon name="trending-down" size="md" />
            Cuentas por Pagar
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(payablesMetrics.totalOutstanding)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Facturas Pendientes</span>
              <span className="text-lg font-semibold">
                {payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Vencidas</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {payables.filter(p => {
                  const today = new Date().toISOString().split('T')[0];
                  return p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled';
                }).length}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
              <a 
                href="/payables"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Ver detalles →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Treasury Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <Icon name="briefcase" size="md" />
            Resumen de Tesorería
          </h3>
          <a 
            href="/cash-flow-projection"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Ver proyección completa →
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash Flow Projection Summary */}
          {cashFlowSummary && (
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Proyección 30 días</div>
              <div className={`text-2xl font-bold ${
                cashFlowSummary.summary.final_projected_balance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(cashFlowSummary.summary.final_projected_balance)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Balance proyectado
              </div>
              {cashFlowSummary.critical_days_count > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Icon name="warning" size="xs" />
                  {cashFlowSummary.critical_days_count} días críticos
                </div>
              )}
            </div>
          )}

          {/* Debts Summary */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <a href="/debts" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5">
                <Icon name="credit-card" size="sm" />
                Deudas Activas
              </a>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(debts.reduce((sum, d) => sum + (d.current_balance || 0), 0))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {debts.length} {debts.length === 1 ? 'deuda' : 'deudas'}
            </div>
            {debts.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Pago mensual: {formatCurrency(debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0))}
              </div>
            )}
          </div>

          {/* Investments Summary */}
          {portfolio && (
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <a href="/investments" className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5">
                  <Icon name="trending-up" size="sm" />
                  Portafolio de Inversiones
                </a>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(portfolio.total_current_value)}
              </div>
              <div className={`text-xs mt-1 ${
                portfolio.percent_return >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {portfolio.percent_return >= 0 ? '+' : ''}{portfolio.percent_return.toFixed(2)}% rendimiento
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {portfolio.active_investments} {portfolio.active_investments === 1 ? 'inversión' : 'inversiones'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Payments */}
      {credits.length > 0 && (
        <UpcomingPayments credits={credits} onPaymentClick={(payment) => {
          // Navigate to credits page or show payment dialog
          window.location.href = '/credits';
        }} />
      )}

      {/* Financial Health Score */}
      <div className={`p-6 rounded-lg shadow-lg ${getHealthColor(healthIndicators.healthLevel)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-75">Salud Financiera</div>
            <div className="text-5xl font-bold mt-2">{healthIndicators.healthScore}/100</div>
            <div className="text-sm mt-1 capitalize">{healthIndicators.healthLevel}</div>
          </div>
          <div className="text-6xl">
            {healthIndicators.healthLevel === 'excellent' && '🎉'}
            {healthIndicators.healthLevel === 'good' && '👍'}
            {healthIndicators.healthLevel === 'fair' && '⚡'}
            {healthIndicators.healthLevel === 'poor' && '⚠️'}
          </div>
        </div>
      </div>

      {/* Automated Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Alertas Automatizadas</h2>
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-sm mt-1">{alert.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">Cuentas por Cobrar</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(receivablesMetrics.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').length} pendientes</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">Cuentas por Pagar</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(payablesMetrics.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length} pendientes</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">DSO (Días)</div>
          <div className="text-2xl font-bold text-blue-600">{healthIndicators.dso}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Días promedio de cobro</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">DPO (Días)</div>
          <div className="text-2xl font-bold text-purple-600">{healthIndicators.dpo}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Días promedio de pago</div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pronóstico de Flujo de Efectivo</h2>
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(parseInt(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="30">30 días</option>
            <option value="60">60 días</option>
            <option value="90">90 días</option>
          </select>
        </div>
        
        {healthIndicators.hasCashCrunch && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mb-4 rounded">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <div>
                <div className="font-medium text-red-900">Alerta de Déficit de Efectivo</div>
                <div className="text-sm text-red-700">
                  Se detectan {healthIndicators.cashCrunchDays} día(s) con déficit. 
                  Posición más baja: {formatCurrency(healthIndicators.worstCashPosition)}
                </div>
              </div>
            </div>
          </div>
        )}

        {cashFlowForecast.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">No hay movimientos pronosticados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Entradas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Salidas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Flujo Neto</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Balance Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {cashFlowForecast.slice(0, 15).map((item, idx) => (
                  <tr key={idx} className={item.runningBalance < 0 ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 text-sm">{item.formattedDate}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600">
                      {item.inflow > 0 ? formatCurrency(item.inflow) : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">
                      {item.outflow > 0 ? formatCurrency(item.outflow) : '-'}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-medium ${item.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.netFlow)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-bold ${item.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(item.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automation Status */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Estado de Automatización</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{automationMetrics.activeRules}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reglas Activas</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{automationMetrics.recurringInvoiceCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Facturas Recurrentes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{automationMetrics.paymentReminderCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recordatorios</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">{automationMetrics.rulesToRunToday}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Por Ejecutar Hoy</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">Ciclo de Conversión de Efectivo</div>
          <div className="text-3xl font-bold text-blue-600">{healthIndicators.cashConversionCycle}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">días (DSO - DPO)</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">Ratio Rápido</div>
          <div className="text-3xl font-bold text-purple-600">{healthIndicators.quickRatio.toFixed(2)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cuentas por Cobrar / Pagar</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Cobranza</div>
          <div className="text-3xl font-bold text-green-600">{receivablesMetrics.collectionRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Efectividad de cobro</div>
        </div>
      </div>
    </div>
  );
}
