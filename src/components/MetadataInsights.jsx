import { useState, useEffect } from 'react';
import { 
  groupByInstitution, 
  calculateInstitutionBalances, 
  calculateDiversification,
  suggestMissingMetadata 
} from '../utils/relationshipDetector';

/**
 * MetadataInsights Component
 * 
 * Displays smart insights based on metadata analysis
 * - Breakdown by institution
 * - Diversification analysis
 * - Suggestions for missing metadata
 * 
 * Props:
 * - items: Array of items with metadata
 * - entityType: Type of entity (accounts, credits, debts, investments)
 * - balanceField: Name of the balance field
 * - requiredFields: Fields that should be present in metadata
 */
export default function MetadataInsights({ 
  items = [], 
  entityType = 'accounts',
  balanceField = 'balance',
  requiredFields = ['bank_name']
}) {
  const [institutionBreakdown, setInstitutionBreakdown] = useState({});
  const [diversification, setDiversification] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('institutions');

  useEffect(() => {
    if (items && items.length > 0) {
      // Calculate institution breakdown
      const balances = calculateInstitutionBalances(items, balanceField);
      setInstitutionBreakdown(balances);

      // Calculate diversification
      const divScore = calculateDiversification(items);
      setDiversification(divScore);

      // Generate suggestions
      const missing = suggestMissingMetadata(items, requiredFields);
      setSuggestions(missing);
    }
  }, [items, balanceField, requiredFields]);

  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No hay datos suficientes para generar insights</p>
        </div>
      </div>
    );
  }

  const getDiversificationColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDiversificationBadge = (score) => {
    if (score >= 70) return { text: 'Excelente', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-800 dark:text-green-200' };
    if (score >= 40) return { text: 'Buena', bg: 'bg-yellow-100 dark:bg-yellow-900/30', color: 'text-yellow-800 dark:text-yellow-200' };
    return { text: 'Mejorable', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-800 dark:text-red-200' };
  };

  const getTotalBalance = () => {
    return Object.values(institutionBreakdown).reduce((sum, inst) => sum + inst.total, 0);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📊 Análisis de Datos
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Insights basados en metadatos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('institutions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'institutions'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Por Institución
        </button>
        <button
          onClick={() => setActiveTab('diversification')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'diversification'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Diversificación
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'suggestions'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Sugerencias
          {suggestions.length > 0 && (
            <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {suggestions.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Institutions Tab */}
        {activeTab === 'institutions' && (
          <div className="space-y-4">
            {Object.keys(institutionBreakdown).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No se encontraron instituciones en los metadatos
              </p>
            ) : (
              <>
                {/* Total Summary */}
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Balance Total</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${getTotalBalance().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    en {Object.keys(institutionBreakdown).filter(k => k !== '_no_institution').length} instituciones
                  </div>
                </div>

                {/* Institution List */}
                {Object.entries(institutionBreakdown)
                  .filter(([key]) => key !== '_no_institution')
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([institution, data]) => {
                    const percentage = (data.total / getTotalBalance()) * 100;
                    return (
                      <div key={institution} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {institution}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {data.count} {data.count === 1 ? entityType.slice(0, -1) : entityType}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              ${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                {/* Items without institution */}
                {institutionBreakdown._no_institution && (
                  <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-slate-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Sin institución
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {institutionBreakdown._no_institution.count} {institutionBreakdown._no_institution.count === 1 ? 'item' : 'items'} sin metadatos
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                          ${institutionBreakdown._no_institution.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Diversification Tab */}
        {activeTab === 'diversification' && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/30 dark:to-blue-900/30 mb-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getDiversificationColor(diversification.score)}`}>
                    {diversification.score}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">de 100</div>
                </div>
              </div>
              <div className="mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDiversificationBadge(diversification.score).bg} ${getDiversificationBadge(diversification.score).color}`}>
                  {getDiversificationBadge(diversification.score).text}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Nivel de diversificación
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {diversification.institutionCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Instituciones</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {diversification.itemCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Items Total</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                💡 Recomendaciones
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                {diversification.score < 40 && (
                  <>
                    <li>• Considera diversificar en más instituciones para reducir riesgo</li>
                    <li>• Una buena diversificación ayuda a proteger tus finanzas</li>
                  </>
                )}
                {diversification.score >= 40 && diversification.score < 70 && (
                  <>
                    <li>• Tu diversificación es buena, pero puede mejorar</li>
                    <li>• Intenta equilibrar mejor la distribución entre instituciones</li>
                  </>
                )}
                {diversification.score >= 70 && (
                  <>
                    <li>• ¡Excelente diversificación!</li>
                    <li>• Continúa manteniendo este balance entre instituciones</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Todo en orden!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Todos los items tienen los metadatos recomendados
                </p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>{suggestions.length}</strong> {suggestions.length === 1 ? 'item necesita' : 'items necesitan'} metadatos adicionales para mejor organización
                  </p>
                </div>

                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {suggestion.item.name || suggestion.item.debt_name || suggestion.item.investment_name || 'Item sin nombre'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Campos faltantes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.missingFields.map(field => (
                        <span
                          key={field}
                          className="inline-block px-2 py-1 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded text-xs text-gray-700 dark:text-gray-300"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {suggestions.length > 5 && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    Y {suggestions.length - 5} items más...
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
