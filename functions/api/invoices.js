// Invoices API - Manage CFDI invoices

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // recibido or emitido
  
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM invoices ORDER BY date DESC LIMIT 100'
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

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const data = await request.json();
    const { uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url } = data;
    
    // Validate required fields
    if (!uuid || !rfc_emisor || !rfc_receptor || !date || subtotal === undefined || iva === undefined || total === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(
      `INSERT INTO invoices (uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url || null).run();
    
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
