import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatCurrency, formatDate } from '../utils/calculations';
import { deleteTransaction, updateTransaction, restoreTransaction } from '../utils/api';
import { showSuccess, showError, showWarning } from '../utils/notifications';
import useTransactionStore from '../stores/useTransactionStore';

export default function TransactionTable({ transactions: propTransactions, onUpdate }) {
  // Use store if available, otherwise fall back to props
  const storeTransactions = useTransactionStore((state) => state.transactions);
  const transactions = propTransactions || storeTransactions;
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Refs for virtualization
  const parentRef = useRef(null);

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta transacción? (Se puede restaurar después)')) {
      try {
        await deleteTransaction(id);
        showSuccess('Transacción eliminada exitosamente (soft delete)');
        if (onUpdate) onUpdate();
      } catch (error) {
        showError(`Error al eliminar: ${error.message}`);
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreTransaction(id);
      showSuccess('Transacción restaurada exitosamente');
      if (onUpdate) onUpdate();
    } catch (error) {
      showError(`Error al restaurar: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (confirm(`¿Estás seguro de eliminar ${selectedIds.length} transacciones?`)) {
      try {
        await Promise.all(selectedIds.map(id => deleteTransaction(id)));
        setSelectedIds([]);
        showSuccess(`${selectedIds.length} transacciones eliminadas exitosamente`);
        if (onUpdate) onUpdate();
      } catch (error) {
        showError(`Error al eliminar: ${error.message}`);
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
      showSuccess(`${selectedIds.length} transacciones actualizadas a categoría ${newCategory}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      showError(`Error al actualizar: ${error.message}`);
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
      is_deductible: transaction.is_deductible ? 1 : 0,
      transaction_type: transaction.transaction_type || 'personal',
      category_id: transaction.category_id || null,
      linked_invoice_id: transaction.linked_invoice_id || null,
      notes: transaction.notes || ''
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
      showSuccess('Transacción actualizada exitosamente');
      if (onUpdate) onUpdate();
    } catch (error) {
      showError(`Error al actualizar: ${error.message}`);
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
        No hay transacciones
      </div>
    );
  }

  const sortedTransactions = getSortedTransactions();

  // Setup virtualizer for large lists
  const rowVirtualizer = useVirtualizer({
    count: sortedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10 // Number of items to render outside of viewport
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
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
              className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              → Avanta
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded hover:bg-red-700"
            >
              Eliminar
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 bg-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table View - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <div 
          ref={parentRef}
          className="overflow-y-auto"
          style={{ maxHeight: '600px' }}
        >
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === transactions.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-slate-600"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Fecha <SortIcon column="date" />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('description')}
                >
                  Descripción <SortIcon column="description" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clasificación</th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  Monto <SortIcon column="amount" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deducible</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const transaction = sortedTransactions[virtualRow.index];
                return (
                  <tr 
                    key={transaction.id} 
                    className={`hover:bg-gray-50 ${selectedIds.includes(transaction.id) ? 'bg-blue-50' : ''}`}
                  >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(transaction.id)}
                    onChange={() => handleSelectOne(transaction.id)}
                    className="rounded border-gray-300 dark:border-slate-600"
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
                      <select
                        value={editForm.transaction_type || 'personal'}
                        onChange={(e) => setEditForm({ ...editForm, transaction_type: e.target.value })}
                        className="border rounded px-2 py-1 w-full text-xs"
                      >
                        <option value="personal">👤 Personal</option>
                        <option value="business">💼 Negocio</option>
                        <option value="transfer">🔄 Transfer</option>
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
                        className="rounded border-gray-300 dark:border-slate-600"
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
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 px-2"
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
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.category === 'avanta' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.transaction_type === 'business' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                          : transaction.transaction_type === 'transfer'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.transaction_type === 'business' ? '💼 Negocio' : 
                         transaction.transaction_type === 'transfer' ? '🔄 Transfer' : 
                         '👤 Personal'}
                      </span>
                      {transaction.linked_invoice_id && (
                        <span className="ml-1 text-xs" title="Factura vinculada">📄</span>
                      )}
                      {transaction.notes && (
                        <span className="ml-1 text-xs" title={transaction.notes}>📝</span>
                      )}
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
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - visible only on mobile */}
      <div className="md:hidden">
        {sortedTransactions.map((transaction) => (
          <div 
            key={transaction.id}
            className={`border-b border-gray-200 p-4 ${selectedIds.includes(transaction.id) ? 'bg-blue-50' : ''}`}
          >
            {editingId === transaction.id ? (
              // Mobile Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fecha</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="border rounded px-2 py-1 w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Descripción</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="border rounded px-2 py-1 w-full mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tipo</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="border rounded px-2 py-1 w-full mt-1"
                    >
                      <option value="ingreso">ingreso</option>
                      <option value="gasto">gasto</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Categoría</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="border rounded px-2 py-1 w-full mt-1"
                    >
                      <option value="personal">personal</option>
                      <option value="avanta">avanta</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                      className="border rounded px-2 py-1 w-full mt-1"
                    />
                  </div>
                  <div className="flex items-center mt-5">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.is_deductible === 1}
                        onChange={(e) => setEditForm({ ...editForm, is_deductible: e.target.checked ? 1 : 0 })}
                        className="rounded border-gray-300 dark:border-slate-600 mr-2"
                      />
                      Deducible
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Mobile View Mode
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(transaction.id)}
                      onChange={() => handleSelectOne(transaction.id)}
                      className="rounded border-gray-300 dark:border-slate-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    transaction.type === 'ingreso' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {transaction.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    transaction.category === 'avanta' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    transaction.transaction_type === 'business' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                      : transaction.transaction_type === 'transfer'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.transaction_type === 'business' ? '💼 Negocio' : 
                     transaction.transaction_type === 'transfer' ? '🔄 Transfer' : 
                     '👤 Personal'}
                  </span>
                  {transaction.is_deductible && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      Deducible
                    </span>
                  )}
                  {transaction.linked_invoice_id && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800">
                      📄 Factura
                    </span>
                  )}
                  {transaction.notes && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800" title={transaction.notes}>
                      📝 Notas
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => startEdit(transaction)}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-100 dark:bg-blue-900/30"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-100 dark:bg-red-900/30"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
