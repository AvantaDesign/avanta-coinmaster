// Categories API - Manage custom transaction categories
// Phase 31: Enhanced with comprehensive security, validation, and error handling

import { getUserIdFromToken } from './auth.js';
import { createApiHandler } from '../utils/middleware.js';
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '../utils/errors.js';
import { validateEnum, validateStringLength, sanitizeString, isSafeSqlValue } from '../utils/validation.js';
import { logAuditEvent } from '../utils/logging.js';
import { getSecurityHeaders } from '../utils/security.js';

/**
 * GET /api/categories
 * List categories with filtering
 */
async function handleGet(context) {
  const { env, request, userId } = context;
  
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const categoryType = url.searchParams.get('category_type');
    
    // Validate category_type if provided
    if (categoryType) {
      const validation = validateEnum(categoryType, ['personal', 'business'], 'category_type');
      if (!validation.valid) {
        return createValidationErrorResponse(validation.error);
      }
      
      // Additional SQL injection check
      if (!isSafeSqlValue(categoryType)) {
        return createValidationErrorResponse('Invalid category_type parameter');
      }
    }
    
    // Build query with validated parameters
    let query = 'SELECT * FROM categories WHERE user_id = ? AND is_active = 1';
    const params = [userId];
    
    if (categoryType) {
      query += ' AND category_type = ?';
      params.push(categoryType);
    }
    
    query += ' ORDER BY name';
    
    // Execute query
    const result = await env.DB.prepare(query).bind(...params).all();
    
    return createSuccessResponse({
      success: true,
      data: result.results || [],
      count: result.results?.length || 0
    });
  } catch (error) {
    await logError(error, { endpoint: 'Categories GET error', category: 'api' }, env);
    return createErrorResponse(error, request, env);
  }
}

/**
 * POST /api/categories
 * Create new category with validation
 */
async function handlePost(context) {
  const { env, request, userId } = context;
  
  try {
    const data = await request.json();
    
    // Comprehensive validation
    const errors = [];
    
    // Validate name
    const nameValidation = validateStringLength(data.name, 1, 100, 'name');
    if (!nameValidation.valid) {
      errors.push(nameValidation.error);
    }
    
    // Validate category_type
    const typeValidation = validateEnum(data.category_type, ['personal', 'business'], 'category_type');
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
    }
    
    // Return validation errors if any
    if (errors.length > 0) {
      return createValidationErrorResponse(errors);
    }
    
    // Sanitize inputs
    const sanitizedName = sanitizeString(data.name);
    const sanitizedDescription = data.description ? sanitizeString(data.description) : null;
    
    // Check for duplicates
    const existing = await env.DB.prepare(
      'SELECT id FROM categories WHERE user_id = ? AND name = ? AND is_active = 1'
    ).bind(userId, sanitizedName).first();
    
    if (existing) {
      return createValidationErrorResponse('Category with this name already exists');
    }
    
    // Insert category
    const result = await env.DB.prepare(`
      INSERT INTO categories (user_id, name, description, category_type, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).bind(userId, sanitizedName, sanitizedDescription, data.category_type).run();
    
    // Log audit event
    await logAuditEvent('create', 'category', {
      userId,
      categoryId: result.meta.last_row_id,
      categoryName: sanitizedName
    }, env);
    
    return createSuccessResponse({
      success: true,
      message: 'Category created successfully',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    await logError(error, { endpoint: 'Categories POST error', category: 'api' }, env);
    return createErrorResponse(error, request, env);
  }
}

/**
 * OPTIONS /api/categories
 * CORS preflight handler
 */
async function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}

// Export handlers using middleware wrapper
export const onRequestGet = createApiHandler(
  { get: handleGet },
  {
    requiresAuth: true,
    requiresDb: true,
    enableRateLimit: true,
    enableLogging: true
  }
).onRequestGet;

export const onRequestPost = createApiHandler(
  { post: handlePost },
  {
    requiresAuth: true,
    requiresDb: true,
    enableRateLimit: true,
    enableLogging: true
  }
).onRequestPost;

export const onRequestOptions = handleOptions;
