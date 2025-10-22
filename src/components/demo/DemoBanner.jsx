// DemoBanner.jsx - Demo Mode Indicator Banner
// Phase 37: Advanced Demo Experience
// Phase 47.5: Enhanced initialization and visibility
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
import { useAuth } from '../AuthProvider';

export default function DemoBanner() {
  const { user } = useAuth(); // Phase 47.5: Get user from auth context
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Phase 47.5: Only load if user is a demo user
    if (user && user.is_demo) {
      loadCurrentScenario();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCurrentScenario = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/demo-data/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Phase 47.5: If no scenario but user is demo, retry after a short delay
        // (AuthProvider might still be initializing)
        if (!data.data && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadCurrentScenario();
          }, 1000);
          return;
        }
        
        setCurrentScenario(data.data);
      } else if (response.status === 403) {
        // Not a demo user, don't show banner
        setCurrentScenario(null);
      }
    } catch (err) {
      console.error('Error loading current scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSwitch = async (targetScenarioId) => {
    if (switching) return;
    
    setSwitching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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

  const getNextScenario = () => {
    if (!currentScenario) return 1;
    
    // Cycle through scenarios: 1 -> 2 -> 3 -> 1
    const currentId = currentScenario.id;
    return currentId === 3 ? 1 : currentId + 1;
  };

  const getScenarioInfo = (scenarioId) => {
    switch (scenarioId) {
      case 1: return { name: 'Excelente', icon: '✅', color: 'green' };
      case 2: return { name: 'Regular', icon: '⚖️', color: 'blue' };
      case 3: return { name: 'Problemas', icon: '⚠️', color: 'red' };
      default: return { name: 'Desconocido', icon: '❓', color: 'gray' };
    }
  };

  // Phase 47.5: Only show banner for demo users
  if (!user || !user.is_demo) {
    return null;
  }

  if (loading || dismissed || !currentScenario) {
    return null;
  }

  const getScenarioColor = () => {
    const scenarioInfo = getScenarioInfo(currentScenario.id);
    switch (scenarioInfo.color) {
      case 'green': return 'bg-green-50 border-green-200 text-green-900';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'red': return 'bg-red-50 border-red-200 text-red-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getScenarioIcon = () => {
    const scenarioInfo = getScenarioInfo(currentScenario.id);
    return scenarioInfo.icon;
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
            {/* 3-Position Scenario Switcher */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border">
              {/* Scenario 1: Excelente */}
              <button
                onClick={() => handleScenarioSwitch(1)}
                disabled={switching}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  currentScenario.id === 1
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Negocio Excelente (+$100,000)"
              >
                ✅
              </button>
              
              {/* Scenario 2: Regular */}
              <button
                onClick={() => handleScenarioSwitch(2)}
                disabled={switching}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  currentScenario.id === 2
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Negocio Regular (+$10,000)"
              >
                ⚖️
              </button>
              
              {/* Scenario 3: Problemas */}
              <button
                onClick={() => handleScenarioSwitch(3)}
                disabled={switching}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  currentScenario.id === 3
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Negocio en Problemas (-$20,000)"
              >
                ⚠️
              </button>
              
              {/* Loading indicator */}
              {switching && (
                <div className="px-2 py-1">
                  <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
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
