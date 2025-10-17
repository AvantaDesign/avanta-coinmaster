import { useState, useEffect } from 'react';
import { fetchDebts, fetchDebt, createDebt, updateDebt, deleteDebt } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showAmortization, setShowAmortization] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  const [formData, setFormData] = useState({
    debt_name: '',
    lender: '',
    principal_amount: '',
    interest_rate: '',
    interest_type: 'fixed',
    loan_term_months: '',
    payment_frequency: 'monthly',
    payment_day: '',
    start_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    collateral: ''
  });

  useEffect(() => {
    loadDebts();
  }, [filterStatus]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const result = await fetchDebts(params);
      setDebts(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      debt_name: '',
      lender: '',
      principal_amount: '',
      interest_rate: '',
      interest_type: 'fixed',
      loan_term_months: '',
      payment_frequency: 'monthly',
      payment_day: '',
      start_date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      collateral: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (debt) => {
    setFormData({
      debt_name: debt.debt_name,
      lender: debt.lender,
      principal_amount: debt.principal_amount.toString(),
      interest_rate: debt.interest_rate.toString(),
      interest_type: debt.interest_type,
      loan_term_months: debt.loan_term_months.toString(),
      payment_frequency: debt.payment_frequency,
      payment_day: debt.payment_day?.toString() || '',
      start_date: debt.start_date,
      category: debt.category || '',
      description: debt.description || '',
      collateral: debt.collateral || ''
    });
    setEditingId(debt.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        principal_amount: parseFloat(formData.principal_amount),
        interest_rate: parseFloat(formData.interest_rate),
        loan_term_months: parseInt(formData.loan_term_months),
        payment_day: formData.payment_day ? parseInt(formData.payment_day) : null
      };

      if (editingId) {
        await updateDebt(editingId, data);
      } else {
        await createDebt(data);
      }
      
      resetForm();
      loadDebts();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta deuda?')) return;
    
    try {
      await deleteDebt(id);
      loadDebts();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const viewAmortization = async (id) => {
    try {
      const debt = await fetchDebt(id, true);
      setSelectedDebt(debt);
      setShowAmortization(true);
    } catch (err) {
      alert('Error al cargar tabla de amortización: ' + err.message);
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + (d.current_balance || 0), 0);
  const monthlyPayments = debts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + (d.monthly_payment || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando deudas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          💳 Gestión de Deudas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra préstamos y obligaciones financieras
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Deudas</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalDebt)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pago Mensual Total</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(monthlyPayments)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deudas Activas</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {debts.filter(d => d.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          ➕ Nueva Deuda
        </button>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="paid_off">Pagadas</option>
          <option value="refinanced">Refinanciadas</option>
        </select>
      </div>

      {/* Debts List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {debts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay deudas registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Deuda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acreedor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pago Mensual
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tasa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Próximo Pago
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {debts.map((debt) => (
                  <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {debt.debt_name}
                      </div>
                      {debt.category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {debt.category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {debt.lender}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(debt.current_balance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(debt.monthly_payment)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-gray-100">
                      {debt.interest_rate}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {debt.next_payment_date ? formatDate(debt.next_payment_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        debt.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : debt.status === 'paid_off'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {debt.status === 'active' ? 'Activa' : debt.status === 'paid_off' ? 'Pagada' : debt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => viewAmortization(debt.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver tabla de amortización"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => handleEdit(debt)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingId ? 'Editar Deuda' : 'Nueva Deuda'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Deuda *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.debt_name}
                      onChange={(e) => setFormData({ ...formData, debt_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Acreedor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lender}
                      onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monto Principal *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.principal_amount}
                      onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tasa de Interés (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Interés
                    </label>
                    <select
                      value={formData.interest_type}
                      onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="fixed">Fijo</option>
                      <option value="variable">Variable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plazo (Meses) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.loan_term_months}
                      onChange={(e) => setFormData({ ...formData, loan_term_months: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frecuencia de Pago
                    </label>
                    <select
                      value={formData.payment_frequency}
                      onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Día de Pago
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.payment_day}
                      onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="ej. Hipoteca, Personal, Negocio"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Garantía/Colateral
                  </label>
                  <input
                    type="text"
                    value={formData.collateral}
                    onChange={(e) => setFormData({ ...formData, collateral: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Amortization Modal */}
      {showAmortization && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Tabla de Amortización - {selectedDebt.debt_name}
              </h2>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monto Original</div>
                  <div className="text-lg font-semibold">{formatCurrency(selectedDebt.principal_amount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Balance Actual</div>
                  <div className="text-lg font-semibold text-red-600">{formatCurrency(selectedDebt.current_balance)}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Fecha</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Pago</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Principal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Interés</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedDebt.amortization_schedule?.slice(0, 12).map((payment, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{payment.payment_number}</td>
                        <td className="px-4 py-2 text-sm">{formatDate(payment.payment_date)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(payment.payment_amount)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(payment.principal_paid)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(payment.interest_paid)}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold">{formatCurrency(payment.remaining_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedDebt.amortization_schedule?.length > 12 && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Mostrando los primeros 12 pagos de {selectedDebt.amortization_schedule.length}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAmortization(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
