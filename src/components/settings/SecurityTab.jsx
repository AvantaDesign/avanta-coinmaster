import { useState } from 'react';
import { showSuccess, showError, showInfo } from '../../utils/notifications';

/**
 * Security Tab - Security and Notifications Settings
 * Phase 35: Centralized Settings Panel
 */

export default function SecurityTab({ settings, updateSettings }) {
  const [notificationSettings, setNotificationSettings] = useState({
    notifications_enabled: settings?.notifications_enabled ?? true,
    email_notifications: settings?.email_notifications ?? true
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleSaveNotifications = async () => {
    await updateSettings(notificationSettings);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // TODO: Implement password change API call
    showError('Funcionalidad de cambio de contraseña en desarrollo');
    
    // Reset form
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Seguridad y Notificaciones
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Gestiona la seguridad de tu cuenta y preferencias de notificación
        </p>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Notificaciones
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notificaciones en la aplicación
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recibe notificaciones dentro de la aplicación
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.notifications_enabled}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  notifications_enabled: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notificaciones por correo electrónico
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recibe notificaciones importantes por correo
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.email_notifications}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  email_notifications: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotifications}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Guardar Preferencias
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Cambiar Contraseña
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Mínimo 8 caracteres
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>

      {/* Security Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Información de Seguridad
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Tu cuenta está protegida
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                <li>Todas las contraseñas están cifradas</li>
                <li>Las sesiones expiran automáticamente</li>
                <li>Registro de auditoría de todas las acciones</li>
                <li>Acceso seguro mediante HTTPS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
