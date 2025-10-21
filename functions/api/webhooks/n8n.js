/**
 * n8n Webhook Integration API
 * Phase 42: Structured logging implementation
 * 
 * This endpoint handles webhooks from n8n workflows for automation:
 * - Transaction classification using AI (Claude/GPT)
 * - CSV import from email attachments
 * - Invoice notifications (Telegram/Email)
 * - Payment reminders
 * 
 * Routes:
 *   POST /api/webhooks/n8n/classify - Classify transaction with AI
 *   POST /api/webhooks/n8n/import-csv - Import CSV from email
 *   POST /api/webhooks/n8n/invoice-notification - Send invoice notification
 *   POST /api/webhooks/n8n/payment-reminder - Send payment reminder
 */

import { logInfo, logBusinessEvent } from '../../utils/logging.js';

// CORS headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Main webhook handler - routes to appropriate sub-handler
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Validate webhook authentication
    const authHeader = request.headers.get('Authorization');
    const webhookSecret = env.N8N_WEBHOOK_SECRET;
    
    // Only validate auth if secret is configured
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid webhook authentication',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Route to appropriate handler
    if (pathname.includes('/classify')) {
      return handleClassifyTransaction(context);
    } else if (pathname.includes('/import-csv')) {
      return handleImportCSV(context);
    } else if (pathname.includes('/invoice-notification')) {
      return handleInvoiceNotification(context);
    } else if (pathname.includes('/payment-reminder')) {
      return handlePaymentReminder(context);
    } else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Webhook endpoint not found',
        code: 'NOT_FOUND',
        availableEndpoints: [
          '/api/webhooks/n8n/classify',
          '/api/webhooks/n8n/import-csv',
          '/api/webhooks/n8n/invoice-notification',
          '/api/webhooks/n8n/payment-reminder'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
  } catch (error) {
    await logError(error, { endpoint: 'Webhook Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'WEBHOOK_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle AI transaction classification
 * Expected payload from n8n:
 * {
 *   transactionId: number,
 *   description: string,
 *   amount: number,
 *   classification: {
 *     category: 'personal' | 'avanta',
 *     isDeductible: boolean,
 *     confidence: number (0-1)
 *   }
 * }
 */
async function handleClassifyTransaction(context) {
  const { request, env } = context;
  
  try {
    const payload = await request.json();
    const { transactionId, description, amount, classification } = payload;

    // Validate required fields
    if (!transactionId || !classification) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'transactionId and classification are required',
        code: 'MISSING_FIELDS'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate classification data
    if (!['personal', 'avanta'].includes(classification.category)) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid category. Must be "personal" or "avanta"',
        code: 'INVALID_CATEGORY'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if transaction exists
    const transaction = await env.DB.prepare(
      'SELECT id FROM transactions WHERE id = ?'
    ).bind(transactionId).first();

    if (!transaction) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Transaction ${transactionId} not found`,
        code: 'TRANSACTION_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update transaction with AI classification
    await env.DB.prepare(`
      UPDATE transactions 
      SET category = ?, 
          is_deductible = ?
      WHERE id = ?
    `).bind(
      classification.category,
      classification.isDeductible ? 1 : 0,
      transactionId
    ).run();

    logBusinessEvent('transaction_classified', {
      transactionId,
      category: classification.category,
      confidence: classification.confidence,
      endpoint: '/api/webhooks/n8n/classify'
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Transaction classified successfully',
      transactionId,
      classification: {
        category: classification.category,
        isDeductible: classification.isDeductible,
        confidence: classification.confidence
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Classification Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'CLASSIFICATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle CSV import from email
 * Expected payload from n8n:
 * {
 *   fileName: string,
 *   csvData: string (CSV content),
 *   bankType: 'bbva' | 'azteca' | 'generic',
 *   autoImport: boolean
 * }
 */
async function handleImportCSV(context) {
  const { request, env } = context;
  
  try {
    const payload = await request.json();
    const { fileName, csvData, bankType = 'generic', autoImport = false } = payload;

    // Validate required fields
    if (!csvData) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'csvData is required',
        code: 'MISSING_CSV_DATA'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse CSV data (simplified - in production, use csvParser.js)
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const transactions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        // Basic CSV parsing (this should use the csvParser utility in production)
        // For now, assume format: date,description,amount,type
        const transaction = {
          date: values[0],
          description: values[1] || `Import from ${fileName}`,
          amount: parseFloat(values[2]) || 0,
          type: values[3] || 'gasto',
          category: 'personal',
          is_deductible: 0
        };

        transactions.push(transaction);
      } catch (error) {
        errors.push({ line: i + 1, error: error.message });
      }
    }

    // If autoImport is true, insert transactions into database
    let imported = 0;
    if (autoImport && transactions.length > 0) {
      const stmt = await env.DB.prepare(`
        INSERT INTO transactions (date, description, amount, type, category, is_deductible)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const transaction of transactions) {
        try {
          await stmt.bind(
            transaction.date,
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.is_deductible
          ).run();
          imported++;
        } catch (error) {
          errors.push({ 
            transaction: transaction.description, 
            error: error.message 
          });
        }
      }
    }

    logBusinessEvent('csv_import_completed', {
      imported,
      fileName,
      endpoint: '/api/webhooks/n8n/import-csv'
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: autoImport 
        ? `Imported ${imported} transactions successfully` 
        : `Parsed ${transactions.length} transactions`,
      fileName,
      bankType,
      parsed: transactions.length,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      transactions: autoImport ? undefined : transactions
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'CSV Import Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'CSV_IMPORT_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle invoice notification
 * Expected payload from n8n:
 * {
 *   invoiceId: number,
 *   uuid: string,
 *   emisor: string,
 *   total: number,
 *   notificationChannel: 'telegram' | 'email' | 'both',
 *   recipient: string (email or telegram chat_id)
 * }
 */
async function handleInvoiceNotification(context) {
  const { request, env } = context;
  
  try {
    const payload = await request.json();
    const { invoiceId, uuid, emisor, total, notificationChannel, recipient } = payload;

    // Validate required fields
    if (!invoiceId && !uuid) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'invoiceId or uuid is required',
        code: 'MISSING_INVOICE_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get invoice from database
    let invoice;
    if (invoiceId) {
      invoice = await env.DB.prepare(
        'SELECT * FROM invoices WHERE id = ?'
      ).bind(invoiceId).first();
    } else if (uuid) {
      invoice = await env.DB.prepare(
        'SELECT * FROM invoices WHERE uuid = ?'
      ).bind(uuid).first();
    }

    if (!invoice) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Prepare notification data
    const notificationData = {
      uuid: invoice.uuid,
      emisor: invoice.rfc_emisor,
      total: invoice.total,
      fecha: invoice.fecha,
      status: invoice.status
    };

    // In production, this would trigger actual notification sending
    // via n8n webhook callback or direct API call
    const notificationUrl = env.N8N_NOTIFICATION_WEBHOOK;
    
    if (notificationUrl) {
      try {
        await fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: notificationChannel,
            recipient,
            invoice: notificationData
          })
        });
      } catch (error) {
        await logError(error, { endpoint: 'Failed to send notification webhook', category: 'api' }, env);
      }
    }

    logBusinessEvent('invoice_notification_sent', {
      invoiceUuid: invoice.uuid,
      endpoint: '/api/webhooks/n8n/invoice-notification'
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification processed',
      invoice: notificationData,
      channel: notificationChannel,
      sent: !!notificationUrl
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Notification Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'NOTIFICATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle payment reminder
 * Expected payload from n8n:
 * {
 *   month: string (YYYY-MM),
 *   type: 'isr' | 'iva' | 'both',
 *   dueDate: string (YYYY-MM-DD),
 *   amount: number,
 *   notificationChannel: 'telegram' | 'email' | 'both'
 * }
 */
async function handlePaymentReminder(context) {
  const { request, env } = context;
  
  try {
    const payload = await request.json();
    const { month, type = 'both', dueDate, amount, notificationChannel = 'telegram' } = payload;

    // Validate required fields
    if (!month || !dueDate) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'month and dueDate are required',
        code: 'MISSING_FIELDS'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate fiscal summary for the month
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-31`;

    const fiscalData = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'gasto' AND is_deductible = 1 THEN amount ELSE 0 END) as deductible_expenses
      FROM transactions
      WHERE date >= ? AND date <= ?
    `).bind(startDate, endDate).first();

    const income = fiscalData?.income || 0;
    const deductibleExpenses = fiscalData?.deductible_expenses || 0;
    const profit = income - deductibleExpenses;
    const isr = profit * 0.20; // 20% ISR rate
    const iva = (income * 0.16) - (deductibleExpenses * 0.16); // 16% IVA

    // Prepare reminder data
    const reminderData = {
      month,
      dueDate,
      income: income.toFixed(2),
      deductibleExpenses: deductibleExpenses.toFixed(2),
      profit: profit.toFixed(2),
      isr: isr.toFixed(2),
      iva: iva.toFixed(2),
      total: (isr + iva).toFixed(2),
      type
    };

    // In production, this would trigger actual reminder sending
    const notificationUrl = env.N8N_REMINDER_WEBHOOK;
    
    if (notificationUrl) {
      try {
        await fetch(notificationUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: notificationChannel,
            reminder: reminderData
          })
        });
      } catch (error) {
        await logError(error, { endpoint: 'Failed to send reminder webhook', category: 'api' }, env);
      }
    }

    logBusinessEvent('payment_reminder_sent', {
      month,
      endpoint: '/api/webhooks/n8n/payment-reminder'
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment reminder processed',
      reminder: reminderData,
      sent: !!notificationUrl
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Reminder Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'REMINDER_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
