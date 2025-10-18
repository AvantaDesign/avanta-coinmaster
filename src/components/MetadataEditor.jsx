import { useState, useEffect } from 'react';

/**
 * Reusable metadata editor component
 * Allows adding/editing key-value pairs as metadata
 * 
 * Props:
 * - value: Object containing current metadata
 * - onChange: Callback when metadata changes
 * - presets: Array of preset key suggestions for the entity type
 * - suggestions: Object with key-value pair suggestions from previous entries
 */
export default function MetadataEditor({ value = {}, onChange, presets = [], suggestions = {} }) {
  const [metadata, setMetadata] = useState(value || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    setMetadata(value || {});
  }, [value]);

  const handleAdd = () => {
    if (!newKey.trim()) return;
    
    const updatedMetadata = {
      ...metadata,
      [newKey.trim()]: newValue.trim()
    };
    
    setMetadata(updatedMetadata);
    onChange(updatedMetadata);
    setNewKey('');
    setNewValue('');
    setShowAddField(false);
  };

  const handleRemove = (key) => {
    const updatedMetadata = { ...metadata };
    delete updatedMetadata[key];
    setMetadata(updatedMetadata);
    onChange(updatedMetadata);
  };

  const handleUpdate = (key, newVal) => {
    const updatedMetadata = {
      ...metadata,
      [key]: newVal
    };
    setMetadata(updatedMetadata);
    onChange(updatedMetadata);
  };

  const handlePresetSelect = (presetKey) => {
    setNewKey(presetKey);
    setNewValue(suggestions[presetKey] || '');
  };

  return (
    <div className="space-y-4">
      {/* Existing metadata */}
      {Object.keys(metadata).length > 0 && (
        <div className="space-y-2">
          {Object.entries(metadata).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Campo
                  </label>
                  <input
                    type="text"
                    value={key}
                    disabled
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleUpdate(key, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(key)}
                className="mt-5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                title="Eliminar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new field */}
      {showAddField ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campo *
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="ej: banco, sucursal"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor *
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="ej: BBVA, Centro"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Preset suggestions */}
            {presets.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Campos sugeridos:
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handlePresetSelect(preset.key)}
                      className="px-3 py-1 text-xs bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-gray-300"
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false);
                  setNewKey('');
                  setNewValue('');
                }}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newKey.trim()}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors text-sm font-medium"
        >
          + Agregar detalle
        </button>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        Los detalles adicionales te ayudan a organizar mejor tu información financiera y encontrar relaciones entre cuentas e instituciones.
      </p>
    </div>
  );
}

// Common presets for different entity types
export const METADATA_PRESETS = {
  accounts: [
    { key: 'bank_name', label: 'Banco', description: 'Nombre del banco o institución financiera' },
    { key: 'account_number_last4', label: 'Últimos 4 dígitos', description: 'Últimos 4 dígitos de la cuenta' },
    { key: 'branch', label: 'Sucursal', description: 'Sucursal bancaria' },
    { key: 'swift_code', label: 'Código SWIFT', description: 'Código SWIFT para transferencias internacionales' },
    { key: 'clabe', label: 'CLABE', description: 'CLABE interbancaria' },
    { key: 'account_officer', label: 'Ejecutivo', description: 'Ejecutivo de cuenta asignado' }
  ],
  credits: [
    { key: 'bank_name', label: 'Banco', description: 'Banco emisor de la tarjeta' },
    { key: 'card_network', label: 'Red', description: 'Visa, Mastercard, Amex, etc.' },
    { key: 'card_last4', label: 'Últimos 4 dígitos', description: 'Últimos 4 dígitos de la tarjeta' },
    { key: 'apr', label: 'APR/Tasa', description: 'Tasa de interés anual' },
    { key: 'rewards_program', label: 'Programa de puntos', description: 'Programa de recompensas' },
    { key: 'annual_fee', label: 'Anualidad', description: 'Costo anual de la tarjeta' }
  ],
  debts: [
    { key: 'creditor_type', label: 'Tipo de acreedor', description: 'Banco, financiera, personal, etc.' },
    { key: 'original_creditor', label: 'Acreedor original', description: 'Acreedor original si fue vendida la deuda' },
    { key: 'collection_agency', label: 'Agencia de cobranza', description: 'Agencia encargada del cobro' },
    { key: 'account_number', label: 'Número de cuenta', description: 'Número de referencia de la deuda' },
    { key: 'contract_number', label: 'Número de contrato', description: 'Número del contrato de préstamo' },
    { key: 'loan_officer', label: 'Oficial de crédito', description: 'Oficial encargado del préstamo' }
  ],
  investments: [
    { key: 'broker', label: 'Casa de bolsa', description: 'Broker o casa de bolsa' },
    { key: 'asset_class', label: 'Clase de activo', description: 'Acciones, bonos, fondos, etc.' },
    { key: 'ticker_symbol', label: 'Símbolo', description: 'Símbolo bursátil (ticker)' },
    { key: 'cusip', label: 'CUSIP', description: 'Código CUSIP del valor' },
    { key: 'isin', label: 'ISIN', description: 'Código ISIN internacional' },
    { key: 'account_number', label: 'Número de cuenta', description: 'Número de cuenta en la casa de bolsa' },
    { key: 'advisor', label: 'Asesor', description: 'Asesor financiero asignado' }
  ]
};
