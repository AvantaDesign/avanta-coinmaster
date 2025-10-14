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
  
  // CORS headers
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Check if this is a request for a single transaction by ID
    const pathParts = url.pathname.split('/').filter(p => p);
    const possibleId = pathParts[pathParts.length - 1];
    
    // If the last path part is a number, treat it as an ID request
    if (/^\d+$/.test(possibleId)) {
      try {
        const transaction = await env.DB.prepare(
          'SELECT * FROM transactions WHERE id = ?'
        ).bind(possibleId).first();
        
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
        console.error('Error fetching transaction by ID:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch transaction',
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Parse query parameters with validation
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50'), 1), 1000);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const category = url.searchParams.get('category');
    const type = url.searchParams.get('type');
    const account = url.searchParams.get('account');
    const search = url.searchParams.get('search');
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
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    
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
      params.push(parseFloat(amountMin));
    }
    
    if (amountMax) {
      query += ' AND amount <= ?';
      params.push(parseFloat(amountMax));
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

    // Add sorting
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    
    // Add secondary sort for consistency
    if (sortBy !== 'created_at') {
      query += ', created_at DESC';
    }
    
    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    // Build response object
    const response = {
      data: result.results || [],
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
        let statsQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN type = "ingreso" THEN amount ELSE 0 END) as total_income, SUM(CASE WHEN type = "gasto" THEN amount ELSE 0 END) as total_expenses FROM transactions WHERE 1=1';
        const statsParams = [];
        
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
          statsParams.push(parseFloat(amountMin));
        }
        if (amountMax) {
          statsQuery += ' AND amount <= ?';
          statsParams.push(parseFloat(amountMax));
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
        
        response.statistics = {
          total_transactions: statsResult?.total || 0,
          total_income: statsResult?.total_income || 0,
          total_expenses: statsResult?.total_expenses || 0,
          net: (statsResult?.total_income || 0) - (statsResult?.total_expenses || 0)
        };
        
        // Update pagination with total count
        response.pagination.total = statsResult?.total || 0;
        response.pagination.total_pages = Math.ceil((statsResult?.total || 0) / limit);
        response.pagination.current_page = Math.floor(offset / limit) + 1;
      } catch (error) {
        console.error('Error fetching statistics:', error);
        response.warnings = ['Could not fetch statistics'];
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Transactions GET Error:', error);
    
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
 *   notes: string (optional)
 * }
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes } = data;
    
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
    const deductibleValue = is_deductible ? 1 : 0;
    const sanitizedAccount = account?.trim() || null;
    const sanitizedActivity = economic_activity?.trim() || null;
    const sanitizedReceiptUrl = receipt_url?.trim() || null;
    const sanitizedTransactionType = transaction_type || 'personal';
    const numCategoryId = category_id ? parseInt(category_id) : null;
    const numLinkedInvoiceId = linked_invoice_id ? parseInt(linked_invoice_id) : null;
    const sanitizedNotes = notes?.trim() || null;

    // Insert transaction
    try {
      const result = await env.DB.prepare(
        `INSERT INTO transactions (date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        date,
        sanitizedDescription,
        numAmount,
        type,
        category,
        sanitizedAccount,
        deductibleValue,
        sanitizedActivity,
        sanitizedReceiptUrl,
        sanitizedTransactionType,
        numCategoryId,
        numLinkedInvoiceId,
        sanitizedNotes
      ).run();

      // Fetch the created transaction to return it
      const createdTransaction = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return new Response(JSON.stringify({
        success: true,
        data: createdTransaction,
        message: 'Transaction created successfully'
      }), {
        status: 201,
        headers: corsHeaders
      });

    } catch (dbError) {
      console.error('Database error creating transaction:', dbError);
      
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
    console.error('Transactions POST Error:', error);
    
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
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url, transaction_type, category_id, linked_invoice_id, notes } = data;
    
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
      params.push(parseFloat(amount));
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

    // Execute update
    const updateQuery = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(updateQuery).bind(...params).run();

    // Fetch updated transaction
    const updatedTransaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Transactions PUT Error:', error);
    
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

    // Perform soft delete or hard delete based on permanent parameter
    if (permanent) {
      // Hard delete - permanently remove from database
      await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Transaction permanently deleted',
        deleted: existingTransaction
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Soft delete - set is_deleted = 1
      await env.DB.prepare('UPDATE transactions SET is_deleted = 1 WHERE id = ?').bind(id).run();
      
      // Fetch the updated transaction
      const deletedTransaction = await env.DB.prepare(
        'SELECT * FROM transactions WHERE id = ?'
      ).bind(id).first();
      
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
    console.error('Transactions DELETE Error:', error);
    
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
 * OPTIONS /api/transactions
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
