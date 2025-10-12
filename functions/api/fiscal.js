// Fiscal API - Calculate ISR and IVA

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get('month')) || new Date().getMonth() + 1;
  const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
  
  try {
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
      income,
      deductible,
      utilidad,
      isr: Math.max(0, isr),
      iva: Math.max(0, iva),
      dueDate
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
