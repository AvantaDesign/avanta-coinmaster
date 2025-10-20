/**
 * Categories Tab - Category Management
 * Phase 35: Centralized Settings Panel
 */

export default function CategoriesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Gestión de Categorías
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Administra las categorías de tus transacciones
        </p>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 text-center">
        <span className="text-4xl">📂</span>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Gestión de Categorías
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          La gestión detallada de categorías está disponible en la sección principal de{' '}
          <a href="/categories" className="text-primary-600 dark:text-primary-400 hover:underline">
            Categorías
          </a>
        </p>
        <div className="mt-6">
          <a
            href="/categories"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Ir a Categorías →
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Información
        </h3>
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Desde la página de categorías puedes:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
            <li>Crear nuevas categorías personalizadas</li>
            <li>Editar categorías existentes</li>
            <li>Configurar categorías de ingresos y gastos</li>
            <li>Establecer categorías fiscales</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
