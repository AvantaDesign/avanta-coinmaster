import { useState, useRef } from 'react';
import { uploadFile } from '../utils/api';

// Allowed file types (must match backend)
const ALLOWED_TYPES = {
  'image/jpeg': { label: 'JPEG', icon: '🖼️' },
  'image/png': { label: 'PNG', icon: '🖼️' },
  'image/gif': { label: 'GIF', icon: '🖼️' },
  'application/pdf': { label: 'PDF', icon: '📄' },
  'text/xml': { label: 'XML', icon: '📋' },
  'application/xml': { label: 'XML', icon: '📋' }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({ onSuccess, onError, title = 'Subir Archivo' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Validate file before upload
  const validateFile = (file) => {
    if (!file) {
      return 'No se seleccionó ningún archivo';
    }

    if (!ALLOWED_TYPES[file.type]) {
      const allowedTypes = Object.values(ALLOWED_TYPES).map(t => t.label).join(', ');
      return `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024;
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `El archivo es demasiado grande (${fileSizeMB} MB). Tamaño máximo: ${maxSizeMB} MB`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (onError) onError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Simulate progress (since we don't have real progress from fetch)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await uploadFile(file);
      clearInterval(progressInterval);
      setProgress(100);
      
      const successMsg = `Archivo subido: ${result.originalName} (${result.sizeMB} MB)`;
      setSuccess(successMsg);
      
      if (onSuccess) {
        onSuccess(result.url, result);
      }

      // Clear preview after 3 seconds
      setTimeout(() => {
        setPreview(null);
        setSuccess(null);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setError(err.message || 'Error al subir archivo');
      if (onError) onError(err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle click to open file browser
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
          <span className="mr-2">❌</span>
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
          <span className="mr-2">✅</span>
          <div className="flex-1">
            <p className="font-semibold">Éxito</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Drag and Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Preview */}
        {preview && (
          <div className="mb-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full max-h-48 mx-auto rounded"
            />
          </div>
        )}

        {/* Upload Icon */}
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>

        {/* Text */}
        <div className="mb-2">
          {uploading ? (
            <p className="text-gray-600 dark:text-gray-400">Subiendo archivo...</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-semibold text-blue-600">Haz clic para seleccionar</span> o arrastra un archivo aquí
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tipos permitidos: JPEG, PNG, GIF, PDF, XML (máx. 10 MB)
              </p>
            </>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          accept={Object.keys(ALLOWED_TYPES).join(',')}
          className="hidden"
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 dark:bg-blue-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Allowed File Types Info */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold mb-1">Tipos de archivo permitidos:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ALLOWED_TYPES).map(([type, info]) => (
            <span key={type} className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded">
              <span className="mr-1">{info.icon}</span>
              {info.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
