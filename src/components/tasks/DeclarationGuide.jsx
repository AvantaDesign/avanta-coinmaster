// DeclarationGuide Component
// Phase 36: Interactive guide for fiscal declarations

import { useState, useEffect } from 'react';

export default function DeclarationGuide({ declarationType, onClose }) {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeclarationSteps();
  }, [declarationType]);

  const loadDeclarationSteps = async () => {
    try {
      setLoading(true);
      // This would fetch from /api/declaration-guide/:type
      // For now, we'll use placeholder data
      const mockSteps = getDeclarationSteps(declarationType);
      setSteps(mockSteps);
    } catch (error) {
      console.error('Error loading declaration steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeclarationSteps = (type) => {
    const stepsData = {
      isr: [
        {
          number: 1,
          title: 'Verificar Ingresos del Periodo',
          description: 'Revisa y confirma todos los ingresos registrados en el periodo',
          helpText: 'Asegúrate de que todos tus ingresos estén correctamente registrados y respaldados con facturas.'
        },
        {
          number: 2,
          title: 'Calcular Deducciones Autorizadas',
          description: 'Identifica y calcula todas las deducciones fiscales aplicables',
          helpText: 'Solo incluye gastos estrictamente indispensables y que cumplan con requisitos fiscales.'
        },
        {
          number: 3,
          title: 'Determinar Base Gravable',
          description: 'Calcula la base sobre la cual se aplicará el ISR',
          helpText: 'La base gravable es la diferencia entre ingresos y deducciones autorizadas.'
        },
        {
          number: 4,
          title: 'Calcular ISR a Pagar',
          description: 'Aplica la tasa de ISR correspondiente a tu régimen',
          helpText: 'Considera retenciones que te hayan aplicado para determinar el monto neto a pagar.'
        },
        {
          number: 5,
          title: 'Preparar Pago',
          description: 'Genera la línea de captura y prepara el pago del ISR',
          helpText: 'El pago debe realizarse a más tardar el día 17 del mes siguiente al que se declara.'
        }
      ],
      iva: [
        {
          number: 1,
          title: 'Calcular IVA Cobrado',
          description: 'Suma el IVA de todas las facturas emitidas en el periodo',
          helpText: 'Incluye todo el IVA que cobraste en tus ventas o servicios.'
        },
        {
          number: 2,
          title: 'Calcular IVA Acreditable',
          description: 'Suma el IVA de gastos deducibles que puedes acreditar',
          helpText: 'Solo es acreditable el IVA de gastos estrictamente indispensables para tu actividad.'
        },
        {
          number: 3,
          title: 'Determinar IVA a Pagar o a Favor',
          description: 'Calcula la diferencia entre IVA cobrado y acreditable',
          helpText: 'Si el IVA cobrado es mayor, tienes IVA a pagar. Si es menor, saldo a favor.'
        },
        {
          number: 4,
          title: 'Preparar Pago o Solicitar Devolución',
          description: 'Genera línea de captura para pago o prepara solicitud de devolución',
          helpText: 'El pago de IVA debe realizarse antes del día 17 del mes siguiente.'
        }
      ],
      diot: [
        {
          number: 1,
          title: 'Identificar Proveedores',
          description: 'Lista todos los proveedores con los que tuviste operaciones',
          helpText: 'Incluye todos los proveedores nacionales y extranjeros del periodo.'
        },
        {
          number: 2,
          title: 'Clasificar Operaciones',
          description: 'Clasifica las operaciones según tipo de IVA (16%, 0%, exento)',
          helpText: 'Separa correctamente las operaciones según la tasa de IVA aplicable.'
        },
        {
          number: 3,
          title: 'Generar Archivo TXT',
          description: 'Genera el archivo en formato requerido por el SAT',
          helpText: 'El archivo debe cumplir con el formato oficial del SAT para DIOT.'
        }
      ]
    };

    return stepsData[type] || [];
  };

  const getDeclarationTitle = (type) => {
    const titles = {
      isr: '📑 Declaración ISR Mensual',
      iva: '📑 Declaración IVA Mensual',
      diot: '📑 Declaración Informativa DIOT'
    };
    return titles[type] || 'Declaración';
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // This would mark the declaration as complete
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando guía...</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = steps.length > 0 ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {getDeclarationTitle(declarationType)}
                </h3>
                <p className="text-sm text-white opacity-90 mt-1">
                  Guía paso a paso para tu declaración
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-white opacity-90 mb-2">
                <span>Paso {currentStep + 1} de {steps.length}</span>
                <span>{progress}% Completado</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content */}
          {currentStepData && (
            <div className="p-6">
              {/* Step Info */}
              <div className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full flex items-center justify-center text-xl font-bold">
                    {currentStepData.number}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {currentStepData.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                <div className="flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400 text-lg flex-shrink-0">💡</span>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">Consejo</p>
                    <p>{currentStepData.helpText}</p>
                  </div>
                </div>
              </div>

              {/* Action Placeholder */}
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Esta es una vista previa de la guía de declaraciones.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  La integración completa con el sistema de declaraciones estará disponible próximamente.
                </p>
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  ← Anterior
                </button>

                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-primary-500 w-8'
                          : index < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-slate-600'
                      }`}
                    ></button>
                  ))}
                </div>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    Siguiente →
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    ✓ Finalizar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
