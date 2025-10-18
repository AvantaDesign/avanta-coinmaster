import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'getting-started', name: 'Primeros Pasos', icon: '🚀' },
    { id: 'transactions', name: 'Transacciones', icon: '💳' },
    { id: 'fiscal', name: 'Fiscal', icon: '📄' },
    { id: 'deductibility', name: 'Deducibilidad', icon: '✅' },
    { id: 'reports', name: 'Reportes', icon: '📊' },
    { id: 'treasury', name: 'Tesorería', icon: '💼' },
    { id: 'automation', name: 'Automatización', icon: '⚙️' },
    { id: 'interface', name: 'Interfaz', icon: '🎨' }
  ];

  const faqs = [
    {
      category: 'getting-started',
      question: '¿Cómo empiezo a usar Avanta Finance?',
      answer: 'Para comenzar, primero configura tus cuentas bancarias en la sección de Cuentas. Luego, define tus categorías de ingresos y gastos. Finalmente, empieza a registrar tus transacciones diarias. Puedes activar la Guía de Inicio desde el menú Ayuda para un recorrido completo.'
    },
    {
      category: 'getting-started',
      question: '¿Cómo configuro mis cuentas bancarias?',
      answer: 'Ve a Finanzas → Cuentas. Haz clic en "Agregar Cuenta" y completa los datos: nombre del banco, tipo de cuenta, y saldo inicial. Puedes agregar cuentas bancarias, tarjetas de crédito, efectivo e inversiones.'
    },
    {
      category: 'getting-started',
      question: '¿Dónde veo mis notificaciones?',
      answer: 'Las notificaciones se encuentran en el ícono de campana 🔔 en la barra superior derecha. Haz clic en la campana para ver un resumen de tus últimas 5 notificaciones. El número en el badge rojo indica cuántas notificaciones no leídas tienes. Haz clic en "Ver todas" para acceder al Centro de Notificaciones completo.'
    },
    {
      category: 'transactions',
      question: '¿Cómo registro una transacción?',
      answer: 'Ve a Finanzas → Transacciones y haz clic en "Nueva Transacción". Selecciona el tipo (ingreso o gasto), la cuenta, categoría, monto, fecha y descripción. Puedes adjuntar archivos XML o PDF de tus comprobantes fiscales. Para gastos, también puedes especificar la deducibilidad fiscal detallada.'
    },
    {
      category: 'transactions',
      question: '¿Puedo editar o eliminar transacciones?',
      answer: 'Sí, puedes editar o eliminar cualquier transacción desde la lista de transacciones. Las eliminaciones se realizan de forma suave (soft delete) para mantener un historial completo.'
    },
    {
      category: 'transactions',
      question: '¿Cómo categorizo mis transacciones?',
      answer: 'Al crear o editar una transacción, selecciona la categoría apropiada. Puedes crear y gestionar tus propias categorías en Finanzas → Categorías. Es recomendable usar categorías consistentes para mejores reportes.'
    },
    {
      category: 'fiscal',
      question: '¿Cómo calculo mis impuestos?',
      answer: 'Ve a Fiscal → Fiscal para usar la calculadora fiscal. El sistema calcula automáticamente ISR, IVA e IEPS según tu régimen fiscal, utilizando la deducibilidad granular de tus gastos para cálculos más precisos.'
    },
    {
      category: 'fiscal',
      question: '¿Cómo gestiono mis facturas (CFDI)?',
      answer: 'En Fiscal → Facturas puedes importar archivos XML de tus CFDI. El sistema los vincula automáticamente con tus transacciones y los organiza para tus declaraciones fiscales.'
    },
    {
      category: 'fiscal',
      question: '¿Qué régimen fiscal debo usar?',
      answer: 'El sistema está diseñado para "Persona Física con Actividad Empresarial". Consulta con tu contador para determinar el régimen fiscal más adecuado para tu situación específica.'
    },
    {
      category: 'deductibility',
      question: '¿Qué es la deducibilidad granular?',
      answer: 'La deducibilidad granular te permite especificar por separado si un gasto es deducible para ISR y si el IVA es acreditable. Esto proporciona cálculos fiscales más precisos según las regulaciones del SAT para Personas Físicas con Actividad Empresarial.'
    },
    {
      category: 'deductibility',
      question: '¿Cuál es la diferencia entre ISR deducible e IVA acreditable?',
      answer: 'ISR Deducible significa que el gasto puede reducir tu base gravable para el Impuesto Sobre la Renta. IVA Acreditable significa que el IVA pagado en ese gasto puede acreditarse contra el IVA cobrado. Un gasto puede ser deducible para ISR pero no tener IVA acreditable (por ejemplo, gastos internacionales sin factura mexicana).'
    },
    {
      category: 'deductibility',
      question: '¿Qué son los tipos de gasto?',
      answer: 'Los tipos de gasto clasifican tus gastos según el SAT: Nacional (gastos en México con factura mexicana), Internacional con Factura (gastos en el extranjero con factura mexicana o válida), e Internacional sin Factura (gastos en el extranjero sin factura mexicana, donde el IVA NO es acreditable).'
    },
    {
      category: 'deductibility',
      question: '¿Cómo marco la deducibilidad al registrar un gasto?',
      answer: 'Al crear o editar un gasto, encontrarás la sección "Deducibilidad Fiscal" donde puedes marcar: ✓ Deducible ISR (si el gasto es deducible para ISR), ✓ IVA Acreditable (si el IVA es acreditable), y seleccionar el Tipo de Gasto apropiado.'
    },
    {
      category: 'deductibility',
      question: '¿Qué son las reglas de deducibilidad?',
      answer: 'Las reglas de deducibilidad te permiten crear reglas automáticas para clasificar tus gastos. Por ejemplo, puedes crear una regla que marque automáticamente todos los gastos de transporte como deducibles. Accede a ellas en Fiscal → Reglas de Deducibilidad.'
    },
    {
      category: 'deductibility',
      question: '¿Cómo creo una regla de deducibilidad?',
      answer: 'Ve a Fiscal → Reglas de Deducibilidad y haz clic en "Nueva Regla". Define criterios de coincidencia (categoría, palabras clave, rangos de monto) y las acciones a aplicar (marcar ISR deducible, IVA acreditable, tipo de gasto). Las reglas se evalúan por prioridad.'
    },
    {
      category: 'deductibility',
      question: '¿Los gastos internacionales son deducibles?',
      answer: 'Depende. Los gastos internacionales CON factura mexicana o comprobante válido pueden ser deducibles para ISR y tener IVA acreditable si cumplen requisitos. Los gastos internacionales SIN factura mexicana pueden ser deducibles para ISR pero el IVA NO es acreditable según el SAT.'
    },
    {
      category: 'reports',
      question: '¿Qué reportes puedo generar?',
      answer: 'Avanta Finance ofrece múltiples reportes: Estado de Resultados, Balance General, Flujo de Efectivo, Análisis de Rentabilidad, Reportes Fiscales, y más. Accede a ellos desde Análisis → Reportes.'
    },
    {
      category: 'reports',
      question: '¿Cómo exporto mis reportes?',
      answer: 'La mayoría de los reportes tienen opciones de exportación en formatos CSV y JSON. Haz clic en el botón "Exportar" en la parte superior del reporte.'
    },
    {
      category: 'treasury',
      question: '¿Qué es la proyección de flujo de efectivo?',
      answer: 'La proyección de flujo de efectivo anticipa tus saldos futuros basándose en tus ingresos, gastos, cuentas por cobrar, cuentas por pagar, y pagos recurrentes. Te ayuda a planificar y evitar problemas de liquidez.'
    },
    {
      category: 'treasury',
      question: '¿Cómo gestiono mis deudas?',
      answer: 'En Tesorería → Deudas puedes registrar préstamos, créditos y financiamientos. El sistema calcula automáticamente las tablas de amortización y te recuerda los pagos próximos.'
    },
    {
      category: 'treasury',
      question: '¿Cómo registro mis inversiones?',
      answer: 'Ve a Tesorería → Inversiones para registrar tus inversiones. Puedes hacer seguimiento del valor, rendimientos, y ver el resumen completo de tu portafolio.'
    },
    {
      category: 'automation',
      question: '¿Qué es la automatización de facturas?',
      answer: 'La automatización de facturas vincula automáticamente tus CFDI con transacciones existentes o crea nuevas transacciones. Esto ahorra tiempo y reduce errores en tu contabilidad.'
    },
    {
      category: 'automation',
      question: '¿Cómo funcionan los pagos recurrentes?',
      answer: 'En Operaciones puedes configurar pagos recurrentes para freelancers y servicios. El sistema te recordará los pagos y puede generar transacciones automáticamente según la frecuencia configurada.'
    },
    {
      category: 'interface',
      question: '¿Cómo activo el modo oscuro?',
      answer: 'Haz clic en el ícono de sol/luna 🌙 en la barra superior derecha para cambiar entre modo claro y modo oscuro. El sistema recordará tu preferencia para futuras sesiones.'
    },
    {
      category: 'interface',
      question: '¿Cómo navego en la aplicación desde dispositivos móviles?',
      answer: 'En pantallas pequeñas (móviles y tablets), encontrarás un menú de hamburguesa ☰ en la esquina superior izquierda. Haz clic en él para abrir el menú de navegación completo. En pantallas más grandes (escritorio), el menú se muestra siempre visible.'
    },
    {
      category: 'interface',
      question: '¿Qué significan los badges de colores en las transacciones?',
      answer: 'Los badges indican la deducibilidad fiscal: Badge azul (ISR) = gasto deducible para ISR, Badge verde (IVA) = IVA acreditable, Badge naranja con 🌍 = gasto internacional. Estos indicadores te ayudan a identificar rápidamente el tratamiento fiscal de cada transacción.'
    }
  ];

  const quickLinks = [
    { title: 'Dashboard Principal', path: '/', icon: '🏠' },
    { title: 'Transacciones', path: '/transactions', icon: '💳' },
    { title: 'Cuentas', path: '/accounts', icon: '🏦' },
    { title: 'Presupuestos', path: '/budgets', icon: '📋' },
    { title: 'Fiscal', path: '/fiscal', icon: '📄' },
    { title: 'Reglas de Deducibilidad', path: '/deductibility-rules', icon: '✅' },
    { title: 'Facturas', path: '/invoices', icon: '📑' },
    { title: 'Cuentas por Cobrar', path: '/receivables', icon: '📈' },
    { title: 'Cuentas por Pagar', path: '/payables', icon: '📉' },
    { title: 'Proyección de Flujo', path: '/cash-flow-projection', icon: '💵' },
    { title: 'Reportes', path: '/reports', icon: '📊' },
    { title: 'Centro de Tareas', path: '/financial-tasks', icon: '📋' },
    { title: 'Notificaciones', path: '/notifications', icon: '🔔' }
  ];

  const tips = [
    {
      title: 'Registra transacciones diariamente',
      description: 'Mantén tus finanzas actualizadas registrando tus transacciones cada día.',
      icon: '💡'
    },
    {
      title: 'Usa deducibilidad granular',
      description: 'Marca correctamente si tus gastos son deducibles para ISR y si el IVA es acreditable para cálculos fiscales precisos.',
      icon: '✅'
    },
    {
      title: 'Crea reglas de deducibilidad',
      description: 'Automatiza la clasificación fiscal de tus gastos creando reglas personalizadas basadas en categorías y palabras clave.',
      icon: '⚙️'
    },
    {
      title: 'Usa categorías consistentes',
      description: 'Define y usa categorías claras para facilitar el análisis de tus gastos.',
      icon: '🏷️'
    },
    {
      title: 'Revisa tus notificaciones',
      description: 'Mantente al tanto de vencimientos y alertas importantes revisando el ícono de campana 🔔 en la barra superior.',
      icon: '🔔'
    },
    {
      title: 'Revisa tu flujo de efectivo',
      description: 'Consulta regularmente tu proyección de flujo para anticipar necesidades de liquidez.',
      icon: '💵'
    },
    {
      title: 'Mantén tu calendario fiscal',
      description: 'No olvides tus obligaciones fiscales mensuales, trimestrales y anuales.',
      icon: '📅'
    },
    {
      title: 'Concilia tus cuentas',
      description: 'Compara regularmente tus registros con tus estados de cuenta bancarios.',
      icon: '✅'
    },
    {
      title: 'Guarda tus comprobantes',
      description: 'Adjunta archivos XML y PDF a tus transacciones para una mejor documentación.',
      icon: '📎'
    },
    {
      title: 'Aprovecha el modo oscuro',
      description: 'Reduce la fatiga visual activando el modo oscuro desde el ícono de sol/luna en la barra superior.',
      icon: '🌙'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">❓ Centro de Ayuda</h1>
        <p className="text-primary-100">
          Encuentra respuestas a tus preguntas y aprende a usar Avanta Finance
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en la ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
            🔍
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🚀 Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {link.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips & Best Practices */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          💡 Consejos y Mejores Prácticas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="text-3xl mb-2">{tip.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {tip.title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ❓ Preguntas Frecuentes
        </h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No se encontraron preguntas para "{searchQuery}"
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <details
                key={index}
                className="bg-gray-50 dark:bg-slate-700 rounded-lg overflow-hidden"
              >
                <summary className="cursor-pointer p-4 font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  {faq.question}
                </summary>
                <div className="p-4 pt-0 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-slate-600">
                  {faq.answer}
                </div>
              </details>
            ))
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">¿Necesitas más ayuda?</h2>
        <p className="text-blue-100 mb-4">
          Si no encontraste lo que buscabas, contáctanos para obtener soporte personalizado.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:soporte@avanta.com"
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            📧 Enviar Email
          </a>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
          >
            🏠 Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
