import { useState, useEffect } from 'react';
import { fetchReceivables, fetchPayables, fetchAutomationRules } from '../utils/api';
import { calculateCollectionMetrics } from '../utils/receivables';
import { calculatePaymentMetrics } from '../utils/payables';
import { calculateCashFlowForecast, calculateFinancialHealthIndicators, generateAutomatedAlerts, calculateAutomationMetrics } from '../utils/automation';
import { formatCurrency } from '../utils/calculations';

export default function FinancialDashboard() {
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [receivablesData, payablesData, rulesData] = await Promise.all([
        fetchReceivables(),
        fetchPayables(),
        fetchAutomationRules()
      ]);
      setReceivables(receivablesData);
      setPayables(payablesData);
      setAutomationRules(rulesData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  const receivablesMetrics = calculateCollectionMetrics(receivables);
  const payablesMetrics = calculatePaymentMetrics(payables);
  const cashFlowForecast = calculateCashFlowForecast(receivables, payables, forecastDays);
  const healthIndicators = calculateFinancialHealthIndicators(receivablesMetrics, payablesMetrics, cashFlowForecast);
  const alerts = generateAutomatedAlerts(receivables, payables, healthIndicators);
  const automationMetrics = calculateAutomationMetrics(automationRules);

  const getHealthColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-500 text-red-900';
      case 'warning': return 'bg-orange-50 border-orange-500 text-orange-900';
      case 'info': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard de Automatización</h1>
        <button
          onClick={loadData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Financial Health Score */}
      <div className={`p-6 rounded-lg shadow-lg ${getHealthColor(healthIndicators.healthLevel)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-75">Salud Financiera</div>
            <div className="text-5xl font-bold mt-2">{healthIndicators.healthScore}/100</div>
            <div className="text-sm mt-1 capitalize">{healthIndicators.healthLevel}</div>
          </div>
          <div className="text-6xl">
            {healthIndicators.healthLevel === 'excellent' && '🎉'}
            {healthIndicators.healthLevel === 'good' && '👍'}
            {healthIndicators.healthLevel === 'fair' && '⚡'}
            {healthIndicators.healthLevel === 'poor' && '⚠️'}
          </div>
        </div>
      </div>

      {/* Automated Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Alertas Automatizadas</h2>
          {alerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-sm mt-1">{alert.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">Cuentas por Cobrar</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(receivablesMetrics.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">{receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').length} pendientes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">Cuentas por Pagar</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(payablesMetrics.totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">{payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length} pendientes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">DSO (Días)</div>
          <div className="text-2xl font-bold text-blue-600">{healthIndicators.dso}</div>
          <div className="text-xs text-gray-500 mt-1">Días promedio de cobro</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">DPO (Días)</div>
          <div className="text-2xl font-bold text-purple-600">{healthIndicators.dpo}</div>
          <div className="text-xs text-gray-500 mt-1">Días promedio de pago</div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pronóstico de Flujo de Efectivo</h2>
          <select
            value={forecastDays}
            onChange={(e) => setForecastDays(parseInt(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="30">30 días</option>
            <option value="60">60 días</option>
            <option value="90">90 días</option>
          </select>
        </div>
        
        {healthIndicators.hasCashCrunch && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <div>
                <div className="font-medium text-red-900">Alerta de Déficit de Efectivo</div>
                <div className="text-sm text-red-700">
                  Se detectan {healthIndicators.cashCrunchDays} día(s) con déficit. 
                  Posición más baja: {formatCurrency(healthIndicators.worstCashPosition)}
                </div>
              </div>
            </div>
          </div>
        )}

        {cashFlowForecast.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No hay movimientos pronosticados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Entradas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Salidas</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Flujo Neto</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Balance Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cashFlowForecast.slice(0, 15).map((item, idx) => (
                  <tr key={idx} className={item.runningBalance < 0 ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 text-sm">{item.formattedDate}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600">
                      {item.inflow > 0 ? formatCurrency(item.inflow) : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">
                      {item.outflow > 0 ? formatCurrency(item.outflow) : '-'}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-medium ${item.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.netFlow)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right font-bold ${item.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(item.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automation Status */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Estado de Automatización</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{automationMetrics.activeRules}</div>
            <div className="text-sm text-gray-600 mt-1">Reglas Activas</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{automationMetrics.recurringInvoiceCount}</div>
            <div className="text-sm text-gray-600 mt-1">Facturas Recurrentes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{automationMetrics.paymentReminderCount}</div>
            <div className="text-sm text-gray-600 mt-1">Recordatorios</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">{automationMetrics.rulesToRunToday}</div>
            <div className="text-sm text-gray-600 mt-1">Por Ejecutar Hoy</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">Ciclo de Conversión de Efectivo</div>
          <div className="text-3xl font-bold text-blue-600">{healthIndicators.cashConversionCycle}</div>
          <div className="text-xs text-gray-500 mt-1">días (DSO - DPO)</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">Ratio Rápido</div>
          <div className="text-3xl font-bold text-purple-600">{healthIndicators.quickRatio.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Cuentas por Cobrar / Pagar</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-600">Tasa de Cobranza</div>
          <div className="text-3xl font-bold text-green-600">{receivablesMetrics.collectionRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Efectividad de cobro</div>
        </div>
      </div>
    </div>
  );
}
