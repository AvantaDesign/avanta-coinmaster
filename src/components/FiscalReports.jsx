import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import { 
  calculateFiscalSummary, 
  calculateQuarterlySummaries,
  calculateExpenseBreakdown,
  formatCurrency,
  formatPercentage,
  formatDate as formatFiscalDate
} from '../utils/fiscalCalculations';

export default function FiscalReports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('quarterly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedYear]);

  const generateReport = async () => {
    try {
      setLoading(true);
      
      const firstDay = `${selectedYear}-01-01`;
      const lastDay = `${selectedYear}-12-31`;
      const result = await fetchTransactions({ date_from: firstDay, date_to: lastDay });
      const txData = result.transactions || result.data || [];
      setTransactions(txData);

      if (reportType === 'quarterly') {
        const quarterlySummaries = calculateQuarterlySummaries(txData);
        setReportData({ type: 'quarterly', data: quarterlySummaries });
      } else if (reportType === 'annual') {
        const annualSummary = calculateFiscalSummary(txData);
        setReportData({ type: 'annual', data: annualSummary });
      } else if (reportType === 'expenses') {
        const breakdown = calculateExpenseBreakdown(txData);
        setReportData({ type: 'expenses', data: breakdown });
      }

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) return;

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'json') {
      exportToJSON();
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    
    if (reportData.type === 'quarterly') {
      csvContent = 'Trimestre,Ingresos,Gastos,Deducibles,Utilidad,ISR,IVA,Fecha Límite\n';
      reportData.data.forEach(q => {
        csvContent += `${q.name},${q.businessIncome},${q.businessExpenses},${q.deductibleExpenses},${q.utilidad},${q.isr},${q.iva},${formatFiscalDate(q.dueDate)}\n`;
      });
    } else if (reportData.type === 'annual') {
      csvContent = 'Concepto,Monto\n';
      csvContent += `Ingresos Totales,${reportData.data.totalIncome}\n`;
      csvContent += `Gastos Totales,${reportData.data.totalExpenses}\n`;
      csvContent += `Ingresos de Negocio,${reportData.data.businessIncome}\n`;
      csvContent += `Gastos de Negocio,${reportData.data.businessExpenses}\n`;
      csvContent += `Gastos Deducibles,${reportData.data.deductibleExpenses}\n`;
      csvContent += `Utilidad,${reportData.data.utilidad}\n`;
      csvContent += `ISR,${reportData.data.isr}\n`;
      csvContent += `IVA,${reportData.data.iva}\n`;
    } else if (reportData.type === 'expenses') {
      csvContent = 'Categoría,Total,Deducible,Cantidad,% Deducible\n';
      reportData.data.forEach(cat => {
        const deductiblePct = cat.total > 0 ? (cat.deductible / cat.total) * 100 : 0;
        csvContent += `${cat.category},${cat.total},${cat.deductible},${cat.count},${deductiblePct.toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_fiscal_${reportType}_${selectedYear}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_fiscal_${reportType}_${selectedYear}.json`;
    link.click();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Reportes Fiscales</h2>
        
        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Reporte</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
              <option value="expenses">Gastos por Categoría</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar'}
            </button>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => exportReport('csv')}
              disabled={!reportData}
              className="flex-1 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              title="Exportar CSV"
            >
              📄 CSV
            </button>
            <button
              onClick={printReport}
              disabled={!reportData}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              title="Imprimir"
            >
              🖨️
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      )}

      {!loading && reportData && reportData.type === 'quarterly' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md print:shadow-none">
          <h3 className="text-xl font-bold mb-4">Resumen Trimestral {selectedYear}</h3>
          
          <div className="space-y-4">
            {reportData.data.map((quarter, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 print:break-inside-avoid">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold">{quarter.name}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Vence: {formatFiscalDate(quarter.dueDate)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Ingresos</div>
                    <div className="text-sm font-bold text-green-700">
                      {formatCurrency(quarter.businessIncome)}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Gastos</div>
                    <div className="text-sm font-bold text-red-700">
                      {formatCurrency(quarter.businessExpenses)}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Deducibles</div>
                    <div className="text-sm font-bold text-blue-700">
                      {formatCurrency(quarter.deductibleExpenses)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Utilidad</div>
                    <div className="text-sm font-bold text-purple-700">
                      {formatCurrency(quarter.utilidad)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 p-2 rounded border border-orange-200">
                    <div className="text-xs text-gray-600 dark:text-gray-400">ISR</div>
                    <div className="text-lg font-bold text-orange-700">
                      {formatCurrency(quarter.isr)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200">
                    <div className="text-xs text-gray-600 dark:text-gray-400">IVA</div>
                    <div className="text-lg font-bold text-yellow-700">
                      {formatCurrency(quarter.iva)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Annual Totals */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-lg font-bold mb-3">Totales Anuales</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Ingresos Totales</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(reportData.data.reduce((sum, q) => sum + q.businessIncome, 0))}
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Deducibles Totales</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(reportData.data.reduce((sum, q) => sum + q.deductibleExpenses, 0))}
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">ISR Total</div>
                <div className="text-lg font-bold text-orange-700">
                  {formatCurrency(reportData.data.reduce((sum, q) => sum + q.isr, 0))}
                </div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">IVA Total</div>
                <div className="text-lg font-bold text-yellow-700">
                  {formatCurrency(reportData.data.reduce((sum, q) => sum + q.iva, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && reportData && reportData.type === 'annual' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md print:shadow-none">
          <h3 className="text-xl font-bold mb-4">Resumen Anual {selectedYear}</h3>
          
          <div className="space-y-6">
            {/* Income and Expenses */}
            <div>
              <h4 className="font-bold mb-3">Ingresos y Gastos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ingresos Totales</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(reportData.data.totalIncome)}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gastos Totales</div>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(reportData.data.totalExpenses)}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(reportData.data.totalIncome - reportData.data.totalExpenses)}
                  </div>
                </div>
              </div>
            </div>

            {/* Business vs Personal */}
            <div className="pt-6 border-t">
              <h4 className="font-bold mb-3">Negocio vs Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ingresos de Negocio</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(reportData.data.businessIncome)}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gastos de Negocio</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {formatCurrency(reportData.data.businessExpenses)}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gastos Personales</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {formatCurrency(reportData.data.personalExpenses)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="pt-6 border-t">
              <h4 className="font-bold mb-3">Resumen Fiscal</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gastos Deducibles</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(reportData.data.deductibleExpenses)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatPercentage(reportData.data.deductiblePercentage)} del total
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Utilidad</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(reportData.data.utilidad)}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-gray-600 dark:text-gray-400">ISR Anual</div>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(reportData.data.isr)}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-gray-600 dark:text-gray-400">IVA Anual</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {formatCurrency(reportData.data.iva)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && reportData && reportData.type === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md print:shadow-none">
          <h3 className="text-xl font-bold mb-4">Gastos por Categoría {selectedYear}</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Categoría</th>
                  <th className="text-right py-3 px-2">Total</th>
                  <th className="text-right py-3 px-2">Deducible</th>
                  <th className="text-right py-3 px-2">Cantidad</th>
                  <th className="text-right py-3 px-2">% Deducible</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((cat, idx) => {
                  const deductiblePct = cat.total > 0 ? (cat.deductible / cat.total) * 100 : 0;
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-2">
                        <div className="font-medium">{cat.category}</div>
                        {cat.isDeductible && (
                          <span className="text-xs text-green-600">✓ Deducible</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-2 font-medium">
                        {formatCurrency(cat.total)}
                      </td>
                      <td className="text-right py-3 px-2 text-green-700 font-medium">
                        {formatCurrency(cat.deductible)}
                      </td>
                      <td className="text-right py-3 px-2 text-gray-600 dark:text-gray-400">
                        {cat.count}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          deductiblePct > 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                          deductiblePct > 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700'
                        }`}>
                          {formatPercentage(deductiblePct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-3 px-2">Total</td>
                  <td className="text-right py-3 px-2">
                    {formatCurrency(reportData.data.reduce((sum, cat) => sum + cat.total, 0))}
                  </td>
                  <td className="text-right py-3 px-2 text-green-700">
                    {formatCurrency(reportData.data.reduce((sum, cat) => sum + cat.deductible, 0))}
                  </td>
                  <td className="text-right py-3 px-2">
                    {reportData.data.reduce((sum, cat) => sum + cat.count, 0)}
                  </td>
                  <td className="text-right py-3 px-2">
                    {formatPercentage(
                      reportData.data.reduce((sum, cat) => sum + cat.total, 0) > 0 ?
                      (reportData.data.reduce((sum, cat) => sum + cat.deductible, 0) / 
                       reportData.data.reduce((sum, cat) => sum + cat.total, 0)) * 100 : 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Count */}
      {!loading && reportData && transactions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md print:hidden">
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Reporte generado con {transactions.length} transacciones
          </div>
        </div>
      )}
    </div>
  );
}
