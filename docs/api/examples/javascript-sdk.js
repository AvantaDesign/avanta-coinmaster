/**
 * Avanta Coinmaster API - JavaScript/TypeScript SDK
 * 
 * A lightweight SDK for interacting with the Avanta Coinmaster API
 * 
 * Features:
 * - Type-safe API calls
 * - Automatic token management
 * - Error handling
 * - Rate limiting support
 * - Request/response logging
 * 
 * @example
 * const client = new AvantaClient({
 *   baseURL: 'https://avanta-coinmaster.pages.dev',
 *   debug: true
 * });
 * 
 * await client.auth.login('user@example.com', 'password');
 * const transactions = await client.transactions.list();
 */

export class AvantaClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://avanta-coinmaster.pages.dev';
    this.token = options.token || null;
    this.debug = options.debug || false;
    
    // Initialize API modules
    this.auth = new AuthAPI(this);
    this.transactions = new TransactionsAPI(this);
    this.accounts = new AccountsAPI(this);
    this.categories = new CategoriesAPI(this);
    this.taxCalculations = new TaxCalculationsAPI(this);
    this.dashboard = new DashboardAPI(this);
    this.health = new HealthAPI(this);
  }
  
  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add authorization header if token exists and not auth endpoint
    if (this.token && !endpoint.startsWith('/api/auth')) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (this.debug) {
      console.log('API Request:', {
        method: options.method || 'GET',
        url,
        headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined },
        body: options.body
      });
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // Check rate limiting
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
        console.warn('API Rate Limit Warning: Only', rateLimitRemaining, 'requests remaining');
      }
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (this.debug) {
        console.log('API Response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
      }
      
      if (!response.ok) {
        const error = new Error(data.message || data.error || 'API request failed');
        error.code = data.code;
        error.status = response.status;
        error.response = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      if (this.debug) {
        console.error('API Error:', error);
      }
      throw error;
    }
  }
  
  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }
  
  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
  }
}

/**
 * Authentication API
 */
class AuthAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * Register a new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @returns {Promise<{token: string, user: object}>}
   */
  async register(email, password, name) {
    const data = await this.client.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    
    this.client.setToken(data.token);
    return data;
  }
  
  /**
   * Login with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(email, password) {
    const data = await this.client.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    this.client.setToken(data.token);
    return data;
  }
  
  /**
   * Login with Google
   * @param {string} credential - Google JWT credential
   * @returns {Promise<{token: string, user: object}>}
   */
  async loginWithGoogle(credential) {
    const data = await this.client.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    
    this.client.setToken(data.token);
    return data;
  }
  
  /**
   * Refresh authentication token
   * @returns {Promise<{token: string}>}
   */
  async refresh() {
    const data = await this.client.request('/api/auth/refresh', {
      method: 'POST'
    });
    
    this.client.setToken(data.token);
    return data;
  }
  
  /**
   * Get current user information
   * @returns {Promise<object>}
   */
  async me() {
    return this.client.request('/api/auth/me');
  }
  
  /**
   * Logout (clear token)
   */
  logout() {
    this.client.clearToken();
  }
}

/**
 * Transactions API
 */
class TransactionsAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * List transactions with optional filters
   * @param {object} filters - Filter options
   * @returns {Promise<{data: array, pagination: object}>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/transactions?${queryString}` : '/api/transactions';
    
    return this.client.request(endpoint);
  }
  
  /**
   * Get a single transaction by ID
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async get(id) {
    return this.client.request(`/api/transactions/${id}`);
  }
  
  /**
   * Create a new transaction
   * @param {object} transaction 
   * @returns {Promise<object>}
   */
  async create(transaction) {
    return this.client.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }
  
  /**
   * Update an existing transaction
   * @param {string} id 
   * @param {object} updates 
   * @returns {Promise<object>}
   */
  async update(id, updates) {
    return this.client.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
  
  /**
   * Delete a transaction
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async delete(id) {
    return this.client.request(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
  }
  
  /**
   * Get transaction statistics
   * @param {object} filters 
   * @returns {Promise<object>}
   */
  async stats(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    const endpoint = queryString ? `/api/transactions/stats?${queryString}` : '/api/transactions/stats';
    
    return this.client.request(endpoint);
  }
}

/**
 * Accounts API
 */
class AccountsAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * List all accounts
   * @param {object} filters 
   * @returns {Promise<array>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    const endpoint = queryString ? `/api/accounts?${queryString}` : '/api/accounts';
    
    return this.client.request(endpoint);
  }
  
  /**
   * Get account by ID
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async get(id) {
    return this.client.request(`/api/accounts/${id}`);
  }
  
  /**
   * Create a new account
   * @param {object} account 
   * @returns {Promise<object>}
   */
  async create(account) {
    return this.client.request('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    });
  }
  
  /**
   * Update an account
   * @param {string} id 
   * @param {object} updates 
   * @returns {Promise<object>}
   */
  async update(id, updates) {
    return this.client.request(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
  
  /**
   * Delete an account
   * @param {string} id 
   * @returns {Promise<object>}
   */
  async delete(id) {
    return this.client.request(`/api/accounts/${id}`, {
      method: 'DELETE'
    });
  }
}

/**
 * Categories API
 */
class CategoriesAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * List all categories
   * @param {object} filters 
   * @returns {Promise<array>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    const endpoint = queryString ? `/api/categories?${queryString}` : '/api/categories';
    
    return this.client.request(endpoint);
  }
  
  /**
   * Create a new category
   * @param {object} category 
   * @returns {Promise<object>}
   */
  async create(category) {
    return this.client.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  }
}

/**
 * Tax Calculations API
 */
class TaxCalculationsAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * List tax calculations
   * @param {object} filters 
   * @returns {Promise<array>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString();
    const endpoint = queryString ? `/api/tax-calculations?${queryString}` : '/api/tax-calculations';
    
    return this.client.request(endpoint);
  }
  
  /**
   * Calculate taxes for a period
   * @param {object} params 
   * @returns {Promise<object>}
   */
  async calculate(params) {
    return this.client.request('/api/tax-calculations', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
}

/**
 * Dashboard API
 */
class DashboardAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * Get dashboard data
   * @returns {Promise<object>}
   */
  async get() {
    return this.client.request('/api/dashboard');
  }
}

/**
 * Health API
 */
class HealthAPI {
  constructor(client) {
    this.client = client;
  }
  
  /**
   * Check system health
   * @returns {Promise<object>}
   */
  async check() {
    return this.client.request('/api/health');
  }
}

// Usage Examples
export async function examples() {
  // Initialize client
  const client = new AvantaClient({
    baseURL: 'https://avanta-coinmaster.pages.dev',
    debug: true
  });
  
  try {
    // 1. Register or Login
    await client.auth.login('user@example.com', 'password');
    
    // 2. Get current user
    const user = await client.auth.me();
    console.log('Logged in as:', user.name);
    
    // 3. Create an account
    const account = await client.accounts.create({
      name: 'Main Checking Account',
      type: 'checking',
      currency: 'MXN',
      initial_balance: '10000.00'
    });
    
    // 4. Create a transaction
    const transaction = await client.transactions.create({
      type: 'expense',
      amount: '1234.56',
      date: '2025-10-22',
      description: 'Office supplies',
      account_id: account.id,
      is_deductible: true
    });
    
    // 5. List transactions with filters
    const transactions = await client.transactions.list({
      type: 'expense',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      limit: 50
    });
    
    // 6. Get transaction statistics
    const stats = await client.transactions.stats({
      start_date: '2025-10-01',
      end_date: '2025-10-31'
    });
    
    // 7. Calculate taxes
    const taxes = await client.taxCalculations.calculate({
      period_type: 'monthly',
      period_year: 2025,
      period_month: 10
    });
    
    // 8. Get dashboard
    const dashboard = await client.dashboard.get();
    console.log('Total balance:', dashboard.totalBalance);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// Export the client
export default AvantaClient;
