// Cash Flow Projection API - Generate 60-day cash flow forecasts

import Decimal from 'decimal.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to get next occurrence date for recurring items
function getNextOccurrence(currentDate, frequency, paymentDay = null, referenceDate = null) {
  const start = referenceDate ? new Date(referenceDate) : new Date(currentDate);
  let next = new Date(start);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (paymentDay) {
        next.setDate(Math.min(paymentDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (paymentDay) {
        next.setDate(Math.min(paymentDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      if (paymentDay) {
        next.setDate(Math.min(paymentDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;
    default:
      next.setDate(next.getDate() + 30);
  }
  
  return next;
}

// Generate all occurrences of a recurring item within the date range
function generateRecurringOccurrences(item, startDate, endDate, type) {
  const occurrences = [];
  let currentDate = new Date(item.next_payment_date || startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    if (currentDate >= startDate) {
      occurrences.push({
        date: currentDate.toISOString().split('T')[0],
        amount: item.amount,
        type: type,
        description: type === 'recurring_freelancer' 
          ? `${item.freelancer_name} (Freelancer)` 
          : `${item.service_name} (${item.provider})`,
        category: item.category || 'Operational',
        status: 'projected'
      });
    }
    currentDate = getNextOccurrence(currentDate, item.frequency, item.payment_day, currentDate);
  }
  
  return occurrences;
}

// Calculate historical average for specific categories
function calculateHistoricalAverage(transactions, category = null, days = 30) {
  if (!transactions || transactions.length === 0) return 0;
  
  const filtered = category 
    ? transactions.filter(t => t.category === category)
    : transactions;
  
  if (filtered.length === 0) return 0;
  
  const total = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);
  return total / Math.max(1, days);
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
    const daysParam = url.searchParams.get('days') || '60';
    const scenario = url.searchParams.get('scenario') || 'realistic';
    const includeHistorical = url.searchParams.get('historical') === 'true';
    
    const days = Math.min(parseInt(daysParam), 365); // Cap at 1 year
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = addDays(today, days);

    // Get current account balances
    const accounts = await env.DB.prepare(
      'SELECT id, name, type, balance FROM accounts WHERE is_active = 1'
    ).all();

    let currentBalance = new Decimal(0);
    for (const account of accounts.results || []) {
      currentBalance = currentBalance.plus(account.balance || 0);
    }

    // Get recurring freelancer payments (outflows)
    const recurringFreelancers = await env.DB.prepare(
      "SELECT * FROM recurring_freelancers WHERE status = 'active'"
    ).all();

    // Get recurring service payments (outflows)
    const recurringServices = await env.DB.prepare(
      "SELECT * FROM recurring_services WHERE status = 'active'"
    ).all();

    // Get active debts (outflows)
    const debts = await env.DB.prepare(
      "SELECT * FROM debts WHERE status = 'active' AND next_payment_date IS NOT NULL"
    ).all();

    // Get pending payables (outflows)
    const payables = await env.DB.prepare(
      "SELECT * FROM payables WHERE status IN ('pending', 'partial') AND due_date BETWEEN ? AND ?"
    ).bind(
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).all();

    // Get pending receivables (inflows)
    const receivables = await env.DB.prepare(
      "SELECT * FROM receivables WHERE status IN ('pending', 'partial') AND due_date BETWEEN ? AND ?"
    ).bind(
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ).all();

    // Get historical transactions for the last 60 days
    const historicalStartDate = addDays(today, -60);
    let historicalIncome = [];
    let historicalExpenses = [];
    
    if (includeHistorical) {
      const historical = await env.DB.prepare(`
        SELECT date, amount, type, category 
        FROM transactions 
        WHERE date >= ? AND date < ? AND deleted_at IS NULL
        ORDER BY date ASC
      `).bind(
        historicalStartDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      ).all();

      historicalIncome = (historical.results || []).filter(t => t.type === 'income');
      historicalExpenses = (historical.results || []).filter(t => t.type === 'expense');
    }

    // Build daily projection
    const dailyProjections = [];
    let runningBalance = new Decimal(currentBalance);

    // Collect all projected transactions
    const projectedTransactions = [];

    // Add recurring freelancers
    for (const freelancer of recurringFreelancers.results || []) {
      const occurrences = generateRecurringOccurrences(freelancer, today, endDate, 'recurring_freelancer');
      projectedTransactions.push(...occurrences.map(o => ({ ...o, flow_type: 'outflow' })));
    }

    // Add recurring services
    for (const service of recurringServices.results || []) {
      const occurrences = generateRecurringOccurrences(service, today, endDate, 'recurring_service');
      projectedTransactions.push(...occurrences.map(o => ({ ...o, flow_type: 'outflow' })));
    }

    // Add debt payments
    for (const debt of debts.results || []) {
      let currentDate = new Date(debt.next_payment_date);
      const amount = debt.monthly_payment || 0;
      
      while (currentDate <= endDate) {
        if (currentDate >= today) {
          projectedTransactions.push({
            date: currentDate.toISOString().split('T')[0],
            amount: amount,
            type: 'debt_payment',
            description: `${debt.debt_name} (${debt.lender})`,
            category: 'Debt Payment',
            status: 'projected',
            flow_type: 'outflow'
          });
        }
        currentDate = getNextOccurrence(currentDate, debt.payment_frequency, debt.payment_day, currentDate);
      }
    }

    // Add payables
    for (const payable of payables.results || []) {
      const remainingAmount = (payable.amount || 0) - (payable.amount_paid || 0);
      if (remainingAmount > 0) {
        projectedTransactions.push({
          date: payable.due_date,
          amount: remainingAmount,
          type: 'payable',
          description: `${payable.vendor_name} - ${payable.bill_number || 'Bill'}`,
          category: payable.category || 'Payable',
          status: 'projected',
          flow_type: 'outflow'
        });
      }
    }

    // Add receivables
    for (const receivable of receivables.results || []) {
      const remainingAmount = (receivable.amount || 0) - (receivable.amount_paid || 0);
      if (remainingAmount > 0) {
        // Apply scenario-based probability
        let adjustedAmount = remainingAmount;
        if (scenario === 'pessimistic') {
          adjustedAmount = remainingAmount * 0.7; // 70% collection rate
        } else if (scenario === 'optimistic') {
          adjustedAmount = remainingAmount * 1.0; // 100% collection rate
        } else {
          adjustedAmount = remainingAmount * 0.85; // 85% collection rate (realistic)
        }
        
        projectedTransactions.push({
          date: receivable.due_date,
          amount: adjustedAmount,
          type: 'receivable',
          description: `${receivable.customer_name} - ${receivable.invoice_number || 'Invoice'}`,
          category: 'Income',
          status: 'projected',
          flow_type: 'inflow'
        });
      }
    }

    // Calculate daily averages from historical data
    const avgDailyIncome = calculateHistoricalAverage(historicalIncome, null, 60);
    const avgDailyExpense = calculateHistoricalAverage(historicalExpenses, null, 60);

    // Generate daily projections
    for (let i = 0; i <= days; i++) {
      const currentDay = addDays(today, i);
      const dateStr = currentDay.toISOString().split('T')[0];
      
      // Get all transactions for this day
      const dayTransactions = projectedTransactions.filter(t => t.date === dateStr);
      
      let dayInflow = new Decimal(0);
      let dayOutflow = new Decimal(0);
      
      for (const trans of dayTransactions) {
        if (trans.flow_type === 'inflow') {
          dayInflow = dayInflow.plus(trans.amount);
        } else {
          dayOutflow = dayOutflow.plus(trans.amount);
        }
      }

      // Add estimated daily income/expenses based on historical averages
      // Only add if not weekend (simple heuristic)
      const dayOfWeek = currentDay.getDay();
      const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
      
      if (isWeekday && includeHistorical) {
        // Apply scenario modifiers
        let incomeModifier = 1.0;
        let expenseModifier = 1.0;
        
        if (scenario === 'optimistic') {
          incomeModifier = 1.15;
          expenseModifier = 0.9;
        } else if (scenario === 'pessimistic') {
          incomeModifier = 0.85;
          expenseModifier = 1.1;
        }
        
        dayInflow = dayInflow.plus(avgDailyIncome * incomeModifier);
        dayOutflow = dayOutflow.plus(avgDailyExpense * expenseModifier);
      }

      const netFlow = dayInflow.minus(dayOutflow);
      runningBalance = runningBalance.plus(netFlow);

      dailyProjections.push({
        date: dateStr,
        inflow: parseFloat(dayInflow.toFixed(2)),
        outflow: parseFloat(dayOutflow.toFixed(2)),
        net_flow: parseFloat(netFlow.toFixed(2)),
        projected_balance: parseFloat(runningBalance.toFixed(2)),
        transactions: dayTransactions
      });
    }

    // Calculate summary statistics
    const totalInflow = dailyProjections.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = dailyProjections.reduce((sum, d) => sum + d.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;
    const finalBalance = dailyProjections[dailyProjections.length - 1]?.projected_balance || currentBalance.toNumber();
    const minBalance = Math.min(...dailyProjections.map(d => d.projected_balance));
    const maxBalance = Math.max(...dailyProjections.map(d => d.projected_balance));

    // Identify critical days (negative balance)
    const criticalDays = dailyProjections.filter(d => d.projected_balance < 0);

    const response = {
      scenario,
      period: {
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days: days
      },
      starting_balance: parseFloat(currentBalance.toFixed(2)),
      summary: {
        total_inflow: parseFloat(totalInflow.toFixed(2)),
        total_outflow: parseFloat(totalOutflow.toFixed(2)),
        net_cash_flow: parseFloat(netCashFlow.toFixed(2)),
        final_projected_balance: parseFloat(finalBalance.toFixed(2)),
        min_balance: parseFloat(minBalance.toFixed(2)),
        max_balance: parseFloat(maxBalance.toFixed(2)),
        critical_days_count: criticalDays.length
      },
      daily_projections: dailyProjections,
      critical_days: criticalDays.map(d => ({
        date: d.date,
        projected_balance: d.projected_balance,
        shortfall: Math.abs(d.projected_balance)
      })),
      data_sources: {
        recurring_freelancers: recurringFreelancers.results?.length || 0,
        recurring_services: recurringServices.results?.length || 0,
        active_debts: debts.results?.length || 0,
        pending_payables: payables.results?.length || 0,
        pending_receivables: receivables.results?.length || 0,
        historical_days: includeHistorical ? 60 : 0
      }
    };

    return new Response(JSON.stringify(response), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error generating cash flow projection:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'PROJECTION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
