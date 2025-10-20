import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingGuide({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const steps = [
    {
      title: '¡Bienvenido a Avanta Finance! 👋',
      description: 'Tu sistema completo de gestión financiera para persona física con actividad empresarial en México.',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Esta guía te ayudará a familiarizarte con las principales funciones del sistema.
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h4 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
              ¿Qué puedes hacer con Avanta Finance?
            </h4>
            <ul className="space-y-1 text-sm text-primary-800 dark:text-primary-200">
              <li>✅ Gestionar tus finanzas personales y empresariales</li>
              <li>✅ Controlar ingresos, gastos e inversiones</li>
              <li>✅ Cumplir con obligaciones fiscales mexicanas con deducibilidad granular</li>
              <li>✅ Generar reportes financieros detallados</li>
              <li>✅ Proyectar flujo de efectivo</li>
              <li>✅ Automatizar clasificación fiscal de gastos</li>
            </ul>
          </div>
        </div>
      ),
      action: null
    },
    {
      title: 'Dashboard Principal 📊',
      description: 'Tu centro de control financiero',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            El dashboard te muestra un resumen completo de tu situación financiera:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-lg">💰</span>
              <span><strong>Saldos de cuentas:</strong> Ve tus cuentas bancarias, efectivo y tarjetas de crédito</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <span><strong>Cuentas por cobrar:</strong> Facturas pendientes de pago</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📉</span>
              <span><strong>Cuentas por pagar:</strong> Compromisos de pago próximos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📋</span>
              <span><strong>Presupuestos:</strong> Control de gastos vs presupuesto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🔔</span>
              <span><strong>Notificaciones:</strong> Accede al ícono de campana en la barra superior para ver alertas importantes</span>
            </li>
          </ul>
        </div>
      ),
      action: () => navigate('/')
    },
    {
      title: 'Transacciones 💳',
      description: 'Registra y gestiona tus movimientos',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            En la sección de transacciones puedes:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Registrar ingresos y gastos</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Categorizar tus movimientos</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Especificar deducibilidad granular (ISR e IVA por separado)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Clasificar tipo de gasto (nacional o internacional)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Adjuntar comprobantes fiscales (XML/PDF)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✅</span>
              <span>Filtrar y buscar transacciones</span>
            </li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Consejo:</strong> Los badges de colores te ayudan a identificar la deducibilidad: azul para ISR, verde para IVA.
            </p>
          </div>
        </div>
      ),
      action: () => navigate('/transactions')
    },
    {
      title: 'Deducibilidad Fiscal Granular ✅',
      description: 'Control preciso de tus deducciones fiscales',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Sistema avanzado de clasificación fiscal según regulaciones del SAT:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-lg">🔵</span>
              <span><strong>ISR Deducible:</strong> Marca gastos deducibles para Impuesto Sobre la Renta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🟢</span>
              <span><strong>IVA Acreditable:</strong> Especifica si el IVA puede acreditarse</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🌍</span>
              <span><strong>Tipos de gasto:</strong> Nacional, Internacional con/sin factura</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">⚙️</span>
              <span><strong>Reglas automáticas:</strong> Crea reglas en Fiscal → Reglas de Deducibilidad</span>
            </li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              ⚠️ <strong>Importante:</strong> Los gastos internacionales sin factura mexicana NO permiten acreditar IVA según el SAT.
            </p>
          </div>
        </div>
      ),
      action: () => navigate('/deductibility-rules')
    },
    {
      title: 'Gestión Fiscal 📄',
      description: 'Cumple con tus obligaciones fiscales',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Mantén tus obligaciones fiscales al día:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-lg">🧾</span>
              <span><strong>Calculadora fiscal:</strong> Calcula ISR, IVA e IEPS con deducibilidad granular</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📑</span>
              <span><strong>Facturas:</strong> Gestiona tus CFDI emitidos y recibidos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📊</span>
              <span><strong>Reportes fiscales:</strong> Genera reportes para declaraciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <span><strong>Reglas de deducibilidad:</strong> Automatiza la clasificación de gastos</span>
            </li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              ⚠️ <strong>Importante:</strong> Consulta con un contador para decisiones fiscales importantes.
            </p>
          </div>
        </div>
      ),
      action: () => navigate('/fiscal')
    },
    {
      title: 'Tesorería 💼',
      description: 'Controla tu flujo de efectivo',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Herramientas avanzadas de gestión de tesorería:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-lg">💵</span>
              <span><strong>Proyección de flujo:</strong> Anticipa tu flujo de efectivo a 60 días</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">💳</span>
              <span><strong>Gestión de deudas:</strong> Controla préstamos y financiamientos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <span><strong>Inversiones:</strong> Seguimiento de tu portafolio</span>
            </li>
          </ul>
        </div>
      ),
      action: () => navigate('/cash-flow-projection')
    },
    {
      title: 'Interfaz y Navegación 🎨',
      description: 'Aprovecha las mejoras de interfaz',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            El sistema incluye mejoras de usabilidad y accesibilidad:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-lg">🔔</span>
              <span><strong>Notificaciones:</strong> Ícono de campana en la barra superior con badge de no leídas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🌙</span>
              <span><strong>Modo oscuro:</strong> Ícono de sol/luna para cambiar tema con contraste mejorado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">☰</span>
              <span><strong>Menú móvil:</strong> Menú de hamburguesa en tablets y móviles para mejor navegación</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🎨</span>
              <span><strong>Badges informativos:</strong> Indicadores visuales de deducibilidad y estados</span>
            </li>
          </ul>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-900 dark:text-green-100">
              ✨ <strong>Tip:</strong> El modo oscuro reduce la fatiga visual y cumple con estándares de accesibilidad WCAG AA.
            </p>
          </div>
        </div>
      ),
      action: null
    },
    {
      title: 'Centro de Tareas 📋',
      description: 'Organiza tus actividades financieras',
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Mantén control de tus tareas financieras regulares:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span>📅</span>
              <span><strong>Tareas diarias:</strong> Revisión de flujo y pagos</span>
            </li>
            <li className="flex items-start gap-2">
              <span>📆</span>
              <span><strong>Tareas semanales:</strong> Conciliaciones y seguimiento</span>
            </li>
            <li className="flex items-start gap-2">
              <span>📊</span>
              <span><strong>Tareas mensuales:</strong> Reportes y análisis</span>
            </li>
            <li className="flex items-start gap-2">
              <span>📈</span>
              <span><strong>Tareas trimestrales y anuales:</strong> Declaraciones y cierres</span>
            </li>
          </ul>
        </div>
      ),
      action: () => navigate('/financial-tasks')
    },
    {
      title: '¡Listo para empezar! 🚀',
      description: 'Comienza a gestionar tus finanzas',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Ya conoces las funciones principales de Avanta Finance. ¡Es hora de comenzar!
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Próximos pasos recomendados:
            </h4>
            <ol className="space-y-2 text-sm text-green-800 dark:text-green-200 list-decimal list-inside">
              <li>Configura tus cuentas bancarias y tarjetas</li>
              <li>Define tus categorías de ingresos y gastos</li>
              <li>Crea reglas de deducibilidad para automatizar clasificación fiscal</li>
              <li>Registra tus primeras transacciones con deducibilidad granular</li>
              <li>Establece presupuestos mensuales</li>
              <li>Revisa el centro de tareas para actividades regulares</li>
              <li>Activa las notificaciones en el ícono de campana 🔔</li>
            </ol>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 Puedes acceder al Centro de Ayuda en cualquier momento desde el menú Ayuda en la barra superior.
          </p>
        </div>
      ),
      action: null
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (steps[currentStep + 1].action) {
        steps[currentStep + 1].action();
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (onComplete) {
      onComplete();
    }
    navigate('/');
  };

  if (!isOpen) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{step.title}</h2>
            <button
              onClick={handleSkip}
              className="text-white hover:text-gray-200 text-sm"
            >
              Saltar guía ✕
            </button>
          </div>
          <p className="text-primary-100">{step.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-primary-100 mb-1">
              <span>Paso {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-primary-700 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700 rounded-b-xl border-t border-gray-200 dark:border-slate-600">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary-500 w-6'
                    : index < currentStep
                    ? 'bg-primary-300'
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
                aria-label={`Ir al paso ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
          >
            {currentStep === steps.length - 1 ? '¡Comenzar! 🚀' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
