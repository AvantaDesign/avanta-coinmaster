// Help Center API - Comprehensive help system with articles and search
// 
// This API handles all help center operations including:
// - List categories and articles
// - Get article details with view tracking
// - Search across titles, content, and tags
// - Submit user feedback
// - Track article helpfulness
//
// Phase 38: Help Center and Onboarding Guide Expansion

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { sanitizeString, validatePagination, validateSort, isSafeSqlValue } from '../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';

/**
 * GET /api/help-center
 * GET /api/help-center/categories
 * GET /api/help-center/articles
 * GET /api/help-center/articles/:slug
 * GET /api/help-center/search?q=query
 * GET /api/help-center/featured
 */
export async function onRequestGet(context) {
  const { env, request, params } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/api/help-center')[1] || '';
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'help-center', method: 'GET', path }, env);

    // Optional: Get user ID (not required for help center access)
    let userId = null;
    try {
      userId = await getUserIdFromToken(request, env);
    } catch (e) {
      // Help center is accessible without authentication
    }

    // Route to appropriate handler
    if (path === '' || path === '/') {
      return handleGetOverview(env, corsHeaders);
    } else if (path === '/categories') {
      return handleGetCategories(env, corsHeaders);
    } else if (path === '/articles') {
      return handleGetArticles(env, url, corsHeaders);
    } else if (path.startsWith('/articles/')) {
      const slug = path.split('/articles/')[1];
      return handleGetArticle(env, slug, userId, corsHeaders);
    } else if (path === '/search') {
      const query = url.searchParams.get('q');
      return handleSearch(env, query, corsHeaders);
    } else if (path === '/featured') {
      return handleGetFeatured(env, corsHeaders);
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Invalid help center endpoint'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError(error, { endpoint: 'help-center', method: 'GET' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * POST /api/help-center/feedback
 * POST /api/help-center/articles/:slug/view
 * POST /api/help-center/articles/:slug/helpful
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/api/help-center')[1] || '';
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'help-center', method: 'POST', path }, env);

    // Get user ID (required for POST operations)
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (path === '/feedback') {
      const data = await request.json();
      return handleSubmitFeedback(env, userId, data, corsHeaders);
    } else if (path.match(/\/articles\/[\w-]+\/helpful/)) {
      const slug = path.split('/articles/')[1].split('/helpful')[0];
      const data = await request.json();
      return handleMarkHelpful(env, userId, slug, data, corsHeaders);
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Invalid help center endpoint'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError(error, { endpoint: 'help-center', method: 'POST' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

// Helper: Get overview with categories and featured articles
async function handleGetOverview(env, corsHeaders) {
  const categories = await env.DB.prepare(`
    SELECT id, name, slug, description, icon, display_order
    FROM help_categories
    WHERE is_active = 1
    ORDER BY display_order ASC, name ASC
  `).all();

  const featured = await env.DB.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.estimated_read_time,
      a.difficulty_level, a.view_count, a.helpful_count,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM help_articles a
    JOIN help_categories c ON a.category_id = c.id
    WHERE a.is_published = 1 AND a.is_featured = 1
    ORDER BY a.display_order ASC, a.view_count DESC
    LIMIT 6
  `).all();

  return new Response(JSON.stringify({
    success: true,
    data: {
      categories: categories.results || [],
      featured: featured.results || []
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Get all categories
async function handleGetCategories(env, corsHeaders) {
  const categories = await env.DB.prepare(`
    SELECT 
      c.id, c.name, c.slug, c.description, c.icon, c.display_order,
      COUNT(a.id) as article_count
    FROM help_categories c
    LEFT JOIN help_articles a ON c.id = a.category_id AND a.is_published = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.name ASC
  `).all();

  return new Response(JSON.stringify({
    success: true,
    data: categories.results || []
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Get articles list with optional category filter
async function handleGetArticles(env, url, corsHeaders) {
  const categorySlug = url.searchParams.get('category');
  const difficulty = url.searchParams.get('difficulty');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = `
    SELECT 
      a.id, a.title, a.slug, a.summary, a.estimated_read_time,
      a.difficulty_level, a.view_count, a.helpful_count, a.not_helpful_count,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM help_articles a
    JOIN help_categories c ON a.category_id = c.id
    WHERE a.is_published = 1
  `;

  const params = [];

  if (categorySlug && isSafeSqlValue(categorySlug)) {
    query += ` AND c.slug = ?`;
    params.push(categorySlug);
  }

  if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
    query += ` AND a.difficulty_level = ?`;
    params.push(difficulty);
  }

  query += ` ORDER BY a.display_order ASC, a.view_count DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const articles = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({
    success: true,
    data: articles.results || [],
    pagination: {
      limit,
      offset,
      count: articles.results?.length || 0
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Get single article by slug
async function handleGetArticle(env, slug, userId, corsHeaders) {
  if (!slug || !isSafeSqlValue(slug)) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Article slug is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const article = await env.DB.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.content, a.tags,
      a.difficulty_level, a.estimated_read_time,
      a.view_count, a.helpful_count, a.not_helpful_count,
      a.created_at, a.updated_at,
      c.id as category_id, c.name as category_name, 
      c.slug as category_slug, c.icon as category_icon
    FROM help_articles a
    JOIN help_categories c ON a.category_id = c.id
    WHERE a.slug = ? AND a.is_published = 1
  `).bind(slug).first();

  if (!article) {
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Article not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Increment view count
  await env.DB.prepare(`
    UPDATE help_articles 
    SET view_count = view_count + 1
    WHERE id = ?
  `).bind(article.id).run();

  // Get related articles from same category
  const related = await env.DB.prepare(`
    SELECT id, title, slug, summary, estimated_read_time, difficulty_level
    FROM help_articles
    WHERE category_id = ? AND id != ? AND is_published = 1
    ORDER BY view_count DESC
    LIMIT 3
  `).bind(article.category_id, article.id).all();

  return new Response(JSON.stringify({
    success: true,
    data: {
      ...article,
      related: related.results || []
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Search articles
async function handleSearch(env, query, corsHeaders) {
  if (!query || query.trim().length < 2) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Search query must be at least 2 characters'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const searchTerm = sanitizeString(query).toLowerCase();
  const searchPattern = `%${searchTerm}%`;

  const results = await env.DB.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.estimated_read_time,
      a.difficulty_level, a.view_count,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM help_articles a
    JOIN help_categories c ON a.category_id = c.id
    WHERE a.is_published = 1 AND (
      LOWER(a.title) LIKE ? OR
      LOWER(a.summary) LIKE ? OR
      LOWER(a.content) LIKE ? OR
      LOWER(a.tags) LIKE ?
    )
    ORDER BY 
      CASE 
        WHEN LOWER(a.title) LIKE ? THEN 1
        WHEN LOWER(a.summary) LIKE ? THEN 2
        WHEN LOWER(a.tags) LIKE ? THEN 3
        ELSE 4
      END,
      a.view_count DESC
    LIMIT 20
  `).bind(
    searchPattern, searchPattern, searchPattern, searchPattern,
    searchPattern, searchPattern, searchPattern
  ).all();

  return new Response(JSON.stringify({
    success: true,
    data: results.results || [],
    query: query
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Get featured articles
async function handleGetFeatured(env, corsHeaders) {
  const featured = await env.DB.prepare(`
    SELECT 
      a.id, a.title, a.slug, a.summary, a.estimated_read_time,
      a.difficulty_level, a.view_count, a.helpful_count,
      c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM help_articles a
    JOIN help_categories c ON a.category_id = c.id
    WHERE a.is_published = 1 AND a.is_featured = 1
    ORDER BY a.display_order ASC, a.view_count DESC
    LIMIT 6
  `).all();

  return new Response(JSON.stringify({
    success: true,
    data: featured.results || []
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Submit feedback
async function handleSubmitFeedback(env, userId, data, corsHeaders) {
  const { article_id, feedback_type, rating, comment, page_url } = data;

  if (!feedback_type || !['helpful', 'not_helpful', 'suggestion', 'bug_report'].includes(feedback_type)) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Valid feedback_type is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const sanitizedComment = comment ? sanitizeString(comment) : null;
  const sanitizedPageUrl = page_url ? sanitizeString(page_url) : null;

  await env.DB.prepare(`
    INSERT INTO help_feedback (user_id, article_id, feedback_type, rating, comment, page_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    article_id || null,
    feedback_type,
    rating || null,
    sanitizedComment,
    sanitizedPageUrl
  ).run();

  logAuditEvent(env, userId, 'help_feedback_submitted', { feedback_type, article_id });

  return new Response(JSON.stringify({
    success: true,
    message: 'Feedback submitted successfully'
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Mark article as helpful/not helpful
async function handleMarkHelpful(env, userId, slug, data, corsHeaders) {
  const { helpful } = data;

  if (typeof helpful !== 'boolean') {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'helpful must be a boolean'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const article = await env.DB.prepare(`
    SELECT id FROM help_articles WHERE slug = ?
  `).bind(slug).first();

  if (!article) {
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Article not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const field = helpful ? 'helpful_count' : 'not_helpful_count';
  await env.DB.prepare(`
    UPDATE help_articles 
    SET ${field} = ${field} + 1
    WHERE id = ?
  `).bind(article.id).run();

  // Also record in feedback table
  await env.DB.prepare(`
    INSERT INTO help_feedback (user_id, article_id, feedback_type)
    VALUES (?, ?, ?)
  `).bind(userId, article.id, helpful ? 'helpful' : 'not_helpful').run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Feedback recorded'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
