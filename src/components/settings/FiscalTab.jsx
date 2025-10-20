import { useState, useEffect } from 'react';
import { showSuccess, showError, showInfo } from '../../utils/notifications';

/**
 * Fiscal Tab - Fiscal Certificate Management
 * Phase 35: Centralized Settings Panel
 */

export default function FiscalTab({ settings, updateSettings }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [fiscalSettings, setFiscalSettings] = useState({
    fiscal_regime: settings?.fiscal_regime || '',
    tax_residence: settings?.tax_residence || 'MX'
  });

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await fetch('/api/fiscal-certificates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar certificados');

      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      showError('Error al cargar certificados');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de archivo no válido. Use JPG, PNG o PDF');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'situacion_fiscal');

      const response = await fetch('/api/fiscal-certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir certificado');

      const data = await response.json();
      showError('Certificado subido exitosamente');
      loadCertificates();
    } catch (error) {
      console.error('Error uploading certificate:', error);
      showError('Error al subir certificado');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este certificado?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fiscal-certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar certificado');

      showError('Certificado eliminado exitosamente');
      loadCertificates();
      setSelectedCertificate(null);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      showError('Error al eliminar certificado');
    }
  };

  const handleViewCertificate = async (certificateId) => {
    try {
      const response = await fetch(`/api/fiscal-certificates/${certificateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener detalles');

      const data = await response.json();
      setSelectedCertificate(data.certificate);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      showError('Error al obtener detalles del certificado');
    }
  };

  const handleSaveFiscalSettings = async () => {
    await updateSettings(fiscalSettings);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pendiente' },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Completado' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Fallido' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configuración Fiscal
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Gestiona tus certificados fiscales y configuración tributaria
        </p>
      </div>

      {/* Fiscal Settings */}
      <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Información Fiscal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Régimen Fiscal
            </label>
            <input
              type="text"
              value={fiscalSettings.fiscal_regime}
              onChange={(e) => setFiscalSettings({ ...fiscalSettings, fiscal_regime: e.target.value })}
              placeholder="Ej: 612 - Personas Físicas con Actividades Empresariales"
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Residencia Fiscal
            </label>
            <select
              value={fiscalSettings.tax_residence}
              onChange={(e) => setFiscalSettings({ ...fiscalSettings, tax_residence: e.target.value })}
              className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="MX">México</option>
              <option value="US">Estados Unidos</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveFiscalSettings}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Guardar Configuración Fiscal
          </button>
        </div>
      </div>

      {/* Certificate Upload */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Certificados Fiscales
        </h3>
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6">
          <div className="text-center">
            <span className="text-4xl">📄</span>
            <div className="mt-4">
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  {uploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      📤 Subir Certificado
                    </>
                  )}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              PDF, JPG, PNG hasta 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Certificados Subidos
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-4xl">📭</span>
            <p className="mt-2">No hay certificados subidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {cert.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(cert.uploaded_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(cert.status)}
                  <button
                    onClick={() => handleViewCertificate(cert.id)}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleDeleteCertificate(cert.id)}
                    className="text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Details Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Detalles del Certificado
                </h3>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de Archivo
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{selectedCertificate.filename}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  {getStatusBadge(selectedCertificate.status)}
                </div>
                {selectedCertificate.analysis_data && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Datos Extraídos
                    </label>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <pre className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {JSON.stringify(selectedCertificate.analysis_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
