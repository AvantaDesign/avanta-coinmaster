// Cloudflare Pages Worker - Avanta Finance
// This file handles all API routes for the Avanta Finance application

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
        const apiPath = path.replace('/api/', '');
        
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
