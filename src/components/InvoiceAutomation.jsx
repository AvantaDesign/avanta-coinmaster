import { useState, useEffect } from 'react';
import { fetchAutomationRules, createAutomationRule, updateAutomationRule, deleteAutomationRule } from '../utils/api';
import { validateAutomationRule } from '../utils/automation';

export default function InvoiceAutomation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'recurring_invoice',
    customer_name: '',
    customer_rfc: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const result = await fetchAutomationRules({ rule_type: 'recurring_invoice' });
      setRules(result);
    } catch (err) {
      console.error('Error loading rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateAutomationRule(formData);
    if (!validation.isValid) {
      alert('Errores en el formulario:\n' + validation.errors.join('\n'));
      return;
    }

    try {
      await createAutomationRule({
        ...formData,
        amount: parseFloat(formData.amount),
        is_active: formData.is_active ? 1 : 0
      });
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        rule_type: 'recurring_invoice',
        customer_name: '',
        customer_rfc: '',
        amount: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true
      });
      loadRules();
    } catch (err) {
      alert('Error al crear regla: ' + err.message);
    }
  };

  const toggleRule = async (id, isActive) => {
    try {
      await updateAutomationRule(id, { is_active: isActive ? 1 : 0 });
      loadRules();
    } catch (err) {
      alert('Error al actualizar regla: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta regla?')) return;
    try {
      await deleteAutomationRule(id);
      loadRules();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Automatización de Facturas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : '+ Nueva Regla'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Nueva Regla de Facturación Recurrente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre de la Regla *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ej: Factura mensual Cliente ABC"
              />
            </div>
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
              <label className="block text-sm font-medium mb-1">Frecuencia *</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Inicio *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Fin (opcional)</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm">Activar regla inmediatamente</label>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Guardar Regla
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Reglas de Facturación Recurrente</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configura facturas que se generan automáticamente según un calendario
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-center">Cargando...</div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No hay reglas configuradas. Crea tu primera regla para automatizar la facturación.
          </div>
        ) : (
          <div className="divide-y">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${rule.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                    )}
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                        <span className="ml-1 font-medium">{rule.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                        <span className="ml-1 font-medium">
                          ${parseFloat(rule.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Frecuencia:</span>
                        <span className="ml-1 font-medium capitalize">{rule.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Próxima:</span>
                        <span className="ml-1 font-medium">
                          {rule.next_generation_date ? new Date(rule.next_generation_date).toLocaleDateString('es-MX') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id, !rule.is_active)}
                      className={`px-3 py-1 rounded text-sm ${rule.is_active ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200'}`}
                    >
                      {rule.is_active ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="px-3 py-1 rounded text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Cómo Funciona</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Las facturas se generan automáticamente según la frecuencia configurada</li>
          <li>• Puedes pausar o reactivar reglas en cualquier momento</li>
          <li>• Las reglas activas se ejecutan diariamente a las 00:00 hrs</li>
          <li>• Recibirás notificaciones cuando se generen facturas</li>
        </ul>
      </div>
    </div>
  );
}
