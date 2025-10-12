// Upload API - Handle file uploads to R2

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    // Upload to R2
    await env.RECEIPTS.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });
    
    // Generate URL (in production, this would be a signed URL)
    const url = `/receipts/${filename}`;
    
    return new Response(JSON.stringify({ url, success: true }), {
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
