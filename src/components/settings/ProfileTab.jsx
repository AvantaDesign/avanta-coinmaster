import { useState } from 'react';

/**
 * Profile Tab - User Profile Settings
 * Phase 35: Centralized Settings Panel
 */

export default function ProfileTab({ settings, updateSettings, user }) {
  const [formData, setFormData] = useState({
    theme: settings?.theme || 'system',
    language: settings?.language || 'es',
    currency: settings?.currency || 'MXN',
    date_format: settings?.date_format || 'DD/MM/YYYY',
    time_format: settings?.time_format || '24h',
    decimal_separator: settings?.decimal_separator || '.',
    thousands_separator: settings?.thousands_separator || ','
  });

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSave = async () => {
    await updateSettings(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Perfil y Preferencias
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Personaliza tu experiencia en Avanta Finance
        </p>
      </div>

      {/* User Info - Read Only */}
      <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Información de Usuario
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg text-gray-900 dark:text-gray-100">
              {user?.name || 'N/A'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg text-gray-900 dark:text-gray-100">
              {user?.email || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Apariencia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tema
            </label>
            <select
              value={formData.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Idioma
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Configuración Regional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moneda
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de Fecha
            </label>
            <select
              value={formData.date_format}
              onChange={(e) => handleChange('date_format', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de Hora
            </label>
            <select
              value={formData.time_format}
              onChange={(e) => handleChange('time_format', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="12h">12 horas (AM/PM)</option>
              <option value="24h">24 horas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Separador Decimal
            </label>
            <select
              value={formData.decimal_separator}
              onChange={(e) => handleChange('decimal_separator', e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value=".">Punto (.)</option>
              <option value=",">Coma (,)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
