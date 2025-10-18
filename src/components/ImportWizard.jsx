import { useState, useRef } from 'react';
import { parseCSV, confirmImport } from '../utils/api';
import { formatCurrency } from '../utils/calculations';

export default function ImportWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Step 1: File upload
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Step 2: Preview and validation
  const [parseResult, setParseResult] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  
  // Step 3: Import result
  const [importResult, setImportResult] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor seleccione un archivo CSV válido');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Por favor seleccione un archivo CSV válido');
        return;
      }
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleParse = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target.result;
        
        try {
          const result = await parseCSV(csvContent, fileName);
          setParseResult(result);
          setStep(2);
        } catch (error) {
          console.error('Parse error:', error);
          setError(error.message || 'Error al analizar el archivo CSV');
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error al leer el archivo');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('File read error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;

    setLoading(true);
    setError(null);

    try {
      const result = await confirmImport({
        transactions: parseResult.transactions,
        fileName: parseResult.fileName,
        source: parseResult.source,
        skipDuplicates,
        periodStart: parseResult.summary.periodStart,
        periodEnd: parseResult.summary.periodEnd,
      });

      setImportResult(result);
      setSuccess('Importación completada exitosamente');
      setStep(3);
    } catch (error) {
      console.error('Import error:', error);
      setError(error.message || 'Error al importar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setFileName('');
    setParseResult(null);
    setImportResult(null);
    setError(null);
    setSuccess(null);
    setSkipDuplicates(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Importar Datos
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={`text-sm font-medium ${
              step >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Cargar Archivo
            </span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${
            step >= 2 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
          }`} />

          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className={`text-sm font-medium ${
              step >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Vista Previa
            </span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${
            step >= 3 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
          }`} />

          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              3
            </div>
            <span className={`text-sm font-medium ${
              step >= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Confirmación
            </span>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex">
            <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
            <p className="text-green-800 dark:text-green-300 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Paso 1: Cargar Archivo CSV
          </h2>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              file
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <>
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {fileName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Haz clic para cambiar el archivo
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📤</div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Arrastra tu archivo CSV aquí
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Formatos soportados: BBVA, Banco Azteca, CSV genérico
                </p>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={handleParse}
              disabled={!file || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analizando...' : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && parseResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Paso 2: Vista Previa de Importación
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Transacciones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseResult.summary.validTransactions}
                </p>
              </div>

              {parseResult.summary.duplicates > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Duplicados</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                    {parseResult.summary.duplicates}
                  </p>
                </div>
              )}

              {parseResult.summary.errors > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">Errores</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                    {parseResult.summary.errors}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">Período</p>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {parseResult.summary.periodStart} - {parseResult.summary.periodEnd}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Omitir transacciones duplicadas
                </span>
              </label>
            </div>

            {/* Transaction Preview */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {parseResult.transactions.slice(0, 10).map((tx, index) => (
                      <tr key={index} className={tx.isDuplicate ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                          <span className={tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.type === 'ingreso'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {tx.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {tx.isDuplicate && (
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                              Duplicado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {parseResult.transactions.length > 10 && (
                <div className="bg-gray-50 dark:bg-slate-800 px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                  Mostrando 10 de {parseResult.transactions.length} transacciones
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Atrás
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Importando...' : 'Confirmar Importación'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && importResult && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Paso 3: Importación Completada
          </h2>

          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Importación Exitosa!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Las transacciones se han importado correctamente
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400">Importadas</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                  {importResult.summary.recordsImported}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Omitidas</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
                  {importResult.summary.recordsDuplicated}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">Fallidas</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-300">
                  {importResult.summary.recordsFailed}
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Importar Otro Archivo
              </button>
              <button
                onClick={() => window.location.href = '/transactions'}
                className="btn-primary"
              >
                Ver Transacciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
