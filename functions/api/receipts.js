// Receipts API - Handle receipt upload, OCR processing, and management
//
// Features:
// - Upload receipts to R2 storage
// - Track OCR processing status
// - Link receipts to transactions
// - Retrieve and manage receipts

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to generate receipt ID
function generateReceiptId() {
  return `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper function to get user ID from request (mock for now)
function getUserId(request) {
  // TODO: Implement proper authentication
  // For now, return a default user ID
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract user ID from token if available
    return 'user_1'; // Placeholder
  }
  return 'user_1'; // Default user
}

// POST /api/receipts/upload - Upload receipt image
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  try {
    // Check if this is an OCR processing request
    if (url.pathname.includes('/process')) {
      return await processReceipt(context);
    }

    // Check if this is a link-transaction request
    if (url.pathname.includes('/link-transaction')) {
      return await linkTransaction(context);
    }

    // Otherwise, handle upload
    return await uploadReceipt(context);
  } catch (error) {
    console.error('[Receipts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Upload receipt file
async function uploadReceipt(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  
  try {
    // Validate R2 connection
    if (!env.RECEIPTS) {
      return new Response(JSON.stringify({ 
        error: 'Storage not configured',
        code: 'R2_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        code: 'FILE_REQUIRED'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type',
        allowed: allowedTypes,
        received: file.type,
        code: 'INVALID_FILE_TYPE'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ 
        error: 'File too large',
        maxSizeMB: maxSize / 1024 / 1024,
        receivedMB: (file.size / 1024 / 1024).toFixed(2),
        code: 'FILE_TOO_LARGE'
      }), {
        status: 413,
        headers: corsHeaders
      });
    }
    
    // Generate receipt ID and file path
    const receiptId = generateReceiptId();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `receipts/${userId}/${timestamp}-${sanitizedName}`;
    
    // Upload to R2
    await env.RECEIPTS.put(filePath, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        userId: userId,
        receiptId: receiptId,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Create receipt record in database
    await env.DB.prepare(`
      INSERT INTO receipts (
        id, user_id, file_name, file_path, file_size, mime_type, ocr_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(receiptId, userId, file.name, filePath, file.size, file.type).run();
    
    // Retrieve the created receipt
    const receipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ?
    `).bind(receiptId).first();
    
    return new Response(JSON.stringify({ 
      success: true,
      receipt: receipt,
      message: 'Receipt uploaded successfully. OCR processing available.'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload receipt',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Process receipt with OCR (placeholder for now)
async function processReceipt(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const receiptId = pathParts[pathParts.length - 2]; // Get ID before '/process'
  
  try {
    // Get receipt from database
    const receipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ? AND user_id = ?
    `).bind(receiptId, userId).first();
    
    if (!receipt) {
      return new Response(JSON.stringify({ 
        error: 'Receipt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update status to processing
    await env.DB.prepare(`
      UPDATE receipts 
      SET ocr_status = 'processing', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(receiptId).run();

    // TODO: Implement actual OCR processing
    // For now, we'll mark it as skipped and provide a placeholder response
    const mockExtractedData = {
      amount: null,
      date: null,
      merchant: null,
      items: [],
      note: 'OCR processing not yet implemented. Manual entry required.'
    };

    await env.DB.prepare(`
      UPDATE receipts 
      SET 
        ocr_status = 'skipped',
        extracted_data = ?,
        confidence_score = 0,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(JSON.stringify(mockExtractedData), receiptId).run();

    // Retrieve updated receipt
    const updatedReceipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ?
    `).bind(receiptId).first();

    return new Response(JSON.stringify({ 
      success: true,
      receipt: updatedReceipt,
      message: 'OCR processing placeholder completed. Manual data entry recommended.'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Process error:', error);
    
    // Update status to failed
    try {
      await env.DB.prepare(`
        UPDATE receipts 
        SET ocr_status = 'failed', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(receiptId).run();
    } catch (updateError) {
      console.error('[Receipts] Failed to update status:', updateError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process receipt',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Link receipt to transaction
async function linkTransaction(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const receiptId = pathParts[pathParts.length - 2]; // Get ID before '/link-transaction'
  
  try {
    const body = await request.json();
    const { transaction_id } = body;
    
    if (!transaction_id) {
      return new Response(JSON.stringify({ 
        error: 'Transaction ID required',
        code: 'TRANSACTION_ID_REQUIRED'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify receipt exists and belongs to user
    const receipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ? AND user_id = ?
    `).bind(receiptId, userId).first();
    
    if (!receipt) {
      return new Response(JSON.stringify({ 
        error: 'Receipt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify transaction exists and belongs to user
    const transaction = await env.DB.prepare(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `).bind(transaction_id, userId).first();
    
    if (!transaction) {
      return new Response(JSON.stringify({ 
        error: 'Transaction not found',
        code: 'TRANSACTION_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update receipt with transaction_id
    await env.DB.prepare(`
      UPDATE receipts 
      SET transaction_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(transaction_id, receiptId).run();

    // Update transaction with receipt_id
    await env.DB.prepare(`
      UPDATE transactions 
      SET receipt_id = ? 
      WHERE id = ?
    `).bind(receiptId, transaction_id).run();

    // Retrieve updated receipt
    const updatedReceipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ?
    `).bind(receiptId).first();

    return new Response(JSON.stringify({ 
      success: true,
      receipt: updatedReceipt,
      message: 'Receipt linked to transaction successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Link transaction error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to link receipt to transaction',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// GET /api/receipts - List user receipts with filtering
export async function onRequestGet(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  const url = new URL(request.url);
  
  try {
    // Check if getting a specific receipt
    const pathParts = url.pathname.split('/');
    if (pathParts.length > 3 && pathParts[3] !== '') {
      const receiptId = pathParts[3];
      return await getReceipt(context, receiptId, userId);
    }

    // Otherwise, list receipts with filtering
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    let query = 'SELECT * FROM receipts WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      query += ' AND ocr_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const receipts = await env.DB.prepare(query).bind(...params).all();
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM receipts WHERE user_id = ?';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND ocr_status = ?';
      countParams.push(status);
    }
    const { total } = await env.DB.prepare(countQuery).bind(...countParams).first();
    
    return new Response(JSON.stringify({ 
      success: true,
      receipts: receipts.results || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] List error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve receipts',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Get specific receipt
async function getReceipt(context, receiptId, userId) {
  const { env } = context;
  
  try {
    const receipt = await env.DB.prepare(`
      SELECT r.*, t.description as transaction_description, t.amount as transaction_amount
      FROM receipts r
      LEFT JOIN transactions t ON r.transaction_id = t.id
      WHERE r.id = ? AND r.user_id = ?
    `).bind(receiptId, userId).first();
    
    if (!receipt) {
      return new Response(JSON.stringify({ 
        error: 'Receipt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Parse extracted_data if it exists
    if (receipt.extracted_data) {
      try {
        receipt.extracted_data = JSON.parse(receipt.extracted_data);
      } catch (e) {
        console.error('[Receipts] Failed to parse extracted_data:', e);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      receipt: receipt
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Get receipt error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve receipt',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT /api/receipts/:id - Update receipt data
export async function onRequestPut(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const receiptId = pathParts[pathParts.length - 1];
  
  try {
    const body = await request.json();
    const { extracted_data, ocr_text, confidence_score } = body;
    
    // Verify receipt exists and belongs to user
    const receipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ? AND user_id = ?
    `).bind(receiptId, userId).first();
    
    if (!receipt) {
      return new Response(JSON.stringify({ 
        error: 'Receipt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const params = [];
    
    if (extracted_data !== undefined) {
      updates.push('extracted_data = ?');
      params.push(JSON.stringify(extracted_data));
    }
    if (ocr_text !== undefined) {
      updates.push('ocr_text = ?');
      params.push(ocr_text);
    }
    if (confidence_score !== undefined) {
      updates.push('confidence_score = ?');
      params.push(confidence_score);
    }
    
    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'NO_UPDATES'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(receiptId);
    
    const query = `UPDATE receipts SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...params).run();
    
    // Retrieve updated receipt
    const updatedReceipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ?
    `).bind(receiptId).first();
    
    return new Response(JSON.stringify({ 
      success: true,
      receipt: updatedReceipt,
      message: 'Receipt updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update receipt',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE /api/receipts/:id - Delete receipt and file
export async function onRequestDelete(context) {
  const { env, request } = context;
  const userId = getUserId(request);
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const receiptId = pathParts[pathParts.length - 1];
  
  try {
    // Get receipt to verify it exists and get file path
    const receipt = await env.DB.prepare(`
      SELECT * FROM receipts WHERE id = ? AND user_id = ?
    `).bind(receiptId, userId).first();
    
    if (!receipt) {
      return new Response(JSON.stringify({ 
        error: 'Receipt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete file from R2
    if (env.RECEIPTS && receipt.file_path) {
      try {
        await env.RECEIPTS.delete(receipt.file_path);
      } catch (r2Error) {
        console.error('[Receipts] R2 delete error:', r2Error);
        // Continue with database deletion even if R2 delete fails
      }
    }

    // Unlink from transaction if linked
    if (receipt.transaction_id) {
      await env.DB.prepare(`
        UPDATE transactions 
        SET receipt_id = NULL 
        WHERE id = ?
      `).bind(receipt.transaction_id).run();
    }

    // Delete receipt record
    await env.DB.prepare(`
      DELETE FROM receipts WHERE id = ?
    `).bind(receiptId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Receipt deleted successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Receipts] Delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete receipt',
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// OPTIONS - CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
