// Import API - Handle CSV imports and historical data
// Endpoints:
// POST /api/import/csv - Upload and parse CSV file
// POST /api/import/confirm - Confirm and execute import
// GET /api/import/history - List import history
// GET /api/import/history/:id - Get specific import details
// DELETE /api/import/history/:id - Delete import and related transactions

import { getUserIdFromToken } from './auth.js';
import { parseCSV, detectColumns, parseDate, parseAmount, detectTransactionType, detectDuplicates } from '../../src/utils/csvParser.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// POST /api/import/csv - Parse CSV file and return preview
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Route to specific handler
    if (path.endsWith('/confirm')) {
      return handleConfirmImport(env, userId, request);
    } else {
      return handleParseCSV(env, userId, request);
    }

  } catch (error) {
    await logError(error, { endpoint: 'Import POST error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to process import',
      message: error.message,
      code: 'IMPORT_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Parse CSV file
async function handleParseCSV(env, userId, request) {
  try {
    const body = await request.json();
    const { csvContent, fileName, source = 'csv_bank_statement' } = body;

    if (!csvContent) {
      return new Response(JSON.stringify({ 
        error: 'CSV content is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse CSV
    const parsed = parseCSV(csvContent);
    
    if (!parsed || parsed.rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No data found in CSV file',
        code: 'EMPTY_FILE'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Detect columns
    const columnMapping = detectColumns(parsed.headers);

    // Parse transactions with detected columns
    const transactions = [];
    const errors = [];
    let earliestDate = null;
    let latestDate = null;

    for (let i = 0; i < Math.min(parsed.rows.length, 1000); i++) { // Limit preview to 1000 rows
      const row = parsed.rows[i];
      
      try {
        const transaction = {
          date: columnMapping.date !== null ? parseDate(row[columnMapping.date]) : null,
          description: columnMapping.description !== null ? row[columnMapping.description] : '',
          amount: columnMapping.amount !== null ? Math.abs(parseAmount(row[columnMapping.amount])) : 0,
          type: null,
          reference: columnMapping.reference !== null ? row[columnMapping.reference] : null,
        };

        // Detect transaction type
        if (columnMapping.type !== null) {
          transaction.type = detectTransactionType(
            transaction.description,
            parseAmount(row[columnMapping.amount]),
            row[columnMapping.type]
          );
        } else {
          // Use amount sign to determine type
          const rawAmount = parseAmount(row[columnMapping.amount]);
          transaction.type = rawAmount >= 0 ? 'ingreso' : 'gasto';
        }

        // Track date range
        if (transaction.date) {
          if (!earliestDate || transaction.date < earliestDate) {
            earliestDate = transaction.date;
          }
          if (!latestDate || transaction.date > latestDate) {
            latestDate = transaction.date;
          }
        }

        // Basic validation
        if (!transaction.date || !transaction.description || transaction.amount <= 0) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields',
            data: row,
          });
          continue;
        }

        transactions.push(transaction);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: row,
        });
      }
    }

    // Check for duplicates against existing transactions
    const existingTransactions = await env.DB.prepare(`
      SELECT date, description, amount, type
      FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ? AND is_deleted = 0
    `).bind(userId, earliestDate || '1900-01-01', latestDate || '2100-12-31').all();

    const withDuplicates = detectDuplicates(
      transactions,
      existingTransactions.results || [],
      { dateWindow: 2, amountTolerance: 0.01, descriptionSimilarity: 0.8 }
    );

    const duplicateCount = withDuplicates.filter(t => t.isDuplicate).length;

    return new Response(JSON.stringify({ 
      success: true,
      fileName,
      source,
      summary: {
        totalRows: parsed.rows.length,
        validTransactions: transactions.length,
        errors: errors.length,
        duplicates: duplicateCount,
        periodStart: earliestDate,
        periodEnd: latestDate,
      },
      columnMapping,
      headers: parsed.headers,
      transactions: withDuplicates,
      errors: errors.slice(0, 100), // Limit error list
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'CSV parse error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse CSV',
      message: error.message,
      code: 'PARSE_ERROR'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
}

// Confirm and execute import
async function handleConfirmImport(env, userId, request) {
  try {
    const body = await request.json();
    const { 
      transactions, 
      fileName, 
      source = 'csv_bank_statement',
      skipDuplicates = true,
      periodStart,
      periodEnd,
    } = body;

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No transactions to import',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Create import history record
    const importId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let recordsImported = 0;
    let recordsDuplicated = 0;
    let recordsFailed = 0;

    // Insert transactions
    for (const transaction of transactions) {
      try {
        // Skip if marked as duplicate and skipDuplicates is true
        if (transaction.isDuplicate && skipDuplicates) {
          recordsDuplicated++;
          continue;
        }

        // Insert transaction
        await env.DB.prepare(`
          INSERT INTO transactions (
            user_id, date, description, amount, type, 
            category, transaction_type, import_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          userId,
          transaction.date,
          transaction.description,
          transaction.amount,
          transaction.type,
          'personal', // Default category
          'personal', // Default transaction_type
          importId
        ).run();

        recordsImported++;
      } catch (error) {
        await logError(error, { endpoint: 'Transaction insert error', category: 'api' }, env);
        recordsFailed++;
      }
    }

    // Create import history record
    await env.DB.prepare(`
      INSERT INTO import_history (
        id, user_id, source, file_name, period_start, period_end,
        records_imported, records_duplicated, records_failed,
        status, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      importId,
      userId,
      source,
      fileName,
      periodStart,
      periodEnd,
      recordsImported,
      recordsDuplicated,
      recordsFailed,
      'completed',
      JSON.stringify({ 
        totalTransactions: transactions.length,
        skipDuplicates 
      })
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      importId,
      summary: {
        recordsImported,
        recordsDuplicated,
        recordsFailed,
        total: transactions.length,
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Import confirm error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to import transactions',
      message: error.message,
      code: 'IMPORT_FAILED'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// GET /api/import/history - List import history
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Check if requesting specific import
    const pathParts = path.split('/');
    const importId = pathParts[pathParts.length - 1];
    
    if (importId && importId !== 'history') {
      return handleGetImportDetails(env, userId, importId);
    }

    // List all imports
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = Math.min(parseInt(url.searchParams.get('perPage')) || 20, 100);
    const offset = (page - 1) * perPage;

    const imports = await env.DB.prepare(`
      SELECT *
      FROM import_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, perPage, offset).all();

    const total = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM import_history
      WHERE user_id = ?
    `).bind(userId).first();

    return new Response(JSON.stringify({ 
      imports: imports.results || [],
      pagination: {
        page,
        perPage,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / perPage),
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Import GET error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch import history',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Get specific import details
async function handleGetImportDetails(env, userId, importId) {
  try {
    const importRecord = await env.DB.prepare(`
      SELECT *
      FROM import_history
      WHERE id = ? AND user_id = ?
    `).bind(importId, userId).first();

    if (!importRecord) {
      return new Response(JSON.stringify({ 
        error: 'Import not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Get associated transactions
    const transactions = await env.DB.prepare(`
      SELECT id, date, description, amount, type, category, transaction_type
      FROM transactions
      WHERE import_id = ? AND user_id = ? AND is_deleted = 0
      ORDER BY date DESC
    `).bind(importId, userId).all();

    return new Response(JSON.stringify({ 
      import: importRecord,
      transactions: transactions.results || [],
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Import details error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch import details',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE /api/import/history/:id - Delete import and related transactions
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const pathParts = path.split('/');
    const importId = pathParts[pathParts.length - 1];

    if (!importId) {
      return new Response(JSON.stringify({ 
        error: 'Import ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify import belongs to user
    const importRecord = await env.DB.prepare(`
      SELECT id
      FROM import_history
      WHERE id = ? AND user_id = ?
    `).bind(importId, userId).first();

    if (!importRecord) {
      return new Response(JSON.stringify({ 
        error: 'Import not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Soft delete all transactions from this import
    await env.DB.prepare(`
      UPDATE transactions
      SET is_deleted = 1
      WHERE import_id = ? AND user_id = ?
    `).bind(importId, userId).run();

    // Delete import history record
    await env.DB.prepare(`
      DELETE FROM import_history
      WHERE id = ? AND user_id = ?
    `).bind(importId, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Import and related transactions deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Import DELETE error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete import',
      message: error.message,
      code: 'DELETE_ERROR'
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
