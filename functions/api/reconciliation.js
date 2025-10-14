// Reconciliation API - Match transactions and find duplicates

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/reconciliation
 * Get reconciliation suggestions for transactions
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const toleranceDays = parseInt(url.searchParams.get('tolerance_days')) || 3;
  const toleranceAmount = parseFloat(url.searchParams.get('tolerance_amount')) || 0.01;
  const minConfidence = parseInt(url.searchParams.get('min_confidence')) || 70;
  const limit = parseInt(url.searchParams.get('limit')) || 1000;
  
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

    // Fetch recent transactions
    const transactions = await env.DB.prepare(
      `SELECT * FROM transactions 
       WHERE is_deleted = 0 
       ORDER BY date DESC 
       LIMIT ?`
    ).bind(limit).all();

    if (!transactions.results || transactions.results.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        duplicates: [],
        stats: {
          totalTransactions: 0,
          totalMatches: 0,
          totalDuplicates: 0
        }
      }), {
        headers: corsHeaders
      });
    }

    // Find transfer matches
    const matches = findTransferMatches(
      transactions.results, 
      toleranceDays, 
      toleranceAmount
    ).filter(m => m.confidence >= minConfidence);

    // Find duplicates
    const duplicates = findDuplicateTransactions(
      transactions.results, 
      24
    ).filter(d => d.duplicates[0].confidence >= minConfidence);

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.results.length,
      totalMatches: matches.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicates.length, 0),
      transferCount: transactions.results.filter(tx => tx.transaction_type === 'transfer').length,
      unmatchedCount: transactions.results.filter(
        tx => !tx.linked_transaction_id && tx.transaction_type !== 'transfer'
      ).length
    };

    return new Response(JSON.stringify({
      matches,
      duplicates,
      stats
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Reconciliation GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to perform reconciliation',
      message: error.message,
      code: 'RECONCILIATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/reconciliation
 * Apply reconciliation suggestions (mark as transfers, merge duplicates)
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const { action, transactionIds } = body;

    if (!action || !transactionIds || !Array.isArray(transactionIds)) {
      return new Response(JSON.stringify({
        error: 'Invalid request. Required: action, transactionIds (array)',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let result = {};

    if (action === 'mark_as_transfer') {
      // Mark transactions as transfers
      const placeholders = transactionIds.map(() => '?').join(',');
      await env.DB.prepare(
        `UPDATE transactions 
         SET transaction_type = 'transfer' 
         WHERE id IN (${placeholders})`
      ).bind(...transactionIds).run();
      
      result = { 
        success: true, 
        message: `Marked ${transactionIds.length} transactions as transfers`,
        updatedCount: transactionIds.length
      };

    } else if (action === 'delete_duplicates') {
      // Soft delete duplicate transactions
      const placeholders = transactionIds.map(() => '?').join(',');
      await env.DB.prepare(
        `UPDATE transactions 
         SET is_deleted = 1 
         WHERE id IN (${placeholders})`
      ).bind(...transactionIds).run();
      
      result = { 
        success: true, 
        message: `Deleted ${transactionIds.length} duplicate transactions`,
        deletedCount: transactionIds.length
      };

    } else if (action === 'link_transfers') {
      // Link two transactions as transfer pair
      if (transactionIds.length !== 2) {
        return new Response(JSON.stringify({
          error: 'link_transfers requires exactly 2 transaction IDs',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Mark both as transfers and link them
      await env.DB.prepare(
        `UPDATE transactions 
         SET transaction_type = 'transfer', 
             notes = COALESCE(notes || '\n', '') || 'Transferencia vinculada con ID: ' || ?
         WHERE id = ?`
      ).bind(transactionIds[1], transactionIds[0]).run();

      await env.DB.prepare(
        `UPDATE transactions 
         SET transaction_type = 'transfer',
             notes = COALESCE(notes || '\n', '') || 'Transferencia vinculada con ID: ' || ?
         WHERE id = ?`
      ).bind(transactionIds[0], transactionIds[1]).run();
      
      result = { 
        success: true, 
        message: 'Linked transactions as transfer pair',
        linkedIds: transactionIds
      };

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Allowed: mark_as_transfer, delete_duplicates, link_transfers',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(result), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Reconciliation POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to apply reconciliation',
      message: error.message,
      code: 'RECONCILIATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Helper functions

function findTransferMatches(transactions, toleranceDays, toleranceAmount) {
  const matches = [];
  const processed = new Set();

  transactions.forEach((tx1, idx1) => {
    if (processed.has(idx1)) return;

    transactions.forEach((tx2, idx2) => {
      if (idx1 >= idx2 || processed.has(idx2)) return;

      // Check if amounts match (within tolerance)
      const amountDiff = Math.abs(Math.abs(tx1.amount) - Math.abs(tx2.amount));
      const amountThreshold = Math.abs(tx1.amount) * toleranceAmount;
      
      if (amountDiff > amountThreshold) return;

      // Check if dates are close
      const date1 = new Date(tx1.date);
      const date2 = new Date(tx2.date);
      const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > toleranceDays) return;

      // Check if they're from different accounts
      if (tx1.account === tx2.account) return;

      // Check if one is income and other is expense
      const isTransfer = (tx1.type === 'ingreso' && tx2.type === 'gasto') ||
                        (tx1.type === 'gasto' && tx2.type === 'ingreso');

      if (!isTransfer) return;

      // Calculate confidence
      const confidence = calculateMatchConfidence(tx1, tx2, amountDiff, daysDiff, toleranceDays, toleranceAmount);

      matches.push({
        tx1: { id: tx1.id, date: tx1.date, description: tx1.description, amount: tx1.amount, account: tx1.account },
        tx2: { id: tx2.id, date: tx2.date, description: tx2.description, amount: tx2.amount, account: tx2.account },
        amountDiff,
        daysDiff,
        confidence,
        type: 'transfer'
      });

      processed.add(idx1);
      processed.add(idx2);
    });
  });

  return matches.sort((a, b) => b.confidence - a.confidence);
}

function findDuplicateTransactions(transactions, toleranceHours) {
  const duplicates = [];
  const processed = new Set();

  transactions.forEach((tx1, idx1) => {
    if (processed.has(idx1)) return;

    const potentialDuplicates = [];

    transactions.forEach((tx2, idx2) => {
      if (idx1 >= idx2 || processed.has(idx2)) return;

      // Check if amounts are exactly the same
      if (Math.abs(tx1.amount) !== Math.abs(tx2.amount)) return;

      // Check if types are the same
      if (tx1.type !== tx2.type) return;

      // Check if dates are very close
      const date1 = new Date(tx1.date);
      const date2 = new Date(tx2.date);
      const hoursDiff = Math.abs((date2 - date1) / (1000 * 60 * 60));
      
      if (hoursDiff > toleranceHours) return;

      // Check description similarity
      const similarity = calculateStringSimilarity(tx1.description, tx2.description);
      
      if (similarity < 0.7) return;

      const confidence = calculateDuplicateConfidence(tx1, tx2, similarity, hoursDiff, toleranceHours);

      potentialDuplicates.push({
        tx: { id: tx2.id, date: tx2.date, description: tx2.description, amount: tx2.amount, account: tx2.account },
        similarity,
        hoursDiff,
        confidence
      });
    });

    if (potentialDuplicates.length > 0) {
      duplicates.push({
        original: { id: tx1.id, date: tx1.date, description: tx1.description, amount: tx1.amount, account: tx1.account },
        duplicates: potentialDuplicates.sort((a, b) => b.confidence - a.confidence)
      });
      
      processed.add(idx1);
      potentialDuplicates.forEach(dup => processed.add(dup.tx.id));
    }
  });

  return duplicates.sort((a, b) => b.duplicates[0].confidence - a.duplicates[0].confidence);
}

function calculateMatchConfidence(tx1, tx2, amountDiff, daysDiff, toleranceDays, toleranceAmount) {
  let confidence = 100;

  const maxAmountDiff = Math.abs(tx1.amount) * toleranceAmount;
  if (maxAmountDiff > 0) {
    confidence -= (amountDiff / maxAmountDiff) * 20;
  }

  if (toleranceDays > 0) {
    confidence -= (daysDiff / toleranceDays) * 20;
  }

  const similarity = calculateStringSimilarity(tx1.description, tx2.description);
  confidence += similarity * 10;

  if (tx1.transaction_type === 'transfer' && tx2.transaction_type === 'transfer') {
    confidence += 10;
  }

  return Math.min(100, Math.max(0, confidence));
}

function calculateDuplicateConfidence(tx1, tx2, similarity, hoursDiff, toleranceHours) {
  let confidence = 50;
  confidence += similarity * 40;

  if (toleranceHours > 0) {
    confidence += (1 - (hoursDiff / toleranceHours)) * 10;
  }

  if (tx1.account === tx2.account) {
    confidence += 20;
  }

  return Math.min(100, Math.max(0, confidence));
}

function calculateStringSimilarity(str1, str2) {
  const s1 = (str1 || '').toLowerCase();
  const s2 = (str2 || '').toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return 1 - (distance / maxLength);
}
