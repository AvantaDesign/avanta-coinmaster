import { useState, useEffect } from 'react';
import { parseCSV } from '../utils/csvParser';

/**
 * CSV Import Mapper Component
 * Provides drag-and-drop column mapping for CSV imports
 */
export default function CSVImportMapper({ file, onMappingComplete, onCancel }) {
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [error, setError] = useState(null);

  // Required fields for import
  const requiredFields = [
    { key: 'date', label: 'Fecha', required: true, example: '2025-10-14 o 14/10/2025' },
    { key: 'description', label: 'Descripción', required: true, example: 'Compra en tienda' },
    { key: 'amount', label: 'Monto', required: true, example: '1500.00' },
  ];

  // Optional fields
  const optionalFields = [
    { key: 'type', label: 'Tipo (ingreso/gasto)', required: false, example: 'gasto o ingreso' },
    { key: 'category', label: 'Categoría', required: false, example: 'personal o avanta' },
    { key: 'account', label: 'Cuenta', required: false, example: 'BBVA Cuenta' },
    { key: 'balance', label: 'Saldo', required: false, example: '50000.00' },
  ];

  const allFields = [...requiredFields, ...optionalFields];

  useEffect(() => {
    if (file) {
      parseFile();
    }
  }, [file]);

  const parseFile = async () => {
    try {
      setError(null);
      const text = await file.text();
      const data = parseCSV(text);

      if (!data || data.length === 0) {
        setError('El archivo CSV está vacío');
        return;
      }

      const fileHeaders = Object.keys(data[0]);
      setHeaders(fileHeaders);
      setCsvData(data);
      setPreviewRows(data.slice(0, 5));

      // Auto-detect mapping
      const autoMapping = autoDetectMapping(fileHeaders);
      setMapping(autoMapping);
    } catch (err) {
      setError(`Error al parsear CSV: ${err.message}`);
    }
  };

  // Auto-detect column mapping based on common names
  const autoDetectMapping = (headers) => {
    const detected = {};
    
    const patterns = {
      date: ['fecha', 'date', 'fec'],
      description: ['descripcion', 'descripción', 'concepto', 'description', 'desc', 'movimiento'],
      amount: ['monto', 'importe', 'cantidad', 'amount'],
      type: ['tipo', 'type', 'transaccion'],
      category: ['categoria', 'categoría', 'category'],
      account: ['cuenta', 'account'],
      balance: ['saldo', 'balance']
    };

    for (const header of headers) {
      const headerLower = header.toLowerCase();
      
      for (const [field, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => headerLower.includes(keyword))) {
          detected[field] = header;
          break;
        }
      }
    }

    return detected;
  };

  const handleMappingChange = (field, csvColumn) => {
    setMapping(prev => ({
      ...prev,
      [field]: csvColumn
    }));
  };

  const handleClearMapping = (field) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[field];
      return newMapping;
    });
  };

  const validateMapping = () => {
    const errors = [];
    
    // Check all required fields are mapped
    for (const field of requiredFields) {
      if (!mapping[field.key]) {
        errors.push(`Campo requerido "${field.label}" no está mapeado`);
      }
    }

    // Check no duplicate mappings
    const mappedColumns = Object.values(mapping);
    const duplicates = mappedColumns.filter((col, idx) => mappedColumns.indexOf(col) !== idx);
    if (duplicates.length > 0) {
      errors.push(`Columnas duplicadas: ${[...new Set(duplicates)].join(', ')}`);
    }

    return errors;
  };

  const handleConfirm = () => {
    const errors = validateMapping();
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    onMappingComplete(mapping);
  };

  if (error && !csvData) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={onCancel}
          className="mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!csvData) {
    return (
      <div className="p-4 text-center">
        <div className="text-xl">Procesando archivo...</div>
      </div>
    );
  }

  const validationErrors = validateMapping();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold mb-2">Mapear Columnas del CSV</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Relaciona las columnas de tu CSV con los campos del sistema. 
          Los campos con <span className="text-red-600">*</span> son obligatorios.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Mapping grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left side: Field mappings */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Campos del Sistema</h4>
          
          {allFields.map(field => (
            <div key={field.key} className="border rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="font-medium text-gray-800 dark:text-gray-200">
                    {field.label}
                    {field.required && <span className="text-red-600 ml-1">*</span>}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Ejemplo: {field.example}
                  </p>
                </div>
                {mapping[field.key] && (
                  <button
                    onClick={() => handleClearMapping(field.key)}
                    className="text-red-600 hover:text-red-800 dark:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  field.required && !mapping[field.key]
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              >
                <option value="">-- Seleccionar columna --</option>
                {headers.map(header => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Right side: Preview */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Vista Previa (primeras 5 filas)</h4>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0">
                  <tr>
                    {headers.map(header => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        {header}
                        {Object.values(mapping).includes(header) && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {headers.map(header => (
                        <td key={header} className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapped preview */}
          {Object.keys(mapping).length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 border-b">
                <h5 className="text-sm font-semibold text-blue-900">Vista con Campos Mapeados</h5>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-slate-800">
                    <tr>
                      {Object.entries(mapping).map(([field, csvColumn]) => (
                        <th key={field} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          {allFields.find(f => f.key === field)?.label || field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.entries(mapping).map(([field, csvColumn]) => (
                          <td key={field} className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {row[csvColumn]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation warnings */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded">
          <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Pendientes:</h5>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={validationErrors.length > 0}
          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continuar con Mapeo
        </button>
      </div>

      {/* Info footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-slate-800 rounded">
        <strong>💡 Consejo:</strong> El sistema intenta detectar automáticamente las columnas. 
        Verifica que el mapeo sea correcto antes de continuar.
      </div>
    </div>
  );
}
