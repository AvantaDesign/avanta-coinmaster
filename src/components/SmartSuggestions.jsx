import { useState, useEffect } from 'react';
import { getSuggestions } from '../utils/suggestions';

/**
 * Smart Category Suggestions Component
 * Shows AI-powered category suggestions based on transaction description and amount
 */
export default function SmartSuggestions({ description, amount, history, onSelect, currentCategory }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (description && description.length > 3) {
      const results = getSuggestions(description, amount, history);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [description, amount, history]);

  if (suggestions.length === 0) {
    return null;
  }

  const topSuggestion = suggestions[0];
  
  // Only show if confidence is reasonably high and different from current
  if (topSuggestion.confidence < 0.3 || topSuggestion.category === currentCategory) {
    return null;
  }

  return (
    <div className="mt-2 border border-blue-200 bg-blue-50 rounded-md p-3">
      <div className="flex items-start gap-2">
        {/* AI Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-blue-600 text-lg">🤖</span>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-blue-900">
              Sugerencia Inteligente
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
          </div>
          
          <p className="text-sm text-blue-800 mt-1">
            Esta transacción parece ser de categoría{' '}
            <strong>{topSuggestion.label}</strong>
            {topSuggestion.confidence >= 0.7 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                Alta confianza
              </span>
            )}
            {topSuggestion.confidence >= 0.5 && topSuggestion.confidence < 0.7 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                Media confianza
              </span>
            )}
          </p>

          {/* Detailed reasons */}
          {showDetails && topSuggestion.reasons.length > 0 && (
            <div className="mt-2 p-2 bg-white rounded border border-blue-100">
              <p className="text-xs font-medium text-gray-700 mb-1">Razones:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {topSuggestion.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={() => onSelect(topSuggestion.category)}
            className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          >
            Usar esta categoría
          </button>

          {/* Alternative suggestions */}
          {showDetails && suggestions.length > 1 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs font-medium text-gray-700 mb-1">Otras opciones:</p>
              <div className="flex gap-2">
                {suggestions.slice(1).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelect(suggestion.category)}
                    className="text-xs px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition"
                  >
                    {suggestion.label} ({Math.round(suggestion.confidence * 100)}%)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
