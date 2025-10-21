/**
 * Database Repository Pattern
 * Phase 43: SQL Injection Prevention & Database Security
 * 
 * Provides a safe, reusable pattern for database operations
 * with built-in SQL injection prevention.
 */

import { validateTableName, buildSafeOrderBy, validateLimit, validateOffset } from './sql-security.js';
import { logError } from './logging.js';

/**
 * Base Repository Class
 * Provides common database operations with security built-in
 */
export class BaseRepository {
  constructor(db, tableName, userId = null) {
    // Validate table name on construction
    const validation = validateTableName(tableName);
    if (!validation.valid) {
      throw new Error(`Invalid table name for repository: ${validation.error}`);
    }
    
    this.db = db;
    this.tableName = validation.sanitized;
    this.userId = userId;
  }

  /**
   * Find record by ID
   * @param {string} id - Record ID
   * @param {boolean} userScope - Whether to scope by user_id
   * @returns {Promise<Object|null>}
   */
  async findById(id, userScope = true) {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const params = [id];

      if (userScope && this.userId) {
        query += ' AND user_id = ?';
        params.push(this.userId);
      }

      const result = await this.db.prepare(query).bind(...params).first();
      return result || null;
    } catch (error) {
      await logError(error, {
        method: 'findById',
        table: this.tableName,
        id
      });
      throw error;
    }
  }

  /**
   * Find all records with filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    const {
      where = {},
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
      userScope = true
    } = options;

    try {
      let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      // Add user scope if enabled
      if (userScope && this.userId) {
        query += ' AND user_id = ?';
        params.push(this.userId);
      }

      // Add WHERE conditions
      for (const [field, value] of Object.entries(where)) {
        query += ` AND ${field} = ?`;
        params.push(value);
      }

      // Add ORDER BY with validation
      const orderBy = buildSafeOrderBy(this.tableName, sortBy, sortOrder);
      if (orderBy.valid) {
        query += orderBy.clause;
      } else {
        // Fallback to default ordering
        query += ' ORDER BY created_at DESC';
      }

      // Add LIMIT and OFFSET with validation
      const limitValidation = validateLimit(limit);
      const offsetValidation = validateOffset(offset);
      
      query += ' LIMIT ? OFFSET ?';
      params.push(limitValidation.value, offsetValidation.value);

      const result = await this.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      await logError(error, {
        method: 'findAll',
        table: this.tableName,
        options
      });
      throw error;
    }
  }

  /**
   * Count records with filtering
   * @param {Object} where - WHERE conditions
   * @param {boolean} userScope - Whether to scope by user_id
   * @returns {Promise<number>}
   */
  async count(where = {}, userScope = true) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      // Add user scope if enabled
      if (userScope && this.userId) {
        query += ' AND user_id = ?';
        params.push(this.userId);
      }

      // Add WHERE conditions
      for (const [field, value] of Object.entries(where)) {
        query += ` AND ${field} = ?`;
        params.push(value);
      }

      const result = await this.db.prepare(query).bind(...params).first();
      return result?.count || 0;
    } catch (error) {
      await logError(error, {
        method: 'count',
        table: this.tableName,
        where
      });
      throw error;
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record data (without id)
   * @returns {Promise<string>} Created record ID
   */
  async create(data) {
    try {
      // Generate ID if not provided
      const id = data.id || this.generateId();
      
      // Add user_id if scoped
      const recordData = { ...data, id };
      if (this.userId && !recordData.user_id) {
        recordData.user_id = this.userId;
      }

      // Build INSERT query
      const fields = Object.keys(recordData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(f => recordData[f]);

      const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      
      await this.db.prepare(query).bind(...values).run();
      
      return id;
    } catch (error) {
      await logError(error, {
        method: 'create',
        table: this.tableName,
        data
      });
      throw error;
    }
  }

  /**
   * Update record by ID
   * @param {string} id - Record ID
   * @param {Object} data - Fields to update
   * @param {boolean} userScope - Whether to scope by user_id
   * @returns {Promise<boolean>} Success status
   */
  async update(id, data, userScope = true) {
    try {
      // Build SET clause
      const fields = Object.keys(data);
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      const setClauses = fields.map(f => `${f} = ?`);
      const values = fields.map(f => data[f]);

      let query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')} WHERE id = ?`;
      values.push(id);

      // Add user scope if enabled
      if (userScope && this.userId) {
        query += ' AND user_id = ?';
        values.push(this.userId);
      }

      const result = await this.db.prepare(query).bind(...values).run();
      return result.meta?.changes > 0;
    } catch (error) {
      await logError(error, {
        method: 'update',
        table: this.tableName,
        id,
        data
      });
      throw error;
    }
  }

  /**
   * Delete record by ID
   * @param {string} id - Record ID
   * @param {boolean} userScope - Whether to scope by user_id
   * @param {boolean} soft - Whether to soft delete (set is_deleted = 1)
   * @returns {Promise<boolean>} Success status
   */
  async delete(id, userScope = true, soft = false) {
    try {
      let query;
      const params = [id];

      if (soft) {
        query = `UPDATE ${this.tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
      } else {
        query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      }

      // Add user scope if enabled
      if (userScope && this.userId) {
        query += ' AND user_id = ?';
        params.push(this.userId);
      }

      const result = await this.db.prepare(query).bind(...params).run();
      return result.meta?.changes > 0;
    } catch (error) {
      await logError(error, {
        method: 'delete',
        table: this.tableName,
        id,
        soft
      });
      throw error;
    }
  }

  /**
   * Execute custom query with parameters
   * Use this for complex queries that don't fit the standard patterns
   * @param {string} query - SQL query with ? placeholders
   * @param {Array} params - Parameters to bind
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    try {
      const result = await this.db.prepare(query).bind(...params).all();
      return result;
    } catch (error) {
      await logError(error, {
        method: 'executeQuery',
        table: this.tableName,
        query
      });
      throw error;
    }
  }

  /**
   * Generate a unique ID for new records
   * Override this in subclasses for custom ID generation
   * @returns {string}
   */
  generateId() {
    return `${this.tableName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Begin transaction (if supported by database)
   * Note: Cloudflare D1 transactions are automatically managed per request
   */
  async beginTransaction() {
    // D1 uses implicit transactions per request
    // This method is a placeholder for compatibility
    return true;
  }

  /**
   * Commit transaction
   */
  async commit() {
    // D1 commits automatically at end of request
    return true;
  }

  /**
   * Rollback transaction
   */
  async rollback() {
    // D1 doesn't support explicit rollback in Workers
    throw new Error('Explicit rollback not supported in D1');
  }
}

/**
 * Transaction Repository
 * Specialized repository for transactions table
 */
export class TransactionRepository extends BaseRepository {
  constructor(db, userId) {
    super(db, 'transactions', userId);
  }

  /**
   * Find transactions by date range
   */
  async findByDateRange(startDate, endDate, options = {}) {
    const where = {
      ...options.where
    };

    let query = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date >= ? AND date <= ?`;
    const params = [this.userId, startDate, endDate];

    // Add additional WHERE conditions
    for (const [field, value] of Object.entries(where)) {
      query += ` AND ${field} = ?`;
      params.push(value);
    }

    // Add ORDER BY
    const orderBy = buildSafeOrderBy(this.tableName, options.sortBy || 'date', options.sortOrder || 'desc');
    if (orderBy.valid) {
      query += orderBy.clause;
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results || [];
  }

  /**
   * Get transaction statistics
   */
  async getStatistics(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as total_expense,
        AVG(amount) as avg_amount
      FROM ${this.tableName}
      WHERE user_id = ? 
        AND date >= ? 
        AND date <= ?
        AND is_deleted = 0
    `;

    const result = await this.db.prepare(query).bind(this.userId, startDate, endDate).first();
    return result || {
      total_count: 0,
      total_income: 0,
      total_expense: 0,
      avg_amount: 0
    };
  }

  generateId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Invoice Repository
 * Specialized repository for invoices table
 */
export class InvoiceRepository extends BaseRepository {
  constructor(db, userId) {
    super(db, 'invoices', userId);
  }

  /**
   * Find invoices by status
   */
  async findByStatus(status, options = {}) {
    return this.findAll({
      ...options,
      where: { ...options.where, status }
    });
  }

  /**
   * Find invoices by date range
   */
  async findByDateRange(startDate, endDate, options = {}) {
    let query = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date >= ? AND date <= ?`;
    const params = [this.userId, startDate, endDate];

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results || [];
  }

  generateId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create repository instance for a table
 * @param {Object} db - Database instance
 * @param {string} tableName - Table name
 * @param {string} userId - User ID for scoping
 * @returns {BaseRepository}
 */
export function createRepository(db, tableName, userId = null) {
  // Return specialized repository if available
  switch (tableName) {
    case 'transactions':
      return new TransactionRepository(db, userId);
    case 'invoices':
      return new InvoiceRepository(db, userId);
    default:
      return new BaseRepository(db, tableName, userId);
  }
}

/**
 * Export repository classes
 */
export default {
  BaseRepository,
  TransactionRepository,
  InvoiceRepository,
  createRepository
};
