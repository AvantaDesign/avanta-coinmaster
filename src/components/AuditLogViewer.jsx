import { useState, useEffect } from 'react';
import { formatDate } from '../utils/calculations';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    severity: '',
    date_from: '',
    date_to: '',
  });
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const logsPerPage = 50;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        limit: logsPerPage,
        offset: (currentPage - 1) * logsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      });

      const response = await fetch(`/api/audit-log?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/audit-log/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      );

      const response = await fetch(`/api/audit-log/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || colors.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || colors.success;
  };

  const formatActionType = (actionType) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track all important actions for security and compliance
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Last 24 Hours</p>
            <p className="text-2xl font-bold text-blue-600">{stats.recent_24h}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Critical Events</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.by_severity?.critical || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">High Severity</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.by_severity?.high || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="create_transaction">Create Transaction</option>
              <option value="update_transaction">Update Transaction</option>
              <option value="delete_transaction">Delete Transaction</option>
              <option value="create_account">Create Account</option>
              <option value="update_account">Update Account</option>
              <option value="delete_account">Delete Account</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="transaction">Transaction</option>
              <option value="account">Account</option>
              <option value="receipt">Receipt</option>
              <option value="declaration">Declaration</option>
              <option value="fiscal">Fiscal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          onClick={() => {
            setFilters({
              action_type: '',
              entity_type: '',
              severity: '',
              date_from: '',
              date_to: '',
            });
            setCurrentPage(1);
          }}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear Filters
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatActionType(log.action_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.entity_type && (
                          <span>
                            {log.entity_type}
                            {log.entity_id && ` #${log.entity_id}`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.action_details && log.action_details !== '{}' && (
                          <button
                            onClick={() => alert(JSON.stringify(JSON.parse(log.action_details), null, 2))}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-900">
                      {formatActionType(log.action_type)}
                    </p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatDate(log.timestamp)}
                  </p>
                  {log.entity_type && (
                    <p className="text-sm text-gray-500">
                      Entity: {log.entity_type}
                      {log.entity_id && ` #${log.entity_id}`}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    {log.action_details && log.action_details !== '{}' && (
                      <button
                        onClick={() => alert(JSON.stringify(JSON.parse(log.action_details), null, 2))}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * logsPerPage + 1} to{' '}
                  {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
