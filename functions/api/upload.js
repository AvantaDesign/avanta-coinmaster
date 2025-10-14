// Upload API - Handle file uploads to R2 and file downloads
//
// Features:
// - Upload files to R2 storage
// - Download files from R2 storage
// - File type validation
// - File size validation
// - Secure filename sanitization
// - CORS support

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Allowed file types with metadata
const ALLOWED_TYPES = {
  'image/jpeg': { extension: '.jpg', icon: '🖼️', category: 'image' },
  'image/png': { extension: '.png', icon: '🖼️', category: 'image' },
  'image/gif': { extension: '.gif', icon: '🖼️', category: 'image' },
  'application/pdf': { extension: '.pdf', icon: '📄', category: 'document' },
  'text/xml': { extension: '.xml', icon: '📋', category: 'document' },
  'application/xml': { extension: '.xml', icon: '📋', category: 'document' }
};

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to get file metadata
function getFileMetadata(mimeType) {
  return ALLOWED_TYPES[mimeType] || { extension: '', icon: '📎', category: 'unknown' };
}

// POST /api/upload - Upload file to R2
export async function onRequestPost(context) {
  const { env, request } = context;
  const uploadStartTime = Date.now();
  
  try {
    // Validate R2 connection
    if (!env.RECEIPTS) {
      console.error('[Upload] R2 binding not configured');
      return new Response(JSON.stringify({ 
        error: 'Storage not available',
        details: 'R2 bucket binding is not configured. Please check wrangler.toml',
        code: 'R2_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      console.warn('[Upload] No file in request');
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        details: 'Please select a file to upload',
        code: 'FILE_REQUIRED'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log(`[Upload] Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      console.warn(`[Upload] Invalid file type: ${file.type}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid file type',
        details: `File type "${file.type}" is not allowed`,
        allowed: Object.keys(ALLOWED_TYPES),
        received: file.type,
        code: 'INVALID_FILE_TYPE'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[Upload] File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return new Response(JSON.stringify({ 
        error: 'File too large',
        details: `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
        maxSize: MAX_FILE_SIZE,
        maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
        received: file.size,
        receivedMB: parseFloat((file.size / 1024 / 1024).toFixed(2)),
        code: 'FILE_TOO_LARGE'
      }), {
        status: 413,
        headers: corsHeaders
      });
    }
    
    // Validate filename
    if (!file.name || file.name.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'Invalid filename',
        details: 'File must have a valid name',
        code: 'INVALID_FILENAME'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Generate unique filename with sanitized original name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    
    // Get file metadata
    const metadata = getFileMetadata(file.type);
    
    // Upload to R2
    try {
      console.log(`[Upload] Uploading to R2: ${filename}`);
      await env.RECEIPTS.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          category: metadata.category
        }
      });
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`[Upload] Successfully uploaded ${filename} in ${uploadDuration}ms`);
    } catch (r2Error) {
      console.error('[Upload] R2 upload error:', r2Error);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file to storage',
        details: 'An error occurred while saving the file. Please try again.',
        message: r2Error.message,
        code: 'STORAGE_ERROR'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Generate URL (in production, this would be a signed URL or CDN URL)
    const url = `/api/upload/${filename}`;
    const uploadDuration = Date.now() - uploadStartTime;
    
    return new Response(JSON.stringify({ 
      success: true,
      url, 
      filename,
      originalName: file.name,
      size: file.size,
      sizeMB: parseFloat((file.size / 1024 / 1024).toFixed(2)),
      type: file.type,
      metadata: {
        icon: metadata.icon,
        category: metadata.category,
        extension: metadata.extension
      },
      uploadedAt: new Date().toISOString(),
      uploadDurationMs: uploadDuration,
      message: 'File uploaded successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process upload',
      details: 'An unexpected error occurred. Please try again.',
      message: error.message,
      code: 'UPLOAD_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// GET /api/upload/:filename - Download file from R2
export async function onRequestGet(context) {
  const { env, request, params } = context;
  
  try {
    // Extract filename from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (!filename) {
      return new Response(JSON.stringify({ 
        error: 'Filename required',
        details: 'Please provide a filename in the URL',
        code: 'FILENAME_REQUIRED'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`[Download] Retrieving file: ${filename}`);
    
    // Validate R2 connection
    if (!env.RECEIPTS) {
      console.error('[Download] R2 binding not configured');
      return new Response(JSON.stringify({ 
        error: 'Storage not available',
        code: 'R2_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Retrieve file from R2
    const object = await env.RECEIPTS.get(filename);
    
    if (!object) {
      console.warn(`[Download] File not found: ${filename}`);
      return new Response(JSON.stringify({ 
        error: 'File not found',
        details: `The file "${filename}" does not exist`,
        filename,
        code: 'FILE_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    console.log(`[Download] Successfully retrieved ${filename}`);
    
    // Return file with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata.contentType || 'application/octet-stream');
    headers.set('Content-Length', object.size);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    headers.set('Access-Control-Allow-Origin', '*');
    
    // If it's an image or PDF, show inline. Otherwise, download.
    const contentType = object.httpMetadata.contentType || '';
    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      headers.set('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    return new Response(object.body, { headers });
    
  } catch (error) {
    console.error('[Download] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to download file',
      details: 'An error occurred while retrieving the file',
      message: error.message,
      code: 'DOWNLOAD_ERROR'
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
