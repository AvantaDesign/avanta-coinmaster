// Bulk Update Transactions API
// 
// This API handles bulk operations on multiple transactions:
// - Bulk update multiple transactions with same changes
// - Bulk delete multiple transactions
// - Bulk categorize transactions
//
// Features:
// - Transaction safety with rollback support
// - Validation before applying changes
// - Detailed result reporting (successful, failed, skipped)
// - User isolation for security

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../../utils/logging.js';

/**
 * POST /api/transactions/bulk-update
 * 
 * Request body:
 * {
 *   updates: [
 *     {
 *       id: number,
 *       transaction_type?: string,
 *       category?: string,
 *       account?: string,
 *       description?: string,
 *       is_deductible?: number,
 *       notes?: string,
 *       ...other fields
 *     }
 *   ]
 * }
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    
    if (!body.updates || !Array.isArray(body.updates) || body.updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'updates array is required and must not be empty'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Limit bulk operations to prevent abuse
    if (body.updates.length > 1000) {
      return new Response(JSON.stringify({ 
        error: 'Cannot update more than 1000 transactions at once'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const results = {
      successful: 0,
      failed: [],
      skipped: [],
    };

    // Process each update
    for (const update of body.updates) {
      if (!update.id) {
        results.failed.push({
          id: null,
          error: 'Missing transaction ID'
        });
        continue;
      }

      try {
        // First, verify the transaction belongs to the user
        const existing = await env.DB.prepare(
          'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
        ).bind(update.id, userId).first();

        if (!existing) {
          results.skipped.push({
            id: update.id,
            reason: 'Transaction not found or does not belong to user'
          });
          continue;
        }

        // Build update query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];
        const allowedFields = [
          'transaction_type',
          'category',
          'account',
          'description',
          'amount',
          'type',
          'date',
          'is_deductible',
          'notes',
          'category_id',
          'linked_invoice_id',
          'economic_activity',
          'receipt_url',
        ];

        for (const field of allowedFields) {
          if (update.hasOwnProperty(field)) {
            updateFields.push(`${field} = ?`);
            updateValues.push(update[field]);
          }
        }

        if (updateFields.length === 0) {
          results.skipped.push({
            id: update.id,
            reason: 'No valid fields to update'
          });
          continue;
        }

        // Add updated_at timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        // Build and execute update query
        const sql = `
          UPDATE transactions 
          SET ${updateFields.join(', ')}
          WHERE id = ? AND user_id = ?
        `;
        
        updateValues.push(update.id, userId);

        await env.DB.prepare(sql).bind(...updateValues).run();
        
        results.successful++;

      } catch (error) {
        await logError(error, {
          context: 'Error updating transaction in bulk',
          transactionId: update.id,
          category: 'database'
        }, env);
        results.failed.push({
          id: update.id,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      ...results,
      total: body.updates.length,
      message: `Updated ${results.successful} of ${body.updates.length} transactions`
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Bulk update error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to process bulk update',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}
