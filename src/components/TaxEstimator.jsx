import { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage, getDaysUntilDue } from '../utils/fiscalCalculations';

export default function TaxEstimator({ data, period = 'monthly' }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!data) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Estimación de Impuestos</h3>
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  const { isr, iva, utilidad, dueDate } = data;
  const totalTax = isr + iva;
  const daysUntil = dueDate ? getDaysUntilDue(dueDate) : null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Estimación de Impuestos</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{period}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ISR</div>
          <div className="text-2xl font-bold text-red-700">
            {formatCurrency(isr)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Impuesto sobre la Renta
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">IVA</div>
          <div className="text-2xl font-bold text-orange-700">
            {formatCurrency(iva)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Impuesto al Valor Agregado
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total a Pagar</div>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(totalTax)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ISR + IVA
          </div>
        </div>
      </div>

      {/* Utilidad */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Utilidad Gravable</div>
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(utilidad)}
            </div>
          </div>
          {data.effectiveRate !== undefined && (
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasa Efectiva</div>
              <div className="text-xl font-bold text-blue-700">
                {formatPercentage(data.effectiveRate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Due Date Alert */}
      {dueDate && (
        <div className={`p-4 rounded-lg mb-4 ${
          daysUntil !== null && daysUntil < 0 
            ? 'bg-red-100 dark:bg-red-900/30 border border-red-300' 
            : daysUntil !== null && daysUntil < 7
            ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300'
            : 'bg-green-100 dark:bg-green-900/30 border border-green-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">
                {daysUntil !== null && daysUntil < 0 
                  ? '⚠️ Fecha límite vencida' 
                  : daysUntil !== null && daysUntil < 7
                  ? '⏰ Fecha límite próxima'
                  : '📅 Fecha límite de pago'
                }
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {new Date(dueDate).toLocaleDateString('es-MX', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            {daysUntil !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {Math.abs(daysUntil)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {daysUntil < 0 ? 'días de atraso' : 'días restantes'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-sm text-blue-600 hover:text-blue-800 dark:text-blue-300 font-medium"
      >
        {showDetails ? '▲ Ocultar detalles' : '▼ Ver detalles'}
      </button>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-4 space-y-3 pt-4 border-t">
          {data.ivaDetails && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">IVA Cobrado (16%)</span>
                <span className="font-medium">{formatCurrency(data.ivaDetails.ivaCobrado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">IVA Pagado (16%)</span>
                <span className="font-medium">{formatCurrency(data.ivaDetails.ivaPagado)}</span>
              </div>
              {data.ivaDetails.ivaAFavor > 0 && (
                <div className="flex justify-between text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <span className="text-green-700">IVA a Favor</span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(data.ivaDetails.ivaAFavor)}
                  </span>
                </div>
              )}
            </>
          )}
          
          {data.businessIncome !== undefined && (
            <>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600 dark:text-gray-400">Ingresos de Negocio</span>
                <span className="font-medium">{formatCurrency(data.businessIncome)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Gastos Deducibles</span>
                <span className="font-medium">{formatCurrency(data.deductibleExpenses)}</span>
              </div>
              {data.deductiblePercentage !== undefined && (
                <div className="flex justify-between text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <span className="text-blue-700">% Deducible</span>
                  <span className="font-medium text-blue-700">
                    {formatPercentage(data.deductiblePercentage)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 p-3 rounded">
        <strong>Nota:</strong> Los cálculos son aproximados y se basan en el régimen de Personas Físicas con Actividad Empresarial. 
        Consulta con tu contador para declaraciones oficiales.
      </div>
    </div>
  );
}
