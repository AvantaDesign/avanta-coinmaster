// DemoBanner.jsx - Demo Mode Indicator Banner
// Phase 37: Advanced Demo Experience
//
// This component displays a persistent banner indicating demo mode is active
// and provides quick access to demo features

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function DemoBanner() {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadCurrentScenario();
  }, []);

  const loadCurrentScenario = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/demo-data/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentScenario(data.data);
      }
    } catch (err) {
      console.error('Error loading current scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSwitch = async () => {
    if (switching) return;
    
    setSwitching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Determine the target scenario (switch between healthy and critical)
      const targetScenarioId = currentScenario.scenario_type === 'healthy' ? 2 : 1; // 1=healthy, 2=critical
      
      // Activate the scenario
      const activateResponse = await fetch(`/api/demo-scenarios/${targetScenarioId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activateResponse.ok) {
        // Load the scenario data
        const loadResponse = await fetch('/api/demo-data/load-scenario', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ scenario_id: targetScenarioId })
        });

        if (loadResponse.ok) {
          // Reload current scenario to update the banner
          await loadCurrentScenario();
          // Reload the page to refresh all data
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error switching scenario:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (loading || dismissed || !currentScenario) {
    return null;
  }

  const getScenarioColor = () => {
    return currentScenario.scenario_type === 'healthy' 
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-amber-50 border-amber-200 text-amber-900';
  };

  const getScenarioIcon = () => {
    return currentScenario.scenario_type === 'healthy' ? '✅' : '⚠️';
  };

  return (
    <div className={`border-b-2 ${getScenarioColor()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <AcademicCapIcon className="h-5 w-5 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">Modo Demostración</span>
              <span className="text-sm">
                {getScenarioIcon()} <strong>{currentScenario.scenario_name}</strong>
              </span>
              <span className="hidden sm:inline text-sm opacity-75">
                • Datos ficticios para aprendizaje
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scenario Switcher Toggle */}
            <button
              onClick={handleScenarioSwitch}
              disabled={switching}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                currentScenario.scenario_type === 'healthy'
                  ? 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={currentScenario.scenario_type === 'healthy' ? 'Cambiar a Negocio en Crisis' : 'Cambiar a Negocio Saludable'}
            >
              {switching ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  {currentScenario.scenario_type === 'healthy' ? '⚠️ Crisis' : '✅ Saludable'}
                </>
              )}
            </button>
            
            {/* Advanced Demo Page Link */}
            <Link
              to="/demo"
              className="inline-flex items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              title="Ver página completa de demo"
            >
              ⚙️
            </Link>
            
            {/* Dismiss Button */}
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Cerrar banner"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
