/**
 * Migration Testing API Endpoint
 * Phase 49: Database Optimization & Performance Tuning
 * 
 * POST /api/admin/migration-test
 * - Test migration in dry-run mode
 * - Validate migration safety
 * - Generate rollback script
 */

import { getUserIdFromToken } from '../auth.js';
import { getSecurityHeaders } from '../../utils/security.js';
import { logInfo, logError } from '../../utils/logging.js';
import { 
  parseSQLStatements, 
  validateMigrationStatements,
  assessMigrationSafety,
  generateRollbackScript,
  dryRunMigration
} from '../../utils/migrationDryRun.js';

// CORS headers
const corsHeaders = {
  ...getSecurityHeaders(),
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

/**
 * Main handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Verify authentication
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify admin role
    const userStmt = env.DB.prepare('SELECT role FROM users WHERE id = ?');
    const user = await userStmt.bind(userId).first();
    
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { sql, dryRun = true } = body;

    if (!sql) {
      return new Response(JSON.stringify({ error: 'SQL content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse SQL statements
    const statements = parseSQLStatements(sql);

    if (statements.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid SQL statements found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate statements
    const validation = validateMigrationStatements(statements);

    // Assess safety
    const safety = assessMigrationSafety(statements);

    // Generate rollback script
    const rollback = generateRollbackScript(statements);

    let dryRunResult = null;
    if (dryRun) {
      // Execute dry-run
      dryRunResult = await dryRunMigration(env.DB, statements);
    }

    const result = {
      success: true,
      analysis: {
        totalStatements: statements.length,
        validation,
        safety,
        rollback: rollback.join(';\n')
      }
    };

    if (dryRunResult) {
      result.dryRun = dryRunResult;
    }

    logInfo('Migration test completed', { userId, statementCount: statements.length }, env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Migration test error', error, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
