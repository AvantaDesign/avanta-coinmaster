import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function SATDeclarations() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const [generatingDIOT, setGeneratingDIOT] = useState(false);
  const [generatingCE, setGeneratingCE] = useState(false);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const declarationTypes = [
    { value: 'all', label: 'Todos los tipos' },
    { value: 'diot', label: 'DIOT' },
    { value: 'contabilidad_electronica', label: 'Contabilidad Electrónica' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador', color: 'gray' },
    { value: 'generated', label: 'Generado', color: 'blue' },
    { value: 'submitted', label: 'Presentado', color: 'yellow' },
    { value: 'accepted', label: 'Aceptado', color: 'green' },
    { value: 'rejected', label: 'Rechazado', color: 'red' },
    { value: 'error', label: 'Error', color: 'red' }
  ];

  useEffect(() => {
    loadDeclarations();
  }, [filterStatus, filterType]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`/api/sat-declarations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDeclarations(data.declarations || []);
      }
    } catch (error) {
      console.error('Error loading declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDIOT = async () => {
    setGeneratingDIOT(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/sat-declarations/diot/${selectedPeriod.year}/${selectedPeriod.month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`✅ DIOT generado exitosamente\n\nOperaciones procesadas: ${data.operationCount}\nID: ${data.declarationId}`);
        loadDeclarations();
        
        // Download XML file
        if (data.xml) {
          downloadXML(data.xml, `DIOT_${selectedPeriod.year}_${String(selectedPeriod.month).padStart(2, '0')}.xml`);
        }
      } else {
        if (data.code === 'DECLARATION_EXISTS') {
          alert('⚠️ Ya existe una declaración DIOT para este período');
        } else {
          alert(`❌ Error al generar DIOT: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Error generating DIOT:', error);
      alert('❌ Error al generar DIOT');
    } finally {
      setGeneratingDIOT(false);
    }
  };

  const generateContabilidadElectronica = async () => {
    setGeneratingCE(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/sat-declarations/contabilidad/${selectedPeriod.year}/${selectedPeriod.month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Contabilidad Electrónica generada exitosamente\n\nArchivos creados: ${data.fileCount}\nID: ${data.declarationId}`);
        loadDeclarations();
      } else {
        if (data.code === 'DECLARATION_EXISTS') {
          alert('⚠️ Ya existe una declaración de Contabilidad Electrónica para este período');
        } else {
          alert(`❌ Error al generar Contabilidad Electrónica: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Error generating Contabilidad Electrónica:', error);
      alert('❌ Error al generar Contabilidad Electrónica');
    } finally {
      setGeneratingCE(false);
    }
  };

  const downloadDeclaration = async (declarationId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sat-declarations/${declarationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.declaration.xml_content) {
          downloadXML(data.declaration.xml_content, fileName || data.declaration.file_name || 'declaration.xml');
        } else {
          alert('❌ No hay contenido XML disponible para descargar');
        }
      }
    } catch (error) {
      console.error('Error downloading declaration:', error);
      alert('❌ Error al descargar la declaración');
    }
  };

  const downloadXML = (content, fileName) => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteDeclaration = async (declarationId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta declaración?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sat-declarations/${declarationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Declaración eliminada exitosamente');
        loadDeclarations();
      } else {
        alert('❌ Error al eliminar la declaración');
      }
    } catch (error) {
      console.error('Error deleting declaration:', error);
      alert('❌ Error al eliminar la declaración');
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    if (!statusInfo) return null;

    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClasses[statusInfo.color] || colorClasses.gray}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const typeLabels = {
      'diot': 'DIOT',
      'contabilidad_electronica': 'Contabilidad Electrónica',
      'catalogo_cuentas': 'Catálogo de Cuentas',
      'balanza_comprobacion': 'Balanza de Comprobación',
      'polizas': 'Pólizas',
      'auxiliar_folios': 'Auxiliar de Folios'
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Declaraciones SAT
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus declaraciones DIOT y Contabilidad Electrónica
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', label: '📊 Resumen', icon: '📊' },
                { id: 'diot', label: 'DIOT', icon: '📋' },
                { id: 'contabilidad', label: 'Contabilidad Electrónica', icon: '💾' },
                { id: 'history', label: 'Historial', icon: '📜' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Declaraciones
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {declarations.length}
                    </p>
                  </div>
                  <div className="text-4xl">📄</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pendientes
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {declarations.filter(d => d.status === 'draft' || d.status === 'generated').length}
                    </p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Aceptadas
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {declarations.filter(d => d.status === 'accepted').length}
                    </p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('diot')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Generar DIOT
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Operaciones con terceros
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('contabilidad')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">💾</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Generar Contabilidad Electrónica
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Anexo 24 - XML SAT
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIOT Tab */}
        {activeTab === 'diot' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Generar DIOT
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                La Declaración Informativa de Operaciones con Terceros (DIOT) reporta las operaciones 
                con proveedores y prestadores de servicios nacionales y extranjeros.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Año
                  </label>
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mes
                  </label>
                  <select
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={generateDIOT}
                disabled={generatingDIOT}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingDIOT ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando DIOT...
                  </span>
                ) : (
                  '📋 Generar DIOT'
                )}
              </button>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  ℹ️ Información
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Se extraerán todas las operaciones con terceros del período seleccionado</li>
                  <li>• Solo se incluirán transacciones con RFC válido</li>
                  <li>• Se generará un archivo XML compatible con el formato SAT</li>
                  <li>• Las operaciones se agruparán por cliente y tipo de operación</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Contabilidad Electrónica Tab */}
        {activeTab === 'contabilidad' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Generar Contabilidad Electrónica
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Genera los archivos XML requeridos por el SAT según el Anexo 24: Catálogo de Cuentas, 
                Balanza de Comprobación, Pólizas y Auxiliar de Folios.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Año
                  </label>
                  <select
                    value={selectedPeriod.year}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mes
                  </label>
                  <select
                    value={selectedPeriod.month}
                    onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={generateContabilidadElectronica}
                disabled={generatingCE}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingCE ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando archivos XML...
                  </span>
                ) : (
                  '💾 Generar Contabilidad Electrónica'
                )}
              </button>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    📁 Catálogo de Cuentas
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Estructura del plan contable según código agrupador SAT
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    📊 Balanza de Comprobación
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Saldos iniciales, movimientos y saldos finales
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    📝 Pólizas
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Detalle de transacciones contables del período
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    🔖 Auxiliar de Folios
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Relación de CFDIs emitidos y recibidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {declarationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Declarations List */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando declaraciones...</p>
                </div>
              ) : declarations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 dark:text-gray-400">No hay declaraciones registradas</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Genera tu primera declaración usando las pestañas anteriores
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha Creación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Operaciones
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                      {declarations.map(declaration => (
                        <tr key={declaration.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTypeLabel(declaration.declaration_type)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {declaration.period_month 
                                ? `${months[declaration.period_month - 1]} ${declaration.period_year}`
                                : `${declaration.period_year}`
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(declaration.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(declaration.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {declaration.diot_count > 0 && (
                              <span className="mr-2">📋 {declaration.diot_count}</span>
                            )}
                            {declaration.file_count > 0 && (
                              <span>📁 {declaration.file_count}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => downloadDeclaration(declaration.id, declaration.file_name)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                              title="Descargar XML"
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={() => deleteDeclaration(declaration.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
