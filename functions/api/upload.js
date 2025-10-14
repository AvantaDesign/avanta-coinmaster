// Upload API - Handle file uploads to R2

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/xml',
  'application/xml'
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // Validate R2 connection
    if (!env.RECEIPTS) {
      return new Response(JSON.stringify({ 
        error: 'Storage not available',
        code: 'R2_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        code: 'FILE_REQUIRED'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type',
        allowed: ALLOWED_TYPES,
        received: file.type,
        code: 'INVALID_FILE_TYPE'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'File too large',
        maxSize: MAX_FILE_SIZE,
        received: file.size,
        code: 'FILE_TOO_LARGE'
      }), {
        status: 413,
        headers: corsHeaders
      });
    }
    
    // Generate unique filename with sanitized original name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    
    // Upload to R2
    try {
      await env.RECEIPTS.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type
        }
      });
    } catch (r2Error) {
      console.error('R2 upload error:', r2Error);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file to storage',
        message: r2Error.message,
        code: 'STORAGE_ERROR'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Generate URL (in production, this would be a signed URL)
    const url = `/receipts/${filename}`;
    
    return new Response(JSON.stringify({ 
      url, 
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      success: true
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process upload',
      message: error.message,
      code: 'UPLOAD_ERROR'
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
