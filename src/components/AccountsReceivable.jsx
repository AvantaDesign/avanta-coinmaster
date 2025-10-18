import { useState, useEffect } from 'react';
import { fetchReceivables, createReceivable, updateReceivable, deleteReceivable } from '../utils/api';
import { calculateAgingReport, calculateCollectionMetrics, getReceivablesNeedingAttention } from '../utils/receivables';
import { formatCurrency, formatDate } from '../utils/calculations';
import Icon from './icons/IconLibrary';

export default function AccountsReceivable() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('list'); // list, aging, metrics
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_rfc: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    payment_terms: '30',
    notes: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    id: null,
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: ''
  });

  useEffect(() => {
    loadReceivables();
  }, [filterStatus]);

  const loadReceivables = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const result = await fetchReceivables(params);
      setReceivables(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReceivable({
        ...formData,
        amount: parseFloat(formData.amount),
        payment_terms: parseInt(formData.payment_terms)
      });
      setShowForm(false);
      setFormData({
        customer_name: '',
        customer_rfc: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        amount: '',
        payment_terms: '30',
        notes: ''
      });
      loadReceivables();
    } catch (err) {
      alert('Error al crear cuenta por cobrar: ' + err.message);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await updateReceivable(paymentForm.id, {
        amount_paid: parseFloat(paymentForm.amount_paid),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number
      });
      setPaymentForm({
        id: null,
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        reference_number: ''
      });
      loadReceivables();
    } catch (err) {
      alert('Error al registrar pago: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta por cobrar?')) return;
    try {
      await deleteReceivable(id);
      loadReceivables();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const agingReport = calculateAgingReport(receivables);
  const metrics = calculateCollectionMetrics(receivables);
  const needsAttention = getReceivablesNeedingAttention(receivables);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'partial': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-900';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-900';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const exportAgingReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalOutstanding: agingReport.totalOutstanding,
        totalCount: agingReport.totalCount
      },
      aging: {
        current: agingReport.current,
        days_1_30: agingReport.days_1_30,
        days_31_60: agingReport.days_31_60,
        days_61_90: agingReport.days_61_90,
        days_90_plus: agingReport.days_90_plus
      },
      receivables: receivables.map(r => ({
        customer: r.customer_name,
        invoice: r.invoice_number,
        date: r.invoice_date,
        dueDate: r.due_date,
        amount: r.amount,
        paid: r.amount_paid || 0,
        outstanding: r.amount - (r.amount_paid || 0),
        status: r.status,
        daysOverdue: Math.floor((new Date() - new Date(r.due_date)) / (1000 * 60 * 60 * 24))
      }))
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar-aging-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAgingBucketColor = (daysOverdue) => {
    if (daysOverdue <= 0) return 'bg-green-500';
    if (daysOverdue <= 30) return 'bg-blue-500';
    if (daysOverdue <= 60) return 'bg-yellow-500';
    if (daysOverdue <= 90) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSortedReceivables = () => {
    let sorted = [...receivables];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'customer':
          aVal = a.customer_name;
          bVal = b.customer_name;
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'due_date':
          aVal = new Date(a.due_date);
          bVal = new Date(b.due_date);
          break;
        case 'outstanding':
          aVal = a.amount - (a.amount_paid || 0);
          bVal = b.amount - (b.amount_paid || 0);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return sorted;
  };

  const sortedReceivables = getSortedReceivables();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cuentas por Cobrar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : '+ Nueva Cuenta por Cobrar'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-4">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 font-medium ${view === 'list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setView('aging')}
            className={`px-4 py-2 font-medium ${view === 'aging' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Antigüedad
          </button>
          <button
            onClick={() => setView('metrics')}
            className={`px-4 py-2 font-medium ${view === 'metrics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Métricas
          </button>
          <button
            onClick={() => setView('attention')}
            className={`px-4 py-2 font-medium ${view === 'attention' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Requieren Atención ({needsAttention.length})
          </button>
        </div>
      </div>

      {/* New Receivable Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Nueva Cuenta por Cobrar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RFC del Cliente</label>
              <input
                type="text"
                value={formData.customer_rfc}
                onChange={(e) => setFormData({ ...formData, customer_rfc: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número de Factura</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Factura *</label>
              <input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Vencimiento *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Términos de Pago (días)</label>
              <input
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Guardar
          </button>
        </form>
      )}

      {/* Payment Form */}
      {paymentForm.id && (
        <form onSubmit={handlePayment} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md border-2 border-green-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Registrar Pago</h2>
            <button
              type="button"
              onClick={() => setPaymentForm({ id: null, amount_paid: '', payment_date: new Date().toISOString().split('T')[0], payment_method: '', reference_number: '' })}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monto Pagado *</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Pago *</label>
              <input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Método de Pago</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Seleccionar</option>
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
                <option value="check">Cheque</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Referencia</label>
              <input
                type="text"
                value={paymentForm.reference_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Guardar Pago
          </button>
        </form>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded ${filterStatus === 'all' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded ${filterStatus === 'pending' ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-gray-300'}`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-3 py-1 rounded ${filterStatus === 'overdue' ? 'bg-red-600 dark:bg-red-700 text-white' : 'bg-gray-200'}`}
              >
                Vencidas
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-3 py-1 rounded ${filterStatus === 'paid' ? 'bg-green-600 dark:bg-green-700 text-white' : 'bg-gray-200'}`}
              >
                Pagadas
              </button>
            </div>
            
            {/* Sorting Controls */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="due_date">Fecha de Vencimiento</option>
                <option value="customer">Cliente</option>
                <option value="amount">Monto</option>
                <option value="outstanding">Pendiente</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-slate-600"
              >
                {sortDirection === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center">Cargando...</div>
          ) : receivables.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">No hay cuentas por cobrar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Factura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vencimiento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pagado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {sortedReceivables.map((receivable) => {
                    const daysOverdue = Math.floor((new Date() - new Date(receivable.due_date)) / (1000 * 60 * 60 * 24));
                    return (
                    <tr key={receivable.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm flex items-center gap-2">
                        <div className={`w-1 h-8 rounded ${getAgingBucketColor(daysOverdue)}`}></div>
                        {receivable.customer_name}
                      </td>
                      <td className="px-4 py-3 text-sm">{receivable.invoice_number || '-'}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(receivable.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receivable.amount)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receivable.amount_paid || 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(receivable.amount - (receivable.amount_paid || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(receivable.status)}`}>
                          {receivable.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          {receivable.status !== 'paid' && receivable.status !== 'cancelled' && (
                            <button
                              onClick={() => setPaymentForm({ ...paymentForm, id: receivable.id })}
                              className="text-green-600 hover:text-green-800 dark:text-green-300"
                              title="Registrar Pago"
                            >
                              <Icon name="currency" size="sm" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(receivable.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-300"
                            title="Eliminar"
                          >
                            <Icon name="trash" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Aging Report View */}
      {view === 'aging' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold">Reporte de Antigüedad de Saldos</h2>
            <button
              onClick={exportAgingReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              📥 Exportar Reporte
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-green-700 dark:text-green-400 font-medium">Al Corriente</div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-200">{formatCurrency(agingReport.current.total)}</div>
              <div className="text-xs text-green-600 dark:text-green-400">{agingReport.current.count} facturas</div>
              <div className="mt-2 bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(agingReport.current.total / agingReport.totalOutstanding * 100) || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-blue-700 dark:text-blue-400 font-medium">1-30 días</div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(agingReport.days_1_30.total)}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">{agingReport.days_1_30.count} facturas</div>
              <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(agingReport.days_1_30.total / agingReport.totalOutstanding * 100) || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">31-60 días</div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{formatCurrency(agingReport.days_31_60.total)}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">{agingReport.days_31_60.count} facturas</div>
              <div className="mt-2 bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${(agingReport.days_31_60.total / agingReport.totalOutstanding * 100) || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-orange-700 font-medium">61-90 días</div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(agingReport.days_61_90.total)}</div>
              <div className="text-xs text-orange-600">{agingReport.days_61_90.count} facturas</div>
              <div className="mt-2 bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${(agingReport.days_61_90.total / agingReport.totalOutstanding * 100) || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-red-700 dark:text-red-400 font-medium">+90 días</div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">{formatCurrency(agingReport.days_90_plus.total)}</div>
              <div className="text-xs text-red-600 dark:text-red-400">{agingReport.days_90_plus.count} facturas</div>
              <div className="mt-2 bg-red-200 dark:bg-red-800 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${(agingReport.days_90_plus.total / agingReport.totalOutstanding * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Total Pendiente de Cobro</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Generado: {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(agingReport.totalOutstanding)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{agingReport.totalCount} facturas pendientes</div>
            
            {/* Visual distribution chart */}
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Distribución por Antigüedad</div>
              <div className="flex h-6 rounded-lg overflow-hidden">
                {agingReport.current.total > 0 && (
                  <div 
                    className="bg-green-500 hover:bg-green-600 transition-colors cursor-pointer" 
                    style={{ width: `${(agingReport.current.total / agingReport.totalOutstanding * 100)}%` }}
                    title={`Al corriente: ${formatCurrency(agingReport.current.total)}`}
                  ></div>
                )}
                {agingReport.days_1_30.total > 0 && (
                  <div 
                    className="bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer" 
                    style={{ width: `${(agingReport.days_1_30.total / agingReport.totalOutstanding * 100)}%` }}
                    title={`1-30 días: ${formatCurrency(agingReport.days_1_30.total)}`}
                  ></div>
                )}
                {agingReport.days_31_60.total > 0 && (
                  <div 
                    className="bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer" 
                    style={{ width: `${(agingReport.days_31_60.total / agingReport.totalOutstanding * 100)}%` }}
                    title={`31-60 días: ${formatCurrency(agingReport.days_31_60.total)}`}
                  ></div>
                )}
                {agingReport.days_61_90.total > 0 && (
                  <div 
                    className="bg-orange-500 hover:bg-orange-600 transition-colors cursor-pointer" 
                    style={{ width: `${(agingReport.days_61_90.total / agingReport.totalOutstanding * 100)}%` }}
                    title={`61-90 días: ${formatCurrency(agingReport.days_61_90.total)}`}
                  ></div>
                )}
                {agingReport.days_90_plus.total > 0 && (
                  <div 
                    className="bg-red-500 hover:bg-red-600 transition-colors cursor-pointer" 
                    style={{ width: `${(agingReport.days_90_plus.total / agingReport.totalOutstanding * 100)}%` }}
                    title={`+90 días: ${formatCurrency(agingReport.days_90_plus.total)}`}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics View */}
      {view === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Facturado</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.totalInvoiced)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Cobrado</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalCollected)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.totalOutstanding)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Cobranza</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.collectionRate.toFixed(1)}%</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Facturas Pagadas</div>
            <div className="text-2xl font-bold text-green-600">{metrics.paidCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Facturas Vencidas</div>
            <div className="text-2xl font-bold text-red-600">{metrics.overdueCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Facturas Pendientes</div>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendingCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Días Promedio de Cobro</div>
            <div className="text-2xl font-bold text-purple-600">{metrics.averageDaysToCollect}</div>
          </div>
        </div>
      )}

      {/* Needs Attention View */}
      {view === 'attention' && (
        <div className="space-y-4">
          {needsAttention.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
              ¡Todo está al día! No hay facturas que requieran atención.
            </div>
          ) : (
            needsAttention.map((item) => (
              <div key={item.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(item.priority)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{item.customer_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Factura: {item.invoice_number || '-'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Vencimiento: {formatDate(item.due_date)}</div>
                    <div className="text-sm font-medium mt-1">{item.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(item.amount - (item.amount_paid || 0))}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">pendiente</div>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, id: item.id })}
                      className="mt-2 bg-green-600 dark:bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Registrar Pago
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
