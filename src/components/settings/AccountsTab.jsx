/**
 * Accounts Tab - Account Settings Management
 * Phase 35: Centralized Settings Panel
 */

export default function AccountsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configuración de Cuentas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Administra tus cuentas bancarias y de efectivo
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <span className="text-4xl">🏦</span>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Gestión de Cuentas
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          La gestión detallada de cuentas está disponible en la sección principal de{' '}
          <a href="/accounts" className="text-primary-600 dark:text-primary-400 hover:underline">
            Cuentas
          </a>
        </p>
        <div className="mt-6">
          <a
            href="/accounts"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ir a Cuentas →
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Preferencias de Cuentas
        </h3>
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Las preferencias específicas de cuentas se gestionan desde la página principal de cuentas.
          </p>
        </div>
      </div>
    </div>
  );
}
