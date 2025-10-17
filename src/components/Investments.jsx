import { useState, useEffect } from 'react';
import { 
  fetchInvestments, 
  fetchInvestment, 
  fetchPortfolioSummary,
  createInvestment, 
  updateInvestment, 
  deleteInvestment 
} from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    investment_name: '',
    investment_type: 'stocks',
    broker_platform: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_amount: '',
    quantity: '',
    current_value: '',
    current_price_per_unit: '',
    currency: 'MXN',
    category: '',
    risk_level: 'medium',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filterStatus, filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (filterType !== 'all') {
        params.type = filterType;
      }
      
      const [investmentsResult, portfolioResult] = await Promise.all([
        fetchInvestments(params),
        fetchPortfolioSummary()
      ]);
      
      setInvestments(investmentsResult);
      setPortfolio(portfolioResult);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      investment_name: '',
      investment_type: 'stocks',
      broker_platform: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_amount: '',
      quantity: '',
      current_value: '',
      current_price_per_unit: '',
      currency: 'MXN',
      category: '',
      risk_level: 'medium',
      description: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (investment) => {
    setFormData({
      investment_name: investment.investment_name,
      investment_type: investment.investment_type,
      broker_platform: investment.broker_platform || '',
      purchase_date: investment.purchase_date,
      purchase_amount: investment.purchase_amount.toString(),
      quantity: investment.quantity?.toString() || '',
      current_value: investment.current_value?.toString() || '',
      current_price_per_unit: investment.current_price_per_unit?.toString() || '',
      currency: investment.currency || 'MXN',
      category: investment.category || '',
      risk_level: investment.risk_level || 'medium',
      description: investment.description || '',
      notes: investment.notes || ''
    });
    setEditingId(investment.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        purchase_amount: parseFloat(formData.purchase_amount),
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
        current_price_per_unit: formData.current_price_per_unit ? parseFloat(formData.current_price_per_unit) : null
      };

      if (editingId) {
        await updateInvestment(editingId, data);
      } else {
        await createInvestment(data);
      }
      
      resetForm();
      loadData();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) return;
    
    try {
      await deleteInvestment(id);
      loadData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getReturnColor = (returnPercent) => {
    if (returnPercent > 0) return 'text-green-600 dark:text-green-400';
    if (returnPercent < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando inversiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📈 Gestión de Inversiones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra tu portafolio y monitorea el desempeño
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Invertido</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolio.total_invested)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Actual</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(portfolio.total_current_value)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rendimiento Total</div>
            <div className={`text-2xl font-bold ${getReturnColor(portfolio.percent_return)}`}>
              {formatCurrency(portfolio.total_return)}
            </div>
            <div className={`text-sm ${getReturnColor(portfolio.percent_return)}`}>
              {portfolio.percent_return > 0 ? '+' : ''}{portfolio.percent_return.toFixed(2)}%
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inversiones Activas</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {portfolio.active_investments}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Breakdown */}
      {portfolio && (portfolio.by_type.length > 0 || portfolio.by_risk.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* By Type */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribución por Tipo
            </h3>
            <div className="space-y-3">
              {portfolio.by_type.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {item.type.replace('_', ' ')} ({item.count})
                    </span>
                    <span className={`text-sm font-semibold ${getReturnColor(item.percent_return)}`}>
                      {item.percent_return > 0 ? '+' : ''}{item.percent_return.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${(item.current_value / portfolio.total_current_value) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatCurrency(item.current_value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Risk */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribución por Riesgo
            </h3>
            <div className="space-y-3">
              {portfolio.by_risk.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {item.risk_level === 'low' ? 'Bajo' : item.risk_level === 'medium' ? 'Medio' : 'Alto'} ({item.count})
                    </span>
                    <span className={`text-sm font-semibold ${getReturnColor(item.percent_return)}`}>
                      {item.percent_return > 0 ? '+' : ''}{item.percent_return.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.risk_level === 'low' ? 'bg-green-500' :
                        item.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(item.current_value / portfolio.total_current_value) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatCurrency(item.current_value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          ➕ Nueva Inversión
        </button>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="sold">Vendidas</option>
          <option value="closed">Cerradas</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todos los tipos</option>
          <option value="stocks">Acciones</option>
          <option value="bonds">Bonos</option>
          <option value="mutual_funds">Fondos Mutuos</option>
          <option value="real_estate">Bienes Raíces</option>
          <option value="crypto">Criptomonedas</option>
          <option value="other">Otros</option>
        </select>
      </div>

      {/* Investments List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        {investments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay inversiones registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Inversión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Invertido
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rendimiento
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Riesgo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {investments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {investment.investment_name}
                      </div>
                      {investment.broker_platform && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {investment.broker_platform}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {investment.investment_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(investment.purchase_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(investment.current_value || investment.purchase_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {investment.performance ? (
                        <>
                          <div className={`font-semibold ${getReturnColor(investment.performance.percent_return)}`}>
                            {investment.performance.percent_return > 0 ? '+' : ''}
                            {investment.performance.percent_return.toFixed(2)}%
                          </div>
                          <div className={`text-xs ${getReturnColor(investment.performance.total_return)}`}>
                            {formatCurrency(investment.performance.total_return)}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRiskBadgeColor(investment.risk_level)}`}>
                        {investment.risk_level === 'low' ? 'Bajo' : investment.risk_level === 'medium' ? 'Medio' : 'Alto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(investment.purchase_date)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
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
                {editingId ? 'Editar Inversión' : 'Nueva Inversión'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Inversión *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.investment_name}
                      onChange={(e) => setFormData({ ...formData, investment_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo *
                    </label>
                    <select
                      required
                      value={formData.investment_type}
                      onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="stocks">Acciones</option>
                      <option value="bonds">Bonos</option>
                      <option value="mutual_funds">Fondos Mutuos</option>
                      <option value="real_estate">Bienes Raíces</option>
                      <option value="crypto">Criptomonedas</option>
                      <option value="other">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Broker/Plataforma
                    </label>
                    <input
                      type="text"
                      value={formData.broker_platform}
                      onChange={(e) => setFormData({ ...formData, broker_platform: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Compra *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monto Invertido *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.purchase_amount}
                      onChange={(e) => setFormData({ ...formData, purchase_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cantidad/Unidades
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor Actual
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.current_value}
                      onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Precio por Unidad
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.current_price_per_unit}
                      onChange={(e) => setFormData({ ...formData, current_price_per_unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="MXN">MXN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nivel de Riesgo
                    </label>
                    <select
                      value={formData.risk_level}
                      onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="low">Bajo</option>
                      <option value="medium">Medio</option>
                      <option value="high">Alto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="ej. Retiro, Crecimiento, Ingresos"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
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
    </div>
  );
}
