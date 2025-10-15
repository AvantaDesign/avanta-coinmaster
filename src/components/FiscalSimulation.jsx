import { useState, useEffect } from 'react';
import { 
  calculateAnnualTaxSummary,
  calculatePaymentSchedule,
  calculateTaxScenarios,
  getTaxPaymentCalendar
} from '../utils/fiscal';
import { formatCurrency } from '../utils/calculations';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function FiscalSimulation() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'monthly', 'scenarios', 'calendar'

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    projected_income: '',
    projected_expenses: '',
    include_current_data: true
  });

  useEffect(() => {
    loadConfig();
  }, [formData.year]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/fiscal-config?year=${formData.year}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const runSimulation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/fiscal-config/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: formData.year,
          projected_income: parseFloat(formData.projected_income) || 0,
          projected_expenses: parseFloat(formData.projected_expenses) || 0,
          include_current_data: formData.include_current_data
        })
      });
      const data = await response.json();
      setSimulation(data.simulation);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSimulation();
  };

  return (
    <div className="space-y-6">
      {/* Simulation Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Simulador Fiscal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año Fiscal
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                min="2020"
                max="2030"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresos Proyectados
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.projected_income}
                  onChange={(e) => setFormData(prev => ({ ...prev, projected_income: e.target.value }))}
                  min="0"
                  step="1000"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gastos Proyectados
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.projected_expenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, projected_expenses: e.target.value }))}
                  min="0"
                  step="1000"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="include_current"
              checked={formData.include_current_data}
              onChange={(e) => setFormData(prev => ({ ...prev, include_current_data: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="include_current" className="ml-2 text-sm text-gray-700">
              Incluir datos actuales del año
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Calculando...' : 'Simular Impuestos'}
          </button>
        </form>
      </div>

      {/* Results */}
      {simulation && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600 mb-2">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(simulation.totals.total_income)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600 mb-2">Gastos Deducibles</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(simulation.totals.total_deductible)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600 mb-2">ISR Anual</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(simulation.taxes.annual_isr)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600 mb-2">IVA a Pagar</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(simulation.taxes.annual_iva)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'monthly'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Desglose Mensual
                </button>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'scenarios'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Escenarios
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calendar'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Calendario
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Resumen Anual</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Gravable:</span>
                          <span className="font-semibold">{formatCurrency(simulation.totals.taxable_base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ISR Anual:</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(simulation.taxes.annual_isr)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IVA a Pagar:</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(simulation.taxes.annual_iva)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                          <span className="font-semibold">Total Impuestos:</span>
                          <span className="font-bold text-xl text-red-700">
                            {formatCurrency(simulation.taxes.total_annual_tax)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasa Efectiva:</span>
                          <span className="font-semibold">{simulation.taxes.effective_rate}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Pagos Provisionales Mensuales</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ISR Mensual:</span>
                          <span className="font-semibold">{formatCurrency(simulation.taxes.monthly_isr)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IVA Mensual:</span>
                          <span className="font-semibold">{formatCurrency(simulation.taxes.monthly_iva)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                          <span className="font-semibold">Total Mensual:</span>
                          <span className="font-bold text-xl">
                            {formatCurrency(simulation.taxes.monthly_total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">💰 Ahorro por Deducciones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-green-700">ISR sin deducciones:</p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(simulation.savings.isr_without_deductions)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700">Ahorro Total:</p>
                        <p className="text-xl font-bold text-green-900">
                          {formatCurrency(simulation.savings.tax_savings)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700">Porcentaje de Ahorro:</p>
                        <p className="text-xl font-bold text-green-900">
                          {simulation.savings.savings_percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Tab */}
              {activeTab === 'monthly' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gastos</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ISR</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {simulation.monthly_breakdown.map((month) => (
                        <tr key={month.month} className={month.is_past ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {month.month_name}
                            {month.is_past && <span className="ml-2 text-xs text-blue-600">(Real)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {formatCurrency(month.income)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {formatCurrency(month.expenses)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {formatCurrency(month.isr)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {formatCurrency(month.iva)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                            {formatCurrency(month.total_tax)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scenarios Tab */}
              {activeTab === 'scenarios' && config && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Comparación de Escenarios</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Visualiza cómo diferentes niveles de deducciones afectan tu carga fiscal
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escenario</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deducciones</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Gravable</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ISR</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tasa Efectiva</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {calculateTaxScenarios(simulation.totals.total_income, config).map((scenario, index) => (
                          <tr key={index} className={index === 3 ? 'bg-green-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {scenario.name}
                              {index === 3 && <span className="ml-2 text-xs text-green-600">(Recomendado)</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {formatCurrency(scenario.deductions)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {formatCurrency(scenario.taxableBase)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                              {formatCurrency(scenario.isr)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {scenario.effectiveRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Calendario de Pagos {simulation.year}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getTaxPaymentCalendar(simulation.year).map((payment) => (
                      <div key={payment.month} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-semibold">{payment.month_name}</span>
                          <span className="text-sm text-gray-600">{payment.period}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{payment.payment_type}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          Vence: {new Date(payment.payment_date).toLocaleDateString('es-MX', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
