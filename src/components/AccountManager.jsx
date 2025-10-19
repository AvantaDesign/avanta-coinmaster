import { useState, useEffect } from 'react';
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../utils/api';
import { formatCurrency } from '../utils/calculations';
import Icon from './icons/IconLibrary';

export default function AccountManager() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: 0
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(data);
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
        await updateAccount(editingId, formData);
      } else {
        await createAccount(formData);
      }
      await loadAccounts();
      resetForm();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance
    });
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return;
    
    try {
      await deleteAccount(id);
      await loadAccounts();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'checking', balance: 0 });
    setEditingId(null);
    setIsAdding(false);
  };

  const getTypeLabel = (type) => {
    const labels = {
      checking: 'Cuenta Corriente',
      savings: 'Cuenta de Ahorro',
      credit: 'Tarjeta de Crédito',
      cash: 'Efectivo'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      checking: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      savings: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      credit: 'bg-orange-100 text-orange-800',
      cash: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando cuentas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Cuentas</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            + Nueva Cuenta
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  required
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Cuenta de Ahorro</option>
                  <option value="credit">Tarjeta de Crédito</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay cuentas registradas
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(account.type)}`}>
                      {getTypeLabel(account.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${
                      account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(account.balance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center gap-1"
                    >
                      <Icon name="pencil" size="sm" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <Icon name="trash" size="sm" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Summary */}
      {accounts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Total de cuentas:</span>
            <span className="text-lg font-bold text-blue-900">{accounts.length}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-blue-900">Balance total:</span>
            <span className={`text-lg font-bold ${
              accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
