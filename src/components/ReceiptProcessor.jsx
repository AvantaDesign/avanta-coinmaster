import { useState } from 'react';
import { processReceipt, calculateConfidence, validateExtractedData } from '../utils/ocrProcessor';
import { updateReceipt, createTransaction } from '../utils/api';
import { showSuccess, showError, showWarning } from '../utils/notifications';

export default function ReceiptProcessor({ receipt, onProcessComplete }) {
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [editedData, setEditedData] = useState(null);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  // Process receipt with OCR
  const handleProcess = async () => {
    if (!receipt || !receipt.file_path) {
      showError('No se encontró el archivo del recibo');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      // Get receipt image URL
      const imageUrl = `/api/upload/${receipt.file_path.split('/').pop()}`;
      
      // Download image for processing
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Process with OCR
      const result = await processReceipt(blob, (progressInfo) => {
        setProgress(progressInfo.progress || 0);
      });

      if (result.success) {
        // Calculate confidence for the extracted data
        const confidence = calculateConfidence(result.text, result.extractedData);
        
        // Validate extracted data
        const validation = validateExtractedData(result.extractedData);

        setOcrResult({
          ...result,
          confidence,
          validation
        });

        // Initialize edited data with extracted data
        setEditedData({
          amount: result.extractedData.amount || result.extractedData.total || '',
          date: result.extractedData.date || new Date().toISOString().split('T')[0],
          description: result.extractedData.merchant || '',
          notes: result.extractedData.rawText || result.text
        });

        // Save OCR result to database
        await updateReceipt(receipt.id, {
          ocr_text: result.text,
          extracted_data: result.extractedData,
          confidence_score: confidence
        });

        showSuccess('Procesamiento OCR completado');

        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => showWarning(warning));
        }
      } else {
        throw new Error(result.error || 'Error al procesar el recibo');
      }
    } catch (error) {
      console.error('[ReceiptProcessor] Processing error:', error);
      showError(`Error al procesar recibo: ${error.message}`);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  // Handle manual data editing
  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create transaction from receipt data
  const handleCreateTransaction = async () => {
    if (!editedData.amount || !editedData.description) {
      showError('Por favor ingrese al menos el monto y la descripción');
      return;
    }

    try {
      const transactionData = {
        date: editedData.date,
        description: editedData.description,
        amount: parseFloat(editedData.amount),
        type: 'gasto',
        transaction_type: 'business',
        notes: editedData.notes,
        receipt_id: receipt.id
      };

      await createTransaction(transactionData);
      showSuccess('Transacción creada exitosamente desde el recibo');
      
      if (onProcessComplete) {
        onProcessComplete(receipt.id);
      }
    } catch (error) {
      showError(`Error al crear transacción: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Procesar Recibo</h2>
        {ocrResult && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Confianza:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              ocrResult.confidence > 0.7 ? 'bg-green-100 text-green-800' :
              ocrResult.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {Math.round(ocrResult.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Receipt Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Información del Recibo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Archivo:</span>
            <span className="ml-2 font-medium">{receipt.file_name}</span>
          </div>
          <div>
            <span className="text-gray-600">Tamaño:</span>
            <span className="ml-2 font-medium">{(receipt.file_size / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-gray-600">Tipo:</span>
            <span className="ml-2 font-medium">{receipt.mime_type}</span>
          </div>
          <div>
            <span className="text-gray-600">Estado OCR:</span>
            <span className={`ml-2 font-medium ${
              receipt.ocr_status === 'completed' ? 'text-green-600' :
              receipt.ocr_status === 'failed' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {receipt.ocr_status}
            </span>
          </div>
        </div>
      </div>

      {/* Process Button */}
      {!ocrResult && (
        <button
          onClick={handleProcess}
          disabled={processing}
          className={`w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            processing ? 'animate-pulse' : ''
          }`}
        >
          {processing ? (
            <span>⏳ Procesando... {Math.round(progress * 100)}%</span>
          ) : (
            <span>🔍 Procesar con OCR</span>
          )}
        </button>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div className="space-y-6">
          {/* Validation Messages */}
          {ocrResult.validation && (
            <>
              {ocrResult.validation.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">❌ Errores:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {ocrResult.validation.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {ocrResult.validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Advertencias:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {ocrResult.validation.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Extracted Data - Editable Form */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Datos Extraídos (Editable)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editedData?.amount || ''}
                  onChange={(e) => handleEditChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={editedData?.date || ''}
                  onChange={(e) => handleEditChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción / Comercio *
                </label>
                <input
                  type="text"
                  value={editedData?.description || ''}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del comercio o descripción"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={editedData?.notes || ''}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales o texto del recibo"
                />
              </div>
            </div>
          </div>

          {/* Raw OCR Text */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Texto OCR Completo</h3>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto bg-white p-3 rounded border border-gray-200">
              {ocrResult.text}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleCreateTransaction}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              ✅ Crear Transacción
            </button>
            <button
              onClick={() => setOcrResult(null)}
              className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              🔄 Procesar Nuevamente
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Acerca del OCR:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• El procesamiento OCR se realiza en tu navegador (datos privados)</li>
          <li>• La precisión puede variar según la calidad de la imagen</li>
          <li>• Puedes editar manualmente los datos extraídos antes de crear la transacción</li>
          <li>• El texto completo del recibo se guarda como referencia</li>
        </ul>
      </div>
    </div>
  );
}
