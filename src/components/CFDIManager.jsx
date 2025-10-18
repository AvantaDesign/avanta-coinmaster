// CFDI Manager Component
// Comprehensive CFDI management interface with upload, parsing, validation, and linking

import { useState, useEffect, useRef } from 'react';
import { 
  parseCFDI, 
  validateCFDI, 
  formatCFDIDisplay,
  isCFDI
} from '../utils/cfdiParser';
import { authFetch } from '../utils/auth';

const API_BASE = '/api';

export default function CFDIManager() {
  // State management
  const [cfdis, setCfdis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    linked: '',
    date_from: '',
    date_to: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  });

  // Upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedCFDI, setParsedCFDI] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Selected CFDI for details/linking
  const [selectedCFDI, setSelectedCFDI] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Transactions for linking
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // View mode
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'upload'

  // Load CFDIs
  useEffect(() => {
    loadCFDIs();
  }, [filters, pagination.offset]);

  const loadCFDIs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      });

      // Remove empty filters
      for (const [key, value] of params.entries()) {
        if (!value) params.delete(key);
      }

      const response = await authFetch(`${API_BASE}/cfdi-management?${params}`);
      if (!response.ok) throw new Error('Failed to load CFDIs');
      
      const data = await response.json();
      setCfdis(data.cfdis || []);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        hasMore: data.hasMore
      }));
    } catch (err) {
      console.error('Error loading CFDIs:', err);
      setError('Error al cargar CFDIs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      setUploadErrors(['El archivo debe ser un XML']);
      return;
    }

    setUploadedFile(file);
    setUploadErrors([]);
    setParsedCFDI(null);

    // Parse and validate XML
    try {
      const text = await file.text();
      
      // Check if it's a valid CFDI
      if (!isCFDI(text)) {
        setUploadErrors(['El XML no es un CFDI válido']);
        return;
      }

      const cfdiData = parseCFDI(text);
      const validation = validateCFDI(cfdiData);

      if (!validation.valid) {
        setUploadErrors(validation.errors);
        return;
      }

      // Check for duplicates
      const dupResponse = await authFetch(
        `${API_BASE}/cfdi-validation/duplicates/${cfdiData.uuid}`
      );
      const dupData = await dupResponse.json();

      setParsedCFDI({
        data: cfdiData,
        xmlContent: text,
        validation,
        duplicates: dupData.duplicates || [],
        display: formatCFDIDisplay(cfdiData)
      });

    } catch (err) {
      console.error('Error parsing CFDI:', err);
      setUploadErrors(['Error al parsear el XML: ' + err.message]);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const input = fileInputRef.current;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Upload CFDI
  const uploadCFDI = async () => {
    if (!parsedCFDI) return;

    setUploading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/cfdi-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xmlContent: parsedCFDI.xmlContent,
          autoLink: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload CFDI');
      }

      const result = await response.json();
      setSuccess(
        `CFDI ${result.cfdi.uuid} agregado exitosamente` +
        (result.autoMatched ? ' y vinculado automáticamente a transacción' : '')
      );

      // Reset upload form
      setUploadedFile(null);
      setParsedCFDI(null);
      setUploadErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload list
      loadCFDIs();
      setViewMode('list');

      // Auto-dismiss success message
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('Error uploading CFDI:', err);
      setError('Error al subir CFDI: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete CFDI
  const deleteCFDI = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este CFDI?')) return;

    try {
      const response = await authFetch(`${API_BASE}/cfdi-management/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete CFDI');

      setSuccess('CFDI eliminado exitosamente');
      loadCFDIs();
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error deleting CFDI:', err);
      setError('Error al eliminar CFDI: ' + err.message);
    }
  };

  // Update CFDI status
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await authFetch(`${API_BASE}/cfdi-management/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      setSuccess('Estado actualizado exitosamente');
      loadCFDIs();
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating status:', err);
      setError('Error al actualizar estado: ' + err.message);
    }
  };

  // Link to transaction
  const linkToTransaction = async (cfdiId, transactionId) => {
    try {
      const response = await authFetch(`${API_BASE}/cfdi-management/${cfdiId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_transaction_id: transactionId })
      });

      if (!response.ok) throw new Error('Failed to link transaction');

      setSuccess('Vinculado a transacción exitosamente');
      loadCFDIs();
      setShowLinkModal(false);
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error linking transaction:', err);
      setError('Error al vincular transacción: ' + err.message);
    }
  };

  // Load transactions for linking
  const loadTransactionsForLinking = async (cfdi) => {
    try {
      const response = await authFetch(
        `${API_BASE}/transactions?search=${cfdi.uuid}&limit=10`
      );
      const data = await response.json();
      setTransactions(data.transactions || []);
      setSelectedCFDI(cfdi);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Error al cargar transacciones: ' + err.message);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Pending Validation': { color: 'yellow', label: 'Pendiente' },
      'Valid': { color: 'green', label: 'Válido' },
      'Invalid RFC': { color: 'red', label: 'RFC Inválido' },
      'Canceled': { color: 'gray', label: 'Cancelado' },
      'Error': { color: 'red', label: 'Error' }
    };

    const config = statusConfig[status] || { color: 'gray', label: status };
    const colorClasses = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestor de CFDI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra, valida y vincula tus comprobantes fiscales digitales
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            📋 Lista de CFDIs
          </button>
          <button
            onClick={() => setViewMode('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'upload'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            ⬆️ Subir CFDI
          </button>
        </div>

        {/* Upload View */}
        {viewMode === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Subir Nuevo CFDI
            </h2>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xml"
                className="hidden"
                id="cfdi-file-input"
              />
              <label htmlFor="cfdi-file-input" className="cursor-pointer">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {uploadedFile ? uploadedFile.name : 'Arrastra un archivo XML aquí'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  o haz clic para seleccionar
                </p>
              </label>
            </div>

            {/* Upload Errors */}
            {uploadErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="font-semibold text-red-800 dark:text-red-200 mb-2">Errores de validación:</p>
                <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm">
                  {uploadErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed CFDI Preview */}
            {parsedCFDI && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Vista Previa del CFDI
                </h3>

                {/* Duplicate Warning */}
                {parsedCFDI.duplicates.length > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      ⚠️ CFDI Duplicado
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Ya existe {parsedCFDI.duplicates.length} CFDI(s) con este UUID en el sistema.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UUID
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.data.uuid}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Folio
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.display.folio}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emisor
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.display.emisor}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Receptor
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.display.receptor}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.display.fecha}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total
                    </label>
                    <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      {parsedCFDI.display.total}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={uploadCFDI}
                    disabled={uploading || parsedCFDI.duplicates.length > 0}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Subiendo...' : 'Guardar CFDI'}
                  </button>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setParsedCFDI(null);
                      setUploadErrors([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="issued">Emitidos</option>
                  <option value="received">Recibidos</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="Pending Validation">Pendiente</option>
                  <option value="Valid">Válido</option>
                  <option value="Invalid RFC">RFC Inválido</option>
                  <option value="Canceled">Cancelado</option>
                  <option value="Error">Error</option>
                </select>

                <select
                  value={filters.linked}
                  onChange={(e) => setFilters({ ...filters, linked: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Vinculación</option>
                  <option value="true">Vinculados</option>
                  <option value="false">Sin vincular</option>
                </select>

                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  placeholder="Desde"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />

                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  placeholder="Hasta"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />

                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Buscar UUID/RFC..."
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* CFDI List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando CFDIs...</p>
                </div>
              ) : cfdis.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No se encontraron CFDIs</p>
                  <button
                    onClick={() => setViewMode('upload')}
                    className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Subir tu primer CFDI →
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            UUID / Folio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Emisor / Receptor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Vinculado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {cfdis.map((cfdi) => (
                          <tr key={cfdi.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                <div className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                  {cfdi.uuid}
                                </div>
                                <div className="text-gray-500 dark:text-gray-500 text-xs">
                                  {cfdi.serie || ''}{cfdi.folio || 'S/N'}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                cfdi.type === 'issued' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              }`}>
                                {cfdi.type === 'issued' ? 'Emitido' : 'Recibido'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="text-gray-900 dark:text-white truncate max-w-xs">
                                {cfdi.type === 'issued' ? cfdi.receiver_name : cfdi.emitter_name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">
                                {cfdi.type === 'issued' ? cfdi.receiver_rfc : cfdi.emitter_rfc}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              ${cfdi.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {cfdi.currency || 'MXN'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {new Date(cfdi.issue_date).toLocaleDateString('es-MX')}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={cfdi.status} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {cfdi.linked_transaction_id ? (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓ #{cfdi.linked_transaction_id}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                {!cfdi.linked_transaction_id && (
                                  <button
                                    onClick={() => loadTransactionsForLinking(cfdi)}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                    title="Vincular a transacción"
                                  >
                                    🔗
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteCFDI(cfdi.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrando {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                        disabled={pagination.offset === 0}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                        disabled={!pagination.hasMore}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Link to Transaction Modal */}
        {showLinkModal && selectedCFDI && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Vincular CFDI a Transacción
                </h3>
                
                <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CFDI UUID:</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedCFDI.uuid}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {transactions.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                      No se encontraron transacciones relacionadas
                    </p>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTransaction?.id === tx.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(tx.date).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => linkToTransaction(selectedCFDI.id, selectedTransaction?.id)}
                    disabled={!selectedTransaction}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Vincular
                  </button>
                  <button
                    onClick={() => {
                      setShowLinkModal(false);
                      setSelectedCFDI(null);
                      setSelectedTransaction(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
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
