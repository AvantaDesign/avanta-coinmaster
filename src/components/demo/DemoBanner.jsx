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
            <Link
              to="/demo"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Cambiar Escenario
            </Link>
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
