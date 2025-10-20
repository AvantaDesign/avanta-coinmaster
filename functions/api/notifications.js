// Notifications API - Manage user notifications and reminders
// Phase 5: In-App Financial Activities and Workflows

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logRequest, logError } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(context) {
  return new Response(null, { headers: getSecurityHeaders() });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Authenticate user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: getSecurityHeaders()
      });
    }

    // Log request
    logRequest(request, { endpoint: 'notifications', method: 'GET' }, env);

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Get specific notification
    if (id) {
      const notification = await env.DB.prepare(
        'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();

      if (!notification) {
        return new Response(JSON.stringify({ 
          error: 'Notification not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: getSecurityHeaders()
        });
      }

      return new Response(JSON.stringify(notification), {
        status: 200,
        headers: getSecurityHeaders()
      });
    }

    // Build query for listing notifications
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ? AND is_dismissed = 0
    `;
    const params = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (unreadOnly) {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results: notifications } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    // Get unread count
    const unreadCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0 AND is_dismissed = 0'
    ).bind(userId).first();

    return new Response(JSON.stringify({
      notifications,
      unreadCount: unreadCount.count || 0
    }), {
      status: 200,
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch notifications',
      code: 'FETCH_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }

    const data = await request.json();
    const userId = 1; // In production, get from auth token

    // Validate required fields
    if (!data.type || !data.title || !data.message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: type, title, message',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Validate type
    const validTypes = ['payment_reminder', 'tax_deadline', 'financial_task', 'system_alert', 'low_cash_flow', 'budget_overrun'];
    if (!validTypes.includes(data.type)) {
      return new Response(JSON.stringify({ 
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Validate priority
    const priority = data.priority || 'medium';
    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      return new Response(JSON.stringify({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Insert notification
    const result = await env.DB.prepare(`
      INSERT INTO notifications (
        user_id, type, priority, title, message, 
        related_type, related_id, snoozed_until
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.type,
      priority,
      data.title,
      data.message,
      data.related_type || null,
      data.related_id || null,
      data.snoozed_until || null
    ).run();

    // Fetch the created notification
    const notification = await env.DB.prepare(
      'SELECT * FROM notifications WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(notification), {
      status: 201,
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create notification',
      code: 'CREATE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    const userId = 1; // In production, get from auth token

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Notification ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Check if notification exists
    const existing = await env.DB.prepare(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Notification not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: getSecurityHeaders()
      });
    }

    // Handle different actions
    if (action === 'mark-read') {
      await env.DB.prepare(`
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `).bind(id, userId).run();
    } else if (action === 'dismiss') {
      await env.DB.prepare(`
        UPDATE notifications 
        SET is_dismissed = 1, dismissed_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `).bind(id, userId).run();
    } else if (action === 'snooze') {
      const data = await request.json();
      const snoozedUntil = data.snoozed_until;
      
      if (!snoozedUntil) {
        return new Response(JSON.stringify({ 
          error: 'snoozed_until is required for snooze action',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: getSecurityHeaders()
        });
      }

      await env.DB.prepare(`
        UPDATE notifications 
        SET snoozed_until = ?, is_read = 0 
        WHERE id = ? AND user_id = ?
      `).bind(snoozedUntil, id, userId).run();
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid action. Must be one of: mark-read, dismiss, snooze',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Fetch updated notification
    const updated = await env.DB.prepare(
      'SELECT * FROM notifications WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update notification',
      code: 'UPDATE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = 1; // In production, get from auth token

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Notification ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: getSecurityHeaders()
      });
    }

    // Check if notification exists
    const existing = await env.DB.prepare(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Notification not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: getSecurityHeaders()
      });
    }

    // Delete notification
    await env.DB.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notification deleted successfully'
    }), {
      status: 200,
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete notification',
      code: 'DELETE_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}
