// Bank Reconciliation Summary API - Provide reconciliation statistics and summaries

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/bank-reconciliation/summary
 * Get reconciliation summary and statistics
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

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

    // Build date filters
    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = ' AND transaction_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get bank statements summary
    const statementsQuery = `
      SELECT 
        COUNT(*) as total_statements,
        SUM(CASE WHEN reconciliation_status = 'matched' THEN 1 ELSE 0 END) as matched_count,
        SUM(CASE WHEN reconciliation_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN reconciliation_status = 'unmatched' THEN 1 ELSE 0 END) as unmatched_count,
        SUM(CASE WHEN reconciliation_status = 'ignored' THEN 1 ELSE 0 END) as ignored_count,
        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type IN ('withdrawal', 'fee') THEN ABS(amount) ELSE 0 END) as total_withdrawals
      FROM bank_statements 
      WHERE user_id = ?${dateFilter}
    `;
    
    const statementsSummary = await env.DB.prepare(statementsQuery).bind(...params).first();

    // Get matches summary
    const matchesQuery = `
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_matches,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_matches,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_matches,
        SUM(CASE WHEN match_type = 'automatic' THEN 1 ELSE 0 END) as automatic_matches,
        SUM(CASE WHEN match_type = 'manual' THEN 1 ELSE 0 END) as manual_matches,
        AVG(match_confidence) as avg_confidence
      FROM reconciliation_matches rm
      JOIN bank_statements bs ON rm.bank_statement_id = bs.id
      WHERE rm.user_id = ?${dateFilter}
    `;
    
    const matchesSummary = await env.DB.prepare(matchesQuery).bind(...params).first();

    // Get unmatched bank statements
    const unmatchedStatementsQuery = `
      SELECT * FROM bank_statements 
      WHERE user_id = ? 
      AND reconciliation_status = 'unmatched'${dateFilter}
      ORDER BY transaction_date DESC
      LIMIT 10
    `;
    
    const unmatchedStatements = await env.DB.prepare(unmatchedStatementsQuery).bind(...params).all();

    // Get unmatched transactions
    const unmatchedTransactionsQuery = `
      SELECT t.* FROM transactions t
      LEFT JOIN reconciliation_matches rm ON t.id = rm.transaction_id AND rm.status IN ('verified', 'reviewed')
      WHERE t.user_id = ? 
      AND t.is_deleted = 0
      AND rm.id IS NULL
      ${startDate && endDate ? 'AND t.date BETWEEN ? AND ?' : ''}
      ORDER BY t.date DESC
      LIMIT 10
    `;
    
    const unmatchedTransactions = await env.DB.prepare(unmatchedTransactionsQuery).bind(...params).all();

    // Get reconciliation by period
    const byPeriodQuery = `
      SELECT 
        strftime('%Y-%m', transaction_date) as period,
        COUNT(*) as total_statements,
        SUM(CASE WHEN reconciliation_status IN ('matched', 'verified') THEN 1 ELSE 0 END) as matched_count,
        SUM(CASE WHEN reconciliation_status = 'unmatched' THEN 1 ELSE 0 END) as unmatched_count,
        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type IN ('withdrawal', 'fee') THEN ABS(amount) ELSE 0 END) as total_withdrawals
      FROM bank_statements 
      WHERE user_id = ?${dateFilter}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `;
    
    const byPeriod = await env.DB.prepare(byPeriodQuery).bind(...params).all();

    // Calculate reconciliation rate
    const totalStatements = statementsSummary?.total_statements || 0;
    const reconciledCount = (statementsSummary?.matched_count || 0) + (statementsSummary?.verified_count || 0);
    const reconciliationRate = totalStatements > 0 ? (reconciledCount / totalStatements) * 100 : 0;

    return new Response(JSON.stringify({
      summary: {
        totalStatements: totalStatements,
        matchedCount: statementsSummary?.matched_count || 0,
        verifiedCount: statementsSummary?.verified_count || 0,
        unmatchedCount: statementsSummary?.unmatched_count || 0,
        ignoredCount: statementsSummary?.ignored_count || 0,
        reconciliationRate: Math.round(reconciliationRate * 100) / 100,
        totalDeposits: statementsSummary?.total_deposits || 0,
        totalWithdrawals: statementsSummary?.total_withdrawals || 0
      },
      matches: {
        totalMatches: matchesSummary?.total_matches || 0,
        verifiedMatches: matchesSummary?.verified_matches || 0,
        pendingMatches: matchesSummary?.pending_matches || 0,
        rejectedMatches: matchesSummary?.rejected_matches || 0,
        automaticMatches: matchesSummary?.automatic_matches || 0,
        manualMatches: matchesSummary?.manual_matches || 0,
        avgConfidence: matchesSummary?.avg_confidence || 0
      },
      unmatchedStatements: unmatchedStatements.results || [],
      unmatchedTransactions: unmatchedTransactions.results || [],
      byPeriod: byPeriod.results || []
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching reconciliation summary:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch reconciliation summary',
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
