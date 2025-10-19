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
    isr_brackets: [],
    tax_regime: 'persona_fisica_actividad_empresarial' // Default regime
  });

  // Phase 17: State for UMA values and SAT accounts catalog
  const [umaValues, setUmaValues] = useState({ daily: 0, monthly: 0, annual: 0 });
  const [satAccounts, setSatAccounts] = useState([]);
  const [showSATCatalog, setShowSATCatalog] = useState(false);
  const [satSearchTerm, setSatSearchTerm] = useState('');

  // Tax regime options for Mexico
  const taxRegimes = [
    { value: 'persona_fisica_actividad_empresarial', label: 'Persona Física con Actividad Empresarial' },
    { value: 'resico', label: 'Régimen Simplificado de Confianza (RESICO)' },
    { value: 'servicios_profesionales', label: 'Servicios Profesionales (Honorarios)' },
    { value: 'arrendamiento', label: 'Arrendamiento' },
    { value: 'salarios', label: 'Sueldos y Salarios' },
    { value: 'actividades_agricolas', label: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
    { value: 'regimen_incorporacion_fiscal', label: 'Régimen de Incorporación Fiscal (RIF)' }
  ];

  useEffect(() => {
    loadAvailableYears();
    loadConfig();
    loadUMAValues();
    loadSATAccounts();
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
      const settings = data.config.settings || {};
      setFormData({
        iva_rate: data.config.iva_rate,
        iva_retention_rate: data.config.iva_retention_rate,
        diot_threshold: data.config.diot_threshold,
        isr_brackets: data.config.isr_brackets,
        tax_regime: settings.tax_regime || 'persona_fisica_actividad_empresarial'
      });
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Phase 17: Load UMA values from fiscal parameters
  const loadUMAValues = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      // Load daily UMA
      const dailyResponse = await fetch(`${API_URL}/api/fiscal-parameters?type=uma_value&period=permanent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dailyData = await dailyResponse.json();
      
      // Find the current year's UMA values
      const currentYearParams = dailyData.parameters?.filter(p => 
        p.effective_from.startsWith(selectedYear.toString())
      ) || [];
      
      const daily = currentYearParams.find(p => p.id.includes('daily'))?.value || 0;
      const monthly = currentYearParams.find(p => p.id.includes('monthly'))?.value || 0;
      const annual = currentYearParams.find(p => p.id.includes('annual'))?.value || 0;
      
      setUmaValues({
        daily: parseFloat(daily),
        monthly: parseFloat(monthly),
        annual: parseFloat(annual)
      });
    } catch (error) {
      console.error('Error loading UMA values:', error);
    }
  };

  // Phase 17: Load SAT accounts catalog
  const loadSATAccounts = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`${API_URL}/api/sat-accounts-catalog?hierarchical=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSatAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error loading SAT accounts:', error);
    }
  };

  // Phase 17: Search SAT accounts
  const searchSATAccounts = async (term) => {
    if (!term || term.length < 2) {
      loadSATAccounts();
      return;
    }
    
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`${API_URL}/api/sat-accounts-catalog/search?q=${encodeURIComponent(term)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSatAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error searching SAT accounts:', error);
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
          iva_rate: formData.iva_rate,
          iva_retention_rate: formData.iva_retention_rate,
          diot_threshold: formData.diot_threshold,
          isr_brackets: formData.isr_brackets,
          settings: {
            tax_regime: formData.tax_regime
          }
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
      const settings = config.settings || {};
      setFormData({
        iva_rate: config.iva_rate,
        iva_retention_rate: config.iva_retention_rate,
        diot_threshold: config.diot_threshold,
        isr_brackets: config.isr_brackets,
        tax_regime: settings.tax_regime || 'persona_fisica_actividad_empresarial'
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
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
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

      {/* Tax Regime Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Régimen Fiscal</h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Importante:</strong> Selecciona tu régimen fiscal según tu situación tributaria en México. 
            Esto afectará cómo se calculan tus impuestos (ISR e IVA).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Régimen Fiscal Aplicable
          </label>
          {editing ? (
            <select
              value={formData.tax_regime}
              onChange={(e) => setFormData(prev => ({ ...prev, tax_regime: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            >
              {taxRegimes.map(regime => (
                <option key={regime.value} value={regime.value}>
                  {regime.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {taxRegimes.find(r => r.value === formData.tax_regime)?.label || 'No especificado'}
            </p>
          )}
        </div>
      </div>

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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800">
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
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Nota:</strong> Las tablas de ISR deben actualizarse cada año según las publicaciones oficiales del SAT. 
            La configuración actual se aplica para cálculos de impuestos provisionales y simulaciones fiscales.
          </p>
        </div>
      </div>

      {/* Phase 17: UMA Values */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Valores UMA {selectedYear}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unidad de Medida y Actualización - Valores oficiales publicados por INEGI
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">UMA Diaria</span>
              <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 rounded">Día</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(umaValues.daily)}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Por día</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900 dark:text-green-300">UMA Mensual</span>
              <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 rounded">Mes</span>
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(umaValues.monthly)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">30.4 días promedio</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-300">UMA Anual</span>
              <span className="text-xs px-2 py-1 bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 rounded">Año</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(umaValues.annual)}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">365 días</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-300">
            <strong>Aplicación:</strong> Los valores UMA se utilizan para calcular límites de deducciones personales 
            (15% de ingresos anuales o 5 veces la UMA anual, lo que sea menor) y otros límites fiscales establecidos por el SAT.
          </p>
        </div>
      </div>

      {/* Phase 17: SAT Accounts Catalog */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Catálogo de Cuentas SAT (Anexo 24)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Código agrupador oficial del SAT para Contabilidad Electrónica
            </p>
          </div>
          <button
            onClick={() => setShowSATCatalog(!showSATCatalog)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {showSATCatalog ? 'Ocultar Catálogo' : 'Ver Catálogo'}
          </button>
        </div>

        {showSATCatalog && (
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-800/50">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={satSearchTerm}
                onChange={(e) => {
                  setSatSearchTerm(e.target.value);
                  searchSATAccounts(e.target.value);
                }}
                placeholder="Buscar por código o descripción..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ej: "101.02" para Bancos, o "gastos" para buscar cuentas de gastos
              </p>
            </div>

            {/* SAT Accounts Tree */}
            <div className="max-h-96 overflow-y-auto">
              {satAccounts.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No se encontraron cuentas. Asegúrate de que la migración 024 se haya ejecutado.
                </p>
              ) : (
                <div className="space-y-2">
                  {satAccounts.map(account => (
                    <SATAccountItem key={account.codigo_agrupador} account={account} level={0} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Phase 17: Helper component to render SAT account items recursively
function SATAccountItem({ account, level }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = account.children && account.children.length > 0;
  
  const levelColors = [
    'text-gray-900 dark:text-gray-100 font-bold',
    'text-blue-900 dark:text-blue-300 font-semibold',
    'text-green-900 dark:text-green-300',
    'text-purple-900 dark:text-purple-300 text-sm',
    'text-gray-700 dark:text-gray-400 text-sm'
  ];
  
  const paddingLeft = level * 24;
  
  return (
    <div>
      <div 
        className={`flex items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer ${levelColors[level] || levelColors[4]}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className="mr-2 text-gray-500 dark:text-gray-400">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="mr-2 w-4"></span>}
        <span className="font-mono mr-3 min-w-[80px]">{account.codigo_agrupador}</span>
        <span className="flex-1">{account.descripcion}</span>
        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-slate-600 rounded ml-2">
          Nivel {account.nivel}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {account.children.map(child => (
            <SATAccountItem key={child.codigo_agrupador} account={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
