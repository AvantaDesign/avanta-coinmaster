import { useState, useEffect } from 'react';
import { fetchInvoices, createInvoice } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import FileUpload from '../components/FileUpload';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
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

  const handleFileUpload = (url) => {
    setFormData(prev => ({ ...prev, xml_url: url }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facturas CFDI</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Agregar Factura'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
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
            <FileUpload onSuccess={handleFileUpload} />
            {formData.xml_url && (
              <p className="text-sm text-green-600 mt-2">Archivo cargado: {formData.xml_url}</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Guardar Factura
          </button>
        </form>
      )}

      {loading && (
        <div className="text-center py-8">Cargando facturas...</div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay facturas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UUID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFC Emisor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFC Receptor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
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
