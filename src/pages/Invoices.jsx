import { useState, useEffect } from 'react';
import { fetchInvoices, createInvoice } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import FileUpload from '../components/FileUpload';
import CFDIImport from '../components/CFDIImport';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCFDIImport, setShowCFDIImport] = useState(false);
  const [formData, setFormData] = useState({
    uuid: '',
    rfc_emisor: '',
    rfc_receptor: '',
    date: new Date().toISOString().split('T')[0],
    subtotal: '',
    iva: '',
    total: '',
    xml_url: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await fetchInvoices();
      setInvoices(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvoice({
        ...formData,
        subtotal: parseFloat(formData.subtotal),
        iva: parseFloat(formData.iva),
        total: parseFloat(formData.total)
      });
      setShowForm(false);
      setFormData({
        uuid: '',
        rfc_emisor: '',
        rfc_receptor: '',
        date: new Date().toISOString().split('T')[0],
        subtotal: '',
        iva: '',
        total: '',
        xml_url: ''
      });
      loadInvoices();
    } catch (err) {
      alert('Error al crear factura: ' + err.message);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileUpload = (url, result) => {
    setFormData(prev => ({ ...prev, xml_url: url }));
    console.log('File uploaded successfully:', result);
  };

  const handleFileError = (error) => {
    console.error('File upload error:', error);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Facturas CFDI</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCFDIImport(true)}
            className="bg-success-600 dark:bg-success-700 text-white px-4 py-2 rounded-md hover:bg-success-700 dark:hover:bg-success-600 flex items-center gap-2 transition-colors"
          >
            📥 Importar XML
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-600 dark:bg-primary-700 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            {showForm ? 'Cancelar' : 'Agregar Manual'}
          </button>
        </div>
      </div>

      {/* CFDI Import Modal */}
      {showCFDIImport && (
        <CFDIImport
          onSuccess={loadInvoices}
          onClose={() => setShowCFDIImport(false)}
        />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Nueva Factura</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">UUID</label>
              <input
                type="text"
                name="uuid"
                value={formData.uuid}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">RFC Emisor</label>
              <input
                type="text"
                name="rfc_emisor"
                value={formData.rfc_emisor}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">RFC Receptor</label>
              <input
                type="text"
                name="rfc_receptor"
                value={formData.rfc_receptor}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subtotal</label>
              <input
                type="number"
                name="subtotal"
                value={formData.subtotal}
                onChange={handleChange}
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IVA</label>
              <input
                type="number"
                name="iva"
                value={formData.iva}
                onChange={handleChange}
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total</label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleChange}
                step="0.01"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-4">
            <FileUpload 
              onSuccess={handleFileUpload} 
              onError={handleFileError}
              title="Subir XML de la Factura"
            />
            {formData.xml_url && (
              <div className="text-sm text-green-600 mt-2 flex items-center">
                <span className="mr-2">✅</span>
                <span>Archivo cargado: {formData.xml_url}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Guardar Factura
          </button>
        </form>
      )}

      {loading && (
        <div className="text-center py-8">Cargando facturas...</div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No hay facturas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">UUID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RFC Emisor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RFC Receptor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">{invoice.uuid.substring(0, 20)}...</td>
                      <td className="px-4 py-3 text-sm">{invoice.rfc_emisor}</td>
                      <td className="px-4 py-3 text-sm">{invoice.rfc_receptor}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invoice.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
