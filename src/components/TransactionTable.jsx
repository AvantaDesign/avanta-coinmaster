import { formatCurrency, formatDate } from '../utils/calculations';
import { deleteTransaction } from '../utils/api';

export default function TransactionTable({ transactions, onUpdate }) {
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

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No hay transacciones
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Deducible</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
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
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {transaction.is_deductible ? '✓' : ''}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
