import { useState, useRef } from 'react';
import { 
  parseGenericBankStatement, 
  parseBBVAStatement, 
  parseAztecaStatement,
  validateTransactions,
  parseWithMapping
} from '../utils/csvParser';
import { createTransaction } from '../utils/api';
import { showSuccess, showError, showWarning } from '../utils/notifications';
import CSVImportMapper from './CSVImportMapper';

export default function CSVImport({ onSuccess, onClose }) {
  const [file, setFile] = useState(null);
  const [bankType, setBankType] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showMapper, setShowMapper] = useState(false);
  const [columnMapping, setColumnMapping] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('El archivo debe ser un CSV');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setParseResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('El archivo debe ser un CSV');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setParseResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const parseFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      let transactions;
      
      // If we have a custom mapping, use it
      if (columnMapping) {
        transactions = parseWithMapping(text, columnMapping);
      } else {
        // Use automatic bank detection
        switch (bankType) {
          case 'bbva':
            transactions = parseBBVAStatement(text);
            break;
          case 'azteca':
            transactions = parseAztecaStatement(text);
            break;
          case 'custom':
            // Show mapper for custom format
            setShowMapper(true);
            setLoading(false);
            return;
          case 'auto':
          default:
            transactions = parseGenericBankStatement(text);
            break;
        }
      }

      // Validate transactions
      const validation = validateTransactions(transactions);
      
      setParseResult({
        transactions,
        validation
      });

      if (!validation.allValid) {
        showWarning(`${validation.invalidCount} transacciones tienen errores de validación`);
      } else {
        showSuccess(`${validation.validCount} transacciones válidas detectadas`);
      }
    } catch (err) {
      setError(err.message);
      showError(`Error al parsear CSV: ${err.message}`);
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMappingComplete = (mapping) => {
    setColumnMapping(mapping);
    setShowMapper(false);
    parseFile();
  };

  const importTransactions = async () => {
    if (!parseResult || !parseResult.validation.allValid) {
      setError('Corrija los errores antes de importar');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const validTransactions = parseResult.transactions.filter((_, idx) => 
        parseResult.validation.results[idx].valid
      );

      setImportProgress({ current: 0, total: validTransactions.length });

      let imported = 0;
      let failed = 0;
      const errors = [];

      for (let i = 0; i < validTransactions.length; i++) {
        try {
          await createTransaction(validTransactions[i]);
          imported++;
        } catch (err) {
          failed++;
          errors.push(`Fila ${i + 1}: ${err.message}`);
        }
        setImportProgress({ current: i + 1, total: validTransactions.length });
      }

      if (failed === 0) {
        showSuccess(`${imported} transacciones importadas exitosamente`);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        const errorMsg = `Importadas: ${imported}, Fallidas: ${failed}`;
        showError(errorMsg);
        setError(`${errorMsg}\n${errors.slice(0, 3).join('\n')}`);
      }
    } catch (err) {
      setError('Error durante la importación: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const updateTransaction = (index, field, value) => {
    if (!parseResult) return;

    const updated = { ...parseResult };
    updated.transactions[index][field] = value;

    // Re-validate
    updated.validation = validateTransactions(updated.transactions);

    setParseResult(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Show mapper if in custom mode */}
        {showMapper ? (
          <div className="p-6">
            <CSVImportMapper
              file={file}
              onMappingComplete={handleMappingComplete}
              onCancel={() => {
                setShowMapper(false);
                setFile(null);
              }}
            />
          </div>
        ) : (
          <>
            <div className="p-6 border-b sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Importar CSV de Banco</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select File */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Seleccionar Archivo CSV</h3>
            
            {/* Bank Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Banco:</label>
              <select
                value={bankType}
                onChange={(e) => setBankType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={parseResult !== null}
              >
                <option value="auto">Detectar Automáticamente</option>
                <option value="bbva">BBVA</option>
                <option value="azteca">Banco Azteca</option>
                <option value="custom">Personalizado (Mapear Columnas)</option>
              </select>
            </div>

            {/* File Drop Zone */}
            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <div className="text-4xl mb-2">📄</div>
                <p className="text-lg font-medium mb-1">Arrastra tu archivo CSV aquí</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">o haz clic para seleccionar</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Selected File */}
            {file && !parseResult && (
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">📄 {file.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800 dark:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
                <button
                  onClick={parseFile}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'Analizando...' : 'Analizar CSV'}
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">❌ Error</p>
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Step 2: Review and Edit */}
          {parseResult && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                2. Revisar Transacciones ({parseResult.validation.validCount} válidas, {parseResult.validation.invalidCount} con errores)
              </h3>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {parseResult.validation.totalCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {parseResult.validation.validCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Válidas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {parseResult.validation.invalidCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Con Errores</p>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Categoría</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.transactions.map((trans, idx) => {
                      const validation = parseResult.validation.results[idx];
                      return (
                        <tr
                          key={idx}
                          className={`border-t ${!validation.valid ? 'bg-red-50' : ''}`}
                        >
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{trans.date}</td>
                          <td className="px-3 py-2 max-w-xs truncate" title={trans.description}>
                            {trans.description}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ${trans.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={trans.type}
                              onChange={(e) => updateTransaction(idx, 'type', e.target.value)}
                              className="text-sm px-2 py-1 border rounded"
                            >
                              <option value="ingreso">Ingreso</option>
                              <option value="gasto">Gasto</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={trans.category}
                              onChange={(e) => updateTransaction(idx, 'category', e.target.value)}
                              className="text-sm px-2 py-1 border rounded"
                            >
                              <option value="personal">Personal</option>
                              <option value="avanta">Avanta</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {validation.valid ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span 
                                className="text-red-600 cursor-help" 
                                title={validation.errors.join(', ')}
                              >
                                ✗
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Import Actions */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setFile(null);
                    setParseResult(null);
                  }}
                  className="px-6 py-2 border rounded-md hover:bg-gray-50"
                >
                  ← Volver
                </button>
                <button
                  onClick={importTransactions}
                  disabled={!parseResult.validation.allValid || importing}
                  className="flex-1 bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {importing
                    ? `Importando... ${importProgress.current}/${importProgress.total}`
                    : `Importar ${parseResult.validation.validCount} Transacciones`}
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          {!parseResult && (
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Formatos Soportados:</h4>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>• <strong>BBVA:</strong> Fecha, Descripción, Cargo, Abono, Saldo</li>
                <li>• <strong>Azteca:</strong> Fecha, Concepto, Retiro, Depósito, Saldo</li>
                <li>• <strong>Genérico:</strong> Cualquier CSV con columnas de fecha, descripción y monto</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Los archivos de ejemplo están en la carpeta <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">samples/</code>
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
