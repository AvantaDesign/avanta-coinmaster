import { useState, useEffect } from 'react';
import { validateISRBrackets, formatISRBracket } from '../utils/fiscal';
import { formatCurrency } from '../utils/calculations';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function FiscalConfiguration() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [errors, setErrors] = useState([]);

  const [formData, setFormData] = useState({
    iva_rate: 0.16,
    iva_retention_rate: 0.1067,
    diot_threshold: 50000,
    isr_brackets: []
  });

  useEffect(() => {
    loadAvailableYears();
    loadConfig();
  }, [selectedYear]);

  const loadAvailableYears = async () => {
    try {
      const response = await fetch(`${API_URL}/api/fiscal-config/years`, {
        credentials: 'include'
      });
      const data = await response.json();
      setAvailableYears(data.years || []);
    } catch (error) {
      console.error('Error loading years:', error);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/fiscal-config?year=${selectedYear}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setConfig(data.config);
      setFormData({
        iva_rate: data.config.iva_rate,
        iva_retention_rate: data.config.iva_retention_rate,
        diot_threshold: data.config.diot_threshold,
        isr_brackets: data.config.isr_brackets
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    const validation = validateISRBrackets(formData.isr_brackets);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSaving(true);
      setErrors([]);

      const response = await fetch(`${API_URL}/api/fiscal-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: selectedYear,
          ...formData
        })
      });

      if (response.ok) {
        setEditing(false);
        loadConfig();
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setErrors(['Error al guardar la configuración']);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors([]);
    if (config) {
      setFormData({
        iva_rate: config.iva_rate,
        iva_retention_rate: config.iva_retention_rate,
        diot_threshold: config.diot_threshold,
        isr_brackets: config.isr_brackets
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-md">
        <div className="text-center">Cargando configuración fiscal...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuración Fiscal</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[...new Set([selectedYear, ...availableYears.map(y => y.year)])].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Editar Configuración
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-6">
          <p className="font-semibold mb-2">Errores de validación:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* IVA Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Configuración de IVA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasa de IVA
            </label>
            {editing ? (
              <div className="relative">
                <input
                  type="number"
                  value={formData.iva_rate * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, iva_rate: parseFloat(e.target.value) / 100 }))}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">%</span>
              </div>
            ) : (
              <p className="text-xl font-semibold">{(formData.iva_rate * 100).toFixed(2)}%</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasa de Retención
            </label>
            {editing ? (
              <div className="relative">
                <input
                  type="number"
                  value={formData.iva_retention_rate * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, iva_retention_rate: parseFloat(e.target.value) / 100 }))}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">%</span>
              </div>
            ) : (
              <p className="text-xl font-semibold">{(formData.iva_retention_rate * 100).toFixed(2)}%</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Umbral DIOT
            </label>
            {editing ? (
              <input
                type="number"
                value={formData.diot_threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, diot_threshold: parseFloat(e.target.value) }))}
                step="1000"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-xl font-semibold">{formatCurrency(formData.diot_threshold)}</p>
            )}
          </div>
        </div>
      </div>

      {/* ISR Brackets */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablas de ISR {selectedYear}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Límite Inferior
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Límite Superior
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cuota Fija
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tasa (%)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {formData.isr_brackets.map((bracket, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(bracket.lowerLimit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {bracket.limit === 999999999 ? 'En adelante' : formatCurrency(bracket.limit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(bracket.fixedFee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    {(bracket.rate * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Las tablas de ISR deben actualizarse cada año según las publicaciones oficiales del SAT. 
            La configuración actual se aplica para cálculos de impuestos provisionales y simulaciones fiscales.
          </p>
        </div>
      </div>
    </div>
  );
}
