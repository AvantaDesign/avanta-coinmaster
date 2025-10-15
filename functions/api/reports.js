/**
 * Advanced Reports API Endpoint
 * 
 * Provides backend support for report generation:
 * - Generate custom reports from database
 * - Aggregate data for analytics
 * - Export formatted data
 * 
 * Routes:
 *   GET /api/reports/monthly-summary?month=YYYY-MM - Monthly summary report
 *   GET /api/reports/profitability?from=DATE&to=DATE - Profitability analysis
 *   GET /api/reports/cash-flow?from=DATE&to=DATE - Cash flow report
 *   GET /api/reports/ar-aging - Accounts receivable aging
 *   GET /api/reports/ap-aging - Accounts payable aging
 */

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Handle GET requests - generate reports
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Route to appropriate handler
    if (pathname.includes('/monthly-summary')) {
      return generateMonthlySummaryReport(context);
    } else if (pathname.includes('/profitability')) {
      return generateProfitabilityReport(context);
    } else if (pathname.includes('/cash-flow')) {
      return generateCashFlowReport(context);
    } else if (pathname.includes('/ar-aging')) {
      return generateARAgingReport(context);
    } else if (pathname.includes('/ap-aging')) {
      return generateAPAgingReport(context);
    } else if (pathname.includes('/category-analysis')) {
      return generateCategoryAnalysisReport(context);
    } else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Report endpoint not found',
        availableEndpoints: [
          '/api/reports/monthly-summary?month=YYYY-MM',
          '/api/reports/profitability?from=DATE&to=DATE',
          '/api/reports/cash-flow?from=DATE&to=DATE',
          '/api/reports/ar-aging',
          '/api/reports/ap-aging',
          '/api/reports/category-analysis?from=DATE&to=DATE'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
  } catch (error) {
    console.error('Reports GET Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate monthly summary report
 */
async function generateMonthlySummaryReport(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const month = url.searchParams.get('month') || new Date().toISOString().substring(0, 7);

  try {
    const db = env.DB;

    // Get transactions for the month
    const transactions = await db.prepare(`
      SELECT * FROM transactions 
      WHERE date LIKE ? 
      AND is_deleted = FALSE
      ORDER BY date DESC
    `).bind(`${month}%`).all();

    // Calculate summary
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};

    transactions.results.forEach(t => {
      const category = t.category || 'Sin categoría';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { income: 0, expenses: 0, count: 0 };
      }

      if (t.amount > 0) {
        totalIncome += t.amount;
        categoryBreakdown[category].income += t.amount;
      } else {
        totalExpenses += Math.abs(t.amount);
        categoryBreakdown[category].expenses += Math.abs(t.amount);
      }
      categoryBreakdown[category].count++;
    });

    const report = {
      month,
      summary: {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: transactions.results.length
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        ...data,
        net: data.income - data.expenses
      })),
      transactions: transactions.results
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Monthly Summary Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate profitability report
 */
async function generateProfitabilityReport(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];

  try {
    const db = env.DB;

    // Get transactions for the period
    const transactions = await db.prepare(`
      SELECT category, SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
             SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
             COUNT(*) as count
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
      GROUP BY category
      ORDER BY (income - expenses) DESC
    `).bind(from, to).all();

    const totalIncome = transactions.results.reduce((sum, t) => sum + t.income, 0);
    const totalExpenses = transactions.results.reduce((sum, t) => sum + t.expenses, 0);

    const report = {
      period: { from, to },
      summary: {
        totalIncome,
        totalExpenses,
        totalProfit: totalIncome - totalExpenses,
        totalMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
      },
      categories: transactions.results.map(t => ({
        category: t.category || 'Sin categoría',
        income: t.income,
        expenses: t.expenses,
        profit: t.income - t.expenses,
        margin: t.income > 0 ? ((t.income - t.expenses) / t.income) * 100 : 0,
        transactions: t.count
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Profitability Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate cash flow report
 */
async function generateCashFlowReport(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];

  try {
    const db = env.DB;

    // Get monthly cash flow
    const monthlyFlow = await db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
      GROUP BY month
      ORDER BY month
    `).bind(from, to).all();

    const report = {
      period: { from, to },
      monthlyFlow: monthlyFlow.results.map(m => ({
        month: m.month,
        income: m.income,
        expenses: m.expenses,
        netFlow: m.income - m.expenses
      })),
      summary: {
        totalIncome: monthlyFlow.results.reduce((sum, m) => sum + m.income, 0),
        totalExpenses: monthlyFlow.results.reduce((sum, m) => sum + m.expenses, 0),
        averageMonthlyIncome: monthlyFlow.results.length > 0 
          ? monthlyFlow.results.reduce((sum, m) => sum + m.income, 0) / monthlyFlow.results.length 
          : 0,
        averageMonthlyExpenses: monthlyFlow.results.length > 0 
          ? monthlyFlow.results.reduce((sum, m) => sum + m.expenses, 0) / monthlyFlow.results.length 
          : 0
      }
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Cash Flow Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate AR aging report
 */
async function generateARAgingReport(context) {
  const { env } = context;

  try {
    const db = env.DB;

    const receivables = await db.prepare(`
      SELECT * FROM receivables 
      WHERE status != 'paid'
      ORDER BY due_date ASC
    `).all();

    const today = new Date();
    const aging = {
      current: [],
      days1to30: [],
      days31to60: [],
      days61to90: [],
      over90: []
    };

    receivables.results.forEach(r => {
      const dueDate = new Date(r.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const outstanding = r.amount - r.amount_paid;

      const item = { ...r, daysOverdue, outstanding };

      if (daysOverdue <= 0) {
        aging.current.push(item);
      } else if (daysOverdue <= 30) {
        aging.days1to30.push(item);
      } else if (daysOverdue <= 60) {
        aging.days31to60.push(item);
      } else if (daysOverdue <= 90) {
        aging.days61to90.push(item);
      } else {
        aging.over90.push(item);
      }
    });

    const calculateTotal = (items) => items.reduce((sum, item) => sum + item.outstanding, 0);

    const report = {
      generatedAt: today.toISOString(),
      aging,
      summary: {
        current: { count: aging.current.length, total: calculateTotal(aging.current) },
        days1to30: { count: aging.days1to30.length, total: calculateTotal(aging.days1to30) },
        days31to60: { count: aging.days31to60.length, total: calculateTotal(aging.days31to60) },
        days61to90: { count: aging.days61to90.length, total: calculateTotal(aging.days61to90) },
        over90: { count: aging.over90.length, total: calculateTotal(aging.over90) },
        totalOutstanding: receivables.results.reduce((sum, r) => sum + (r.amount - r.amount_paid), 0)
      }
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('AR Aging Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate AP aging report
 */
async function generateAPAgingReport(context) {
  const { env } = context;

  try {
    const db = env.DB;

    const payables = await db.prepare(`
      SELECT * FROM payables 
      WHERE status != 'paid'
      ORDER BY due_date ASC
    `).all();

    const today = new Date();
    const aging = {
      current: [],
      days1to30: [],
      days31to60: [],
      days61to90: [],
      over90: []
    };

    payables.results.forEach(p => {
      const dueDate = new Date(p.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const outstanding = p.amount - p.amount_paid;

      const item = { ...p, daysOverdue, outstanding };

      if (daysOverdue <= 0) {
        aging.current.push(item);
      } else if (daysOverdue <= 30) {
        aging.days1to30.push(item);
      } else if (daysOverdue <= 60) {
        aging.days31to60.push(item);
      } else if (daysOverdue <= 90) {
        aging.days61to90.push(item);
      } else {
        aging.over90.push(item);
      }
    });

    const calculateTotal = (items) => items.reduce((sum, item) => sum + item.outstanding, 0);

    const report = {
      generatedAt: today.toISOString(),
      aging,
      summary: {
        current: { count: aging.current.length, total: calculateTotal(aging.current) },
        days1to30: { count: aging.days1to30.length, total: calculateTotal(aging.days1to30) },
        days31to60: { count: aging.days31to60.length, total: calculateTotal(aging.days31to60) },
        days61to90: { count: aging.days61to90.length, total: calculateTotal(aging.days61to90) },
        over90: { count: aging.over90.length, total: calculateTotal(aging.over90) },
        totalOutstanding: payables.results.reduce((sum, p) => sum + (p.amount - p.amount_paid), 0)
      }
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('AP Aging Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Generate category analysis report
 */
async function generateCategoryAnalysisReport(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const from = url.searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const to = url.searchParams.get('to') || new Date().toISOString().split('T')[0];

  try {
    const db = env.DB;

    const analysis = await db.prepare(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as min,
        MAX(amount) as max
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
      GROUP BY category
      ORDER BY ABS(total) DESC
    `).bind(from, to).all();

    const totalAmount = analysis.results.reduce((sum, a) => sum + Math.abs(a.total), 0);

    const report = {
      period: { from, to },
      categories: analysis.results.map(a => ({
        category: a.category || 'Sin categoría',
        count: a.count,
        total: a.total,
        average: a.average,
        min: a.min,
        max: a.max,
        percentage: totalAmount > 0 ? (Math.abs(a.total) / totalAmount) * 100 : 0
      })),
      summary: {
        totalCategories: analysis.results.length,
        totalTransactions: analysis.results.reduce((sum, a) => sum + a.count, 0),
        totalAmount
      }
    };

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Category Analysis Report Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
