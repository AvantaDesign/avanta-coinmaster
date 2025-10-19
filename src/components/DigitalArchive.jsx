// Digital Archive Component
// Comprehensive digital document archive with upload, management, search, and lifecycle tracking

import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function DigitalArchive() {
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    status: 'active',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // View mode
  const [viewMode, setViewMode] = useState('list'); // 'list', 'upload', 'details'
  
  // Upload state
  const [uploadData, setUploadData] = useState({
    document_type: 'other',
    document_name: '',
    file: null,
    retention_period: 5,
    access_level: 'private',
    tags: [],
    expiration_date: '',
    related_transaction_id: null
  });
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef(null);

  // Selected document
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    by_type: {},
    total_size: 0,
    expiring_soon: 0
  });

  // Load documents
  useEffect(() => {
    loadDocuments();
    loadStats();
  }, [filters, pagination.page]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      // Remove empty filters
      for (const [key, value] of params.entries()) {
        if (!value) params.delete(key);
      }

      const response = await authFetch(`${API_BASE}/digital-archive?${params}`);
      if (!response.ok) throw new Error('Failed to load documents');
      
      const data = await response.json();
      setDocuments(data.documents || []);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Error al cargar documentos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${API_BASE}/digital-archive?status=active&limit=1000`);
      if (!response.ok) return;
      
      const data = await response.json();
      const docs = data.documents || [];
      
      const byType = {};
      let totalSize = 0;
      let expiringSoon = 0;
      
      docs.forEach(doc => {
        byType[doc.document_type] = (byType[doc.document_type] || 0) + 1;
        totalSize += doc.file_size || 0;
        
        if (doc.expiration_date) {
          const daysUntilExp = Math.floor(
            (new Date(doc.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExp >= 0 && daysUntilExp <= 30) {
            expiringSoon++;
          }
        }
      });
      
      setStats({
        total: docs.length,
        by_type: byType,
        total_size: totalSize,
        expiring_soon: expiringSoon
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadData(prev => ({
      ...prev,
      file,
      document_name: file.name
    }));
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, you would upload the file to R2 first
      // For now, we'll simulate with a file path
      const filePath = `/archive/${Date.now()}_${uploadData.file.name}`;
      
      // Calculate file hash (simplified for demo)
      const hash = await calculateFileHash(uploadData.file);

      const response = await authFetch(`${API_BASE}/digital-archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: uploadData.document_type,
          document_name: uploadData.document_name,
          file_path: filePath,
          file_size: uploadData.file.size,
          mime_type: uploadData.file.type,
          hash_sha256: hash,
          retention_period: uploadData.retention_period,
          access_level: uploadData.access_level,
          tags: uploadData.tags,
          expiration_date: uploadData.expiration_date || null,
          related_transaction_id: uploadData.related_transaction_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setSuccess('Documento archivado exitosamente');
      
      // Reset form
      setUploadData({
        document_type: 'other',
        document_name: '',
        file: null,
        retention_period: 5,
        access_level: 'private',
        tags: [],
        expiration_date: '',
        related_transaction_id: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload documents
      loadDocuments();
      loadStats();
      setViewMode('list');
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Error al subir documento: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Calculate file hash (simplified)
  const calculateFileHash = async (file) => {
    // In production, use SubtleCrypto API or similar
    // This is a simplified version for demo
    const text = await file.text();
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16).padStart(64, '0');
  };

  // Add tag
  const addTag = () => {
    if (newTag && !uploadData.tags.includes(newTag)) {
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag) => {
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // View document details
  const viewDocument = async (doc) => {
    setSelectedDocument(doc);
    setShowDetails(true);
  };

  // Delete document
  const deleteDocument = async (id) => {
    if (!confirm('¿Estás seguro de que deseas archivar este documento?')) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE}/digital-archive/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      setSuccess('Documento archivado exitosamente');
      loadDocuments();
      loadStats();
      setShowDetails(false);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al archivar documento: ' + err.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get document type label
  const getDocumentTypeLabel = (type) => {
    const labels = {
      cfdi: 'CFDI',
      receipt: 'Recibo',
      invoice: 'Factura',
      declaration: 'Declaración',
      statement: 'Estado de Cuenta',
      contract: 'Contrato',
      report: 'Reporte',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return badges[status] || badges.active;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Archivo Digital
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestión segura de documentos fiscales y empresariales
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Documentos
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tamaño Total
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {formatFileSize(stats.total_size)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Por Vencer
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats.expiring_soon}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Período Retención
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              5 años
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'list'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              📁 Lista de Documentos
            </button>
            <button
              onClick={() => setViewMode('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'upload'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ⬆️ Subir Documento
            </button>
          </nav>
        </div>

        {/* Upload View */}
        {viewMode === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Subir Nuevo Documento
            </h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-700 focus:outline-none"
                />
                {uploadData.file && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Archivo seleccionado: {uploadData.file.name} ({formatFileSize(uploadData.file.size)})
                  </p>
                )}
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={uploadData.document_type}
                  onChange={(e) => setUploadData(prev => ({ ...prev, document_type: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="cfdi">CFDI</option>
                  <option value="receipt">Recibo</option>
                  <option value="invoice">Factura</option>
                  <option value="declaration">Declaración</option>
                  <option value="statement">Estado de Cuenta</option>
                  <option value="contract">Contrato</option>
                  <option value="report">Reporte</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Documento
                </label>
                <input
                  type="text"
                  value={uploadData.document_name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, document_name: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Retention Period & Access Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período de Retención (años)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={uploadData.retention_period}
                    onChange={(e) => setUploadData(prev => ({ ...prev, retention_period: parseInt(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nivel de Acceso
                  </label>
                  <select
                    value={uploadData.access_level}
                    onChange={(e) => setUploadData(prev => ({ ...prev, access_level: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="public">Público</option>
                    <option value="private">Privado</option>
                    <option value="confidential">Confidencial</option>
                  </select>
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Vencimiento (Opcional)
                </label>
                <input
                  type="date"
                  value={uploadData.expiration_date}
                  onChange={(e) => setUploadData(prev => ({ ...prev, expiration_date: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Etiquetas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Agregar etiqueta..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uploadData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadData.file}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Archivar Documento'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div>
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="cfdi">CFDI</option>
                    <option value="receipt">Recibo</option>
                    <option value="invoice">Factura</option>
                    <option value="declaration">Declaración</option>
                    <option value="statement">Estado de Cuenta</option>
                    <option value="contract">Contrato</option>
                    <option value="report">Reporte</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    <option value="active">Activo</option>
                    <option value="archived">Archivado</option>
                    <option value="expired">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Buscar documentos..."
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">Cargando documentos...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No se encontraron documentos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tamaño
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fecha Subida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.document_name}
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 2 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{doc.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {getDocumentTypeLabel(doc.document_type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(doc.file_size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(doc.upload_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => viewDocument(doc)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200 mr-4"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                            >
                              Archivar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Details Modal */}
        {showDetails && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalles del Documento
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Nombre
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedDocument.document_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tipo
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {getDocumentTypeLabel(selectedDocument.document_type)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tamaño
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatFileSize(selectedDocument.file_size)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de Subida
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(selectedDocument.upload_date)}
                    </p>
                  </div>

                  {selectedDocument.expiration_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Fecha de Vencimiento
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(selectedDocument.expiration_date)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Período de Retención
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedDocument.retention_period} años
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Nivel de Acceso
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedDocument.access_level}
                    </p>
                  </div>

                  {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Etiquetas
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Estado
                    </label>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${getStatusBadge(selectedDocument.status)}`}>
                      {selectedDocument.status}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
