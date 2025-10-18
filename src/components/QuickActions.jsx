import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Nueva Transacción',
      description: 'Registrar ingreso o gasto',
      icon: '➕',
      color: 'primary',
      action: () => navigate('/transactions')
    },
    {
      title: 'Ver Dashboard',
      description: 'Ir al panel principal',
      icon: '🏠',
      color: 'blue',
      action: () => navigate('/')
    },
    {
      title: 'Cuentas',
      description: 'Gestionar cuentas bancarias',
      icon: '🏦',
      color: 'green',
      action: () => navigate('/accounts')
    },
    {
      title: 'Reportes',
      description: 'Ver análisis financieros',
      icon: '📊',
      color: 'purple',
      action: () => navigate('/reports')
    },
    {
      title: 'Facturas',
      description: 'Gestionar CFDI',
      icon: '📑',
      color: 'orange',
      action: () => navigate('/invoices')
    },
    {
      title: 'Flujo de Efectivo',
      description: 'Ver proyección',
      icon: '💵',
      color: 'teal',
      action: () => navigate('/cash-flow-projection')
    },
    {
      title: 'Tareas',
      description: 'Centro de tareas financieras',
      icon: '📋',
      color: 'indigo',
      action: () => navigate('/financial-tasks')
    },
    {
      title: 'Notificaciones',
      description: 'Ver alertas y recordatorios',
      icon: '🔔',
      color: 'red',
      action: () => navigate('/notifications')
    }
  ];

  const recentActivity = [
    { icon: '💰', text: 'Transacción registrada', time: 'Hace 5 minutos', color: 'green' },
    { icon: '📄', text: 'Factura importada', time: 'Hace 15 minutos', color: 'blue' },
    { icon: '✅', text: 'Tarea completada', time: 'Hace 1 hora', color: 'purple' },
    { icon: '📊', text: 'Reporte generado', time: 'Hace 2 horas', color: 'orange' }
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    };
    return colors[color] || colors.primary;
  };

  const getActivityColorClass = (color) => {
    const colors = {
      green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ⚡ Acciones Rápidas
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Accede rápidamente a las funciones más utilizadas
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`bg-gradient-to-br ${getColorClasses(action.color)} text-white rounded-lg shadow-lg p-6 transition-all transform hover:scale-105 hover:shadow-xl`}
          >
            <div className="text-4xl mb-3">{action.icon}</div>
            <h3 className="text-lg font-bold mb-1">{action.title}</h3>
            <p className="text-sm text-white/90 mb-3">{action.description}</p>
            <div className="text-xs text-white/70">
              <span>Haz clic para acceder</span>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🕐 Actividad Reciente
        </h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            >
              <div className={`p-2 rounded-lg ${getActivityColorClass(activity.color)}`}>
                <span className="text-xl">{activity.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {activity.text}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-3xl mb-3">💡</div>
          <h3 className="text-lg font-bold mb-2">Consejo del día</h3>
          <p className="text-blue-100">
            Usa el centro de tareas para organizar tus actividades financieras regulares y nunca olvides una obligación importante.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-bold mb-2">Dato importante</h3>
          <p className="text-purple-100">
            Revisa tu proyección de flujo de efectivo semanalmente para anticipar necesidades de liquidez y tomar decisiones informadas.
          </p>
        </div>
      </div>

      {/* Navigation Help */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🧭 Navegación Rápida
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">🏠</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Dashboard</div>
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">💳</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Transacciones</div>
          </button>
          <button
            onClick={() => navigate('/accounts')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">🏦</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Cuentas</div>
          </button>
          <button
            onClick={() => navigate('/budgets')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Presupuestos</div>
          </button>
          <button
            onClick={() => navigate('/fiscal')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">📄</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Fiscal</div>
          </button>
          <button
            onClick={() => navigate('/help')}
            className="p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            <div className="text-2xl mb-1">❓</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Ayuda</div>
          </button>
        </div>
      </div>
    </div>
  );
}
