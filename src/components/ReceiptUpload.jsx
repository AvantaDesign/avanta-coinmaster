import { useState, useRef } from 'react';
import { uploadReceipt } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';

export default function ReceiptUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  // Process selected file
  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      showError('Tipo de archivo no válido. Use JPG, PNG, GIF o PDF.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      showError(`Archivo demasiado grande. Máximo: 10 MB`);
      return;
    }

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!file) {
      showError('Por favor seleccione un archivo');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadReceipt(file);
      showSuccess('Recibo subido exitosamente');
      
      // Reset form
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(result.receipt);
      }
    } catch (error) {
      showError(`Error al subir recibo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open camera on mobile (if available)
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Subir Recibo</h2>
      
      {/* Drag and Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Vista previa del recibo" 
              className="max-h-64 mx-auto rounded shadow-md"
            />
            <p className="text-sm text-gray-600">{file?.name}</p>
            <p className="text-xs text-gray-500">
              {file && `${(file.size / 1024).toFixed(1)} KB`}
            </p>
          </div>
        ) : file ? (
          <div className="space-y-2">
            <div className="text-6xl">📄</div>
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📸</div>
            <p className="text-gray-600">
              Arrastra un recibo aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, GIF o PDF • Máximo 10 MB
            </p>
          </div>
        )}
      </div>

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {!file && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📁 Seleccionar Archivo
            </button>
            
            {/* Show camera button only on mobile devices */}
            {typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
              <button
                onClick={handleCameraCapture}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                📷 Tomar Foto
              </button>
            )}
          </div>
        )}

        {file && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                uploading ? 'animate-pulse' : ''
              }`}
            >
              {uploading ? '⏳ Subiendo...' : '✅ Subir Recibo'}
            </button>
            <button
              onClick={handleClear}
              disabled={uploading}
              className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Consejos:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Asegúrate de que el recibo esté bien iluminado y enfocado</li>
          <li>• Evita sombras y reflejos en la imagen</li>
          <li>• El texto debe ser legible y claro</li>
          <li>• Puedes procesar el recibo después con OCR para extraer datos</li>
        </ul>
      </div>
    </div>
  );
}
