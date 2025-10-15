/**
 * Invoice Reconciliation API
 * Manages explicit relationships between transactions and CFDI invoices
 * 
 * Endpoints:
 * - GET    /api/invoice-reconciliation           - Get reconciliation data
 * - POST   /api/invoice-reconciliation/link      - Link transaction to invoice
 * - DELETE /api/invoice-reconciliation/link/:id  - Unlink transaction from invoice
 * - GET    /api/invoice-reconciliation/invoice/:id  - Get all transactions for an invoice
 * - GET    /api/invoice-reconciliation/transaction/:id - Get all invoices for a transaction
 * - GET    /api/invoice-reconciliation/unmatched - Get unmatched transactions and invoices
 */

import { getUserIdFromToken, authenticateRequest, validateRequired, generateId, getApiResponse } from './auth.js';

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/invoice-reconciliation', '');
  const method = request.method;

  try {
    // Authenticate user
    const userId = await authenticateRequest(request, env);

    // Route to appropriate handler
    if (path === '' || path === '/') {
      if (method === 'GET') return await getReconciliationData(env, userId, url);
    }

    if (path === '/link' && method === 'POST') {
      return await linkTransactionToInvoice(env, userId, request);
    }

    if (path === '/unmatched' && method === 'GET') {
      return await getUnmatchedItems(env, userId, url);
    }

    const linkIdMatch = path.match(/^\/link\/([^/]+)$/);
    if (linkIdMatch && method === 'DELETE') {
      return await unlinkTransactionFromInvoice(env, userId, linkIdMatch[1]);
    }

    const invoiceMatch = path.match(/^\/invoice\/([^/]+)$/);
    if (invoiceMatch && method === 'GET') {
      return await getTransactionsForInvoice(env, userId, invoiceMatch[1]);
    }

    const transactionMatch = path.match(/^\/transaction\/([^/]+)$/);
    if (transactionMatch && method === 'GET') {
      return await getInvoicesForTransaction(env, userId, transactionMatch[1]);
    }

    return getApiResponse(null, 'Not found', 404);
  } catch (error) {
    console.error('Invoice Reconciliation API error:', error);
    return getApiResponse(null, error.message || 'Internal server error', error.status || 500);
  }
}

/**
 * Get reconciliation data with statistics
 */
async function getReconciliationData(env, userId, url) {
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  // Get all links
  let query = `
    SELECT 
      tim.*,
      t.description as transaction_description,
      t.amount as transaction_amount,
      t.date as transaction_date,
      t.type as transaction_type,
      i.uuid as invoice_uuid,
      i.total as invoice_total,
      i.date as invoice_date,
      i.status as invoice_status
    FROM transaction_invoice_map tim
    JOIN transactions t ON t.id = tim.transaction_id
    JOIN invoices i ON i.id = tim.invoice_id
    WHERE t.user_id = ?
  `;
  const params = [userId];

  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY t.date DESC';

  const { results: links } = await env.DB.prepare(query).bind(...params).all();

  // Get statistics
  const stats = await env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT tim.transaction_id) as linked_transactions,
      COUNT(DISTINCT tim.invoice_id) as linked_invoices,
      COUNT(*) as total_links,
      COALESCE(SUM(tim.amount), 0) as total_linked_amount
    FROM transaction_invoice_map tim
    JOIN transactions t ON t.id = tim.transaction_id
    WHERE t.user_id = ?
  `).bind(userId).first();

  // Get unlinked counts
  const unlinked = await env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM transactions t 
       WHERE t.user_id = ? 
       AND t.is_deleted = 0
       AND t.id NOT IN (SELECT transaction_id FROM transaction_invoice_map)
      ) as unlinked_transactions,
      (SELECT COUNT(*) FROM invoices i 
       WHERE i.user_id = ? 
       AND i.status = 'active'
       AND i.id NOT IN (SELECT invoice_id FROM transaction_invoice_map)
      ) as unlinked_invoices
  `).bind(userId, userId).first();

  return getApiResponse({
    links,
    statistics: {
      ...stats,
      ...unlinked
    }
  });
}

/**
 * Link a transaction to an invoice
 */
async function linkTransactionToInvoice(env, userId, request) {
  const data = await request.json();

  // Validate required fields
  validateRequired(data, ['transaction_id', 'invoice_id']);

  // Verify transaction belongs to user
  const transaction = await env.DB.prepare(
    'SELECT id, amount FROM transactions WHERE id = ? AND user_id = ?'
  ).bind(data.transaction_id, userId).first();

  if (!transaction) {
    return getApiResponse(null, 'Transaction not found', 404);
  }

  // Verify invoice belongs to user
  const invoice = await env.DB.prepare(
    'SELECT id, total FROM invoices WHERE id = ? AND user_id = ?'
  ).bind(data.invoice_id, userId).first();

  if (!invoice) {
    return getApiResponse(null, 'Invoice not found', 404);
  }

  // Check if link already exists
  const existing = await env.DB.prepare(
    'SELECT id FROM transaction_invoice_map WHERE transaction_id = ? AND invoice_id = ?'
  ).bind(data.transaction_id, data.invoice_id).first();

  if (existing) {
    return getApiResponse(null, 'Link already exists', 400);
  }

  // Validate amount if provided
  const linkAmount = data.amount || transaction.amount;
  if (linkAmount > transaction.amount) {
    return getApiResponse(null, 'Link amount cannot exceed transaction amount', 400);
  }

  // Create link
  const linkId = generateId('tim');
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO transaction_invoice_map (
      id, transaction_id, invoice_id, amount, notes, created_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    linkId,
    data.transaction_id,
    data.invoice_id,
    linkAmount,
    data.notes || null,
    now,
    userId
  ).run();

  // Fetch the created link with full details
  const link = await env.DB.prepare(`
    SELECT 
      tim.*,
      t.description as transaction_description,
      t.amount as transaction_amount,
      t.date as transaction_date,
      i.uuid as invoice_uuid,
      i.total as invoice_total,
      i.date as invoice_date
    FROM transaction_invoice_map tim
    JOIN transactions t ON t.id = tim.transaction_id
    JOIN invoices i ON i.id = tim.invoice_id
    WHERE tim.id = ?
  `).bind(linkId).first();

  return getApiResponse({ link }, 'Transaction linked to invoice successfully', 201);
}

/**
 * Unlink a transaction from an invoice
 */
async function unlinkTransactionFromInvoice(env, userId, linkId) {
  // Verify link exists and user has access
  const link = await env.DB.prepare(`
    SELECT tim.id
    FROM transaction_invoice_map tim
    JOIN transactions t ON t.id = tim.transaction_id
    WHERE tim.id = ? AND t.user_id = ?
  `).bind(linkId, userId).first();

  if (!link) {
    return getApiResponse(null, 'Link not found', 404);
  }

  // Delete link
  await env.DB.prepare(
    'DELETE FROM transaction_invoice_map WHERE id = ?'
  ).bind(linkId).run();

  return getApiResponse({ id: linkId }, 'Transaction unlinked from invoice successfully');
}

/**
 * Get all transactions for a specific invoice
 */
async function getTransactionsForInvoice(env, userId, invoiceId) {
  // Verify invoice belongs to user
  const invoice = await env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
  ).bind(invoiceId, userId).first();

  if (!invoice) {
    return getApiResponse(null, 'Invoice not found', 404);
  }

  // Get all linked transactions
  const { results: transactions } = await env.DB.prepare(`
    SELECT 
      t.*,
      tim.id as link_id,
      tim.amount as link_amount,
      tim.notes as link_notes,
      tim.created_at as link_created_at
    FROM transactions t
    JOIN transaction_invoice_map tim ON tim.transaction_id = t.id
    WHERE tim.invoice_id = ?
    ORDER BY t.date DESC
  `).bind(invoiceId).all();

  // Calculate total linked amount
  const totalLinked = transactions.reduce((sum, t) => sum + (t.link_amount || 0), 0);
  const remaining = invoice.total - totalLinked;

  return getApiResponse({
    invoice,
    transactions,
    summary: {
      total_transactions: transactions.length,
      total_linked: Math.round(totalLinked * 100) / 100,
      invoice_total: invoice.total,
      remaining: Math.round(remaining * 100) / 100,
      is_fully_reconciled: remaining <= 0.01 // Allow small rounding differences
    }
  });
}

/**
 * Get all invoices for a specific transaction
 */
async function getInvoicesForTransaction(env, userId, transactionId) {
  // Verify transaction belongs to user
  const transaction = await env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
  ).bind(transactionId, userId).first();

  if (!transaction) {
    return getApiResponse(null, 'Transaction not found', 404);
  }

  // Get all linked invoices
  const { results: invoices } = await env.DB.prepare(`
    SELECT 
      i.*,
      tim.id as link_id,
      tim.amount as link_amount,
      tim.notes as link_notes,
      tim.created_at as link_created_at
    FROM invoices i
    JOIN transaction_invoice_map tim ON tim.invoice_id = i.id
    WHERE tim.transaction_id = ?
    ORDER BY i.date DESC
  `).bind(transactionId).all();

  // Calculate total linked amount
  const totalLinked = invoices.reduce((sum, i) => sum + (i.link_amount || 0), 0);
  const remaining = transaction.amount - totalLinked;

  return getApiResponse({
    transaction,
    invoices,
    summary: {
      total_invoices: invoices.length,
      total_linked: Math.round(totalLinked * 100) / 100,
      transaction_amount: transaction.amount,
      remaining: Math.round(remaining * 100) / 100,
      is_fully_reconciled: remaining <= 0.01
    }
  });
}

/**
 * Get unmatched transactions and invoices (suggestions for reconciliation)
 */
async function getUnmatchedItems(env, userId, url) {
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const minAmount = parseFloat(url.searchParams.get('min_amount') || '0');
  const maxAmount = parseFloat(url.searchParams.get('max_amount') || '999999999');

  // Get unmatched transactions (business income/expenses with no invoice link)
  const { results: unmatchedTransactions } = await env.DB.prepare(`
    SELECT t.*
    FROM transactions t
    WHERE t.user_id = ?
      AND t.is_deleted = 0
      AND t.transaction_type = 'business'
      AND t.amount >= ?
      AND t.amount <= ?
      AND t.id NOT IN (SELECT transaction_id FROM transaction_invoice_map)
    ORDER BY t.date DESC
    LIMIT ?
  `).bind(userId, minAmount, maxAmount, limit).all();

  // Get unmatched invoices (active invoices with no transaction link)
  const { results: unmatchedInvoices } = await env.DB.prepare(`
    SELECT i.*
    FROM invoices i
    WHERE i.user_id = ?
      AND i.status = 'active'
      AND i.total >= ?
      AND i.total <= ?
      AND i.id NOT IN (SELECT invoice_id FROM transaction_invoice_map)
    ORDER BY i.date DESC
    LIMIT ?
  `).bind(userId, minAmount, maxAmount, limit).all();

  // Generate matching suggestions (simple amount-based matching)
  const suggestions = [];
  for (const transaction of unmatchedTransactions) {
    for (const invoice of unmatchedInvoices) {
      // Check if amounts are close (within 1%)
      const difference = Math.abs(transaction.amount - invoice.total);
      const percentDiff = (difference / transaction.amount) * 100;

      if (percentDiff <= 1) {
        // Check if dates are close (within 30 days)
        const dateDiff = Math.abs(
          new Date(transaction.date).getTime() - new Date(invoice.date).getTime()
        ) / (1000 * 60 * 60 * 24);

        if (dateDiff <= 30) {
          suggestions.push({
            transaction,
            invoice,
            confidence: Math.round((100 - percentDiff - (dateDiff / 30 * 10)) * 100) / 100,
            reason: `Amounts match within ${percentDiff.toFixed(2)}%, dates within ${Math.round(dateDiff)} days`
          });
        }
      }
    }
  }

  // Sort suggestions by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return getApiResponse({
    unmatched_transactions: unmatchedTransactions,
    unmatched_invoices: unmatchedInvoices,
    suggestions: suggestions.slice(0, 20), // Return top 20 suggestions
    summary: {
      total_unmatched_transactions: unmatchedTransactions.length,
      total_unmatched_invoices: unmatchedInvoices.length,
      total_suggestions: suggestions.length
    }
  });
}
