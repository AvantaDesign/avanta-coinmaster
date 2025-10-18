import { useState, useEffect } from 'react';
import { fetchNotifications, markNotificationAsRead, dismissNotification, snoozeNotification } from '../utils/api';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, by type
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications({ unread: filter === 'unread' });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissNotification(id);
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleSnooze = async (id, hours) => {
    try {
      const snoozedUntil = new Date();
      snoozedUntil.setHours(snoozedUntil.getHours() + hours);
      await snoozeNotification(id, snoozedUntil.toISOString());
      await loadNotifications();
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  };

  const notificationTypes = [
    { key: 'payment_reminder', label: 'Recordatorios de Pago', icon: '💰', color: 'blue' },
    { key: 'tax_deadline', label: 'Fechas Fiscales', icon: '📋', color: 'red' },
    { key: 'financial_task', label: 'Tareas Financieras', icon: '✅', color: 'green' },
    { key: 'system_alert', label: 'Alertas del Sistema', icon: '⚠️', color: 'yellow' },
    { key: 'low_cash_flow', label: 'Flujo de Efectivo Bajo', icon: '📉', color: 'orange' },
    { key: 'budget_overrun', label: 'Exceso de Presupuesto', icon: '💸', color: 'purple' }
  ];

  const priorityConfig = {
    high: { label: 'Alta', color: 'red', icon: '🔴' },
    medium: { label: 'Media', color: 'yellow', icon: '🟡' },
    low: { label: 'Baja', color: 'green', icon: '🟢' }
  };

  const getTypeConfig = (type) => {
    return notificationTypes.find(t => t.key === type) || notificationTypes[0];
  };

  const getColorClass = (color, variant = 'bg') => {
    const colors = {
      blue: variant === 'bg' ? 'bg-blue-100 dark:bg-blue-900' : variant === 'text' ? 'text-blue-600 dark:text-blue-400' : 'border-blue-300',
      red: variant === 'bg' ? 'bg-red-100 dark:bg-red-900' : variant === 'text' ? 'text-red-600 dark:text-red-400' : 'border-red-300',
      green: variant === 'bg' ? 'bg-green-100 dark:bg-green-900' : variant === 'text' ? 'text-green-600 dark:text-green-400' : 'border-green-300',
      yellow: variant === 'bg' ? 'bg-yellow-100 dark:bg-yellow-900' : variant === 'text' ? 'text-yellow-600 dark:text-yellow-400' : 'border-yellow-300',
      orange: variant === 'bg' ? 'bg-orange-100 dark:bg-orange-900' : variant === 'text' ? 'text-orange-600 dark:text-orange-400' : 'border-orange-300',
      purple: variant === 'bg' ? 'bg-purple-100 dark:bg-purple-900' : variant === 'text' ? 'text-purple-600 dark:text-purple-400' : 'border-purple-300'
    };
    return colors[color] || colors.blue;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.is_read) return false;
    if (selectedType && n.type !== selectedType) return false;
    return true;
  });

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🔔 Centro de Notificaciones
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer` : 'No tienes notificaciones sin leer'}
            </p>
          </div>
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col gap-4">
          {/* Read/Unread Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Sin leer ({unreadCount})
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedType
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Todos los tipos
            </button>
            {notificationTypes.map(type => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === type.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread' 
                ? 'Todas tus notificaciones han sido leídas' 
                : 'No tienes notificaciones en este momento'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const typeConfig = getTypeConfig(notification.type);
            const priorityInfo = priorityConfig[notification.priority];
            
            return (
              <div
                key={notification.id}
                className={`bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all ${
                  !notification.is_read ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''
                }`}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getColorClass(typeConfig.color, 'bg')}`}>
                        <span className="text-2xl">{typeConfig.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getColorClass(typeConfig.color, 'bg')} ${getColorClass(typeConfig.color, 'text')}`}>
                            {typeConfig.label}
                          </span>
                          <span className="text-lg" title={`Prioridad ${priorityInfo.label}`}>
                            {priorityInfo.icon}
                          </span>
                          {!notification.is_read && (
                            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded">
                              Nuevo
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </h3>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(notification.created_at).toLocaleString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {notification.message}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
                      >
                        ✓ Marcar como leída
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Descartar
                    </button>
                    <div className="relative group">
                      <button className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors">
                        ⏰ Posponer
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-10">
                        <button
                          onClick={() => handleSnooze(notification.id, 1)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 first:rounded-t-lg"
                        >
                          1 hora
                        </button>
                        <button
                          onClick={() => handleSnooze(notification.id, 4)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                        >
                          4 horas
                        </button>
                        <button
                          onClick={() => handleSnooze(notification.id, 24)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 last:rounded-b-lg"
                        >
                          1 día
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
