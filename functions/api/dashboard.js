// Dashboard API - Get balance and summary
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // Get total balance from accounts
    const accountsResult = await env.DB.prepare(
      'SELECT SUM(CASE WHEN type = "banco" THEN balance ELSE -balance END) as totalBalance FROM accounts'
    ).first();
    
    const totalBalance = accountsResult?.totalBalance || 0;
    
    // Get this month's income and expenses
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthSummary = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses
      FROM transactions
      WHERE date >= ? AND date <= ?
    `).bind(firstDayOfMonth, lastDayOfMonth).first();
    
    // Get recent transactions
    const recentTransactions = await env.DB.prepare(
      'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 10'
    ).all();
    
    return new Response(JSON.stringify({
      totalBalance,
      thisMonth: {
        income: monthSummary?.income || 0,
        expenses: monthSummary?.expenses || 0
      },
      recentTransactions: recentTransactions.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
