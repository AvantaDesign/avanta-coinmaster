// Fiscal API - Calculate ISR and IVA

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get('month')) || new Date().getMonth() + 1;
  const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
  
  try {
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

    // Validate month and year
    if (month < 1 || month > 12) {
      return new Response(JSON.stringify({ 
        error: 'Invalid month (must be 1-12)',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (year < 2000 || year > 2100) {
      return new Response(JSON.stringify({ 
        error: 'Invalid year',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate first and last day of the month
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    
    // Get income and deductible expenses for the month
    const summary = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'ingreso' AND category = 'avanta' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'gasto' AND category = 'avanta' AND is_deductible = 1 THEN amount ELSE 0 END) as deductible
      FROM transactions
      WHERE date >= ? AND date <= ?
    `).bind(firstDay, lastDay).first();
    
    const income = summary?.income || 0;
    const deductible = summary?.deductible || 0;
    const utilidad = income - deductible;
    
    // Calculate ISR (simplified 20% rate)
    const isr = utilidad > 0 ? utilidad * 0.20 : 0;
    
    // Calculate IVA (16%)
    const ivaCobrado = income * 0.16;
    const ivaPagado = deductible * 0.16;
    const iva = ivaCobrado - ivaPagado;
    
    // Due date is the 17th of the following month
    const dueDate = new Date(year, month, 17).toISOString().split('T')[0];
    
    return new Response(JSON.stringify({
      month,
      year,
      income: parseFloat(income.toFixed(2)),
      deductible: parseFloat(deductible.toFixed(2)),
      utilidad: parseFloat(utilidad.toFixed(2)),
      isr: parseFloat(Math.max(0, isr).toFixed(2)),
      iva: parseFloat(Math.max(0, iva).toFixed(2)),
      ivaCobrado: parseFloat(ivaCobrado.toFixed(2)),
      ivaPagado: parseFloat(ivaPagado.toFixed(2)),
      dueDate
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Fiscal GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to calculate fiscal data',
      message: error.message,
      code: 'CALCULATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
