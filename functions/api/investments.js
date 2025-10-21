// Investments API - Manage investment portfolio and performance tracking
// Phase 30: Monetary values stored as INTEGER cents in database
// Phase 41: Authentication hardening - Added getUserIdFromToken for all endpoints

import Decimal from 'decimal.js';
import { getUserIdFromToken } from './auth.js';
import { 
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
  toCents, 
  fromCents, 
  fromCentsToDecimal,
  convertArrayFromCents, 
  convertObjectFromCents, 
  parseMonetaryInput,
  MONETARY_FIELDS 
} from '../utils/monetary.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Calculate ROI and performance metrics
// Phase 30: Expects amounts in cents, converts to Decimal for calculations
function calculatePerformanceMetrics(purchaseAmountCents, currentValueCents, purchaseDate) {
  // Convert from cents to Decimal for calculations
  const invested = fromCentsToDecimal(purchaseAmountCents);
  const current = currentValueCents ? fromCentsToDecimal(currentValueCents) : invested;
  
  const totalReturn = current.minus(invested);
  const percentReturn = invested.gt(0) ? totalReturn.div(invested).times(100) : new Decimal(0);
  
  // Calculate annualized return
  const purchaseDateObj = new Date(purchaseDate);
  const today = new Date();
  const daysHeld = Math.max(1, Math.floor((today - purchaseDateObj) / (1000 * 60 * 60 * 24)));
  const yearsHeld = daysHeld / 365.25;
  
  const annualizedReturn = yearsHeld > 0 && invested.gt(0)
    ? new Decimal(Math.pow((current.div(invested).toNumber()), (1 / yearsHeld)) - 1).times(100)
    : percentReturn;
  
  return {
    total_return: parseFloat(totalReturn.toFixed(2)),
    percent_return: parseFloat(percentReturn.toFixed(2)),
    annualized_return: parseFloat(annualizedReturn.toFixed(2)),
    days_held: daysHeld,
    years_held: parseFloat(yearsHeld.toFixed(2))
  };
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const includeTransactions = url.searchParams.get('transactions');
    const getPortfolioSummary = url.searchParams.get('portfolio');

    // Get portfolio summary
    if (getPortfolioSummary === 'true') {
      const investments = await env.DB.prepare(
        'SELECT * FROM investments WHERE status = ? AND user_id = ?'
      ).bind('active', userId).all();

      let totalInvested = new Decimal(0);
      let totalCurrentValue = new Decimal(0);
      const byType = {};
      const byRisk = {};

      // Phase 30: Values from DB are in cents, convert to Decimal for calculations
      for (const inv of investments.results || []) {
        const purchaseAmt = fromCentsToDecimal(inv.purchase_amount);
        const currentVal = inv.current_value ? fromCentsToDecimal(inv.current_value) : purchaseAmt;
        
        totalInvested = totalInvested.plus(purchaseAmt);
        totalCurrentValue = totalCurrentValue.plus(currentVal);
        
        // Group by type
        if (!byType[inv.investment_type]) {
          byType[inv.investment_type] = { 
            count: 0, 
            invested: new Decimal(0), 
            current: new Decimal(0) 
          };
        }
        byType[inv.investment_type].count++;
        byType[inv.investment_type].invested = byType[inv.investment_type].invested.plus(purchaseAmt);
        byType[inv.investment_type].current = byType[inv.investment_type].current.plus(currentVal);
        
        // Group by risk
        const risk = inv.risk_level || 'medium';
        if (!byRisk[risk]) {
          byRisk[risk] = { 
            count: 0, 
            invested: new Decimal(0), 
            current: new Decimal(0) 
          };
        }
        byRisk[risk].count++;
        byRisk[risk].invested = byRisk[risk].invested.plus(purchaseAmt);
        byRisk[risk].current = byRisk[risk].current.plus(currentVal);
      }

      // Convert to regular objects
      const typeBreakdown = Object.entries(byType).map(([type, data]) => ({
        type,
        count: data.count,
        invested: parseFloat(data.invested.toFixed(2)),
        current_value: parseFloat(data.current.toFixed(2)),
        return: parseFloat(data.current.minus(data.invested).toFixed(2)),
        percent_return: data.invested.gt(0) ? parseFloat(data.current.minus(data.invested).div(data.invested).times(100).toFixed(2)) : 0
      }));

      const riskBreakdown = Object.entries(byRisk).map(([risk, data]) => ({
        risk_level: risk,
        count: data.count,
        invested: parseFloat(data.invested.toFixed(2)),
        current_value: parseFloat(data.current.toFixed(2)),
        return: parseFloat(data.current.minus(data.invested).toFixed(2)),
        percent_return: data.invested.gt(0) ? parseFloat(data.current.minus(data.invested).div(data.invested).times(100).toFixed(2)) : 0
      }));

      const totalReturn = totalCurrentValue.minus(totalInvested);
      const percentReturn = totalInvested.gt(0) ? totalReturn.div(totalInvested).times(100) : new Decimal(0);

      return new Response(JSON.stringify({
        total_invested: parseFloat(totalInvested.toFixed(2)),
        total_current_value: parseFloat(totalCurrentValue.toFixed(2)),
        total_return: parseFloat(totalReturn.toFixed(2)),
        percent_return: parseFloat(percentReturn.toFixed(2)),
        active_investments: investments.results?.length || 0,
        by_type: typeBreakdown,
        by_risk: riskBreakdown
      }), {
        headers: corsHeaders
      });
    }

    // Get specific investment
    if (id) {
      const investment = await env.DB.prepare(
        'SELECT * FROM investments WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();

      if (!investment) {
        return new Response(JSON.stringify({ 
          error: 'Investment not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Phase 30: Convert monetary fields from cents to decimal
      const convertedInvestment = convertObjectFromCents(
        investment, 
        MONETARY_FIELDS.INVESTMENTS
      );

      // Calculate performance metrics (using cents values from DB)
      if (investment.current_value) {
        convertedInvestment.performance = calculatePerformanceMetrics(
          investment.purchase_amount,
          investment.current_value,
          investment.purchase_date
        );
      }

      // Include transactions if requested
      if (includeTransactions === 'true') {
        const transactions = await env.DB.prepare(
          'SELECT * FROM investment_transactions WHERE investment_id = ? ORDER BY transaction_date DESC'
        ).bind(id).all();
        
        // Convert transaction monetary fields
        convertedInvestment.transactions = convertArrayFromCents(
          transactions.results || [],
          ['amount', 'price_per_unit', 'fees']
        );
      }

      // Include valuations
      const valuations = await env.DB.prepare(
        'SELECT * FROM investment_valuations WHERE investment_id = ? ORDER BY valuation_date DESC LIMIT 30'
      ).bind(id).all();
      
      // Convert valuation monetary fields
      convertedInvestment.recent_valuations = convertArrayFromCents(
        valuations.results || [],
        ['value', 'price_per_unit']
      );

      return new Response(JSON.stringify(convertedInvestment), {
        headers: corsHeaders
      });
    }

    // Build query for list - Phase 41: Filter by user_id
    let query = 'SELECT * FROM investments WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND investment_type = ?';
      params.push(type);
    }

    query += ' ORDER BY purchase_date DESC, investment_name ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedResults = convertArrayFromCents(
      result.results || [],
      MONETARY_FIELDS.INVESTMENTS
    );

    // Add performance metrics to each investment (using cents values from DB)
    const investmentsWithMetrics = convertedResults.map((inv, idx) => {
      const originalInv = (result.results || [])[idx];
      if (originalInv && originalInv.current_value) {
        inv.performance = calculatePerformanceMetrics(
          originalInv.purchase_amount,
          originalInv.current_value,
          originalInv.purchase_date
        );
      }
      return inv;
    });

    return new Response(JSON.stringify(investmentsWithMetrics), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error fetching investments', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.investment_name || !data.investment_type || !data.purchase_date || !data.purchase_amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 30: Parse and validate monetary inputs
    const purchaseAmountResult = parseMonetaryInput(data.purchase_amount, 'purchase_amount', true);
    if (purchaseAmountResult.error) {
      return new Response(JSON.stringify({ 
        error: purchaseAmountResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const currentValueResult = parseMonetaryInput(
      data.current_value !== undefined ? data.current_value : data.purchase_amount, 
      'current_value', 
      false
    );
    if (currentValueResult.error) {
      return new Response(JSON.stringify({ 
        error: currentValueResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const pricePerUnitResult = parseMonetaryInput(data.current_price_per_unit, 'current_price_per_unit', false);
    if (pricePerUnitResult.error) {
      return new Response(JSON.stringify({ 
        error: pricePerUnitResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const feesResult = parseMonetaryInput(data.fees || 0, 'fees', false);
    if (feesResult.error) {
      return new Response(JSON.stringify({ 
        error: feesResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const metadataStr = data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null;

    const result = await env.DB.prepare(`
      INSERT INTO investments (
        investment_name, investment_type, broker_platform, purchase_date,
        purchase_amount, quantity, current_value, current_price_per_unit,
        currency, status, category, risk_level, description, notes, user_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.investment_name,
      data.investment_type,
      data.broker_platform || null,
      data.purchase_date,
      purchaseAmountResult.value,  // Phase 30: Store as cents
      data.quantity || null,
      currentValueResult.value,  // Phase 30: Store as cents
      pricePerUnitResult.value,  // Phase 30: Store as cents
      data.currency || 'MXN',
      data.status || 'active',
      data.category || null,
      data.risk_level || null,
      data.description || null,
      data.notes || null,
      userId,  // Phase 41: Use authenticated user_id
      metadataStr
    ).run();

    const investmentId = result.meta.last_row_id;

    // Create initial valuation record
    await env.DB.prepare(`
      INSERT INTO investment_valuations (
        investment_id, valuation_date, value, price_per_unit, notes
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      investmentId,
      data.purchase_date,
      purchaseAmountResult.value,  // Phase 30: Store as cents
      pricePerUnitResult.value,  // Phase 30: Store as cents
      'Initial purchase'
    ).run();

    // Create initial transaction record
    await env.DB.prepare(`
      INSERT INTO investment_transactions (
        investment_id, transaction_date, transaction_type, quantity,
        price_per_unit, amount, fees, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      investmentId,
      data.purchase_date,
      'buy',
      data.quantity || null,
      pricePerUnitResult.value,  // Phase 30: Store as cents
      purchaseAmountResult.value,  // Phase 30: Store as cents
      feesResult.value,  // Phase 30: Store as cents
      'Initial purchase'
    ).run();

    return new Response(JSON.stringify({ 
      id: investmentId,
      message: 'Investment created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error creating investment', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    
    if (!data.id) {
      return new Response(JSON.stringify({ 
        error: 'Missing investment ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 41: Verify ownership
    const existingInvestment = await env.DB.prepare(
      'SELECT id FROM investments WHERE id = ? AND user_id = ?'
    ).bind(data.id, userId).first();

    if (!existingInvestment) {
      return new Response(JSON.stringify({
        error: 'Investment not found or access denied',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    const allowedFields = [
      'investment_name', 'investment_type', 'broker_platform', 'quantity',
      'currency', 'status', 'category', 'risk_level', 'description', 'notes'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // Phase 30: Handle monetary fields with validation
    if (data.current_value !== undefined) {
      const currentValueResult = parseMonetaryInput(data.current_value, 'current_value', false);
      if (currentValueResult.error) {
        return new Response(JSON.stringify({ 
          error: currentValueResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('current_value = ?');
      params.push(currentValueResult.value);
    }

    if (data.current_price_per_unit !== undefined) {
      const priceResult = parseMonetaryInput(data.current_price_per_unit, 'current_price_per_unit', false);
      if (priceResult.error) {
        return new Response(JSON.stringify({ 
          error: priceResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('current_price_per_unit = ?');
      params.push(priceResult.value);
    }

    if (data.metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(data.id);
    params.push(userId);  // Phase 41: Add user_id for ownership check

    const query = `UPDATE investments SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    const result = await env.DB.prepare(query).bind(...params).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Investment not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // If current_value is updated, create a new valuation record
    if (data.current_value !== undefined) {
      const currentValueResult = parseMonetaryInput(data.current_value, 'current_value', false);
      const priceResult = data.current_price_per_unit !== undefined 
        ? parseMonetaryInput(data.current_price_per_unit, 'current_price_per_unit', false)
        : { value: null };

      await env.DB.prepare(`
        INSERT INTO investment_valuations (
          investment_id, valuation_date, value, price_per_unit, notes
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        data.id,
        new Date().toISOString().split('T')[0],
        currentValueResult.value,  // Phase 30: Store as cents
        priceResult.value,  // Phase 30: Store as cents
        data.valuation_notes || 'Manual update'
      ).run();
    }

    return new Response(JSON.stringify({ 
      message: 'Investment updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error updating investment', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Missing investment ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 41: Delete with user_id check for ownership
    const result = await env.DB.prepare(
      'DELETE FROM investments WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Investment not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Investment deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error deleting investment', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
