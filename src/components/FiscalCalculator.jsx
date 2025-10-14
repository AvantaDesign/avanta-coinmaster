import { useState, useEffect } from 'react';
import { fetchTransactions } from '../utils/api';
import { 
  calculateFiscalSummary, 
  calculateQuarterlySummaries,
  formatCurrency,
  formatPercentage,
  getTaxDueDate
} from '../utils/fiscalCalculations';
import TaxEstimator from './TaxEstimator';

export default function FiscalCalculator() {
  const [period, setPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil(new Date().getMonth() / 3) + 1);
  const [loading, setLoading] = useState(false);
  const [fiscalData, setFiscalData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const quarters = [
    { value: 1, label: 'Q1 - Enero a Marzo' },
    { value: 2, label: 'Q2 - Abril a Junio' },
    { value: 3, label: 'Q3 - Julio a Septiembre' },
    { value: 4, label: 'Q4 - Octubre a Diciembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadFiscalData();
  }, [period, selectedYear, selectedMonth, selectedQuarter]);

  const loadFiscalData = async () => {
    try {
      setLoading(true);
      
      let params = {};
      
      if (period === 'monthly') {
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        const lastDay = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
        params = { date_from: firstDay, date_to: lastDay };
      } else if (period === 'quarterly') {
        const quarterMonths = {
          1: [0, 2],
          2: [3, 5],
          3: [6, 8],
          4: [9, 11]
        };
        const [startMonth, endMonth] = quarterMonths[selectedQuarter];
        const firstDay = new Date(selectedYear, startMonth, 1).toISOString().split('T')[0];
        const lastDay = new Date(selectedYear, endMonth + 1, 0).toISOString().split('T')[0];
        params = { date_from: firstDay, date_to: lastDay };
      } else if (period === 'annual') {
        const firstDay = `${selectedYear}-01-01`;
        const lastDay = `${selectedYear}-12-31`;
        params = { date_from: firstDay, date_to: lastDay };
      }

      const result = await fetchTransactions(params);
      const txData = result.transactions || result.data || [];
      setTransactions(txData);

      // Calculate fiscal summary
      const summary = calculateFiscalSummary(txData);
      
      let dueDate;
      if (period === 'monthly') {
        dueDate = getTaxDueDate(selectedYear, selectedMonth);
      } else if (period === 'quarterly') {
        const quarterEndMonths = [3, 6, 9, 12];
        dueDate = getTaxDueDate(selectedYear, quarterEndMonths[selectedQuarter - 1]);
      } else {
        dueDate = new Date(selectedYear + 1, 3, 30); // Annual due date: April 30th
      }

      setFiscalData({
        ...summary,
        dueDate,
        period,
        year: selectedYear,
        month: period === 'monthly' ? selectedMonth : undefined,
        quarter: period === 'quarterly' ? selectedQuarter : undefined
      });

    } catch (error) {
      console.error('Error loading fiscal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuarterlySummaries = async () => {
    try {
      setLoading(true);
      const firstDay = `${selectedYear}-01-01`;
      const lastDay = `${selectedYear}-12-31`;
      const result = await fetchTransactions({ date_from: firstDay, date_to: lastDay });
      const txData = result.transactions || result.data || [];
      
      return calculateQuarterlySummaries(txData);
    } catch (error) {
      console.error('Error loading quarterly data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Calculadora Fiscal</h2>
        
        {/* Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {period === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Mes</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'quarterly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Trimestre</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {quarters.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={loadFiscalData}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        {!loading && fiscalData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Ingresos</div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(fiscalData.businessIncome)}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Gastos</div>
              <div className="text-lg font-bold text-red-700">
                {formatCurrency(fiscalData.businessExpenses)}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Deducibles</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(fiscalData.deductibleExpenses)}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600">Utilidad</div>
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(fiscalData.utilidad)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Estimator */}
      {!loading && fiscalData && (
        <TaxEstimator data={fiscalData} period={period} />
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Transaction Count */}
      {!loading && fiscalData && transactions.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Transacciones analizadas: {transactions.length}</span>
            <span>
              {fiscalData.deductiblePercentage !== undefined && 
                `${formatPercentage(fiscalData.deductiblePercentage)} deducible`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
