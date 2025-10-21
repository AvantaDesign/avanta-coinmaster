/**
 * Monitoring Dashboard - Admin Only
 * Phase 42: Structured Logging & Monitoring System
 * 
 * Provides real-time system monitoring including:
 * - Error logs with filtering
 * - System metrics and statistics
 * - Health check status
 * - Performance metrics
 */

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  ServerIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_BASE = '/api';

export default function Monitoring() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    level: '',
    startDate: '',
    endDate: '',
    limit: 50
  });

  const [activeTab, setActiveTab] = useState('logs'); // logs, metrics, health

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filters, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'logs') {
        await loadLogs();
      } else if (activeTab === 'metrics') {
        await loadMetrics();
      } else if (activeTab === 'health') {
        await loadHealth();
      }
    } catch (err) {
      console.error('Error loading monitoring data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('limit', filters.limit);

    const response = await fetch(`${API_BASE}/monitoring/logs?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load logs');
    }

    const data = await response.json();
    setLogs(data.logs || []);
  };

  const loadMetrics = async () => {
    const response = await fetch(`${API_BASE}/monitoring/metrics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load metrics');
    }

    const data = await response.json();
    setMetrics(data);
  };

  const loadHealth = async () => {
    const response = await fetch(`${API_BASE}/monitoring/health`);
    
    if (!response.ok) {
      throw new Error('Failed to load health status');
    }

    const data = await response.json();
    setHealth(data);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getLevelBadgeColor = (level) => {
    const colors = {
      debug: 'bg-gray-100 text-gray-800',
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-600 text-white'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor system logs, metrics, and health status
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'logs', name: 'Error Logs', icon: ExclamationTriangleIcon },
            { id: 'metrics', name: 'System Metrics', icon: ChartBarIcon },
            { id: 'health', name: 'Health Status', icon: ServerIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
              </div>
              <button
                onClick={loadData}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(log.level)}`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.message}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.stack && (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-700">
                                View Stack
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Loading metrics...
            </div>
          ) : metrics ? (
            <>
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {metrics.system?.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {metrics.system?.totalTransactions || 0}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500">Environment</h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {metrics.system?.environment || 'unknown'}
                  </p>
                </div>
              </div>

              {/* Error Metrics */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Errors (Last 24 Hours)
                </h3>
                {metrics.errors?.last24Hours?.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.errors.last24Hours.map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(stat.level)}`}>
                          {stat.level}
                        </span>
                        <span className="text-sm text-gray-900">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No errors in the last 24 hours</p>
                )}
              </div>

              {/* Database Metrics */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Database Table Sizes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {metrics.database?.tableSizes && Object.entries(metrics.database.tableSizes).map(([table, count]) => (
                    <div key={table} className="flex justify-between">
                      <span className="text-sm text-gray-600">{table}:</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No metrics available
            </div>
          )}
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Checking health status...
            </div>
          ) : health ? (
            <>
              {/* Overall Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Last checked: {new Date(health.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className={`
                    px-4 py-2 rounded-full text-sm font-semibold
                    ${health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {health.status.toUpperCase()}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Response Time: </span>
                  <span className="text-sm font-medium text-gray-900">{health.responseTime}ms</span>
                </div>
              </div>

              {/* Component Checks */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Component Health</h3>
                <div className="space-y-3">
                  {health.checks && Object.entries(health.checks).map(([component, check]) => (
                    <div key={component} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className={`
                          w-3 h-3 rounded-full mr-3
                          ${check.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}
                        `} />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {component}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {check.responseTime && `${check.responseTime}ms`}
                        {check.error && (
                          <span className="text-red-600 ml-2">{check.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No health data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
