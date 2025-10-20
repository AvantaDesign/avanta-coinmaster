// Demo.jsx - Demo Mode Dashboard
// Phase 37: Advanced Demo Experience
//
// This page provides:
// - Demo scenario selection
// - Current scenario overview
// - Demo data reset functionality
// - Educational guidance

import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

export default function Demo() {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load available scenarios
      const scenariosResponse = await fetch('/api/demo-data/scenarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!scenariosResponse.ok) {
        throw new Error('Failed to load demo scenarios');
      }

      const scenariosData = await scenariosResponse.json();
      setScenarios(scenariosData.data || []);

      // Load current scenario
      const currentResponse = await fetch('/api/demo-data/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentScenario(currentData.data);
      }
    } catch (err) {
      console.error('Error loading demo data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchScenario = async (scenarioId) => {
    try {
      setSwitching(true);
      setError(null);

      const token = localStorage.getItem('token');

      // First activate the scenario
      await fetch(`/api/demo-scenarios/${scenarioId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Then load the scenario data
      const response = await fetch('/api/demo-data/load-scenario', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scenario_id: scenarioId })
      });

      if (!response.ok) {
        throw new Error('Failed to load scenario data');
      }

      // Reload demo data
      await loadDemoData();

      // Show success message
      alert('¡Escenario cargado exitosamente! Los datos se han actualizado.');
      
      // Refresh the page to show new data
      window.location.reload();
    } catch (err) {
      console.error('Error switching scenario:', err);
      setError(err.message);
      alert('Error al cambiar de escenario: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('¿Estás seguro de que deseas reiniciar los datos del escenario actual?')) {
      return;
    }

    try {
      setResetting(true);
      setError(null);

      const token = localStorage.getItem('token');

      const response = await fetch('/api/demo-data/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset demo data');
      }

      // Show success message
      alert('¡Datos reiniciados exitosamente!');
      
      // Refresh the page to show reset data
      window.location.reload();
    } catch (err) {
      console.error('Error resetting data:', err);
      setError(err.message);
      alert('Error al reiniciar datos: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const getScenarioIcon = (type) => {
    return type === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon;
  };

  const getScenarioColor = (type) => {
    return type === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  const getScenarioBgColor = (type) => {
    return type === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <AcademicCapIcon className="h-10 w-10 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modo Demostración</h1>
            <p className="text-gray-600 mt-1">
              Explora diferentes escenarios financieros y aprende a gestionar tu negocio
            </p>
          </div>
        </div>

        {/* Demo Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <div className="flex items-start">
            <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                Entorno de Aprendizaje Seguro
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Este es un entorno de demostración con datos ficticios. Puedes explorar todas las funciones
                sin afectar información real. Los datos se pueden reiniciar en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Scenario Overview */}
      {currentScenario && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Escenario Actual</h2>
            <button
              onClick={handleResetData}
              disabled={resetting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Reiniciando...' : 'Reiniciar Datos'}
            </button>
          </div>

          <div className={`border-2 rounded-lg p-6 ${getScenarioBgColor(currentScenario.scenario_type)}`}>
            <div className="flex items-start gap-4">
              {React.createElement(getScenarioIcon(currentScenario.scenario_type), {
                className: `h-12 w-12 ${getScenarioColor(currentScenario.scenario_type)} flex-shrink-0`
              })}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentScenario.scenario_name}
                </h3>
                <p className="text-gray-700 mb-4">
                  {currentScenario.description}
                </p>

                {/* Business Context */}
                {currentScenario.business_context && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2" />
                      Contexto del Negocio
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <span className="ml-2 font-medium">{currentScenario.business_context.business_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ingresos Mensuales:</span>
                        <span className="ml-2 font-medium">
                          ${(currentScenario.business_context.monthly_revenue / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Años Operando:</span>
                        <span className="ml-2 font-medium">{currentScenario.business_context.years_operating}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Régimen Fiscal:</span>
                        <span className="ml-2 font-medium">{currentScenario.business_context.fiscal_regime}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Learning Objectives */}
                {currentScenario.learning_objectives && currentScenario.learning_objectives.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <BookOpenIcon className="h-5 w-5 mr-2" />
                      Objetivos de Aprendizaje
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {currentScenario.learning_objectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Scenarios */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Escenarios Disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => {
            const Icon = getScenarioIcon(scenario.scenario_type);
            const isActive = currentScenario && currentScenario.id === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`border-2 rounded-lg p-6 transition-all ${
                  isActive
                    ? `${getScenarioBgColor(scenario.scenario_type)} border-2`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <Icon className={`h-8 w-8 ${getScenarioColor(scenario.scenario_type)} flex-shrink-0`} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {scenario.scenario_name}
                      {isActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Activo
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {scenario.description}
                    </p>

                    {/* Learning Objectives Preview */}
                    {scenario.learning_objectives && scenario.learning_objectives.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Aprenderás sobre:
                        </p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {scenario.learning_objectives.slice(0, 3).map((objective, index) => (
                            <li key={index}>• {objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => handleSwitchScenario(scenario.id)}
                      disabled={switching || isActive}
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isActive
                          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {switching ? 'Cargando...' : isActive ? 'Escenario Activo' : 'Cargar Escenario'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <BookOpenIcon className="h-6 w-6 text-blue-600 mr-2" />
          ¿Cómo usar el Modo Demostración?
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>1. Selecciona un escenario:</strong> Elige entre "Negocio Saludable" o "Negocio en Crisis"
            para explorar diferentes situaciones financieras.
          </p>
          <p>
            <strong>2. Explora las funciones:</strong> Navega por el sistema, revisa transacciones, genera
            reportes y usa todas las herramientas disponibles.
          </p>
          <p>
            <strong>3. Aprende de cada escenario:</strong> Presta atención a los objetivos de aprendizaje
            específicos de cada escenario.
          </p>
          <p>
            <strong>4. Reinicia cuando quieras:</strong> Usa el botón "Reiniciar Datos" para volver al
            estado inicial del escenario en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  );
}
