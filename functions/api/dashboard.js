// Dashboard API - Get balance and comprehensive financial summary
// This endpoint provides a complete overview of financial status including:
// - Total balance across all accounts
// - Current month income and expenses
// - Year-to-date statistics
// - Recent transactions
// - Category breakdowns
// - Spending trends
// - Account summaries
// Phase 30: Monetary values stored as INTEGER cents in database
// Phase 31: Backend Hardening and Security - Integrated security utilities

import { getUserIdFromToken } from './auth.js';
import { fromCents, convertArrayFromCents, MONETARY_FIELDS } from '../utils/monetary.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logRequest, logError } from '../utils/logging.js';
import { createErrorResponse } from '../utils/errors.js';

/**
 * GET /api/dashboard
 * Query Parameters:
 *   - period: 'month' | 'year' | 'all' (default: 'month')
 *   - include_categories: boolean (default: true)
 *   - include_accounts: boolean (default: true)
 *   - include_trends: boolean (default: true)
 *   - recent_limit: number (default: 10, max: 50)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  // Parse query parameters
  const period = url.searchParams.get('period') || 'month';
  const includeCategories = url.searchParams.get('include_categories') !== 'false';
  const includeAccounts = url.searchParams.get('include_accounts') !== 'false';
  const includeTrends = url.searchParams.get('include_trends') !== 'false';
  const recentLimit = Math.min(parseInt(url.searchParams.get('recent_limit') || '10'), 50);

  // Phase 31: Security headers with cache control
  const corsHeaders = {
    ...getSecurityHeaders(),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'dashboard', method: 'GET', period }, env);
    
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

    // Initialize response object
    const dashboardData = {
      timestamp: new Date().toISOString(),
      period,
      totalBalance: 0,
      thisMonth: {
        income: 0,
        expenses: 0,
        net: 0
      },
      recentTransactions: []
    };

    // Get total balance from all accounts for this user
    try {
      const accountsResult = await env.DB.prepare(
        'SELECT SUM(CASE WHEN type = "banco" THEN balance ELSE -balance END) as totalBalance FROM accounts WHERE user_id = ?'
      ).bind(userId).first();
      
      // Phase 30: Convert balance from cents to decimal
      dashboardData.totalBalance = fromCents(accountsResult?.totalBalance || 0);
    } catch (error) {
      await logError(error, { endpoint: 'Error fetching account balance', category: 'api' }, env);
      dashboardData.totalBalance = "0.00";
      dashboardData.warnings = dashboardData.warnings || [];
      dashboardData.warnings.push('Could not fetch account balance');
    }
    
    // Calculate date ranges based on period
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    } else if (period === 'all') {
      startDate = '2000-01-01'; // Far past date to include all
      endDate = '2099-12-31'; // Far future date
    } else { // default to 'month'
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    // Get current period income and expenses summary
    try {
      const monthSummary = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = ? AND date >= ? AND date <= ?
      `).bind(userId, startDate, endDate).first();
      
      // Phase 30: Convert amounts from cents to decimal
      const income = parseFloat(fromCents(monthSummary?.income || 0));
      const expenses = parseFloat(fromCents(monthSummary?.expenses || 0));
      dashboardData.thisMonth.income = income;
      dashboardData.thisMonth.expenses = expenses;
      dashboardData.thisMonth.net = income - expenses;
      dashboardData.thisMonth.transaction_count = monthSummary?.transaction_count || 0;
    } catch (error) {
      await logError(error, { endpoint: 'Error fetching period summary', category: 'api' }, env);
      dashboardData.warnings = dashboardData.warnings || [];
      dashboardData.warnings.push('Could not fetch period summary');
    }

    // Get category breakdown if requested
    if (includeCategories) {
      try {
        const categoryBreakdown = await env.DB.prepare(`
          SELECT 
            category,
            type,
            SUM(amount) as total,
            COUNT(*) as count
          FROM transactions
          WHERE user_id = ? AND date >= ? AND date <= ?
          GROUP BY category, type
          ORDER BY total DESC
        `).bind(userId, startDate, endDate).all();
        
        // Phase 30: Convert aggregated amounts from cents to decimal
        dashboardData.categoryBreakdown = (categoryBreakdown.results || []).map(item => ({
          ...item,
          total: fromCents(item.total)
        }));
      } catch (error) {
        await logError(error, { endpoint: 'Error fetching category breakdown', category: 'api' }, env);
        dashboardData.warnings = dashboardData.warnings || [];
        dashboardData.warnings.push('Could not fetch category breakdown');
      }
    }

    // Get account summaries if requested
    if (includeAccounts) {
      try {
        const accounts = await env.DB.prepare(
          'SELECT id, name, type, balance, updated_at FROM accounts WHERE user_id = ? ORDER BY type, name'
        ).bind(userId).all();
        
        // Phase 30: Convert balance from cents to decimal
        dashboardData.accounts = convertArrayFromCents(accounts.results || [], MONETARY_FIELDS.ACCOUNTS);
      } catch (error) {
        await logError(error, { endpoint: 'Error fetching accounts', category: 'api' }, env);
        dashboardData.warnings = dashboardData.warnings || [];
        dashboardData.warnings.push('Could not fetch accounts');
      }
    }

    // Get spending trends if requested (last 6 months)
    if (includeTrends && period !== 'all') {
      try {
        const trendsData = [];
        for (let i = 5; i >= 0; i--) {
          const trendMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const trendStart = new Date(trendMonth.getFullYear(), trendMonth.getMonth(), 1).toISOString().split('T')[0];
          const trendEnd = new Date(trendMonth.getFullYear(), trendMonth.getMonth() + 1, 0).toISOString().split('T')[0];
          
          const trendSummary = await env.DB.prepare(`
            SELECT 
              SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses
            FROM transactions
            WHERE user_id = ? AND date >= ? AND date <= ?
          `).bind(userId, trendStart, trendEnd).first();
          
          // Phase 30: Convert amounts from cents to decimal
          const income = parseFloat(fromCents(trendSummary?.income || 0));
          const expenses = parseFloat(fromCents(trendSummary?.expenses || 0));
          trendsData.push({
            month: trendMonth.toISOString().slice(0, 7), // YYYY-MM format
            income,
            expenses,
            net: income - expenses
          });
        }
        
        dashboardData.trends = trendsData;
      } catch (error) {
        await logError(error, { endpoint: 'Error fetching trends', category: 'api' }, env);
        dashboardData.warnings = dashboardData.warnings || [];
        dashboardData.warnings.push('Could not fetch spending trends');
      }
    }

    // Get recent transactions
    try {
      const recentTransactions = await env.DB.prepare(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?'
      ).bind(userId, recentLimit).all();
      
      // Phase 30: Convert amounts from cents to decimal
      dashboardData.recentTransactions = convertArrayFromCents(
        recentTransactions.results || [], 
        MONETARY_FIELDS.TRANSACTIONS
      );
    } catch (error) {
      await logError(error, { endpoint: 'Error fetching recent transactions', category: 'api' }, env);
      dashboardData.warnings = dashboardData.warnings || [];
      dashboardData.warnings.push('Could not fetch recent transactions');
    }

    // Get deductible expenses summary for tax purposes
    try {
      const deductibleSummary = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN is_deductible = 1 THEN amount ELSE 0 END) as deductible,
          COUNT(CASE WHEN is_deductible = 1 THEN 1 END) as deductible_count
        FROM transactions
        WHERE user_id = ? AND date >= ? AND date <= ? AND type = 'gasto'
      `).bind(userId, startDate, endDate).first();
      
      // Phase 30: Convert amount from cents to decimal
      dashboardData.deductible = {
        amount: fromCents(deductibleSummary?.deductible || 0),
        count: deductibleSummary?.deductible_count || 0
      };
    } catch (error) {
      await logError(error, { endpoint: 'Error fetching deductible summary', category: 'api' }, env);
      dashboardData.warnings = dashboardData.warnings || [];
      dashboardData.warnings.push('Could not fetch deductible expenses');
    }

    // Calculate quick financial health indicators
    dashboardData.indicators = {
      savingsRate: dashboardData.thisMonth.income > 0 
        ? ((dashboardData.thisMonth.net / dashboardData.thisMonth.income) * 100).toFixed(2)
        : 0,
      expenseRatio: dashboardData.thisMonth.income > 0
        ? ((dashboardData.thisMonth.expenses / dashboardData.thisMonth.income) * 100).toFixed(2)
        : 0,
      isPositive: dashboardData.thisMonth.net >= 0
    };

    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Dashboard API Error', category: 'api' }, env);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'dashboard',
      method: 'GET',
      userId,
      period
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function onRequestOptions(context) {
  // Phase 31: Use security headers
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
