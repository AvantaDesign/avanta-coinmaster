import { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/calculations';
import { deleteTransaction, updateTransaction } from '../utils/api';

export default function TransactionTable({ transactions, onUpdate }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        await deleteTransaction(id);
        if (onUpdate) onUpdate();
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`¿Estás seguro de eliminar ${selectedIds.length} transacciones?`)) {
      try {
        await Promise.all(selectedIds.map(id => deleteTransaction(id)));
        setSelectedIds([]);
        if (onUpdate) onUpdate();
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  const handleBulkCategoryChange = async (newCategory) => {
    if (selectedIds.length === 0) return;
    
    try {
      await Promise.all(
        selectedIds.map(id => {
          const transaction = transactions.find(t => t.id === id);
          return updateTransaction(id, { ...transaction, category: newCategory });
        })
      );
      setSelectedIds([]);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account || '',
      is_deductible: transaction.is_deductible ? 1 : 0
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      await updateTransaction(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Error al actualizar: ' + error.message);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortedTransactions = () => {
    const sorted = [...transactions].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return sortOrder === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No hay transacciones
      </div>
    );
  }

  const sortedTransactions = getSortedTransactions();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.length} transacción(es) seleccionada(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkCategoryChange('personal')}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              → Personal
            </button>
            <button
              onClick={() => handleBulkCategoryChange('avanta')}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              → Avanta
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Eliminar
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === transactions.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                Fecha <SortIcon column="date" />
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Descripción <SortIcon column="description" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Monto <SortIcon column="amount" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Deducible</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className={`hover:bg-gray-50 ${selectedIds.includes(transaction.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(transaction.id)}
                    onChange={() => handleSelectOne(transaction.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                
                {editingId === transaction.id ? (
                  // Edit mode
                  <>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="ingreso">ingreso</option>
                        <option value="gasto">gasto</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="border rounded px-2 py-1 w-full"
                      >
                        <option value="personal">personal</option>
                        <option value="avanta">avanta</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        className="border rounded px-2 py-1 w-full text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="checkbox"
                        checked={editForm.is_deductible === 1}
                        onChange={(e) => setEditForm({ ...editForm, is_deductible: e.target.checked ? 1 : 0 })}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900 px-2"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900 px-2"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td className="px-4 py-3 text-sm">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3 text-sm">{transaction.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === 'ingreso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.category === 'avanta' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {transaction.is_deductible ? '✓' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 px-2"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900 px-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
