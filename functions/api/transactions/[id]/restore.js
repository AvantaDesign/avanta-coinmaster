// Transactions Restore API - Restore soft-deleted transactions
// POST /api/transactions/:id/restore

/**
 * POST /api/transactions/:id/restore
 * Restore a soft-deleted transaction
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  // Path is: api / transactions / :id / restore
  const id = pathParts[pathParts.length - 2];
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Validate ID
    if (!id || !/^\d+$/.test(id)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid transaction ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if transaction exists
    const existingTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    ).bind(id).first();

    if (!existingTransaction) {
      return new Response(JSON.stringify({ 
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Check if transaction is actually deleted
    if (!existingTransaction.is_deleted) {
      return new Response(JSON.stringify({ 
        error: 'Transaction is not deleted',
        code: 'NOT_DELETED',
        message: 'This transaction has not been deleted and does not need restoration'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Restore the transaction by setting is_deleted = 0
    await env.DB.prepare('UPDATE transactions SET is_deleted = 0 WHERE id = ?').bind(id).run();
    
    // Fetch the restored transaction
    const restoredTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    ).bind(id).first();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Transaction restored successfully',
      data: restoredTransaction
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Transactions RESTORE Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS /api/transactions/:id/restore
 * Handle CORS preflight requests
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}
