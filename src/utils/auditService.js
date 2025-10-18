/**
 * Audit Service
 * 
 * Provides utilities for logging user actions for security and compliance.
 * All audit logs are stored centrally and can be queried for analysis.
 */

import { v4 as uuidv4 } from 'crypto';

/**
 * Generate a unique ID for audit log entries
 */
function generateAuditId() {
  // Use timestamp + random string for unique ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `audit_${timestamp}_${random}`;
}

/**
 * Get client information from the browser
 */
function getClientInfo() {
  return {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main logging function - creates an audit log entry
 * 
 * @param {string} userId - User ID performing the action
 * @param {string} actionType - Type of action (e.g., 'create_transaction')
 * @param {string} entityType - Type of entity affected (e.g., 'transaction')
 * @param {string} entityId - ID of the affected entity
 * @param {object} details - Additional details about the action
 * @param {string} severity - Severity level (low, medium, high, critical)
 * @returns {Promise<object>} - The created audit log entry
 */
export async function logAction(userId, actionType, entityType, entityId, details = {}, severity = 'low') {
  const clientInfo = getClientInfo();
  
  const auditEntry = {
    id: generateAuditId(),
    user_id: userId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    action_details: JSON.stringify(details),
    user_agent: clientInfo.userAgent,
    timestamp: clientInfo.timestamp,
    severity: severity,
    status: 'success',
  };

  try {
    const response = await fetch('/api/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(auditEntry),
    });

    if (!response.ok) {
      console.error('Failed to create audit log:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
}

/**
 * Log security-specific events
 * 
 * @param {string} userId - User ID
 * @param {string} eventType - Type of security event
 * @param {object} details - Event details
 */
export async function logSecurityEvent(userId, eventType, details = {}) {
  return logAction(
    userId,
    `security_${eventType}`,
    'security',
    null,
    details,
    'high'
  );
}

/**
 * Log data change events with before/after comparison
 * 
 * @param {string} userId - User ID
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @param {object} oldData - Previous data
 * @param {object} newData - New data
 */
export async function logDataChange(userId, entityType, entityId, oldData, newData) {
  const changes = {};
  
  // Identify changed fields
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  return logAction(
    userId,
    `update_${entityType}`,
    entityType,
    entityId,
    { changes },
    'medium'
  );
}

/**
 * Log system-level events
 * 
 * @param {string} eventType - Type of system event
 * @param {object} details - Event details
 */
export async function logSystemEvent(eventType, details = {}) {
  return logAction(
    'system',
    `system_${eventType}`,
    'system',
    null,
    details,
    'medium'
  );
}

/**
 * Get complete audit trail for a specific entity
 * 
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<Array>} - Array of audit log entries
 */
export async function getAuditTrail(entityType, entityId) {
  try {
    const response = await fetch(
      `/api/audit-log?entity_type=${entityType}&entity_id=${entityId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch audit trail');
    }

    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return [];
  }
}

/**
 * Get audit statistics
 * 
 * @returns {Promise<object>} - Audit statistics
 */
export async function getAuditStats() {
  try {
    const response = await fetch('/api/audit-log/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return null;
  }
}

/**
 * Export audit logs to CSV
 * 
 * @param {object} filters - Filters to apply
 * @returns {Promise<Blob>} - CSV file as blob
 */
export async function exportAuditLogs(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/audit-log/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return null;
  }
}
