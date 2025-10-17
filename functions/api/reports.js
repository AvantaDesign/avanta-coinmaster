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

import Decimal from 'decimal.js';

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
    if (pathname.includes('/daily-dashboard')) {
      return generateDailyDashboardReport(context);
    } else if (pathname.includes('/weekly-report')) {
      return generateWeeklyReport(context);
    } else if (pathname.includes('/quarterly-balance-sheet')) {
      return generateQuarterlyBalanceSheet(context);
    } else if (pathname.includes('/monthly-summary')) {
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
          '/api/reports/daily-dashboard',
          '/api/reports/weekly-report',
          '/api/reports/monthly-summary?month=YYYY-MM',
          '/api/reports/quarterly-balance-sheet?quarter=1-4&year=YYYY',
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

    // Calculate summary using Decimal for precision
    let totalIncome = new Decimal(0);
    let totalExpenses = new Decimal(0);
    const categoryBreakdown = {};

    transactions.results.forEach(t => {
      const category = t.category || 'Sin categoría';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { 
          income: new Decimal(0), 
          expenses: new Decimal(0), 
          count: 0 
        };
      }

      const amount = new Decimal(t.amount);
      if (amount.gt(0)) {
        totalIncome = totalIncome.plus(amount);
        categoryBreakdown[category].income = categoryBreakdown[category].income.plus(amount);
      } else {
        const absAmount = amount.abs();
        totalExpenses = totalExpenses.plus(absAmount);
        categoryBreakdown[category].expenses = categoryBreakdown[category].expenses.plus(absAmount);
      }
      categoryBreakdown[category].count++;
    });

    const report = {
      month,
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netIncome: parseFloat(totalIncome.minus(totalExpenses).toFixed(2)),
        transactionCount: transactions.results.length
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        income: parseFloat(data.income.toFixed(2)),
        expenses: parseFloat(data.expenses.toFixed(2)),
        count: data.count,
        net: parseFloat(data.income.minus(data.expenses).toFixed(2))
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

    const totalIncome = transactions.results.reduce((sum, t) => 
      sum.plus(new Decimal(t.income)), new Decimal(0));
    const totalExpenses = transactions.results.reduce((sum, t) => 
      sum.plus(new Decimal(t.expenses)), new Decimal(0));

    const report = {
      period: { from, to },
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalProfit: parseFloat(totalIncome.minus(totalExpenses).toFixed(2)),
        totalMargin: totalIncome.gt(0) 
          ? parseFloat(totalIncome.minus(totalExpenses).div(totalIncome).times(new Decimal(100)).toFixed(2)) 
          : 0
      },
      categories: transactions.results.map(t => {
        const income = new Decimal(t.income);
        const expenses = new Decimal(t.expenses);
        const profit = income.minus(expenses);
        return {
          category: t.category || 'Sin categoría',
          income: parseFloat(income.toFixed(2)),
          expenses: parseFloat(expenses.toFixed(2)),
          profit: parseFloat(profit.toFixed(2)),
          margin: income.gt(0) ? parseFloat(profit.div(income).times(new Decimal(100)).toFixed(2)) : 0,
          transactions: t.count
        };
      })
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
      monthlyFlow: monthlyFlow.results.map(m => {
        const income = new Decimal(m.income);
        const expenses = new Decimal(m.expenses);
        return {
          month: m.month,
          income: parseFloat(income.toFixed(2)),
          expenses: parseFloat(expenses.toFixed(2)),
          netFlow: parseFloat(income.minus(expenses).toFixed(2))
        };
      }),
      summary: {
        totalIncome: parseFloat(monthlyFlow.results.reduce((sum, m) => 
          sum.plus(new Decimal(m.income)), new Decimal(0)).toFixed(2)),
        totalExpenses: parseFloat(monthlyFlow.results.reduce((sum, m) => 
          sum.plus(new Decimal(m.expenses)), new Decimal(0)).toFixed(2)),
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

/**
 * Generate daily financial dashboard report
 */
async function generateDailyDashboardReport(context) {
  const { env } = context;
  const today = new Date().toISOString().split('T')[0];

  try {
    const db = env.DB;

    // Today's transactions
    const todayTransactions = await db.prepare(`
      SELECT * FROM transactions 
      WHERE date = ?
      AND is_deleted = FALSE
      ORDER BY date DESC
    `).bind(today).all();

    // Cash flow today
    let todayIncome = new Decimal(0);
    let todayExpenses = new Decimal(0);
    
    todayTransactions.results.forEach(t => {
      const amount = new Decimal(t.amount);
      if (amount.gt(0)) {
        todayIncome = todayIncome.plus(amount);
      } else {
        todayExpenses = todayExpenses.plus(amount.abs());
      }
    });

    // Immediate commitments (due today or overdue)
    const immediatePayables = await db.prepare(`
      SELECT * FROM payables 
      WHERE due_date <= ?
      AND status != 'paid' AND status != 'cancelled'
      ORDER BY due_date ASC
      LIMIT 10
    `).bind(today).all();

    const immediateReceivables = await db.prepare(`
      SELECT * FROM receivables 
      WHERE due_date <= ?
      AND status != 'paid' AND status != 'cancelled'
      ORDER BY due_date ASC
      LIMIT 10
    `).bind(today).all();

    // Account balances
    const accounts = await db.prepare(`
      SELECT * FROM accounts 
      WHERE is_deleted = FALSE
      ORDER BY balance DESC
    `).all();

    const report = {
      date: today,
      cashFlow: {
        income: parseFloat(todayIncome.toFixed(2)),
        expenses: parseFloat(todayExpenses.toFixed(2)),
        net: parseFloat(todayIncome.minus(todayExpenses).toFixed(2)),
        transactionCount: todayTransactions.results.length
      },
      immediateCommitments: {
        payables: {
          count: immediatePayables.results.length,
          total: immediatePayables.results.reduce((sum, p) => sum + (p.amount - (p.amount_paid || 0)), 0),
          items: immediatePayables.results
        },
        receivables: {
          count: immediateReceivables.results.length,
          total: immediateReceivables.results.reduce((sum, r) => sum + (r.amount - (r.amount_paid || 0)), 0),
          items: immediateReceivables.results
        }
      },
      accountBalances: {
        total: accounts.results.reduce((sum, a) => sum + a.balance, 0),
        byAccount: accounts.results.map(a => ({
          name: a.name,
          type: a.type,
          balance: a.balance
        }))
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
    console.error('Daily Dashboard Report Error:', error);
    
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
 * Generate weekly report
 */
async function generateWeeklyReport(context) {
  const { env } = context;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

  const from = weekStart.toISOString().split('T')[0];
  const to = weekEnd.toISOString().split('T')[0];

  try {
    const db = env.DB;

    // Week's transactions
    const weekTransactions = await db.prepare(`
      SELECT * FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
    `).bind(from, to).all();

    // Pending invoices
    const pendingReceivables = await db.prepare(`
      SELECT * FROM receivables 
      WHERE status != 'paid' AND status != 'cancelled'
      ORDER BY due_date ASC
    `).all();

    // Scheduled payments for the week
    const scheduledPayables = await db.prepare(`
      SELECT * FROM payables 
      WHERE due_date BETWEEN ? AND ?
      AND status != 'paid' AND status != 'cancelled'
      ORDER BY due_date ASC
    `).bind(from, to).all();

    // Active projects (from categories or custom tracking)
    const projectCategories = await db.prepare(`
      SELECT 
        category,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
      AND category IS NOT NULL
      GROUP BY category
      ORDER BY (income + expenses) DESC
    `).bind(from, to).all();

    const report = {
      period: { from, to, week: `Semana del ${from} al ${to}` },
      summary: {
        transactions: weekTransactions.results.length,
        income: weekTransactions.results.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0),
        expenses: weekTransactions.results.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0)
      },
      activeProjects: projectCategories.results.map(p => ({
        project: p.category,
        transactions: p.transaction_count,
        income: p.income,
        expenses: p.expenses,
        net: p.income - p.expenses
      })),
      pendingInvoices: {
        count: pendingReceivables.results.length,
        total: pendingReceivables.results.reduce((sum, r) => sum + (r.amount - (r.amount_paid || 0)), 0),
        items: pendingReceivables.results.slice(0, 10) // Top 10
      },
      scheduledPayments: {
        count: scheduledPayables.results.length,
        total: scheduledPayables.results.reduce((sum, p) => sum + (p.amount - (p.amount_paid || 0)), 0),
        items: scheduledPayables.results
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
    console.error('Weekly Report Error:', error);
    
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
 * Generate quarterly balance sheet
 */
async function generateQuarterlyBalanceSheet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  
  const quarter = parseInt(url.searchParams.get('quarter') || currentQuarter);
  const year = parseInt(url.searchParams.get('year') || currentYear);

  // Calculate quarter date range
  const startMonth = (quarter - 1) * 3;
  const from = new Date(year, startMonth, 1).toISOString().split('T')[0];
  const to = new Date(year, startMonth + 3, 0).toISOString().split('T')[0];

  try {
    const db = env.DB;

    // Assets (account balances)
    const accounts = await db.prepare(`
      SELECT * FROM accounts 
      WHERE is_deleted = FALSE
    `).all();

    const assets = {
      cash: accounts.results.filter(a => a.type === 'efectivo' || a.type === 'cuenta_bancaria')
        .reduce((sum, a) => sum + a.balance, 0),
      receivables: 0, // Will calculate from AR
      total: 0
    };

    // Get receivables balance
    const receivables = await db.prepare(`
      SELECT SUM(amount - COALESCE(amount_paid, 0)) as total
      FROM receivables 
      WHERE status != 'paid' AND status != 'cancelled'
    `).all();
    
    assets.receivables = receivables.results[0]?.total || 0;
    assets.total = assets.cash + assets.receivables;

    // Liabilities (payables)
    const payables = await db.prepare(`
      SELECT SUM(amount - COALESCE(amount_paid, 0)) as total
      FROM payables 
      WHERE status != 'paid' AND status != 'cancelled'
    `).all();

    const liabilities = {
      accountsPayable: payables.results[0]?.total || 0,
      total: payables.results[0]?.total || 0
    };

    // Equity (calculated from income statement)
    const incomeStatement = await db.prepare(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions 
      WHERE date BETWEEN ? AND ?
      AND is_deleted = FALSE
    `).bind(from, to).all();

    const quarterIncome = incomeStatement.results[0]?.income || 0;
    const quarterExpenses = incomeStatement.results[0]?.expenses || 0;
    const quarterNet = quarterIncome - quarterExpenses;

    // Get opening equity (simplified - would need more complex calculation in real scenario)
    const equity = {
      retainedEarnings: assets.total - liabilities.total - quarterNet,
      quarterNet: quarterNet,
      total: assets.total - liabilities.total
    };

    const report = {
      period: { 
        quarter, 
        year, 
        from, 
        to,
        label: `Q${quarter} ${year}` 
      },
      balanceSheet: {
        assets: {
          current: {
            cash: assets.cash,
            accountsReceivable: assets.receivables,
            total: assets.total
          },
          total: assets.total
        },
        liabilities: {
          current: {
            accountsPayable: liabilities.accountsPayable,
            total: liabilities.total
          },
          total: liabilities.total
        },
        equity: {
          retainedEarnings: equity.retainedEarnings,
          quarterNetIncome: equity.quarterNet,
          total: equity.total
        }
      },
      verification: {
        assetsTotal: assets.total,
        liabilitiesAndEquityTotal: liabilities.total + equity.total,
        balanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01
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
    console.error('Quarterly Balance Sheet Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
