// Cloudflare Pages Worker - Avanta Finance
// This file handles all API routes for the Avanta Finance application
// Security: Enforces authentication on all protected endpoints

import { getUserIdFromToken } from './api/auth.js';

/**
 * Authentication middleware
 * Verifies JWT token and returns user ID or error response
 */
async function authenticateRequest(request, env) {
  const userId = await getUserIdFromToken(request, env);
  if (!userId) {
    return {
      isAuthenticated: false,
      response: new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      })
    };
  }
  return { isAuthenticated: true, userId };
}

/**
 * Check if endpoint requires authentication
 */
function isPublicEndpoint(path) {
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
  ];
  
  return publicPaths.some(publicPath => path.endsWith(publicPath));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
      // Route API requests to appropriate handlers
      if (path.startsWith('/api/')) {
        // Enforce authentication for protected endpoints
        if (!isPublicEndpoint(path)) {
          const authResult = await authenticateRequest(request, env);
          if (!authResult.isAuthenticated) {
            return authResult.response;
          }
          // User is authenticated, proceed with request
        }
        
        const apiPath = path.replace('/api/', '');
        
        // Handle auth endpoints (with sub-paths)
        if (apiPath.startsWith('auth/')) {
          const authModule = await import('./api/auth.js');
          const authResponse = await authModule.onRequest({ request, env, ctx });
          return authResponse;
        }
        
        // Import and execute the appropriate API handler
        switch (apiPath) {
          case 'dashboard':
            const dashboardModule = await import('./api/dashboard.js');
            const dashboardResponse = await dashboardModule.default(request, env, ctx);
            return new Response(dashboardResponse.body, {
              status: dashboardResponse.status || 200,
              headers: { ...corsHeaders, ...dashboardResponse.headers },
            });

          case 'transactions':
            const transactionsModule = await import('./api/transactions.js');
            const transactionsResponse = await transactionsModule.default(request, env, ctx);
            return new Response(transactionsResponse.body, {
              status: transactionsResponse.status || 200,
              headers: { ...corsHeaders, ...transactionsResponse.headers },
            });

          case 'accounts':
            const accountsModule = await import('./api/accounts.js');
            const accountsResponse = await accountsModule.default(request, env, ctx);
            return new Response(accountsResponse.body, {
              status: accountsResponse.status || 200,
              headers: { ...corsHeaders, ...accountsResponse.headers },
            });

          case 'categories':
            const categoriesModule = await import('./api/categories.js');
            const categoriesResponse = await categoriesModule.default(request, env, ctx);
            return new Response(categoriesResponse.body, {
              status: categoriesResponse.status || 200,
              headers: { ...corsHeaders, ...categoriesResponse.headers },
            });

          case 'budgets':
            const budgetsModule = await import('./api/budgets.js');
            const budgetsResponse = await budgetsModule.default(request, env, ctx);
            return new Response(budgetsResponse.body, {
              status: budgetsResponse.status || 200,
              headers: { ...corsHeaders, ...budgetsResponse.headers },
            });

          case 'fiscal':
            const fiscalModule = await import('./api/fiscal.js');
            const fiscalResponse = await fiscalModule.default(request, env, ctx);
            return new Response(fiscalResponse.body, {
              status: fiscalResponse.status || 200,
              headers: { ...corsHeaders, ...fiscalResponse.headers },
            });

          case 'invoices':
            const invoicesModule = await import('./api/invoices.js');
            const invoicesResponse = await invoicesModule.default(request, env, ctx);
            return new Response(invoicesResponse.body, {
              status: invoicesResponse.status || 200,
              headers: { ...corsHeaders, ...invoicesResponse.headers },
            });

          case 'upload':
            const uploadModule = await import('./api/upload.js');
            const uploadResponse = await uploadModule.default(request, env, ctx);
            return new Response(uploadResponse.body, {
              status: uploadResponse.status || 200,
              headers: { ...corsHeaders, ...uploadResponse.headers },
            });

          case 'analytics':
            const analyticsModule = await import('./api/analytics.js');
            const analyticsResponse = await analyticsModule.default(request, env, ctx);
            return new Response(analyticsResponse.body, {
              status: analyticsResponse.status || 200,
              headers: { ...corsHeaders, ...analyticsResponse.headers },
            });

          case 'reports':
            const reportsModule = await import('./api/reports.js');
            const reportsResponse = await reportsModule.default(request, env, ctx);
            return new Response(reportsResponse.body, {
              status: reportsResponse.status || 200,
              headers: { ...corsHeaders, ...reportsResponse.headers },
            });

          case 'fiscal-config':
            const fiscalConfigModule = await import('./api/fiscal-config.js');
            const fiscalConfigResponse = await fiscalConfigModule.default(request, env, ctx);
            return new Response(fiscalConfigResponse.body, {
              status: fiscalConfigResponse.status || 200,
              headers: { ...corsHeaders, ...fiscalConfigResponse.headers },
            });

          case 'automation':
            const automationModule = await import('./api/automation.js');
            const automationResponse = await automationModule.default(request, env, ctx);
            return new Response(automationResponse.body, {
              status: automationResponse.status || 200,
              headers: { ...corsHeaders, ...automationResponse.headers },
            });

          case 'receivables':
            const receivablesModule = await import('./api/receivables.js');
            const receivablesResponse = await receivablesModule.default(request, env, ctx);
            return new Response(receivablesResponse.body, {
              status: receivablesResponse.status || 200,
              headers: { ...corsHeaders, ...receivablesResponse.headers },
            });

          case 'payables':
            const payablesModule = await import('./api/payables.js');
            const payablesResponse = await payablesModule.default(request, env, ctx);
            return new Response(payablesResponse.body, {
              status: payablesResponse.status || 200,
              headers: { ...corsHeaders, ...payablesResponse.headers },
            });

          case 'reconciliation':
            const reconciliationModule = await import('./api/reconciliation.js');
            const reconciliationResponse = await reconciliationModule.default(request, env, ctx);
            return new Response(reconciliationResponse.body, {
              status: reconciliationResponse.status || 200,
              headers: { ...corsHeaders, ...reconciliationResponse.headers },
            });

          case 'invoice-reconciliation':
            const invoiceReconciliationModule = await import('./api/invoice-reconciliation.js');
            const invoiceReconciliationResponse = await invoiceReconciliationModule.default(request, env, ctx);
            return new Response(invoiceReconciliationResponse.body, {
              status: invoiceReconciliationResponse.status || 200,
              headers: { ...corsHeaders, ...invoiceReconciliationResponse.headers },
            });

          case 'errors':
            const errorsModule = await import('./api/errors.js');
            const errorsResponse = await errorsModule.default(request, env, ctx);
            return new Response(errorsResponse.body, {
              status: errorsResponse.status || 200,
              headers: { ...corsHeaders, ...errorsResponse.headers },
            });

          case 'webhooks/n8n':
            const n8nModule = await import('./api/webhooks/n8n.js');
            const n8nResponse = await n8nModule.default(request, env, ctx);
            return new Response(n8nResponse.body, {
              status: n8nResponse.status || 200,
              headers: { ...corsHeaders, ...n8nResponse.headers },
            });

          default:
            // Handle credits API with path parameters (/api/credits/:id, /api/credits/:id/movements)
            if (apiPath.startsWith('credits')) {
              const creditsModule = await import('./api/credits.js');
              const creditsResponse = await creditsModule.default(request, env, ctx);
              return new Response(creditsResponse.body, {
                status: creditsResponse.status || 200,
                headers: { ...corsHeaders, ...creditsResponse.headers },
              });
            }
            return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
      }

      // For non-API requests, let Cloudflare Pages handle static files
      return env.ASSETS.fetch(request);

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
