import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { showSuccess, showError } from '../utils/notifications';
import ProfileTab from '../components/settings/ProfileTab';
import FiscalTab from '../components/settings/FiscalTab';
import AccountsTab from '../components/settings/AccountsTab';
import CategoriesTab from '../components/settings/CategoriesTab';
import RulesTab from '../components/settings/RulesTab';
import SecurityTab from '../components/settings/SecurityTab';

/**
 * Settings Page - Centralized Settings Panel
 * Phase 35: Centralized Settings Panel
 * 
 * Unified settings interface with tabbed navigation
 */

const TABS = [
  { id: 'profile', name: 'Perfil', icon: '👤', component: ProfileTab },
  { id: 'fiscal', name: 'Fiscal', icon: '📄', component: FiscalTab },
  { id: 'accounts', name: 'Cuentas', icon: '🏦', component: AccountsTab },
  { id: 'categories', name: 'Categorías', icon: '📂', component: CategoriesTab },
  { id: 'rules', name: 'Reglas', icon: '⚙️', component: RulesTab },
  { id: 'security', name: 'Seguridad', icon: '🔒', component: SecurityTab }
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar configuración');

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      });

      if (!response.ok) throw new Error('Error al actualizar configuración');

      const data = await response.json();
      setSettings({ ...settings, ...data.updated });
      showSuccess('Configuración actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      showError('Error al actualizar configuración');
      return false;
    }
  };

  const resetSettings = async () => {
    if (!confirm('¿Estás seguro de que deseas restablecer toda la configuración a los valores predeterminados?')) {
      return;
    }

    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al restablecer configuración');

      const data = await response.json();
      setSettings(data.settings);
      showSuccess('Configuración restablecida exitosamente');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showError('Error al restablecer configuración');
    }
  };

  const ActiveTabComponent = TABS.find(tab => tab.id === activeTab)?.component;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              Configuración
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona todas las preferencias de tu cuenta
            </p>
          </div>
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-slate-700 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors"
          >
            🔄 Restablecer
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        {/* Desktop Tabs */}
        <div className="hidden md:block border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-1 px-4" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tabs - Dropdown */}
        <div className="md:hidden border-b border-gray-200 dark:border-slate-700 p-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.icon} {tab.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveTabComponent && (
            <ActiveTabComponent
              settings={settings}
              updateSettings={updateSettings}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  );
}
