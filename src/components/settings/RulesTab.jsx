/**
 * Rules Tab - Business Rules and Automation
 * Phase 35: Centralized Settings Panel
 */

export default function RulesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Reglas de Negocio
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configura reglas de automatización y deducibilidad
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deductibility Rules */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <span className="text-4xl">⚖️</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Reglas de Deducibilidad
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configura reglas automáticas para calcular la deducibilidad de gastos
          </p>
          <div className="mt-6">
            <a
              href="/deductibility-rules"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ir a Reglas →
            </a>
          </div>
        </div>

        {/* Automation Rules */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
          <span className="text-4xl">🤖</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Automatización
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configura reglas para automatizar la clasificación de transacciones
          </p>
          <div className="mt-6">
            <a
              href="/automation"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ir a Automatización →
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Información sobre Reglas
        </h3>
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Las reglas de negocio te permiten:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
            <li>Automatizar la clasificación de transacciones</li>
            <li>Calcular automáticamente la deducibilidad de gastos</li>
            <li>Configurar reglas basadas en patrones de texto</li>
            <li>Establecer porcentajes de deducibilidad por categoría</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
