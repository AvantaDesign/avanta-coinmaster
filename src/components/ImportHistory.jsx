import { useState, useEffect } from 'react';
import { fetchImportHistory, fetchImportDetails, deleteImport } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import { showSuccess, showError } from '../utils/notifications';

export default function ImportHistory() {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [importDetails, setImportDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadImports();
  }, [currentPage, statusFilter, dateFilter]);

  const loadImports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (dateFilter) {
        params.date = dateFilter;
      }

      const result = await fetchImportHistory(params);
      setImports(result.imports || []);
      setTotalPages(Math.ceil((result.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Failed to load import history:', error);
      showError('Error al cargar historial de importaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (importRecord) => {
    try {
      setSelectedImport(importRecord);
      setShowDetails(true);
      setDetailsLoading(true);
      
      const details = await fetchImportDetails(importRecord.id);
      setImportDetails(details);
    } catch (error) {
      console.error('Failed to load import details:', error);
      showError('Error al cargar detalles de importación');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRollback = async (importRecord) => {
    if (!confirm(`¿Estás seguro de que deseas revertir la importación "${importRecord.file_name}"? Esto eliminará todas las ${importRecord.records_imported} transacciones importadas.`)) {
      return;
    }

    try {
      await deleteImport(importRecord.id);
      showSuccess('Importación revertida exitosamente');
      setShowDetails(false);
      setSelectedImport(null);
      loadImports();
    } catch (error) {
      console.error('Failed to rollback import:', error);
      showError('Error al revertir importación');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        label: 'Completada'
      },
      failed: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        label: 'Fallida'
      },
      processing: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        label: 'Procesando'
      }
    };

    const badge = badges[status] || badges.completed;
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const filteredImports = imports.filter(imp => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        imp.file_name?.toLowerCase().includes(term) ||
        imp.source?.toLowerCase().includes(term) ||
        imp.description?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historial de Importaciones
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre de archivo, fuente..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="completed">Completadas</option>
              <option value="failed">Fallidas</option>
              <option value="processing">Procesando</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Import List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-default border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando importaciones...</p>
          </div>
        ) : filteredImports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No se encontraron importaciones</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fuente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Registros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredImports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {imp.file_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {imp.source || 'CSV'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(imp.imported_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          <div>Importados: {imp.records_imported || 0}</div>
                          {imp.duplicates_found > 0 && (
                            <div className="text-yellow-600 dark:text-yellow-400">
                              Duplicados: {imp.duplicates_found}
                            </div>
                          )}
                          {imp.records_failed > 0 && (
                            <div className="text-red-600 dark:text-red-400">
                              Fallidos: {imp.records_failed}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(imp.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(imp)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          Ver Detalles
                        </button>
                        {imp.status === 'completed' && (
                          <button
                            onClick={() => handleRollback(imp)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            Revertir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {filteredImports.map((imp) => (
                <div key={imp.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {imp.file_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {imp.source || 'CSV'} • {formatDate(imp.imported_at)}
                      </p>
                    </div>
                    {getStatusBadge(imp.status)}
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="text-gray-600 dark:text-gray-400">
                      Importados: {imp.records_imported || 0}
                    </div>
                    {imp.duplicates_found > 0 && (
                      <div className="text-yellow-600 dark:text-yellow-400">
                        Duplicados: {imp.duplicates_found}
                      </div>
                    )}
                    {imp.records_failed > 0 && (
                      <div className="text-red-600 dark:text-red-400">
                        Fallidos: {imp.records_failed}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(imp)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                    >
                      Ver Detalles
                    </button>
                    {imp.status === 'completed' && (
                      <button
                        onClick={() => handleRollback(imp)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Revertir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-white"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-white"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detalles de Importación
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedImport.file_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedImport(null);
                    setImportDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando detalles...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fuente</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedImport.source || 'CSV'}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fecha de Importación</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatDate(selectedImport.imported_at)}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Importados</div>
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {selectedImport.records_imported || 0}
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Duplicados</div>
                      <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                        {selectedImport.duplicates_found || 0}
                      </div>
                    </div>
                  </div>

                  {/* Period Information */}
                  {importDetails?.period_start && importDetails?.period_end && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Período</div>
                      <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        {formatDate(importDetails.period_start)} - {formatDate(importDetails.period_end)}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedImport.description && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedImport.description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    {selectedImport.status === 'completed' && (
                      <button
                        onClick={() => handleRollback(selectedImport)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Revertir Importación
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        setSelectedImport(null);
                        setImportDetails(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-white"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
