import { useState, useEffect } from 'react';
import { fetchReceipts, deleteReceipt, linkReceiptToTransaction, fetchTransactions } from '../utils/api';
import { showSuccess, showError } from '../utils/notifications';
import { formatDate } from '../utils/calculations';
import ReceiptUpload from './ReceiptUpload';
import ReceiptProcessor from './ReceiptProcessor';

export default function ReceiptManager() {
  const [receipts, setReceipts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // list, upload, process
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingReceipt, setLinkingReceipt] = useState(null);

  useEffect(() => {
    loadReceipts();
    loadTransactions();
  }, [filterStatus]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const result = await fetchReceipts(params);
      setReceipts(result.receipts || []);
    } catch (error) {
      showError(`Error al cargar recibos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const result = await fetchTransactions({ limit: 100 });
      setTransactions(result.data || result || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este recibo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteReceipt(id);
      showSuccess('Recibo eliminado exitosamente');
      loadReceipts();
    } catch (error) {
      showError(`Error al eliminar recibo: ${error.message}`);
    }
  };

  const handleUploadSuccess = (receipt) => {
    loadReceipts();
    setActiveTab('list');
    showSuccess('Recibo subido exitosamente. Ahora puedes procesarlo con OCR.');
  };

  const handleProcessClick = (receipt) => {
    setSelectedReceipt(receipt);
    setActiveTab('process');
  };

  const handleProcessComplete = () => {
    loadReceipts();
    setActiveTab('list');
    setSelectedReceipt(null);
  };

  const handleLinkClick = (receipt) => {
    setLinkingReceipt(receipt);
    setShowLinkModal(true);
  };

  const handleLinkTransaction = async (transactionId) => {
    if (!linkingReceipt) return;

    try {
      await linkReceiptToTransaction(linkingReceipt.id, transactionId);
      showSuccess('Recibo vinculado a transacción exitosamente');
      setShowLinkModal(false);
      setLinkingReceipt(null);
      loadReceipts();
    } catch (error) {
      showError(`Error al vincular recibo: ${error.message}`);
    }
  };

  const handleViewReceipt = (receipt) => {
    const imageUrl = `/api/upload/${receipt.file_path.split('/').pop()}`;
    window.open(imageUrl, '_blank');
  };

  // Filter receipts by search term
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      receipt.file_name.toLowerCase().includes(term) ||
      (receipt.extracted_data && JSON.stringify(receipt.extracted_data).toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Recibos</h1>
            <p className="text-gray-600 mt-1">Sube, procesa y gestiona tus recibos</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📤 Subir
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Buscar recibos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="processing">Procesando</option>
                  <option value="completed">Completados</option>
                  <option value="skipped">Omitidos</option>
                  <option value="failed">Fallidos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Receipts List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Cargando recibos...
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg">No hay recibos</p>
                <p className="text-sm mt-2">Sube tu primer recibo para comenzar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado OCR
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confianza
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transacción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {receipt.mime_type.startsWith('image/') ? '🖼️' : '📄'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {receipt.file_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(receipt.file_size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(receipt.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            receipt.ocr_status === 'completed' ? 'bg-green-100 text-green-800' :
                            receipt.ocr_status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            receipt.ocr_status === 'failed' ? 'bg-red-100 text-red-800' :
                            receipt.ocr_status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {receipt.ocr_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {receipt.confidence_score !== null ? (
                            <span className={`font-semibold ${
                              receipt.confidence_score > 0.7 ? 'text-green-600' :
                              receipt.confidence_score > 0.4 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {Math.round(receipt.confidence_score * 100)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {receipt.transaction_id ? (
                            <span className="text-green-600 font-medium">✓ Vinculado</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewReceipt(receipt)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver recibo"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleProcessClick(receipt)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Procesar con OCR"
                            >
                              🔍
                            </button>
                            {!receipt.transaction_id && (
                              <button
                                onClick={() => handleLinkClick(receipt)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Vincular a transacción"
                              >
                                🔗
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(receipt.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <div key={receipt.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">
                            {receipt.mime_type.startsWith('image/') ? '🖼️' : '📄'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{receipt.file_name}</div>
                            <div className="text-sm text-gray-500">
                              {(receipt.file_size / 1024).toFixed(1)} KB • {formatDate(receipt.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          receipt.ocr_status === 'completed' ? 'bg-green-100 text-green-800' :
                          receipt.ocr_status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          receipt.ocr_status === 'failed' ? 'bg-red-100 text-red-800' :
                          receipt.ocr_status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {receipt.ocr_status}
                        </span>
                        
                        {receipt.confidence_score !== null && (
                          <span className={`font-semibold ${
                            receipt.confidence_score > 0.7 ? 'text-green-600' :
                            receipt.confidence_score > 0.4 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {Math.round(receipt.confidence_score * 100)}% confianza
                          </span>
                        )}
                        
                        {receipt.transaction_id && (
                          <span className="text-green-600 font-medium">✓ Vinculado</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewReceipt(receipt)}
                          className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => handleProcessClick(receipt)}
                          className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          🔍 Procesar
                        </button>
                        {!receipt.transaction_id && (
                          <button
                            onClick={() => handleLinkClick(receipt)}
                            className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                          >
                            🔗
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <ReceiptUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {activeTab === 'process' && selectedReceipt && (
        <div>
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedReceipt(null);
            }}
            className="mb-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            ← Volver a la lista
          </button>
          <ReceiptProcessor 
            receipt={selectedReceipt}
            onProcessComplete={handleProcessComplete}
          />
        </div>
      )}

      {/* Link Transaction Modal */}
      {showLinkModal && linkingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Vincular a Transacción</h2>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkingReceipt(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Recibo seleccionado:</p>
                <p className="font-medium">{linkingReceipt.file_name}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Seleccionar Transacción:</h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {transactions.filter(t => !t.receipt_id).map((transaction) => (
                    <button
                      key={transaction.id}
                      onClick={() => handleLinkTransaction(transaction.id)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-600">{formatDate(transaction.date)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">{transaction.transaction_type}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
