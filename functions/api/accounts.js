// Accounts API - Manage bank accounts and credit cards

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM accounts ORDER BY type, name'
    ).all();
    
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

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const data = await request.json();
    const { balance } = data;
    
    if (balance === undefined) {
      return new Response(JSON.stringify({ error: 'Balance is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await env.DB.prepare(
      'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(balance, id).run();
    
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
