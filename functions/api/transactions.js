// Transactions API - Comprehensive CRUD operations with advanced features
// 
// This API handles all transaction operations including:
// - List transactions with filtering, search, sorting, and pagination
// - Create new transactions with validation
// - Update existing transactions
// - Delete transactions
// - Bulk operations
// - Statistics and aggregations
//
// Supported features:
// - Full-text search across description
// - Date range filtering
// - Category and type filtering
// - Account filtering
// - Deductible expense filtering
// - Amount range filtering
// - Sorting by multiple fields
// - Pagination with offset/limit
// - CORS support
// - Comprehensive error handling
// - Input validation and sanitization
// - Multi-tenancy with user isolation
//
// Phase 30: Monetary values stored as INTEGER cents in database
// - Incoming amounts (decimal) converted to cents before storage
// - Outgoing amounts (cents) converted to decimal for API responses
//
// Phase 31: Backend Hardening and Security
// - Integrated security headers and validation
// - Rate limiting on write operations
// - Comprehensive logging and audit trails
// - Input sanitization for XSS/SQL injection prevention

import { getUserIdFromToken } from './auth.js';
import { toCents, fromCents, convertArrayFromCents, convertObjectFromCents, parseMonetaryInput, MONETARY_FIELDS } from '../utils/monetary.js';
import { getSecurityHeaders } from '../utils/security.js';
import { sanitizeString, validateTransactionData, validatePagination, validateSort, isSafeSqlValue } from '../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createValidationErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { checkRateLimit, getRateLimitConfig } from '../utils/rate-limiter.js';
import { buildSafeOrderBy } from '../utils/sql-security.js';

/**
 * GET /api/transactions
 * GET /api/transactions/:id (get single transaction)
 * 
 * Query Parameters for listing:
 *   - limit: number (default: 50, max: 1000)
 *   - offset: number (default: 0) for pagination
 *   - category: 'personal' | 'avanta'
 *   - type: 'ingreso' | 'gasto'
 *   - account: string (account name filter)
 *   - search: string (search in description)
 *   - date_from: YYYY-MM-DD
 *   - date_to: YYYY-MM-DD
 *   - amount_min: number
 *   - amount_max: number
 *   - is_deductible: boolean
 *   - sort_by: 'date' | 'amount' | 'description' | 'created_at' (default: 'date')
 *   - sort_order: 'asc' | 'desc' (default: 'desc')
 *   - include_stats: boolean (include aggregated statistics)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const startTime = Date.now();
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();

  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'transactions', method: 'GET' }, env);

    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Check if this is a request for a single transaction by ID
    const pathParts = url.pathname.split('/').filter(p => p);
    const possibleId = pathParts[pathParts.length - 1];
    
    // If the last path part is a number, treat it as an ID request
    if (/^\d+$/.test(possibleId)) {
      try {
        const transaction = await env.DB.prepare(
          'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
        ).bind(possibleId, userId).first();
        
        if (!transaction) {
          return new Response(JSON.stringify({ 
            error: 'Transaction not found',
            code: 'NOT_FOUND'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }
        
        return new Response(JSON.stringify(transaction), {
          status: 200,
          headers: corsHeaders
        });
      } catch (error) {
        await logError(error, { endpoint: 'Error fetching transaction by ID', category: 'api' }, env);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch transaction',
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Phase 31: Validate pagination parameters
    const limitParam = url.searchParams.get('limit') || '50';
    const offsetParam = url.searchParams.get('offset') || '0';
    const paginationValidation = validatePagination(limitParam, offsetParam);
    
    if (!paginationValidation.valid) {
      return createValidationErrorResponse(paginationValidation.error);
    }
    
    const limit = paginationValidation.limit;
    const offset = paginationValidation.offset;
    
    // Parse and sanitize query parameters
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type');
    const account = url.searchParams.get('account');
    const search = sanitizeString(url.searchParams.get('search') || '');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const amountMin = url.searchParams.get('amount_min');
    const amountMax = url.searchParams.get('amount_max');
    const isDeductible = url.searchParams.get('is_deductible');
    const sortBy = url.searchParams.get('sort_by') || 'date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const includeStats = url.searchParams.get('include_stats') === 'true';
    const includeDeleted = url.searchParams.get('include_deleted') === 'true';
    const transactionType = url.searchParams.get('transaction_type');
    const categoryId = url.searchParams.get('category_id');
    const linkedInvoiceId = url.searchParams.get('linked_invoice_id');
    
    // Phase 31: Validate sort parameters
    const sortValidation = validateSort(sortBy, sortOrder, ['date', 'amount', 'description', 'created_at']);
    if (!sortValidation.valid) {
      return createValidationErrorResponse(sortValidation.error);
    }

    // Validate enum values
    if (category && !['personal', 'avanta'].includes(category)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid category. Must be "personal" or "avanta"',
        code: 'INVALID_PARAMETER'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (type && !['ingreso', 'gasto'].includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid type. Must be "ingreso" or "gasto"',
        code: 'INVALID_PARAMETER'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!['date', 'amount', 'description', 'created_at'].includes(sortBy)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid sort_by. Must be "date", "amount", "description", or "created_at"',
        code: 'INVALID_PARAMETER'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return new Response(JSON.stringify({ 
        error: 'Invalid sort_order. Must be "asc" or "desc"',
        code: 'INVALID_PARAMETER'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (transactionType && !['business', 'personal', 'transfer'].includes(transactionType)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid transaction_type. Must be "business", "personal", or "transfer"',
        code: 'INVALID_PARAMETER'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Build dynamic query
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];
    
    // Filter out soft-deleted transactions by default
    if (!includeDeleted) {
      query += ' AND (is_deleted IS NULL OR is_deleted = 0)';
    }
    
    // Add filters
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (account) {
      query += ' AND account = ?';
      params.push(account);
    }
    
    if (search) {
      query += ' AND description LIKE ?';
      params.push(`%${search}%`);
    }
    
    if (dateFrom) {
      query += ' AND date >= ?';
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ' AND date <= ?';
      params.push(dateTo);
    }
    
    if (amountMin) {
      query += ' AND amount >= ?';
      params.push(toCents(parseFloat(amountMin)));
    }
    
    if (amountMax) {
      query += ' AND amount <= ?';
      params.push(toCents(parseFloat(amountMax)));
    }
    
    if (isDeductible !== null && isDeductible !== undefined) {
      query += ' AND is_deductible = ?';
      params.push(isDeductible === 'true' ? 1 : 0);
    }

    if (transactionType) {
      query += ' AND transaction_type = ?';
      params.push(transactionType);
    }

    if (categoryId) {
      query += ' AND category_id = ?';
      params.push(parseInt(categoryId));
    }

    if (linkedInvoiceId) {
      query += ' AND linked_invoice_id = ?';
      params.push(parseInt(linkedInvoiceId));
    }

    // Add sorting - Phase 43: Fixed SQL injection vulnerability
    // Use validated ORDER BY clause instead of string concatenation
    const orderByResult = buildSafeOrderBy('transactions', sortBy, sortOrder);
    if (orderByResult.valid) {
      query += orderByResult.clause;
      // Add secondary sort for consistency
      if (sortBy !== 'created_at') {
        query += ', created_at DESC';
      }
    } else {
      // Log validation error and use default sorting
      await logError(new Error('Invalid sort parameters'), {
        endpoint: '/api/transactions',
        error: orderByResult.error,
        sortBy,
        sortOrder
      }, env);
      query += ' ORDER BY created_at DESC';
    }
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    // Phase 30: Convert monetary values from cents to decimal for API response
    const convertedResults = convertArrayFromCents(result.results || [], MONETARY_FIELDS.TRANSACTIONS);

    // Build response object
    const response = {
      data: convertedResults,
      pagination: {
        limit,
        offset,
        count: result.results?.length || 0,
        has_more: (result.results?.length || 0) === limit
      },
      filters: {
        category,
        type,
        account,
        search,
        date_from: dateFrom,
        date_to: dateTo,
        amount_min: amountMin,
        amount_max: amountMax,
        is_deductible: isDeductible
      }
    };

    // Include statistics if requested
    if (includeStats) {
      try {
        // Build stats query with same filters (excluding pagination)
        let statsQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN type = "ingreso" THEN amount ELSE 0 END) as total_income, SUM(CASE WHEN type = "gasto" THEN amount ELSE 0 END) as total_expenses FROM transactions WHERE user_id = ?';
        const statsParams = [userId];
        
        // Filter out soft-deleted transactions by default
        if (!includeDeleted) {
          statsQuery += ' AND (is_deleted IS NULL OR is_deleted = 0)';
        }
        
        // Apply same filters
        if (category) {
          statsQuery += ' AND category = ?';
          statsParams.push(category);
        }
        if (type) {
          statsQuery += ' AND type = ?';
          statsParams.push(type);
        }
        if (account) {
          statsQuery += ' AND account = ?';
          statsParams.push(account);
        }
        if (search) {
          statsQuery += ' AND description LIKE ?';
          statsParams.push(`%${search}%`);
        }
        if (dateFrom) {
          statsQuery += ' AND date >= ?';
          statsParams.push(dateFrom);
        }
        if (dateTo) {
          statsQuery += ' AND date <= ?';
          statsParams.push(dateTo);
        }
        if (amountMin) {
          statsQuery += ' AND amount >= ?';
          statsParams.push(toCents(parseFloat(amountMin)));
        }
        if (amountMax) {
          statsQuery += ' AND amount <= ?';
          statsParams.push(toCents(parseFloat(amountMax)));
        }
        if (isDeductible !== null && isDeductible !== undefined) {
          statsQuery += ' AND is_deductible = ?';
          statsParams.push(isDeductible === 'true' ? 1 : 0);
        }
        if (transactionType) {
          statsQuery += ' AND transaction_type = ?';
          statsParams.push(transactionType);
        }
        if (categoryId) {
          statsQuery += ' AND category_id = ?';
          statsParams.push(parseInt(categoryId));
        }
        if (linkedInvoiceId) {
          statsQuery += ' AND linked_invoice_id = ?';
          statsParams.push(parseInt(linkedInvoiceId));
        }

        const statsResult = await env.DB.prepare(statsQuery).bind(...statsParams).first();
        
        // Phase 30: Convert stats amounts from cents to decimal
        response.statistics = {
          total_transactions: statsResult?.total || 0,
          total_income: fromCents(statsResult?.total_income || 0),
          total_expenses: fromCents(statsResult?.total_expenses || 0),
          net: fromCents((statsResult?.total_income || 0) - (statsResult?.total_expenses || 0))
        };
        
        // Update pagination with total count
        response.pagination.total = statsResult?.total || 0;
        response.pagination.total_pages = Math.ceil((statsResult?.total || 0) / limit);
        response.pagination.current_page = Math.floor(offset / limit) + 1;
      } catch (error) {
        await logError(error, { endpoint: 'Error fetching statistics', category: 'api' }, env);
        response.warnings = ['Could not fetch statistics'];
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Transactions GET Error', category: 'api' }, env);
    
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
 * POST /api/transactions
 * Create a new transaction
 * 
 * Request body:
 * {
 *   date: string (YYYY-MM-DD, required),
 *   description: string (required, max 500 chars),
 *   amount: number (required, positive),
 *   type: 'ingreso' | 'gasto' (required),
 *   category: 'personal' | 'avanta' (required),
 *   account: string (optional),
 *   is_deductible: boolean (optional, default: false),
 *   economic_activity: string (optional),
 *   receipt_url: string (optional, URL),
 *   transaction_type: 'business' | 'personal' | 'transfer' (optional, default: 'personal'),
 *   category_id: integer (optional, FK to categories table),
 *   linked_invoice_id: integer (optional, FK to invoices table),
 *   notes: string (optional),
 *   is_iva_deductible: boolean (optional, default: false),
 *   is_isr_deductible: boolean (optional, default: false),
 *   expense_type: 'national' | 'international_with_invoice' | 'international_no_invoice' (optional, default: 'national'),
 *   // Phase 17: Income-specific fields
 *   client_type: 'nacional' | 'extranjero' (optional, default: 'nacional'),
 *   client_rfc: string (optional, RFC of client),
 *   currency: string (optional, 3-letter currency code, default: 'MXN'),
 *   exchange_rate: number (optional, default: 1.0),
 *   payment_method: 'PUE' | 'PPD' (optional, Pago en Una Exhibición or Pago en Parcialidades),
 *   iva_rate: '16' | '0' | 'exento' (optional, IVA rate applied),
 *   isr_retention: number (optional, ISR amount withheld, default: 0),
 *   iva_retention: number (optional, IVA amount withheld, default: 0),
 *   cfdi_uuid: string (optional, CFDI folio fiscal),
 *   issue_date: string (optional, YYYY-MM-DD, CFDI issue date),
 *   payment_date: string (optional, YYYY-MM-DD, actual payment date),
 *   economic_activity_code: string (optional, SAT economic activity code)
 * }
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const startTime = Date.now();
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'transactions', method: 'POST' }, env);
    
    // Phase 31: Rate limiting for write operations
    const rateLimitConfig = getRateLimitConfig('POST', '/api/transactions');
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }
    
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Parse and validate request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Phase 31: Sanitize string inputs
    if (data.description) {
      data.description = sanitizeString(data.description);
    }
    if (data.notes) {
      data.notes = sanitizeString(data.notes);
    }
    if (data.economic_activity) {
      data.economic_activity = sanitizeString(data.economic_activity);
    }

    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes, is_iva_deductible, is_isr_deductible, expense_type, client_type, client_rfc, currency, exchange_rate, payment_method, iva_rate, isr_retention, iva_retention, cfdi_uuid, issue_date, payment_date, economic_activity_code } = data;
    
    // Comprehensive validation
    const errors = [];

    // Validate required fields
    if (!date) errors.push('date is required');
    if (!description) errors.push('description is required');
    if (amount === undefined || amount === null) errors.push('amount is required');
    if (!type) errors.push('type is required');
    if (!category) errors.push('category is required');

    // Validate date format (YYYY-MM-DD)
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push('date must be in YYYY-MM-DD format');
    }

    // Validate date is not in future
    if (date) {
      const transactionDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (transactionDate > today) {
        errors.push('date cannot be in the future');
      }
    }

    // Validate description length
    if (description && description.length > 500) {
      errors.push('description must be 500 characters or less');
    }

    if (description && description.trim().length === 0) {
      errors.push('description cannot be empty or whitespace only');
    }

    // Validate amount
    if (amount !== undefined && amount !== null) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        errors.push('amount must be a valid number');
      } else if (numAmount <= 0) {
        errors.push('amount must be greater than 0');
      } else if (numAmount > 999999999.99) {
        errors.push('amount is too large (max: 999,999,999.99)');
      }
    }

    // Validate type
    if (type && !['ingreso', 'gasto'].includes(type)) {
      errors.push('type must be either "ingreso" or "gasto"');
    }

    // Validate category
    if (category && !['personal', 'avanta'].includes(category)) {
      errors.push('category must be either "personal" or "avanta"');
    }

    // Validate receipt_url format if provided
    if (receipt_url && receipt_url.trim() !== '') {
      try {
        new URL(receipt_url);
      } catch (e) {
        // If absolute URL fails, check if it's a valid relative path
        if (!receipt_url.startsWith('/')) {
          errors.push('receipt_url must be a valid URL or path starting with /');
        }
      }
    }

    // Validate transaction_type
    if (transaction_type && !['business', 'personal', 'transfer'].includes(transaction_type)) {
      errors.push('transaction_type must be "business", "personal", or "transfer"');
    }

    // Validate category_id if provided
    if (category_id !== undefined && category_id !== null) {
      const numCategoryId = parseInt(category_id);
      if (isNaN(numCategoryId) || numCategoryId <= 0) {
        errors.push('category_id must be a positive integer');
      }
    }

    // Validate linked_invoice_id if provided
    if (linked_invoice_id !== undefined && linked_invoice_id !== null) {
      const numInvoiceId = parseInt(linked_invoice_id);
      if (isNaN(numInvoiceId) || numInvoiceId <= 0) {
        errors.push('linked_invoice_id must be a positive integer');
      }
    }

    // Validate notes length if provided
    if (notes && notes.length > 1000) {
      errors.push('notes must be 1000 characters or less');
    }

    // Validate expense_type if provided
    if (expense_type && !['national', 'international_with_invoice', 'international_no_invoice'].includes(expense_type)) {
      errors.push('expense_type must be "national", "international_with_invoice", or "international_no_invoice"');
    }

    // Phase 17: Validate income-specific fields
    if (client_type && !['nacional', 'extranjero'].includes(client_type)) {
      errors.push('client_type must be "nacional" or "extranjero"');
    }

    // Validate client_rfc format if provided (basic RFC validation)
    if (client_rfc && client_rfc.trim() !== '') {
      const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
      if (!rfcPattern.test(client_rfc.trim())) {
        errors.push('client_rfc format is invalid (should be RFC format like XEXX010101000)');
      }
    }

    // Validate currency code if provided (3-letter ISO code)
    if (currency && (typeof currency !== 'string' || currency.length !== 3)) {
      errors.push('currency must be a 3-letter ISO code (e.g., MXN, USD, EUR)');
    }

    // Validate exchange_rate if provided
    if (exchange_rate !== undefined && exchange_rate !== null) {
      const numExchangeRate = parseFloat(exchange_rate);
      if (isNaN(numExchangeRate) || numExchangeRate <= 0) {
        errors.push('exchange_rate must be a positive number');
      }
    }

    // Validate payment_method if provided
    if (payment_method && !['PUE', 'PPD'].includes(payment_method)) {
      errors.push('payment_method must be "PUE" or "PPD"');
    }

    // Validate iva_rate if provided
    if (iva_rate && !['16', '0', 'exento'].includes(iva_rate)) {
      errors.push('iva_rate must be "16", "0", or "exento"');
    }

    // Validate retention amounts if provided
    if (isr_retention !== undefined && isr_retention !== null) {
      const numIsrRetention = parseFloat(isr_retention);
      if (isNaN(numIsrRetention) || numIsrRetention < 0) {
        errors.push('isr_retention must be a non-negative number');
      }
    }

    if (iva_retention !== undefined && iva_retention !== null) {
      const numIvaRetention = parseFloat(iva_retention);
      if (isNaN(numIvaRetention) || numIvaRetention < 0) {
        errors.push('iva_retention must be a non-negative number');
      }
    }

    // Validate issue_date format if provided
    if (issue_date && !/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
      errors.push('issue_date must be in YYYY-MM-DD format');
    }

    // Validate payment_date format if provided
    if (payment_date && !/^\d{4}-\d{2}-\d{2}$/.test(payment_date)) {
      errors.push('payment_date must be in YYYY-MM-DD format');
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Sanitize and prepare data
    const sanitizedDescription = description.trim();
    const numAmount = parseFloat(amount);
    
    // Phase 30: Convert amount to cents for database storage
    const amountInCents = toCents(numAmount);
    
    const deductibleValue = is_deductible ? 1 : 0;
    const sanitizedAccount = account?.trim() || null;
    const sanitizedActivity = economic_activity?.trim() || null;
    const sanitizedReceiptUrl = receipt_url?.trim() || null;
    const sanitizedTransactionType = transaction_type || 'personal';
    const numCategoryId = category_id ? parseInt(category_id) : null;
    const numLinkedInvoiceId = linked_invoice_id ? parseInt(linked_invoice_id) : null;
    const sanitizedNotes = notes?.trim() || null;
    const ivaDeductibleValue = is_iva_deductible ? 1 : 0;
    const isrDeductibleValue = is_isr_deductible ? 1 : 0;
    const sanitizedExpenseType = expense_type || 'national';
    
    // Phase 17: Sanitize income-specific fields
    const sanitizedClientType = client_type || 'nacional';
    const sanitizedClientRfc = client_rfc?.trim() || null;
    const sanitizedCurrency = currency?.trim().toUpperCase() || 'MXN';
    const numExchangeRate = exchange_rate ? parseFloat(exchange_rate) : 1.0;
    const sanitizedPaymentMethod = payment_method?.trim() || null;
    const sanitizedIvaRate = iva_rate || null;
    const numIsrRetention = isr_retention ? parseFloat(isr_retention) : 0;
    const numIvaRetention = iva_retention ? parseFloat(iva_retention) : 0;
    const sanitizedCfdiUuid = cfdi_uuid?.trim() || null;
    const sanitizedIssueDate = issue_date?.trim() || null;
    const sanitizedPaymentDate = payment_date?.trim() || null;
    const sanitizedEconomicActivityCode = economic_activity_code?.trim() || null;

    // PHASE 28: Run compliance engine evaluation before inserting
    // Note: Compliance evaluation is available via /api/compliance-engine/evaluate endpoint
    // For now, we track that the transaction will be evaluated post-creation
    let complianceNote = null;
    if (!sanitizedCfdiUuid && type === 'gasto') {
      complianceNote = 'Gasto sin CFDI: verificar requisitos de deducibilidad';
    } else if (numAmount > 2000 && sanitizedAccount?.toLowerCase().includes('efectivo')) {
      complianceNote = 'Pago en efectivo >$2,000: puede afectar deducibilidad';
    }

    // Insert transaction
    try {
      const result = await env.DB.prepare(
        `INSERT INTO transactions (user_id, date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes, is_iva_deductible, is_isr_deductible, expense_type, client_type, client_rfc, currency, exchange_rate, payment_method, iva_rate, isr_retention, iva_retention, cfdi_uuid, issue_date, payment_date, economic_activity_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userId,
        date,
        sanitizedDescription,
        amountInCents,  // Phase 30: Store as cents
        type,
        category,
        sanitizedAccount,
        deductibleValue,
        sanitizedActivity,
        sanitizedReceiptUrl,
        sanitizedTransactionType,
        numCategoryId,
        numLinkedInvoiceId,
        sanitizedNotes,
        ivaDeductibleValue,
        isrDeductibleValue,
        sanitizedExpenseType,
        sanitizedClientType,
        sanitizedClientRfc,
        sanitizedCurrency,
        numExchangeRate,
        sanitizedPaymentMethod,
        sanitizedIvaRate,
        numIsrRetention,
        numIvaRetention,
        sanitizedCfdiUuid,
        sanitizedIssueDate,
        sanitizedPaymentDate,
        sanitizedEconomicActivityCode
      ).run();

      // Fetch the created transaction to return it (verify ownership)
      const createdTransaction = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
      ).bind(result.meta.last_row_id, userId).first();

      // Phase 30: Convert monetary values from cents to decimal
      const convertedTransaction = convertObjectFromCents(createdTransaction, MONETARY_FIELDS.TRANSACTIONS);
      
      // Phase 31: Log audit event
      await logAuditEvent('CREATE', 'transaction', {
        userId,
        transactionId: result.meta.last_row_id,
        type,
        category,
        amount: numAmount
      }, env);

      // Prepare response
      const response = {
        success: true,
        data: convertedTransaction,
        message: 'Transaction created successfully'
      };

      // Add compliance note if available
      if (complianceNote) {
        response.compliance_note = complianceNote;
      }
      
      // Phase 31: Add rate limit headers
      const responseHeaders = {
        ...corsHeaders,
        'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
      };

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: responseHeaders
      });

    } catch (dbError) {
      await logError(dbError, {
        context: 'Database error creating transaction',
        category: 'database'
      }, env);
      
      // Check for specific database errors
      if (dbError.message.includes('UNIQUE constraint')) {
        return new Response(JSON.stringify({ 
          error: 'Duplicate transaction',
          code: 'DUPLICATE_ERROR',
          message: dbError.message
        }), {
          status: 409,
          headers: corsHeaders
        });
      }

      throw dbError; // Re-throw for general error handler
    }

  } catch (error) {
    await logError(error, { endpoint: 'Transactions POST Error', category: 'api' }, env);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'transactions',
      method: 'POST',
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * PUT /api/transactions/:id
 * Update an existing transaction
 * 
 * Request body: Same as POST (all fields optional, only provided fields will be updated)
 */
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[pathParts.length - 1];
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'transactions', method: 'PUT', transactionId: id }, env);
    
    // Phase 31: Rate limiting for update operations
    const rateLimitConfig = getRateLimitConfig('PUT', '/api/transactions');
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Check if transaction exists and belongs to user
    const existingTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existingTransaction) {
      return new Response(JSON.stringify({ 
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes, is_iva_deductible, is_isr_deductible, expense_type, client_type, client_rfc, currency, exchange_rate, payment_method, iva_rate, isr_retention, iva_retention, cfdi_uuid, issue_date, payment_date, economic_activity_code } = data;
    
    // Validate provided fields
    const errors = [];

    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push('date must be in YYYY-MM-DD format');
      }
      const transactionDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (transactionDate > today) {
        errors.push('date cannot be in the future');
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        errors.push('description cannot be empty');
      } else if (description.length > 500) {
        errors.push('description must be 500 characters or less');
      }
    }

    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.push('amount must be a positive number');
      } else if (numAmount > 999999999.99) {
        errors.push('amount is too large');
      }
    }

    if (type !== undefined && !['ingreso', 'gasto'].includes(type)) {
      errors.push('type must be either "ingreso" or "gasto"');
    }

    if (category !== undefined && !['personal', 'avanta'].includes(category)) {
      errors.push('category must be either "personal" or "avanta"');
    }

    if (receipt_url !== undefined && receipt_url !== null && receipt_url.trim() !== '') {
      try {
        new URL(receipt_url);
      } catch (e) {
        if (!receipt_url.startsWith('/')) {
          errors.push('receipt_url must be a valid URL or path');
        }
      }
    }

    if (transaction_type !== undefined && !['business', 'personal', 'transfer'].includes(transaction_type)) {
      errors.push('transaction_type must be "business", "personal", or "transfer"');
    }

    if (category_id !== undefined && category_id !== null) {
      const numCategoryId = parseInt(category_id);
      if (isNaN(numCategoryId) || numCategoryId <= 0) {
        errors.push('category_id must be a positive integer');
      }
    }

    if (linked_invoice_id !== undefined && linked_invoice_id !== null) {
      const numInvoiceId = parseInt(linked_invoice_id);
      if (isNaN(numInvoiceId) || numInvoiceId <= 0) {
        errors.push('linked_invoice_id must be a positive integer');
      }
    }

    if (notes !== undefined && notes !== null && notes.length > 1000) {
      errors.push('notes must be 1000 characters or less');
    }

    if (expense_type !== undefined && !['national', 'international_with_invoice', 'international_no_invoice'].includes(expense_type)) {
      errors.push('expense_type must be "national", "international_with_invoice", or "international_no_invoice"');
    }

    // Phase 17: Validate income-specific fields (same as POST)
    if (client_type !== undefined && !['nacional', 'extranjero'].includes(client_type)) {
      errors.push('client_type must be "nacional" or "extranjero"');
    }

    if (client_rfc !== undefined && client_rfc !== null && client_rfc.trim() !== '') {
      const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
      if (!rfcPattern.test(client_rfc.trim())) {
        errors.push('client_rfc format is invalid');
      }
    }

    if (currency !== undefined && currency !== null && (typeof currency !== 'string' || currency.length !== 3)) {
      errors.push('currency must be a 3-letter ISO code');
    }

    if (exchange_rate !== undefined && exchange_rate !== null) {
      const numExchangeRate = parseFloat(exchange_rate);
      if (isNaN(numExchangeRate) || numExchangeRate <= 0) {
        errors.push('exchange_rate must be a positive number');
      }
    }

    if (payment_method !== undefined && payment_method !== null && !['PUE', 'PPD'].includes(payment_method)) {
      errors.push('payment_method must be "PUE" or "PPD"');
    }

    if (iva_rate !== undefined && iva_rate !== null && !['16', '0', 'exento'].includes(iva_rate)) {
      errors.push('iva_rate must be "16", "0", or "exento"');
    }

    if (isr_retention !== undefined && isr_retention !== null) {
      const numIsrRetention = parseFloat(isr_retention);
      if (isNaN(numIsrRetention) || numIsrRetention < 0) {
        errors.push('isr_retention must be a non-negative number');
      }
    }

    if (iva_retention !== undefined && iva_retention !== null) {
      const numIvaRetention = parseFloat(iva_retention);
      if (isNaN(numIvaRetention) || numIvaRetention < 0) {
        errors.push('iva_retention must be a non-negative number');
      }
    }

    if (issue_date !== undefined && issue_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
      errors.push('issue_date must be in YYYY-MM-DD format');
    }

    if (payment_date !== undefined && payment_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(payment_date)) {
      errors.push('payment_date must be in YYYY-MM-DD format');
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(toCents(parseFloat(amount)));  // Phase 30: Convert to cents
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (account !== undefined) {
      updates.push('account = ?');
      params.push(account?.trim() || null);
    }
    if (is_deductible !== undefined) {
      updates.push('is_deductible = ?');
      params.push(is_deductible ? 1 : 0);
    }
    if (economic_activity !== undefined) {
      updates.push('economic_activity = ?');
      params.push(economic_activity?.trim() || null);
    }
    if (receipt_url !== undefined) {
      updates.push('receipt_url = ?');
      params.push(receipt_url?.trim() || null);
    }
    if (transaction_type !== undefined) {
      updates.push('transaction_type = ?');
      params.push(transaction_type);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id ? parseInt(category_id) : null);
    }
    if (linked_invoice_id !== undefined) {
      updates.push('linked_invoice_id = ?');
      params.push(linked_invoice_id ? parseInt(linked_invoice_id) : null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes?.trim() || null);
    }
    if (is_iva_deductible !== undefined) {
      updates.push('is_iva_deductible = ?');
      params.push(is_iva_deductible ? 1 : 0);
    }
    if (is_isr_deductible !== undefined) {
      updates.push('is_isr_deductible = ?');
      params.push(is_isr_deductible ? 1 : 0);
    }
    if (expense_type !== undefined) {
      updates.push('expense_type = ?');
      params.push(expense_type);
    }
    
    // Phase 17: Add income-specific fields to update
    if (client_type !== undefined) {
      updates.push('client_type = ?');
      params.push(client_type);
    }
    if (client_rfc !== undefined) {
      updates.push('client_rfc = ?');
      params.push(client_rfc?.trim() || null);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency?.trim().toUpperCase() || 'MXN');
    }
    if (exchange_rate !== undefined) {
      updates.push('exchange_rate = ?');
      params.push(exchange_rate ? parseFloat(exchange_rate) : 1.0);
    }
    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      params.push(payment_method?.trim() || null);
    }
    if (iva_rate !== undefined) {
      updates.push('iva_rate = ?');
      params.push(iva_rate || null);
    }
    if (isr_retention !== undefined) {
      updates.push('isr_retention = ?');
      params.push(isr_retention ? parseFloat(isr_retention) : 0);
    }
    if (iva_retention !== undefined) {
      updates.push('iva_retention = ?');
      params.push(iva_retention ? parseFloat(iva_retention) : 0);
    }
    if (cfdi_uuid !== undefined) {
      updates.push('cfdi_uuid = ?');
      params.push(cfdi_uuid?.trim() || null);
    }
    if (issue_date !== undefined) {
      updates.push('issue_date = ?');
      params.push(issue_date?.trim() || null);
    }
    if (payment_date !== undefined) {
      updates.push('payment_date = ?');
      params.push(payment_date?.trim() || null);
    }
    if (economic_activity_code !== undefined) {
      updates.push('economic_activity_code = ?');
      params.push(economic_activity_code?.trim() || null);
    }

    // If no fields to update
    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'NO_UPDATE_FIELDS'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Add ID to params
    params.push(id);

    // Execute update (already verified ownership above)
    const updateQuery = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await env.DB.prepare(updateQuery).bind(...params, userId).run();

    // Fetch updated transaction (verify ownership)
    const updatedTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    // Phase 30: Convert monetary values from cents to decimal
    const convertedTransaction = convertObjectFromCents(updatedTransaction, MONETARY_FIELDS.TRANSACTIONS);
    
    // Phase 31: Log audit event
    await logAuditEvent('UPDATE', 'transaction', {
      userId,
      transactionId: id,
      updatedFields: Object.keys(data)
    }, env);

    return new Response(JSON.stringify({
      success: true,
      data: convertedTransaction,
      message: 'Transaction updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Transactions PUT Error', category: 'api' }, env);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'transactions',
      method: 'PUT',
      transactionId: id,
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * PATCH /api/transactions/:id
 * Partially update a transaction (alternative to PUT)
 * 
 * Request body: Same as PUT (all fields optional, only provided fields will be updated)
 */
export async function onRequestPatch(context) {
  // PATCH is functionally the same as PUT for this API
  // Both allow partial updates
  return onRequestPut(context);
}

/**
 * DELETE /api/transactions/:id
 * Soft delete a transaction (sets is_deleted = 1)
 * 
 * Query Parameters:
 *   - confirm: boolean (must be 'true' for safety)
 *   - permanent: boolean (if 'true', performs hard delete instead of soft delete)
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[pathParts.length - 1];
  const confirm = url.searchParams.get('confirm');
  const permanent = url.searchParams.get('permanent') === 'true';
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'transactions', method: 'DELETE', transactionId: id }, env);
    
    // Phase 31: Rate limiting for delete operations
    const rateLimitConfig = getRateLimitConfig('DELETE', '/api/transactions');
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Safety check: require confirmation
    if (confirm !== 'true') {
      return new Response(JSON.stringify({ 
        error: 'Delete confirmation required',
        code: 'CONFIRMATION_REQUIRED',
        message: 'Add ?confirm=true to the request to confirm deletion'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existingTransaction) {
      return new Response(JSON.stringify({ 
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Perform soft delete or hard delete based on permanent parameter
    if (permanent) {
      // Hard delete - permanently remove from database (already verified ownership above)
      await env.DB.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).run();
      
      // Phase 31: Log audit event
      await logAuditEvent('DELETE_PERMANENT', 'transaction', {
        userId,
        transactionId: id,
        type: existingTransaction.type,
        category: existingTransaction.category,
        amount: fromCents(existingTransaction.amount)
      }, env);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Transaction permanently deleted',
        deleted: existingTransaction
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Soft delete - set is_deleted = 1 (already verified ownership above)
      await env.DB.prepare('UPDATE transactions SET is_deleted = 1 WHERE id = ? AND user_id = ?').bind(id, userId).run();
      
      // Fetch the updated transaction (verify ownership)
      const deletedTransaction = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();
      
      // Phase 31: Log audit event
      await logAuditEvent('DELETE_SOFT', 'transaction', {
        userId,
        transactionId: id,
        type: existingTransaction.type,
        category: existingTransaction.category,
        amount: fromCents(existingTransaction.amount)
      }, env);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Transaction soft deleted successfully',
        data: deletedTransaction
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

  } catch (error) {
    await logError(error, { endpoint: 'Transactions DELETE Error', category: 'api' }, env);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'transactions',
      method: 'DELETE',
      transactionId: id,
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * OPTIONS /api/transactions
 * Handle CORS preflight requests
 */
export async function onRequestOptions(context) {
  // Phase 31: Use security headers for OPTIONS
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
