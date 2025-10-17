import { useState, useEffect } from 'react';
import { fetchPayables, createPayable, updatePayable, deletePayable } from '../utils/api';
import { calculatePaymentSchedule, getVendorSummary, calculatePaymentMetrics, getUrgentPayables } from '../utils/payables';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function AccountsPayable() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState('list'); // list, schedule, vendors, metrics
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_rfc: '',
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    payment_terms: '30',
    category: '',
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
    loadPayables();
  }, [filterStatus]);

  const loadPayables = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const result = await fetchPayables(params);
      setPayables(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPayable({
        ...formData,
        amount: parseFloat(formData.amount),
        payment_terms: parseInt(formData.payment_terms)
      });
      setShowForm(false);
      setFormData({
        vendor_name: '',
        vendor_rfc: '',
        bill_number: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: '',
        amount: '',
        payment_terms: '30',
        category: '',
        notes: ''
      });
      loadPayables();
    } catch (err) {
      alert('Error al crear cuenta por pagar: ' + err.message);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await updatePayable(paymentForm.id, {
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
      loadPayables();
    } catch (err) {
      alert('Error al registrar pago: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta por pagar?')) return;
    try {
      await deletePayable(id);
      loadPayables();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const schedule = calculatePaymentSchedule(payables);
  const vendors = getVendorSummary(payables);
  const metrics = calculatePaymentMetrics(payables);
  const urgent = getUrgentPayables(payables);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cuentas por Pagar</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : '+ Nueva Cuenta por Pagar'}
        </button>
      </div>

      {/* Urgent Payments Alert */}
      {urgent.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <div className="font-bold text-red-900">Pagos Urgentes</div>
              <div className="text-sm text-red-700">
                Tienes {urgent.length} pago{urgent.length > 1 ? 's' : ''} que requieren atención inmediata
              </div>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setView('schedule')}
            className={`px-4 py-2 font-medium ${view === 'schedule' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Calendario de Pagos
          </button>
          <button
            onClick={() => setView('vendors')}
            className={`px-4 py-2 font-medium ${view === 'vendors' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Proveedores
          </button>
          <button
            onClick={() => setView('metrics')}
            className={`px-4 py-2 font-medium ${view === 'metrics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Métricas
          </button>
        </div>
      </div>

      {/* New Payable Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Nueva Cuenta por Pagar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor *</label>
              <input
                type="text"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RFC del Proveedor</label>
              <input
                type="text"
                value={formData.vendor_rfc}
                onChange={(e) => setFormData({ ...formData, vendor_rfc: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número de Factura</label>
              <input
                type="text"
                value={formData.bill_number}
                onChange={(e) => setFormData({ ...formData, bill_number: e.target.value })}
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
                value={formData.bill_date}
                onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
          <div className="p-4 border-b flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
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
          {loading ? (
            <div className="p-6 text-center">Cargando...</div>
          ) : payables.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">No hay cuentas por pagar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
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
                  {payables.map((payable) => (
                    <tr key={payable.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{payable.vendor_name}</td>
                      <td className="px-4 py-3 text-sm">{payable.bill_number || '-'}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(payable.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(payable.amount)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(payable.amount_paid || 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(payable.amount - (payable.amount_paid || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payable.status)}`}>
                          {payable.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          {payable.status !== 'paid' && payable.status !== 'cancelled' && (
                            <button
                              onClick={() => setPaymentForm({ ...paymentForm, id: payable.id })}
                              className="text-green-600 hover:text-green-800 dark:text-green-300"
                              title="Registrar Pago"
                            >
                              💰
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(payable.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-300"
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
          )}
        </div>
      )}

      {/* Schedule View */}
      {view === 'schedule' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-700 font-medium">Vencidos</div>
              <div className="text-2xl font-bold text-red-900">{formatCurrency(schedule.overdue.total)}</div>
              <div className="text-xs text-red-600">{schedule.overdue.count} pagos</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700 font-medium">Esta Semana</div>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(schedule.thisWeek.total)}</div>
              <div className="text-xs text-orange-600">{schedule.thisWeek.count} pagos</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 font-medium">Este Mes</div>
              <div className="text-2xl font-bold text-yellow-900">{formatCurrency(schedule.thisMonth.total)}</div>
              <div className="text-xs text-yellow-600">{schedule.thisMonth.count} pagos</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 font-medium">Próximo Mes</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(schedule.nextMonth.total)}</div>
              <div className="text-xs text-blue-600">{schedule.nextMonth.count} pagos</div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Futuro</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(schedule.future.total)}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{schedule.future.count} pagos</div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-2">Total a Pagar</h3>
            <div className="text-3xl font-bold text-red-900">{formatCurrency(schedule.totalAmount)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{schedule.totalCount} pagos pendientes</div>
          </div>
        </div>
      )}

      {/* Vendors View */}
      {view === 'vendors' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md">
          {vendors.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">No hay proveedores</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Facturado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Pagado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Facturas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vencidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {vendors.map((vendor, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{vendor.vendor_name}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(vendor.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(vendor.paidAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                        {formatCurrency(vendor.outstandingAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{vendor.payableCount}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {vendor.overdueCount > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            {vendor.overdueCount}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Metrics View */}
      {view === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Facturado</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.totalBilled)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pagado</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Pendiente</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalOutstanding)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Pago</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.paymentRate.toFixed(1)}%</div>
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
            <div className="text-sm text-gray-600 dark:text-gray-400">Días Promedio de Pago</div>
            <div className="text-2xl font-bold text-purple-600">{metrics.averageDaysToPay}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasa de Pagos a Tiempo</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.onTimePaymentRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Porcentaje de facturas pagadas antes o en la fecha de vencimiento
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
