import { useState, useRef } from 'react';
import { 
  parseCFDI, 
  validateCFDI, 
  cfdiToInvoice,
  cfdiToTransaction,
  formatCFDIDisplay 
} from '../utils/cfdiParser';
import { createInvoice, createTransaction, uploadFile } from '../utils/api';

export default function CFDIImport({ onSuccess, onClose, mode = 'invoice' }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [createTransactionOption, setCreateTransactionOption] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xml')) {
        setError('El archivo debe ser un XML');
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
      if (!droppedFile.name.endsWith('.xml')) {
        setError('El archivo debe ser un XML');
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
      const cfdiData = parseCFDI(text);
      
      // Validate CFDI
      const validation = validateCFDI(cfdiData);
      
      if (!validation.valid) {
        setError('CFDI inválido: ' + validation.errors.join(', '));
        setParseResult(null);
        return;
      }

      // Format for display
      const display = formatCFDIDisplay(cfdiData);

      setParseResult({
        cfdi: cfdiData,
        display,
        validation
      });
    } catch (err) {
      setError(err.message);
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  };

  const importCFDI = async () => {
    if (!parseResult || !parseResult.validation.valid) {
      setError('CFDI inválido. No se puede importar.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      // Step 1: Upload XML file to R2
      let xmlUrl = '';
      try {
        const uploadResult = await uploadFile(file);
        xmlUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('Failed to upload XML:', uploadErr.message);
        // Continue without XML URL
      }

      // Step 2: Create invoice record
      const invoiceData = cfdiToInvoice(parseResult.cfdi);
      invoiceData.xml_url = xmlUrl;

      try {
        await createInvoice(invoiceData);
      } catch (invoiceErr) {
        if (invoiceErr.message.includes('UNIQUE')) {
          setError('Esta factura ya existe (UUID duplicado)');
          setImporting(false);
          return;
        }
        throw invoiceErr;
      }

      // Step 3: Optionally create transaction
      if (createTransactionOption) {
        try {
          const transactionData = cfdiToTransaction(parseResult.cfdi);
          transactionData.receipt_url = xmlUrl;
          await createTransaction(transactionData);
        } catch (transErr) {
          console.warn('Failed to create transaction:', transErr.message);
          // Continue - invoice was created successfully
        }
      }

      alert('✅ CFDI importado exitosamente');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError('Error durante la importación: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Importar CFDI (XML)</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Select File */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Seleccionar Archivo XML</h3>

            {/* File Drop Zone */}
            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <div className="text-4xl mb-2">📋</div>
                <p className="text-lg font-medium mb-1">Arrastra tu CFDI XML aquí</p>
                <p className="text-sm text-gray-600">o haz clic para seleccionar</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Selected File */}
            {file && !parseResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">📋 {file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
                <button
                  onClick={parseFile}
                  disabled={loading}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Analizando...' : 'Analizar CFDI'}
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">❌ Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Step 2: Review CFDI */}
          {parseResult && (
            <div>
              <h3 className="text-lg font-semibold mb-3">2. Revisar Datos del CFDI</h3>

              {/* CFDI Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Folio:</p>
                    <p className="font-medium">{parseResult.display.folio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha:</p>
                    <p className="font-medium">{parseResult.display.fecha}</p>
                  </div>
                </div>

                {/* UUID */}
                <div>
                  <p className="text-sm text-gray-600">UUID (Folio Fiscal):</p>
                  <p className="font-mono text-sm bg-white p-2 rounded border">
                    {parseResult.display.uuid}
                  </p>
                </div>

                {/* Emisor */}
                <div>
                  <p className="text-sm text-gray-600">Emisor:</p>
                  <p className="font-medium">{parseResult.display.emisor}</p>
                </div>

                {/* Receptor */}
                <div>
                  <p className="text-sm text-gray-600">Receptor:</p>
                  <p className="font-medium">{parseResult.display.receptor}</p>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal:</p>
                    <p className="font-bold">{parseResult.display.subtotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IVA (16%):</p>
                    <p className="font-bold">{parseResult.display.iva}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total:</p>
                    <p className="font-bold text-blue-600">{parseResult.display.total}</p>
                  </div>
                </div>

                {/* Conceptos */}
                {parseResult.display.conceptos.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      Conceptos ({parseResult.display.conceptos.length}):
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {parseResult.display.conceptos.map((concepto, idx) => (
                        <div key={idx} className="bg-white p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span>{concepto.descripcion}</span>
                            <span className="font-medium">{concepto.importe}</span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            Cantidad: {concepto.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createTransactionOption}
                    onChange={(e) => setCreateTransactionOption(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    Crear también una transacción automáticamente basada en este CFDI
                  </span>
                </label>
              </div>

              {/* Import Actions */}
              <div className="flex gap-4">
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
                  onClick={importCFDI}
                  disabled={importing}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {importing ? 'Importando...' : 'Importar CFDI'}
                </button>
              </div>
            </div>
          )}

          {/* Help Section */}
          {!parseResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Acerca del CFDI:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• El CFDI es el Comprobante Fiscal Digital por Internet oficial del SAT</li>
                <li>• Soporta versiones CFDI 3.3 y 4.0</li>
                <li>• El UUID debe ser único (no se pueden importar facturas duplicadas)</li>
                <li>• El sistema detecta automáticamente si es ingreso o gasto</li>
                <li>• Se calcula automáticamente el IVA del 16%</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                Los archivos de ejemplo están en la carpeta <code className="bg-gray-200 px-1 rounded">samples/</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
