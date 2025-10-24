/**
 * Migration Dry-Run Utility
 * Phase 49: Database Optimization & Performance Tuning
 * 
 * Provides safe migration testing with rollback capabilities
 */

/**
 * Parse SQL migration file into individual statements
 * @param {string} sqlContent - SQL file content
 * @returns {Array<string>} Array of SQL statements
 */
export function parseSQLStatements(sqlContent) {
  // Remove comments
  const withoutComments = sqlContent
    .replace(/--[^\n]*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Split by semicolons, but not within strings
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const prevChar = i > 0 ? withoutComments[i - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (char === ';' && !inString) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }

  // Add last statement if exists
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements.filter(s => s.length > 0);
}

/**
 * Validate migration statements without executing
 * @param {Array<string>} statements - SQL statements
 * @returns {Object} Validation result
 */
export function validateMigrationStatements(statements) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    statements: []
  };

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const stmtInfo = {
      index: i,
      statement: stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''),
      type: detectStatementType(stmt),
      safe: true
    };

    // Check for dangerous operations
    if (stmt.match(/DROP\s+TABLE/i)) {
      stmtInfo.safe = false;
      results.warnings.push({
        statement: i,
        message: 'DROP TABLE detected - data will be lost',
        severity: 'high'
      });
    }

    if (stmt.match(/DELETE\s+FROM/i) && !stmt.match(/WHERE/i)) {
      stmtInfo.safe = false;
      results.warnings.push({
        statement: i,
        message: 'DELETE without WHERE clause - all data will be deleted',
        severity: 'critical'
      });
    }

    if (stmt.match(/UPDATE/i) && !stmt.match(/WHERE/i)) {
      stmtInfo.safe = false;
      results.warnings.push({
        statement: i,
        message: 'UPDATE without WHERE clause - all rows will be updated',
        severity: 'high'
      });
    }

    // Check for CREATE INDEX on large tables (potential lock issues)
    if (stmt.match(/CREATE\s+INDEX/i)) {
      results.warnings.push({
        statement: i,
        message: 'CREATE INDEX may take time on large tables',
        severity: 'low'
      });
    }

    results.statements.push(stmtInfo);
  }

  return results;
}

/**
 * Detect SQL statement type
 * @param {string} statement - SQL statement
 * @returns {string} Statement type
 */
function detectStatementType(statement) {
  const stmt = statement.toUpperCase().trim();
  
  if (stmt.startsWith('CREATE TABLE')) return 'CREATE_TABLE';
  if (stmt.startsWith('CREATE INDEX')) return 'CREATE_INDEX';
  if (stmt.startsWith('CREATE VIEW')) return 'CREATE_VIEW';
  if (stmt.startsWith('ALTER TABLE')) return 'ALTER_TABLE';
  if (stmt.startsWith('DROP TABLE')) return 'DROP_TABLE';
  if (stmt.startsWith('DROP INDEX')) return 'DROP_INDEX';
  if (stmt.startsWith('DROP VIEW')) return 'DROP_VIEW';
  if (stmt.startsWith('INSERT')) return 'INSERT';
  if (stmt.startsWith('UPDATE')) return 'UPDATE';
  if (stmt.startsWith('DELETE')) return 'DELETE';
  if (stmt.startsWith('SELECT')) return 'SELECT';
  
  return 'UNKNOWN';
}

/**
 * Execute migration in dry-run mode
 * @param {Object} db - Database connection
 * @param {Array<string>} statements - SQL statements
 * @returns {Promise<Object>} Dry-run result
 */
export async function dryRunMigration(db, statements) {
  const result = {
    success: true,
    totalStatements: statements.length,
    executed: 0,
    failed: 0,
    results: [],
    duration: 0
  };

  const startTime = Date.now();

  // Start a transaction for dry-run
  try {
    await db.prepare('BEGIN TRANSACTION').run();

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      try {
        // Try to prepare the statement (validates syntax)
        const prepared = db.prepare(stmt);
        
        // For CREATE/ALTER/DROP, we can just validate
        // For INSERT/UPDATE/DELETE, we can execute but will rollback
        const stmtType = detectStatementType(stmt);
        
        if (['INSERT', 'UPDATE', 'DELETE'].includes(stmtType)) {
          // Execute to test but will rollback
          await prepared.run();
        }
        
        result.results.push({
          index: i,
          statement: stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''),
          type: stmtType,
          status: 'success',
          message: 'Statement validated successfully'
        });
        
        result.executed++;
      } catch (error) {
        result.success = false;
        result.failed++;
        result.results.push({
          index: i,
          statement: stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''),
          type: detectStatementType(stmt),
          status: 'error',
          message: error.message
        });
      }
    }

    // Always rollback - this is a dry run
    await db.prepare('ROLLBACK').run();
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
    
    // Try to rollback on error
    try {
      await db.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      result.rollbackError = rollbackError.message;
    }
  }

  result.duration = Date.now() - startTime;
  
  return result;
}

/**
 * Generate migration rollback script
 * @param {Array<string>} statements - Original SQL statements
 * @returns {Array<string>} Rollback statements
 */
export function generateRollbackScript(statements) {
  const rollback = [];

  for (const stmt of statements) {
    const type = detectStatementType(stmt);

    if (type === 'CREATE_TABLE') {
      // Extract table name
      const match = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
      if (match) {
        rollback.unshift(`DROP TABLE IF EXISTS ${match[1]}`);
      }
    } else if (type === 'CREATE_INDEX') {
      // Extract index name
      const match = stmt.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s]+)/i);
      if (match) {
        rollback.unshift(`DROP INDEX IF EXISTS ${match[1]}`);
      }
    } else if (type === 'CREATE_VIEW') {
      // Extract view name
      const match = stmt.match(/CREATE\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
      if (match) {
        rollback.unshift(`DROP VIEW IF EXISTS ${match[1]}`);
      }
    } else if (type === 'ALTER_TABLE') {
      // ALTER TABLE rollback is complex and would need backup data
      rollback.unshift(`-- MANUAL ROLLBACK REQUIRED: ${stmt.substring(0, 100)}...`);
    }
  }

  return rollback;
}

/**
 * Migration safety checker
 * @param {Array<string>} statements - SQL statements
 * @returns {Object} Safety assessment
 */
export function assessMigrationSafety(statements) {
  const validation = validateMigrationStatements(statements);
  
  const criticalWarnings = validation.warnings.filter(w => w.severity === 'critical');
  const highWarnings = validation.warnings.filter(w => w.severity === 'high');
  
  let safetyLevel = 'safe';
  if (criticalWarnings.length > 0) {
    safetyLevel = 'dangerous';
  } else if (highWarnings.length > 0) {
    safetyLevel = 'risky';
  } else if (validation.warnings.length > 0) {
    safetyLevel = 'caution';
  }

  return {
    safetyLevel,
    canRollback: !statements.some(s => 
      detectStatementType(s) === 'ALTER_TABLE' ||
      detectStatementType(s) === 'DELETE' ||
      detectStatementType(s) === 'UPDATE'
    ),
    warnings: validation.warnings,
    recommendation: getSafetyRecommendation(safetyLevel, validation.warnings)
  };
}

/**
 * Get safety recommendation
 * @param {string} safetyLevel - Safety level
 * @param {Array} warnings - Warnings
 * @returns {string} Recommendation
 */
function getSafetyRecommendation(safetyLevel, warnings) {
  switch (safetyLevel) {
    case 'dangerous':
      return 'DO NOT RUN in production without backup. Contains data-destructive operations.';
    case 'risky':
      return 'Run with caution. Backup recommended before execution.';
    case 'caution':
      return 'Review warnings. Consider testing in development environment first.';
    case 'safe':
      return 'Migration appears safe. Standard testing recommended.';
    default:
      return 'Unknown safety level. Review migration carefully.';
  }
}

export default {
  parseSQLStatements,
  validateMigrationStatements,
  dryRunMigration,
  generateRollbackScript,
  assessMigrationSafety
};
