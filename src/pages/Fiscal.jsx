import { useState, useEffect } from 'react';
import { fetchFiscal } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function Fiscal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadFiscalData();
  }, [selectedMonth, selectedYear]);

  const loadFiscalData = async () => {
    try {
      setLoading(true);
      const result = await fetchFiscal(selectedMonth, selectedYear);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vista Fiscal</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-md"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">Cargando datos fiscales...</div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(data.income)}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Gastos Deducibles</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(data.deductible)}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Utilidad</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(data.utilidad)}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Fecha Límite</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {formatDate(data.dueDate)}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Impuestos a Pagar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">ISR Provisional (20%)</div>
                  <div className="text-3xl font-bold text-red-700">
                    {formatCurrency(data.isr)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Cálculo simplificado sobre utilidad
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">IVA a Pagar (16%)</div>
                  <div className="text-3xl font-bold text-orange-700">
                    {formatCurrency(data.iva)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    IVA cobrado menos IVA pagado
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Nota:</strong> Los cálculos son aproximados para tracking personal.
                Para declaraciones reales, consulta con tu contador.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
