import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/calculations';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function InvoiceLinker({ transaction, onClose, onLinked }) {
  const [invoices, setInvoices] = useState([]);
  const [linkedInvoices, setLinkedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [linkAmount, setLinkAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'linked'

  useEffect(() => {
    loadData();
  }, [transaction.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLinkedInvoices(),
        loadAvailableInvoices()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedInvoices = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/invoice-reconciliation/transaction/${transaction.id}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setLinkedInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error loading linked invoices:', error);
    }
  };

  const loadAvailableInvoices = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/invoice-reconciliation/unmatched`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setInvoices(data.unmatched_invoices || []);
    } catch (error) {
      console.error('Error loading available invoices:', error);
    }
  };

  const handleLink = async () => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`${API_URL}/api/invoice-reconciliation/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transaction_id: transaction.id,
          invoice_id: selectedInvoice.id,
          amount: linkAmount ? parseFloat(linkAmount) : transaction.amount,
          notes: notes || null
        })
      });

      if (response.ok) {
        setSelectedInvoice(null);
        setLinkAmount('');
        setNotes('');
        await loadData();
        if (onLinked) onLinked();
      }
    } catch (error) {
      console.error('Error linking invoice:', error);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!confirm('¿Estás seguro de desvincular esta factura?')) return;

    try {
      const response = await fetch(`${API_URL}/api/invoice-reconciliation/link/${linkId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadData();
        if (onLinked) onLinked();
      }
    } catch (error) {
      console.error('Error unlinking invoice:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.rfc_emisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.rfc_receptor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLinked = linkedInvoices.reduce((sum, inv) => sum + (inv.link_amount || 0), 0);
  const remaining = transaction.amount - totalLinked;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Vincular Facturas (CFDIs)</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Transacción: {transaction.description} - {formatCurrency(transaction.amount)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-600">Monto Transacción</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(transaction.amount)}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-600">Total Vinculado</p>
              <p className="text-lg font-bold text-green-900">{formatCurrency(totalLinked)}</p>
            </div>
            <div className={`p-3 rounded-lg ${remaining >= 0 ? 'bg-gray-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${remaining >= 0 ? 'text-gray-600' : 'text-red-600'}`}>Restante</p>
              <p className={`text-lg font-bold ${remaining >= 0 ? 'text-gray-900' : 'text-red-900'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Facturas Disponibles ({filteredInvoices.length})
              </button>
              <button
                onClick={() => setActiveTab('linked')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'linked'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Facturas Vinculadas ({linkedInvoices.length})
              </button>
            </nav>
          </div>

          {/* Available Invoices Tab */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por UUID o RFC..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />

              {/* Invoice List */}
              {loading ? (
                <div className="text-center py-8">Cargando facturas...</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay facturas disponibles para vincular
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">UUID: {invoice.uuid}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Emisor: {invoice.rfc_emisor} → Receptor: {invoice.rfc_receptor}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(invoice.total)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal: {formatCurrency(invoice.subtotal)} + IVA: {formatCurrency(invoice.iva)}
                        </span>
                        {selectedInvoice?.id === invoice.id && (
                          <span className="text-blue-600 font-semibold">✓ Seleccionada</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Link Form */}
              {selectedInvoice && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">Detalles de Vinculación</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monto a vincular (opcional)
                      </label>
                      <input
                        type="number"
                        value={linkAmount}
                        onChange={(e) => setLinkAmount(e.target.value)}
                        placeholder={transaction.amount.toString()}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Dejar vacío para vincular el monto completo de la transacción
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notas (opcional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder="Agregar notas sobre esta vinculación..."
                      />
                    </div>

                    <button
                      onClick={handleLink}
                      className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Vincular Factura
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked Invoices Tab */}
          {activeTab === 'linked' && (
            <div>
              {linkedInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay facturas vinculadas a esta transacción
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedInvoices.map((invoice) => (
                    <div key={invoice.link_id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">UUID: {invoice.uuid}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Emisor: {invoice.rfc_emisor} → Receptor: {invoice.rfc_receptor}
                          </p>
                          {invoice.link_notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <strong>Notas:</strong> {invoice.link_notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(invoice.link_amount || invoice.total)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Vinculado: {formatDate(invoice.link_created_at)}
                        </span>
                        <button
                          onClick={() => handleUnlink(invoice.link_id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-300 text-sm font-semibold"
                        >
                          Desvincular
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
