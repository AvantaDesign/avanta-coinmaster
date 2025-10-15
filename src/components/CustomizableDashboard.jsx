import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import InteractiveCharts from './InteractiveCharts';
import AdvancedAnalytics from './AdvancedAnalytics';

/**
 * Customizable Dashboard Component
 * 
 * Allows users to:
 * - Add/remove widgets
 * - Rearrange widget layout
 * - Customize widget settings
 * - Save/load dashboard configurations
 */

const AVAILABLE_WIDGETS = [
  { id: 'balance', name: 'Balance General', icon: '💰', type: 'metric' },
  { id: 'income-expense', name: 'Ingresos vs Gastos', icon: '📊', type: 'chart' },
  { id: 'category-breakdown', name: 'Desglose por Categoría', icon: '🥧', type: 'chart' },
  { id: 'recent-transactions', name: 'Transacciones Recientes', icon: '📝', type: 'list' },
  { id: 'health-score', name: 'Salud Financiera', icon: '💓', type: 'metric' },
  { id: 'cash-flow', name: 'Flujo de Caja', icon: '📈', type: 'chart' },
  { id: 'top-categories', name: 'Top Categorías', icon: '🏆', type: 'list' },
  { id: 'monthly-trend', name: 'Tendencia Mensual', icon: '📉', type: 'chart' },
  { id: 'alerts', name: 'Alertas y Notificaciones', icon: '🔔', type: 'list' },
  { id: 'quick-actions', name: 'Acciones Rápidas', icon: '⚡', type: 'actions' }
];

export default function CustomizableDashboard({ dashboardData = {} }) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [widgetSettings, setWidgetSettings] = useState({});

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem('customDashboard');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setActiveWidgets(config.widgets || getDefaultWidgets());
        setWidgetSettings(config.settings || {});
      } catch (error) {
        setActiveWidgets(getDefaultWidgets());
      }
    } else {
      setActiveWidgets(getDefaultWidgets());
    }
  }, []);

  // Save configuration
  const saveConfiguration = () => {
    const config = {
      widgets: activeWidgets,
      settings: widgetSettings,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('customDashboard', JSON.stringify(config));
  };

  // Get default widgets
  function getDefaultWidgets() {
    return ['balance', 'income-expense', 'category-breakdown', 'recent-transactions'];
  }

  // Add widget
  const addWidget = (widgetId) => {
    if (!activeWidgets.includes(widgetId)) {
      const newWidgets = [...activeWidgets, widgetId];
      setActiveWidgets(newWidgets);
    }
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId));
  };

  // Move widget
  const moveWidget = (widgetId, direction) => {
    const index = activeWidgets.indexOf(widgetId);
    if (index === -1) return;

    const newWidgets = [...activeWidgets];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newWidgets.length) {
      [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      setActiveWidgets(newWidgets);
    }
  };

  // Reset to default
  const resetToDefault = () => {
    if (confirm('¿Restaurar configuración predeterminada?')) {
      setActiveWidgets(getDefaultWidgets());
      setWidgetSettings({});
      localStorage.removeItem('customDashboard');
    }
  };

  // Save and exit customization
  const saveAndExit = () => {
    saveConfiguration();
    setIsCustomizing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isCustomizing ? '✏️ Personalizar Dashboard' : '📊 Mi Dashboard'}
        </h2>
        <div className="flex gap-2">
          {isCustomizing ? (
            <>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                🔄 Restaurar
              </button>
              <button
                onClick={saveAndExit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                💾 Guardar
              </button>
              <button
                onClick={() => setIsCustomizing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                ✕ Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCustomizing(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              ✏️ Personalizar
            </button>
          )}
        </div>
      </div>

      {/* Customization Panel */}
      {isCustomizing && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">➕ Agregar Widgets</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {AVAILABLE_WIDGETS.map(widget => (
              <button
                key={widget.id}
                onClick={() => addWidget(widget.id)}
                disabled={activeWidgets.includes(widget.id)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  activeWidgets.includes(widget.id)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-100 border-2 border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{widget.icon}</div>
                <div className="text-xs font-medium">{widget.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeWidgets.map((widgetId, index) => {
          const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
          if (!widget) return null;

          return (
            <div key={widgetId} className="relative">
              {/* Widget Controls (when customizing) */}
              {isCustomizing && (
                <div className="absolute -top-3 -right-3 z-10 flex gap-1">
                  <button
                    onClick={() => moveWidget(widgetId, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveWidget(widgetId, 'down')}
                    disabled={index === activeWidgets.length - 1}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeWidget(widgetId)}
                    className="w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Widget Content */}
              <WidgetRenderer
                widgetId={widgetId}
                widget={widget}
                data={dashboardData}
                settings={widgetSettings[widgetId] || {}}
                isCustomizing={isCustomizing}
              />
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {activeWidgets.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            Dashboard vacío
          </h3>
          <p className="text-gray-500 mb-4">
            Agrega widgets para personalizar tu dashboard
          </p>
          <button
            onClick={() => setIsCustomizing(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ➕ Agregar Widgets
          </button>
        </div>
      )}
    </div>
  );
}

// Widget Renderer Component
function WidgetRenderer({ widgetId, widget, data, settings, isCustomizing }) {
  const renderWidget = () => {
    switch (widgetId) {
      case 'balance':
        return <BalanceWidget data={data} />;
      case 'income-expense':
        return <IncomeExpenseWidget data={data} />;
      case 'category-breakdown':
        return <CategoryBreakdownWidget data={data} />;
      case 'recent-transactions':
        return <RecentTransactionsWidget data={data} />;
      case 'health-score':
        return <HealthScoreWidget data={data} />;
      case 'cash-flow':
        return <CashFlowWidget data={data} />;
      case 'top-categories':
        return <TopCategoriesWidget data={data} />;
      case 'monthly-trend':
        return <MonthlyTrendWidget data={data} />;
      case 'alerts':
        return <AlertsWidget data={data} />;
      case 'quick-actions':
        return <QuickActionsWidget />;
      default:
        return <div>Widget no disponible</div>;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isCustomizing ? 'ring-2 ring-blue-300' : ''}`}>
      <div className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>{widget.icon}</span>
          <span>{widget.name}</span>
        </h3>
        {renderWidget()}
      </div>
    </div>
  );
}

// Individual Widget Components

function BalanceWidget({ data }) {
  const balance = data?.balance || 0;
  const income = data?.totalIncome || 0;
  const expenses = data?.totalExpenses || 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-1">Balance</div>
        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(balance)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-1">Ingresos</div>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(income)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-1">Gastos</div>
        <div className="text-2xl font-bold text-red-600">
          {formatCurrency(expenses)}
        </div>
      </div>
    </div>
  );
}

function IncomeExpenseWidget({ data }) {
  const chartData = data?.monthlyTrends?.slice(-6).map(m => ({
    label: new Date(m.month + '-01').toLocaleDateString('es-MX', { month: 'short' }),
    value1: m.income || 0,
    value2: m.expenses || 0,
    label1: 'Ingresos',
    label2: 'Gastos'
  })) || [];

  if (chartData.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay datos</div>;
  }

  return <InteractiveCharts data={chartData} type="comparison" />;
}

function CategoryBreakdownWidget({ data }) {
  const chartData = data?.categoryBreakdown?.map(c => ({
    name: c.category,
    value: Math.abs(c.total)
  })) || [];

  if (chartData.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay datos</div>;
  }

  return <InteractiveCharts data={chartData} type="donut" />;
}

function RecentTransactionsWidget({ data }) {
  const transactions = data?.recentTransactions?.slice(0, 5) || [];

  if (transactions.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay transacciones</div>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((t, i) => (
        <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{t.description}</div>
            <div className="text-xs text-gray-500">{t.date}</div>
          </div>
          <div className={`text-sm font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(t.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

function HealthScoreWidget({ data }) {
  const score = data?.healthScore || 0;
  const rating = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Aceptable' : 'Requiere atención';
  const color = score >= 80 ? 'green' : score >= 60 ? 'blue' : score >= 40 ? 'yellow' : 'red';

  return (
    <div className="text-center">
      <div className="text-6xl font-bold mb-2" style={{ color: color }}>{score}</div>
      <div className="text-xl font-bold mb-2">{rating}</div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full bg-${color}-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

function CashFlowWidget({ data }) {
  const chartData = data?.cashFlowForecast?.map(f => ({
    label: f.month,
    value: f.netCashFlow
  })) || [];

  if (chartData.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay pronóstico</div>;
  }

  return <InteractiveCharts data={chartData} type="line" />;
}

function TopCategoriesWidget({ data }) {
  const top = data?.topCategories?.slice(0, 5) || [];

  if (top.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay datos</div>;
  }

  return (
    <div className="space-y-2">
      {top.map((cat, i) => (
        <div key={i} className="flex justify-between items-center">
          <span className="text-sm">{i + 1}. {cat.name}</span>
          <span className="text-sm font-bold">{formatCurrency(cat.total)}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyTrendWidget({ data }) {
  const chartData = data?.monthlyTrends?.slice(-12).map(m => ({
    label: new Date(m.month + '-01').toLocaleDateString('es-MX', { month: 'short' }),
    value: (m.income || 0) - (m.expenses || 0)
  })) || [];

  if (chartData.length === 0) {
    return <div className="text-gray-500 text-center py-4">No hay datos</div>;
  }

  return <InteractiveCharts data={chartData} type="line" />;
}

function AlertsWidget({ data }) {
  const alerts = data?.alerts || [];

  if (alerts.length === 0) {
    return (
      <div className="text-center text-green-600 py-4">
        ✅ Todo en orden
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((alert, i) => (
        <div key={i} className={`p-2 rounded text-sm ${
          alert.severity === 'high' ? 'bg-red-50 text-red-700' :
          alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}

function QuickActionsWidget() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href="/transactions" className="p-3 bg-blue-50 hover:bg-blue-100 rounded text-center text-sm">
        ➕ Nueva Transacción
      </a>
      <a href="/invoices" className="p-3 bg-purple-50 hover:bg-purple-100 rounded text-center text-sm">
        📄 Subir Factura
      </a>
      <a href="/fiscal" className="p-3 bg-green-50 hover:bg-green-100 rounded text-center text-sm">
        💰 Ver Impuestos
      </a>
      <a href="/receivables" className="p-3 bg-orange-50 hover:bg-orange-100 rounded text-center text-sm">
        📊 Cuentas x Cobrar
      </a>
    </div>
  );
}
