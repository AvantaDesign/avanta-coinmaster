// Transactions API - CRUD operations

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '50';
  const category = url.searchParams.get('category');
  
  try {
    let query = 'SELECT * FROM transactions';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const data = await request.json();
    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url } = data;
    
    // Validate required fields
    if (!date || !description || !amount || !type || !category) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(
      `INSERT INTO transactions (date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(date, description, amount, type, category, account || null, is_deductible ? 1 : 0, economic_activity || null, receipt_url || null).run();
    
    return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const data = await request.json();
    const { date, description, amount, type, category, account, is_deductible, economic_activity, receipt_url } = data;
    
    await env.DB.prepare(
      `UPDATE transactions 
       SET date = ?, description = ?, amount = ?, type = ?, category = ?, 
           account = ?, is_deductible = ?, economic_activity = ?, receipt_url = ?
       WHERE id = ?`
    ).bind(date, description, amount, type, category, account || null, is_deductible ? 1 : 0, economic_activity || null, receipt_url || null, id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
