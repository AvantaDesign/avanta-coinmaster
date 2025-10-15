import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import CreditCard from '../components/CreditCard';
import CreditMovementForm from '../components/CreditMovementForm';
import CreditDetails from '../components/CreditDetails';
import { formatCurrency } from '../utils/calculations';
import {
  formatCreditType,
  validateCredit,
  generateCreditId
} from '../utils/credits';

const API_URL = import.meta.env.VITE_API_URL || 'https://avanta-finance.pages.dev';

export default function Credits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [movements, setMovements] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits?include_balance=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load credits');
      }

      const data = await response.json();
      setCredits(data);
    } catch (err) {
      console.error('Error loading credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async (creditId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits/${creditId}/movements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load movements');
      }

      const data = await response.json();
      return data.movements || [];
    } catch (err) {
      console.error('Error loading movements:', err);
      return [];
    }
  };

  const handleCreateCredit = async (formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create credit');
      }

      await loadCredits();
      setShowCreateForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateCredit = async (creditId, formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits/${creditId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update credit');
      }

      await loadCredits();
      setShowCreateForm(false);
      setSelectedCredit(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteCredit = async (creditId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits/${creditId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete credit');
      }

      await loadCredits();
    } catch (err) {
      console.error('Error deleting credit:', err);
      alert('Error al eliminar el crédito: ' + err.message);
    }
  };

  const handleAddMovement = async (formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/credits/${selectedCredit.id}/movements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          date: formData.date
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add movement');
      }

      // If it's a payment and user wants to create transaction
      if (formData.type === 'payment' && formData.createTransaction) {
        try {
          await fetch(`${API_URL}/api/transactions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              date: formData.date,
              description: `Pago ${selectedCredit.name} - ${formData.description}`,
              amount: parseFloat(formData.amount),
              type: 'gasto',
              category: 'personal',
              transaction_type: 'personal'
            })
          });
        } catch (txErr) {
          console.error('Error creating transaction:', txErr);
          // Don't fail the whole operation if transaction creation fails
        }
      }

      await loadCredits();
      setShowMovementForm(false);
      
      // Reload details if showing
      if (showDetails) {
        const newMovements = await loadMovements(selectedCredit.id);
        setMovements(newMovements);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleViewDetails = async (credit) => {
    setSelectedCredit(credit);
    const creditMovements = await loadMovements(credit.id);
    setMovements(creditMovements);
    setShowDetails(true);
  };

  // Filter and sort credits
  const filteredCredits = credits
    .filter(credit => {
      if (filterType === 'all') return true;
      return credit.type === filterType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'balance') return (b.current_balance || 0) - (a.current_balance || 0);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

  // Calculate totals
  const totalBalance = credits.reduce((sum, credit) => sum + (credit.current_balance || 0), 0);
  const totalLimit = credits.filter(c => c.credit_limit).reduce((sum, c) => sum + c.credit_limit, 0);
  const totalAvailable = credits.filter(c => c.available_credit).reduce((sum, c) => sum + c.available_credit, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando créditos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créditos y Deudas</h1>
          <p className="text-gray-600">
            Gestiona tus tarjetas de crédito, préstamos e hipotecas en un solo lugar
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Saldo Total</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            <p className="text-sm text-gray-500 mt-1">{credits.length} crédito{credits.length !== 1 ? 's' : ''} activo{credits.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Crédito Disponible</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAvailable)}</p>
            <p className="text-sm text-gray-500 mt-1">
              de {formatCurrency(totalLimit)} límite total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Utilización</h3>
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalLimit > 0 ? ((totalBalance / totalLimit) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">del crédito total</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              {/* Filter by type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="credit_card">Tarjetas de Crédito</option>
                <option value="loan">Préstamos</option>
                <option value="mortgage">Hipotecas</option>
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Ordenar por Nombre</option>
                <option value="balance">Ordenar por Saldo</option>
                <option value="type">Ordenar por Tipo</option>
              </select>
            </div>

            {/* Add Credit Button */}
            <button
              onClick={() => {
                setSelectedCredit(null);
                setShowCreateForm(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Crédito
            </button>
          </div>
        </div>

        {/* Credits Grid */}
        {filteredCredits.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes créditos registrados</h3>
            <p className="text-gray-600 mb-6">
              {filterType === 'all' 
                ? 'Comienza agregando tu primera tarjeta de crédito, préstamo o hipoteca'
                : 'No tienes créditos de este tipo registrados'}
            </p>
            {filterType === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Primer Crédito
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onEdit={(credit) => {
                  setSelectedCredit(credit);
                  setShowCreateForm(true);
                }}
                onDelete={handleDeleteCredit}
                onAddMovement={(credit) => {
                  setSelectedCredit(credit);
                  setShowMovementForm(true);
                }}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Credit Modal */}
      {showCreateForm && (
        <CreditFormModal
          credit={selectedCredit}
          onSubmit={selectedCredit ? 
            (data) => handleUpdateCredit(selectedCredit.id, data) : 
            handleCreateCredit
          }
          onCancel={() => {
            setShowCreateForm(false);
            setSelectedCredit(null);
          }}
        />
      )}

      {/* Add Movement Modal */}
      {showMovementForm && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <CreditMovementForm
              credit={selectedCredit}
              onSubmit={handleAddMovement}
              onCancel={() => {
                setShowMovementForm(false);
                setSelectedCredit(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Credit Details Modal */}
      {showDetails && selectedCredit && (
        <CreditDetails
          credit={selectedCredit}
          movements={movements}
          onClose={() => {
            setShowDetails(false);
            setSelectedCredit(null);
            setMovements([]);
          }}
          onAddMovement={(credit) => {
            setShowDetails(false);
            setShowMovementForm(true);
          }}
          onEdit={(credit) => {
            setShowDetails(false);
            setShowCreateForm(true);
          }}
        />
      )}
    </div>
  );
}

// Credit Form Modal Component
function CreditFormModal({ credit, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: credit?.name || '',
    type: credit?.type || 'credit_card',
    credit_limit: credit?.credit_limit || '',
    interest_rate: credit?.interest_rate ? (credit.interest_rate * 100).toString() : '',
    statement_day: credit?.statement_day || '',
    payment_due_day: credit?.payment_due_day || ''
  });
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Convert and validate
    const creditData = {
      ...formData,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) / 100 : null,
      statement_day: formData.statement_day ? parseInt(formData.statement_day) : null,
      payment_due_day: formData.payment_due_day ? parseInt(formData.payment_due_day) : null
    };

    const validationErrors = validateCredit(creditData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(creditData);
    } catch (error) {
      setErrors([error.message || 'Error al guardar el crédito']);
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {credit ? 'Editar Crédito' : 'Agregar Nuevo Crédito'}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Crédito *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej. BBVA Platino, Santander Auto, Hipoteca Infonavit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={100}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Crédito *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'credit_card', label: 'Tarjeta de Crédito' },
                { value: 'loan', label: 'Préstamo' },
                { value: 'mortgage', label: 'Hipoteca' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Limit */}
          <div>
            <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700 mb-1">
              Límite de Crédito {formData.type === 'credit_card' ? '*' : '(Opcional)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="credit_limit"
                value={formData.credit_limit}
                onChange={(e) => handleChange('credit_limit', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Tasa de Interés Anual (Opcional)
            </label>
            <div className="relative">
              <input
                type="number"
                id="interest_rate"
                value={formData.interest_rate}
                onChange={(e) => handleChange('interest_rate', e.target.value)}
                placeholder="24"
                step="0.01"
                min="0"
                max="100"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>

          {/* Statement Day */}
          <div>
            <label htmlFor="statement_day" className="block text-sm font-medium text-gray-700 mb-1">
              Día de Corte (Opcional)
            </label>
            <input
              type="number"
              id="statement_day"
              value={formData.statement_day}
              onChange={(e) => handleChange('statement_day', e.target.value)}
              placeholder="Día del mes (1-31)"
              min="1"
              max="31"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Due Day */}
          <div>
            <label htmlFor="payment_due_day" className="block text-sm font-medium text-gray-700 mb-1">
              Día de Pago (Opcional)
            </label>
            <input
              type="number"
              id="payment_due_day"
              value={formData.payment_due_day}
              onChange={(e) => handleChange('payment_due_day', e.target.value)}
              placeholder="Día del mes (1-31)"
              min="1"
              max="31"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : credit ? 'Actualizar' : 'Crear Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
