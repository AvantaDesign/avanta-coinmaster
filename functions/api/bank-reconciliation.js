// Bank Reconciliation API - Manage bank statements and reconciliation
// Phase 30: Monetary values stored as INTEGER cents in database
// Handles upload, parsing, matching, and reconciliation management

import { 
  toCents, 
  fromCents,
  convertArrayFromCents, 
  convertObjectFromCents,
  MONETARY_FIELDS 
} from '../utils/monetary.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to parse CSV data
function parseCSV(csvText, format = 'generic') {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Map values to transaction object based on format
    const transaction = parseTransactionFromFormat(headers, values, format);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return transactions;
}

// Parse transaction based on bank format
function parseTransactionFromFormat(headers, values, format) {
  const row = {};
  headers.forEach((header, index) => {
    row[header.toLowerCase()] = values[index] ? values[index].replace(/"/g, '') : '';
  });

  // Generic format mapping
  let transaction = {
    transaction_date: findValue(row, ['fecha', 'date', 'transaction_date', 'fecha operacion']),
    description: findValue(row, ['descripcion', 'description', 'concepto', 'detalle']),
    amount: parseAmount(findValue(row, ['monto', 'amount', 'importe', 'cargo', 'abono'])),
    balance: parseAmount(findValue(row, ['saldo', 'balance'])),
    reference_number: findValue(row, ['referencia', 'reference', 'folio', 'numero']),
  };

  // Determine transaction type from amount or separate columns
  const deposit = parseAmount(findValue(row, ['deposito', 'deposit', 'abono', 'credito']));
  const withdrawal = parseAmount(findValue(row, ['retiro', 'withdrawal', 'cargo', 'debito']));

  if (deposit && deposit > 0) {
    transaction.amount = deposit;
    transaction.transaction_type = 'deposit';
  } else if (withdrawal && withdrawal > 0) {
    transaction.amount = -Math.abs(withdrawal);
    transaction.transaction_type = 'withdrawal';
  } else if (transaction.amount > 0) {
    transaction.transaction_type = 'deposit';
  } else if (transaction.amount < 0) {
    transaction.transaction_type = 'withdrawal';
  }

  // Validate required fields
  if (!transaction.transaction_date || !transaction.description || transaction.amount === null) {
    return null;
  }

  return transaction;
}

// Find value from multiple possible field names
function findValue(obj, possibleKeys) {
  for (const key of possibleKeys) {
    if (obj[key] !== undefined && obj[key] !== '') {
      return obj[key];
    }
  }
  return '';
}

// Parse amount from string (handles various formats)
function parseAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  
  // Remove currency symbols and whitespace
  let cleaned = String(value).replace(/[$,\s]/g, '');
  
  // Handle parentheses as negative (accounting format)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Calculate similarity between two strings (simple Levenshtein-based)
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Auto-match bank statements with transactions
async function autoMatchTransactions(env, userId, bankStatementId = null) {
  const matches = [];
  
  // Get unmatched bank statements
  let bankStatementsQuery = `
    SELECT * FROM bank_statements 
    WHERE user_id = ? AND reconciliation_status = 'unmatched'
  `;
  const params = [userId];
  
  if (bankStatementId) {
    bankStatementsQuery += ' AND id = ?';
    params.push(bankStatementId);
  }
  
  const bankStatements = await env.DB.prepare(bankStatementsQuery).bind(...params).all();
  
  if (!bankStatements.results || bankStatements.results.length === 0) {
    return matches;
  }
  
  // Get unmatched transactions (within reasonable date range)
  const transactions = await env.DB.prepare(`
    SELECT t.* FROM transactions t
    LEFT JOIN reconciliation_matches rm ON t.id = rm.transaction_id AND rm.status IN ('verified', 'reviewed')
    WHERE t.user_id = ? 
    AND t.is_deleted = 0
    AND rm.id IS NULL
    ORDER BY t.date DESC
  `).bind(userId).all();
  
  if (!transactions.results || transactions.results.length === 0) {
    return matches;
  }
  
  // Match logic
  for (const statement of bankStatements.results) {
    const statementDate = new Date(statement.transaction_date);
    // Phase 30: amounts are stored as cents, compare directly
    const statementAmount = Math.abs(statement.amount);
    
    for (const transaction of transactions.results) {
      const transactionDate = new Date(transaction.date);
      // Phase 30: amounts are stored as cents, compare directly
      const transactionAmount = Math.abs(transaction.amount);
      
      // Calculate date difference in days
      const dateDiff = Math.abs((statementDate - transactionDate) / (1000 * 60 * 60 * 24));
      
      // Calculate amount difference (both in cents)
      const amountDiff = Math.abs(statementAmount - transactionAmount);
      const amountDiffPercent = amountDiff / Math.max(statementAmount, transactionAmount);
      
      // Calculate description similarity
      const descSimilarity = calculateSimilarity(statement.description, transaction.description);
      
      // Scoring criteria
      let confidence = 0;
      const criteria = {};
      
      // Exact amount match (high weight) - Phase 30: comparing cents, so < 1 cent is exact
      if (amountDiff < 1) {
        confidence += 0.5;
        criteria.amount = 'exact';
      } else if (amountDiffPercent < 0.01) {
        confidence += 0.4;
        criteria.amount = 'close';
      } else if (amountDiffPercent < 0.05) {
        confidence += 0.2;
        criteria.amount = 'similar';
      }
      
      // Date proximity (medium weight)
      if (dateDiff === 0) {
        confidence += 0.3;
        criteria.date = 'exact';
      } else if (dateDiff <= 2) {
        confidence += 0.2;
        criteria.date = 'close';
      } else if (dateDiff <= 5) {
        confidence += 0.1;
        criteria.date = 'similar';
      }
      
      // Description similarity (low weight)
      if (descSimilarity > 0.8) {
        confidence += 0.2;
        criteria.description = descSimilarity;
      } else if (descSimilarity > 0.5) {
        confidence += 0.1;
        criteria.description = descSimilarity;
      }
      
      // Only consider matches with reasonable confidence
      if (confidence >= 0.5) {
        matches.push({
          bank_statement_id: statement.id,
          transaction_id: transaction.id,
          match_confidence: confidence,
          match_criteria: JSON.stringify(criteria),
          amount_difference: amountDiff,
          date_difference: Math.round(dateDiff),
          description_similarity: descSimilarity,
          match_type: confidence >= 0.85 ? 'automatic' : 'suggested',
          status: confidence >= 0.85 ? 'verified' : 'pending'
        });
      }
    }
  }
  
  // Sort by confidence (highest first)
  matches.sort((a, b) => b.match_confidence - a.match_confidence);
  
  return matches;
}

/**
 * GET /api/bank-reconciliation
 * List bank statements with optional filtering
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const status = url.searchParams.get('status');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const bankName = url.searchParams.get('bank_name');
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
    let query = 'SELECT * FROM bank_statements WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND reconciliation_status = ?';
      params.push(status);
    }

    if (startDate) {
      query += ' AND transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    if (bankName) {
      query += ' AND bank_name = ?';
      params.push(bankName);
    }

    query += ' ORDER BY transaction_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();

    // Phase 30: Convert monetary fields from cents to decimal
    const BANK_STATEMENT_FIELDS = ['amount', 'balance'];
    const convertedStatements = convertArrayFromCents(result.results || [], BANK_STATEMENT_FIELDS);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM bank_statements WHERE user_id = ?';
    const countParams = [userId];
    
    if (status) {
      countQuery += ' AND reconciliation_status = ?';
      countParams.push(status);
    }
    if (startDate) {
      countQuery += ' AND transaction_date >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND transaction_date <= ?';
      countParams.push(endDate);
    }
    if (bankName) {
      countQuery += ' AND bank_name = ?';
      countParams.push(bankName);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return new Response(JSON.stringify({
      statements: convertedStatements,
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
    console.error('Error fetching bank statements:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch bank statements',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/bank-reconciliation
 * Upload and parse bank statement file
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
    const { userId, bankName, accountNumber, csvData, format = 'generic' } = data;

    if (!userId || !bankName || !accountNumber || !csvData) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: userId, bankName, accountNumber, csvData'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse CSV data
    const transactions = parseCSV(csvData, format);

    if (transactions.length === 0) {
      return new Response(JSON.stringify({
        error: 'No valid transactions found in CSV'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate import batch ID
    const importBatchId = `BATCH_${Date.now()}_${userId}`;

    // Insert bank statements
    const insertedStatements = [];
    for (const transaction of transactions) {
      // Phase 30: Convert monetary values to cents before storing
      const amountInCents = toCents(transaction.amount);
      const balanceInCents = transaction.balance !== null ? toCents(transaction.balance) : null;

      const result = await env.DB.prepare(`
        INSERT INTO bank_statements (
          user_id, bank_name, account_number,
          statement_date, transaction_date, description,
          amount, balance, reference_number, transaction_type,
          import_batch_id, reconciliation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unmatched')
      `).bind(
        userId,
        bankName,
        accountNumber,
        transaction.transaction_date,
        transaction.transaction_date,
        transaction.description,
        amountInCents,     // stored as cents
        balanceInCents,    // stored as cents
        transaction.reference_number || null,
        transaction.transaction_type || 'withdrawal',
        importBatchId
      ).run();

      insertedStatements.push({
        id: result.meta.last_row_id,
        ...transaction
      });
    }

    // Run auto-matching
    const matches = await autoMatchTransactions(env, userId);

    // Insert matches
    let matchesInserted = 0;
    for (const match of matches) {
      try {
        await env.DB.prepare(`
          INSERT INTO reconciliation_matches (
            user_id, bank_statement_id, transaction_id,
            match_type, match_confidence, match_criteria,
            amount_difference, date_difference, description_similarity,
            status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          match.bank_statement_id,
          match.transaction_id,
          match.match_type,
          match.match_confidence,
          match.match_criteria,
          match.amount_difference,
          match.date_difference,
          match.description_similarity,
          match.status
        ).run();
        matchesInserted++;
      } catch (err) {
        // Skip duplicates
        if (!err.message.includes('UNIQUE constraint')) {
          console.error('Error inserting match:', err);
        }
      }
    }

    // Phase 30: Convert monetary fields from cents to decimal for response
    // Note: insertedStatements already has decimal values from transaction object,
    // but we should ensure consistency with what's stored in DB
    const BANK_STATEMENT_FIELDS = ['amount', 'balance'];
    
    return new Response(JSON.stringify({
      success: true,
      importBatchId,
      statementsImported: insertedStatements.length,
      matchesFound: matchesInserted,
      statements: insertedStatements
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error uploading bank statements:', error);
    return new Response(JSON.stringify({
      error: 'Failed to upload bank statements',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/bank-reconciliation
 * Update reconciliation match status
 */
export async function onRequestPut(context) {
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
    const { matchId, status, notes, verifiedBy } = data;

    if (!matchId || !status) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: matchId, status'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const updateFields = ['status = ?'];
    const params = [status];

    if (notes) {
      updateFields.push('notes = ?');
      params.push(notes);
    }

    if (verifiedBy && (status === 'verified' || status === 'reviewed')) {
      updateFields.push('verified_by = ?', 'verified_at = CURRENT_TIMESTAMP');
      params.push(verifiedBy);
    }

    params.push(matchId);

    await env.DB.prepare(`
      UPDATE reconciliation_matches 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Match status updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update match',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/bank-reconciliation
 * Delete a bank statement or reconciliation match
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const statementId = url.searchParams.get('statement_id');
  const matchId = url.searchParams.get('match_id');

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database connection not available'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    if (statementId) {
      // Delete bank statement and associated matches
      await env.DB.prepare('DELETE FROM reconciliation_matches WHERE bank_statement_id = ?')
        .bind(statementId).run();
      await env.DB.prepare('DELETE FROM bank_statements WHERE id = ?')
        .bind(statementId).run();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Bank statement deleted successfully'
      }), {
        headers: corsHeaders
      });
    } else if (matchId) {
      // Delete reconciliation match
      await env.DB.prepare('DELETE FROM reconciliation_matches WHERE id = ?')
        .bind(matchId).run();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Reconciliation match deleted successfully'
      }), {
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({
        error: 'Either statement_id or match_id is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error('Error deleting:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete',
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
