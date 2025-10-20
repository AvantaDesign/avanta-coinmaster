// InitialBalanceManager - Manage historical initial balances for an account
// Phase 33: Data Foundations and Initial Improvements

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/calculations';
import { 
  fetchAccountInitialBalances, 
  createAccountInitialBalance,
  updateAccountInitialBalance,
  deleteAccountInitialBalance 
} from '../utils/api';
import Icon from './icons/IconLibrary';

export default function InitialBalanceManager({ accountId, accountName }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    balance_date: '',
    initial_balance: 0,
    notes: ''
  });

  useEffect(() => {
    if (accountId) {
      loadBalances();
    }
  }, [accountId]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const data = await fetchAccountInitialBalances(accountId);
      setBalances(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAccountInitialBalance(accountId, editingId, formData);
      } else {
        await createAccountInitialBalance(accountId, formData);
      }
      await loadBalances();
      resetForm();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (balance) => {
    setEditingId(balance.id);
    setFormData({
      balance_date: balance.balance_date,
      initial_balance: balance.initial_balance,
      notes: balance.notes || ''
    });
    setIsAdding(true);
  };

  const handleDelete = async (balanceId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este saldo inicial?')) return;
    
    try {
      await deleteAccountInitialBalance(accountId, balanceId);
      await loadBalances();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ balance_date: '', initial_balance: 0, notes: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-600 dark:text-gray-400">
        Cargando saldos iniciales...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Saldos Iniciales - {accountName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Define saldos iniciales para diferentes fechas
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm"
          >
            + Agregar Saldo
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
            {editingId ? 'Editar Saldo Inicial' : 'Nuevo Saldo Inicial'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.balance_date}
                  onChange={(e) => setFormData({ ...formData, balance_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Saldo Inicial *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                rows="2"
                placeholder="Opcional: Descripción del saldo inicial"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Balances List */}
      {balances.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          No hay saldos iniciales registrados para esta cuenta.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saldo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Notas
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {balances.map((balance) => (
                <tr key={balance.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {new Date(balance.balance_date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(balance.initial_balance)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {balance.notes || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(balance)}
                      className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                    >
                      <Icon name="pencil" size="sm" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(balance.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <Icon name="trash" size="sm" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
