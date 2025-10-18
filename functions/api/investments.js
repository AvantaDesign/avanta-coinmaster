// Investments API - Manage investment portfolio and performance tracking

import Decimal from 'decimal.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Calculate ROI and performance metrics
function calculatePerformanceMetrics(purchaseAmount, currentValue, purchaseDate) {
  const invested = new Decimal(purchaseAmount);
  const current = new Decimal(currentValue || purchaseAmount);
  
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
        'SELECT * FROM investments WHERE status = ?'
      ).bind('active').all();

      let totalInvested = new Decimal(0);
      let totalCurrentValue = new Decimal(0);
      const byType = {};
      const byRisk = {};

      for (const inv of investments.results || []) {
        totalInvested = totalInvested.plus(inv.purchase_amount);
        totalCurrentValue = totalCurrentValue.plus(inv.current_value || inv.purchase_amount);
        
        // Group by type
        if (!byType[inv.investment_type]) {
          byType[inv.investment_type] = { 
            count: 0, 
            invested: new Decimal(0), 
            current: new Decimal(0) 
          };
        }
        byType[inv.investment_type].count++;
        byType[inv.investment_type].invested = byType[inv.investment_type].invested.plus(inv.purchase_amount);
        byType[inv.investment_type].current = byType[inv.investment_type].current.plus(inv.current_value || inv.purchase_amount);
        
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
        byRisk[risk].invested = byRisk[risk].invested.plus(inv.purchase_amount);
        byRisk[risk].current = byRisk[risk].current.plus(inv.current_value || inv.purchase_amount);
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
        'SELECT * FROM investments WHERE id = ?'
      ).bind(id).first();

      if (!investment) {
        return new Response(JSON.stringify({ 
          error: 'Investment not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Calculate performance metrics
      if (investment.current_value) {
        investment.performance = calculatePerformanceMetrics(
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
        
        investment.transactions = transactions.results || [];
      }

      // Include valuations
      const valuations = await env.DB.prepare(
        'SELECT * FROM investment_valuations WHERE investment_id = ? ORDER BY valuation_date DESC LIMIT 30'
      ).bind(id).all();
      
      investment.recent_valuations = valuations.results || [];

      return new Response(JSON.stringify(investment), {
        headers: corsHeaders
      });
    }

    // Build query for list
    let query = 'SELECT * FROM investments WHERE 1=1';
    const params = [];

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

    // Add performance metrics to each investment
    const investmentsWithMetrics = (result.results || []).map(inv => {
      if (inv.current_value) {
        inv.performance = calculatePerformanceMetrics(
          inv.purchase_amount,
          inv.current_value,
          inv.purchase_date
        );
      }
      return inv;
    });

    return new Response(JSON.stringify(investmentsWithMetrics), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching investments:', error);
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
      data.purchase_amount,
      data.quantity || null,
      data.current_value || data.purchase_amount,
      data.current_price_per_unit || null,
      data.currency || 'MXN',
      data.status || 'active',
      data.category || null,
      data.risk_level || null,
      data.description || null,
      data.notes || null,
      data.user_id || null,
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
      data.purchase_amount,
      data.current_price_per_unit || null,
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
      data.current_price_per_unit || null,
      data.purchase_amount,
      data.fees || 0,
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
    console.error('Error creating investment:', error);
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

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    const allowedFields = [
      'investment_name', 'investment_type', 'broker_platform', 'quantity',
      'current_value', 'current_price_per_unit', 'currency', 'status',
      'category', 'risk_level', 'description', 'notes'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
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

    const query = `UPDATE investments SET ${updates.join(', ')} WHERE id = ?`;
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
      await env.DB.prepare(`
        INSERT INTO investment_valuations (
          investment_id, valuation_date, value, price_per_unit, notes
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        data.id,
        new Date().toISOString().split('T')[0],
        data.current_value,
        data.current_price_per_unit || null,
        data.valuation_notes || 'Manual update'
      ).run();
    }

    return new Response(JSON.stringify({ 
      message: 'Investment updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating investment:', error);
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

    const result = await env.DB.prepare(
      'DELETE FROM investments WHERE id = ?'
    ).bind(id).run();

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
    console.error('Error deleting investment:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
