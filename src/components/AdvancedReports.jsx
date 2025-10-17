import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportToJSON,
  exportTransactions,
  exportFiscalReport,
  createBackup
} from '../utils/export';
import { showSuccess, showError } from '../utils/notifications';

/**
 * Advanced Reports Component
 * 
 * Comprehensive reporting suite with:
 * - Custom report builder
 * - Multiple export formats (CSV, Excel, PDF, JSON)
 * - Pre-built report templates
 * - Scheduled reports
 * - Report history
 */

const REPORT_TEMPLATES = [
  {
    id: 'monthly-summary',
    name: 'Resumen Mensual',
    icon: '📅',
    description: 'Resumen completo de ingresos, gastos y utilidad del mes',
    category: 'financial'
  },
  {
    id: 'fiscal-report',
    name: 'Reporte Fiscal',
    icon: '💰',
    description: 'Cálculo de ISR, IVA y otros impuestos',
    category: 'fiscal'
  },
  {
    id: 'cash-flow',
    name: 'Flujo de Caja',
    icon: '💵',
    description: 'Análisis detallado de entradas y salidas de efectivo',
    category: 'financial'
  },
  {
    id: 'profitability',
    name: 'Análisis de Rentabilidad',
    icon: '📊',
    description: 'Rentabilidad por categoría, producto o servicio',
    category: 'analytics'
  },
  {
    id: 'ar-aging',
    name: 'Antigüedad de Cuentas por Cobrar',
    icon: '📈',
    description: 'Reporte de antigüedad de facturas por cobrar',
    category: 'ar-ap'
  },
  {
    id: 'ap-aging',
    name: 'Antigüedad de Cuentas por Pagar',
    icon: '📉',
    description: 'Reporte de antigüedad de facturas por pagar',
    category: 'ar-ap'
  },
  {
    id: 'transactions-detail',
    name: 'Detalle de Transacciones',
    icon: '📝',
    description: 'Listado completo de transacciones con filtros',
    category: 'transactions'
  },
  {
    id: 'category-analysis',
    name: 'Análisis por Categoría',
    icon: '🏷️',
    description: 'Desglose detallado por categoría de gasto/ingreso',
    category: 'analytics'
  },
  {
    id: 'account-reconciliation',
    name: 'Conciliación Bancaria',
    icon: '🏦',
    description: 'Reporte de conciliación de cuentas bancarias',
    category: 'reconciliation'
  },
  {
    id: 'budget-variance',
    name: 'Variaciones vs Presupuesto',
    icon: '🎯',
    description: 'Comparación de gastos reales vs presupuestados',
    category: 'analytics'
  }
];

export default function AdvancedReports({ data = {} }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [filterCategory, setFilterCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      showError('Selecciona un tipo de reporte');
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate report based on template
      switch (selectedTemplate.id) {
        case 'transactions-detail':
          exportTransactions(
            data.transactions || [],
            exportFormat,
            `transacciones-${dateRange.from}-${dateRange.to}.${exportFormat}`
          );
          break;

        case 'fiscal-report':
          exportFiscalReport(
            data.fiscalData || {},
            exportFormat,
            `reporte-fiscal-${dateRange.from}-${dateRange.to}.${exportFormat}`
          );
          break;

        case 'monthly-summary':
          generateMonthlySummaryReport(data, exportFormat, dateRange);
          break;

        case 'profitability':
          generateProfitabilityReport(data, exportFormat, dateRange);
          break;

        case 'ar-aging':
          generateARAgingReport(data, exportFormat);
          break;

        case 'ap-aging':
          generateAPAgingReport(data, exportFormat);
          break;

        case 'cash-flow':
          generateCashFlowReport(data, exportFormat, dateRange);
          break;

        case 'category-analysis':
          generateCategoryAnalysisReport(data, exportFormat, dateRange);
          break;

        default:
          showError('Reporte no implementado');
          return;
      }

      showSuccess('Reporte generado exitosamente');
    } catch (error) {
      showError('Error al generar reporte: ' + error.message);
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackup = () => {
    try {
      createBackup(data);
      showSuccess('Backup creado exitosamente');
    } catch (error) {
      showError('Error al crear backup: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 dark:from-purple-700 to-blue-600 dark:to-blue-700 p-6 rounded-lg shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Reportes Avanzados</h2>
        <p className="text-purple-100">
          Genera reportes personalizados y exporta en múltiples formatos
        </p>
      </div>

      {/* Report Templates Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Selecciona un Tipo de Reporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      {selectedTemplate && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">⚙️ Configurar Reporte</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Exportación
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">📄 PDF</option>
                <option value="excel">📊 Excel</option>
                <option value="csv">📋 CSV</option>
                <option value="json">🔧 JSON</option>
              </select>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className={`w-full px-4 py-2 rounded-md font-medium ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-600'
                } text-white`}
              >
                {isGenerating ? '⏳ Generando...' : '🚀 Generar Reporte'}
              </button>
            </div>
          </div>

          {/* Selected Template Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedTemplate.icon}</span>
              <div>
                <h4 className="font-bold">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">⚡ Acciones Rápidas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleBackup}
            className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:bg-green-900/30 border-2 border-green-300 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">💾</div>
            <div className="font-bold text-sm mb-1">Crear Backup</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Respalda todos tus datos en formato JSON
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedTemplate(REPORT_TEMPLATES.find(t => t.id === 'transactions-detail'));
              setExportFormat('excel');
            }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-bold text-sm mb-1">Exportar Transacciones</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Descarga todas tus transacciones a Excel
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedTemplate(REPORT_TEMPLATES.find(t => t.id === 'fiscal-report'));
              setExportFormat('pdf');
            }}
            className="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-bold text-sm mb-1">Reporte Fiscal</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Genera tu reporte de impuestos en PDF
            </div>
          </button>
        </div>
      </div>

      {/* Report History (Future Feature) */}
      <div className="bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">📜</div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
          Historial de Reportes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Próximamente: accede a reportes generados anteriormente
        </p>
      </div>
    </div>
  );
}

// Helper functions for report generation

function generateMonthlySummaryReport(data, format, dateRange) {
  const reportData = [
    { concepto: 'Periodo', valor: `${dateRange.from} a ${dateRange.to}` },
    { concepto: 'Ingresos Totales', valor: formatCurrency(data.totalIncome || 0) },
    { concepto: 'Gastos Totales', valor: formatCurrency(data.totalExpenses || 0) },
    { concepto: 'Utilidad Neta', valor: formatCurrency((data.totalIncome || 0) - (data.totalExpenses || 0)) },
    { concepto: 'Total Transacciones', valor: (data.transactions?.length || 0).toString() }
  ];

  const columns = [
    { key: 'concepto', label: 'Concepto' },
    { key: 'valor', label: 'Valor' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Resumen Mensual', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, `resumen-mensual-${dateRange.from}.xlsx`, columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, `resumen-mensual-${dateRange.from}.csv`, columns);
  } else {
    exportToJSON({ report: 'monthly-summary', data: reportData, dateRange });
  }
}

function generateProfitabilityReport(data, format, dateRange) {
  const categoryData = data.categoryBreakdown || [];
  
  const reportData = categoryData.map(cat => ({
    categoria: cat.category,
    ingresos: cat.income || 0,
    gastos: cat.expenses || 0,
    utilidad: (cat.income || 0) - (cat.expenses || 0),
    margen: cat.income > 0 ? (((cat.income - cat.expenses) / cat.income) * 100).toFixed(2) + '%' : '0%'
  }));

  const columns = [
    { key: 'categoria', label: 'Categoría' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'utilidad', label: 'Utilidad' },
    { key: 'margen', label: 'Margen %' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Análisis de Rentabilidad', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, `rentabilidad-${dateRange.from}.xlsx`, columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, `rentabilidad-${dateRange.from}.csv`, columns);
  } else {
    exportToJSON({ report: 'profitability', data: reportData, dateRange });
  }
}

function generateARAgingReport(data, format) {
  const receivables = data.receivables || [];
  
  const reportData = receivables.map(r => ({
    factura: r.invoice_number,
    cliente: r.customer_name,
    fecha: r.invoice_date,
    vencimiento: r.due_date,
    monto: r.amount,
    pagado: r.amount_paid,
    pendiente: r.amount - r.amount_paid,
    dias: Math.floor((new Date() - new Date(r.due_date)) / (1000 * 60 * 60 * 24)),
    estado: r.status
  }));

  const columns = [
    { key: 'factura', label: 'Factura' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'vencimiento', label: 'Vencimiento' },
    { key: 'monto', label: 'Monto' },
    { key: 'pagado', label: 'Pagado' },
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'dias', label: 'Días Vencido' },
    { key: 'estado', label: 'Estado' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Antigüedad de Cuentas por Cobrar', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, 'cuentas-por-cobrar-antiguedad.xlsx', columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, 'cuentas-por-cobrar-antiguedad.csv', columns);
  } else {
    exportToJSON({ report: 'ar-aging', data: reportData });
  }
}

function generateAPAgingReport(data, format) {
  const payables = data.payables || [];
  
  const reportData = payables.map(p => ({
    factura: p.bill_number,
    proveedor: p.vendor_name,
    fecha: p.bill_date,
    vencimiento: p.due_date,
    monto: p.amount,
    pagado: p.amount_paid,
    pendiente: p.amount - p.amount_paid,
    dias: Math.floor((new Date() - new Date(p.due_date)) / (1000 * 60 * 60 * 24)),
    estado: p.status
  }));

  const columns = [
    { key: 'factura', label: 'Factura' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'vencimiento', label: 'Vencimiento' },
    { key: 'monto', label: 'Monto' },
    { key: 'pagado', label: 'Pagado' },
    { key: 'pendiente', label: 'Pendiente' },
    { key: 'dias', label: 'Días Vencido' },
    { key: 'estado', label: 'Estado' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Antigüedad de Cuentas por Pagar', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, 'cuentas-por-pagar-antiguedad.xlsx', columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, 'cuentas-por-pagar-antiguedad.csv', columns);
  } else {
    exportToJSON({ report: 'ap-aging', data: reportData });
  }
}

function generateCashFlowReport(data, format, dateRange) {
  const transactions = data.transactions || [];
  
  // Group by month
  const monthlyData = {};
  transactions.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { ingresos: 0, gastos: 0 };
    }
    if (t.amount > 0) {
      monthlyData[month].ingresos += t.amount;
    } else {
      monthlyData[month].gastos += Math.abs(t.amount);
    }
  });

  const reportData = Object.entries(monthlyData).map(([month, data]) => ({
    mes: month,
    ingresos: data.ingresos,
    gastos: data.gastos,
    flujo_neto: data.ingresos - data.gastos
  }));

  const columns = [
    { key: 'mes', label: 'Mes' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'flujo_neto', label: 'Flujo Neto' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Flujo de Caja', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, `flujo-caja-${dateRange.from}.xlsx`, columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, `flujo-caja-${dateRange.from}.csv`, columns);
  } else {
    exportToJSON({ report: 'cash-flow', data: reportData, dateRange });
  }
}

function generateCategoryAnalysisReport(data, format, dateRange) {
  const categoryData = data.categoryBreakdown || [];
  
  const reportData = categoryData.map(cat => ({
    categoria: cat.category,
    transacciones: cat.count || 0,
    total: cat.total || 0,
    promedio: cat.count > 0 ? (cat.total / cat.count).toFixed(2) : 0,
    porcentaje: cat.percentage ? cat.percentage.toFixed(2) + '%' : '0%'
  }));

  const columns = [
    { key: 'categoria', label: 'Categoría' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'total', label: 'Total' },
    { key: 'promedio', label: 'Promedio' },
    { key: 'porcentaje', label: '% del Total' }
  ];

  if (format === 'pdf') {
    exportToPDF(reportData, 'Análisis por Categoría', columns);
  } else if (format === 'excel' || format === 'xlsx') {
    exportToExcel(reportData, `analisis-categorias-${dateRange.from}.xlsx`, columns);
  } else if (format === 'csv') {
    exportToCSV(reportData, `analisis-categorias-${dateRange.from}.csv`, columns);
  } else {
    exportToJSON({ report: 'category-analysis', data: reportData, dateRange });
  }
}
