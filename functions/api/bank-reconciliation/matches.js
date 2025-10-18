// Bank Reconciliation Matches API - Manage reconciliation matches and suggestions

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/bank-reconciliation/matches
 * Get reconciliation matches with optional filtering
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const status = url.searchParams.get('status');
  const matchType = url.searchParams.get('match_type');
  const minConfidence = parseFloat(url.searchParams.get('min_confidence')) || 0;
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  const offset = (page - 1) * limit;

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database connection not available'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'user_id is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Build query with filters
    let query = `
      SELECT 
        rm.*,
        bs.transaction_date as bank_date,
        bs.description as bank_description,
        bs.amount as bank_amount,
        bs.bank_name,
        bs.account_number,
        t.date as transaction_date,
        t.description as transaction_description,
        t.amount as transaction_amount,
        t.type as transaction_type
      FROM reconciliation_matches rm
      JOIN bank_statements bs ON rm.bank_statement_id = bs.id
      JOIN transactions t ON rm.transaction_id = t.id
      WHERE rm.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND rm.status = ?';
      params.push(status);
    }

    if (matchType) {
      query += ' AND rm.match_type = ?';
      params.push(matchType);
    }

    if (minConfidence > 0) {
      query += ' AND rm.match_confidence >= ?';
      params.push(minConfidence);
    }

    query += ' ORDER BY rm.match_confidence DESC, rm.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM reconciliation_matches WHERE user_id = ?';
    const countParams = [userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (matchType) {
      countQuery += ' AND match_type = ?';
      countParams.push(matchType);
    }
    if (minConfidence > 0) {
      countQuery += ' AND match_confidence >= ?';
      countParams.push(minConfidence);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return new Response(JSON.stringify({
      matches: result.results || [],
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch matches',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/bank-reconciliation/matches
 * Create a manual match between bank statement and transaction
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database connection not available'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { userId, bankStatementId, transactionId, notes } = data;

    if (!userId || !bankStatementId || !transactionId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, bankStatementId, transactionId'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get bank statement and transaction details
    const statement = await env.DB.prepare('SELECT * FROM bank_statements WHERE id = ? AND user_id = ?')
      .bind(bankStatementId, userId).first();
    
    const transaction = await env.DB.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .bind(transactionId, userId).first();

    if (!statement || !transaction) {
      return new Response(JSON.stringify({
        error: 'Bank statement or transaction not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Calculate match metrics
    const statementDate = new Date(statement.transaction_date);
    const transactionDate = new Date(transaction.date);
    const dateDiff = Math.abs((statementDate - transactionDate) / (1000 * 60 * 60 * 24));
    const amountDiff = Math.abs(Math.abs(statement.amount) - Math.abs(transaction.amount));

    // Insert manual match
    const result = await env.DB.prepare(`
      INSERT INTO reconciliation_matches (
        user_id, bank_statement_id, transaction_id,
        match_type, match_confidence, match_criteria,
        amount_difference, date_difference,
        status, notes
      ) VALUES (?, ?, ?, 'manual', 1.0, ?, ?, ?, 'verified', ?)
    `).bind(
      userId,
      bankStatementId,
      transactionId,
      JSON.stringify({ manual: true }),
      amountDiff,
      Math.round(dateDiff),
      notes || null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      matchId: result.meta.last_row_id,
      message: 'Manual match created successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error creating manual match:', error);
    
    // Check for unique constraint violation
    if (error.message.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({
        error: 'Match already exists for this bank statement and transaction'
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Failed to create manual match',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    headers: corsHeaders
  });
}
