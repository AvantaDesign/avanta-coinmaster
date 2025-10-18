import { useState, useEffect } from 'react';
import { getAuditTrail } from '../utils/auditService';
import { formatDate } from '../utils/calculations';

/**
 * AuditTrail Component
 * 
 * Shows the complete audit trail for a specific entity (transaction, account, etc.)
 * Displays changes in a timeline format with before/after comparison
 */
export default function AuditTrail({ entityType, entityId }) {
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (entityType && entityId) {
      loadAuditTrail();
    }
  }, [entityType, entityId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      const data = await getAuditTrail(entityType, entityId);
      setTrail(data);
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActionType = (actionType) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const parseDetails = (detailsJson) => {
    try {
      return JSON.parse(detailsJson);
    } catch {
      return {};
    }
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };
    return icons[severity] || '⚪';
  };

  const renderChangeDetails = (details) => {
    if (!details.changes) return null;

    return (
      <div className="mt-3 space-y-2">
        {Object.entries(details.changes).map(([field, change]) => (
          <div key={field} className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Changed: {field}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Before:</p>
                <p className="text-gray-900 font-mono">
                  {JSON.stringify(change.old)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">After:</p>
                <p className="text-gray-900 font-mono">
                  {JSON.stringify(change.new)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!entityType || !entityId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        No entity specified for audit trail
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  if (trail.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500">No audit trail available for this entity</p>
        <p className="text-sm text-gray-400 mt-1">
          {entityType} #{entityId}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete history for {entityType} #{entityId}
        </p>
      </div>

      <div className="p-6">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Timeline items */}
          <div className="space-y-6">
            {trail.map((entry, index) => {
              const details = parseDetails(entry.action_details);
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="relative flex">
                  {/* Icon */}
                  <div className="absolute left-0 flex items-center justify-center w-12 h-12">
                    <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xl">
                      {getSeverityIcon(entry.severity)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-16 flex-1">
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {formatActionType(entry.action_type)}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${entry.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              entry.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              entry.severity === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {entry.severity}
                          </span>
                          {details.changes && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {isExpanded ? 'Hide' : 'Show'} Details
                            </button>
                          )}
                        </div>
                      </div>

                      {/* User info */}
                      {entry.user_id && (
                        <p className="text-xs text-gray-500 mt-2">
                          User ID: {entry.user_id}
                        </p>
                      )}

                      {/* IP and User Agent */}
                      {(entry.ip_address || entry.user_agent) && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {entry.ip_address && <p>IP: {entry.ip_address}</p>}
                          {entry.user_agent && (
                            <p className="truncate">
                              User Agent: {entry.user_agent}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Expanded details */}
                      {isExpanded && renderChangeDetails(details)}

                      {/* Other details */}
                      {isExpanded && Object.keys(details).length > 0 && !details.changes && (
                        <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                          <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total events: <span className="font-medium text-gray-900">{trail.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
