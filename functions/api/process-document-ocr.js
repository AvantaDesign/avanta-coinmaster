/**
 * OCR Processing API Endpoint
 * 
 * Phase 32: Performance and User Experience Optimization
 * Phase 41: Authentication hardening - Added getUserIdFromToken for all endpoints
 * 
 * Handles server-side OCR processing to prevent UI freezing.
 * Accepts uploaded images and returns extracted text.
 * 
 * This implementation uses a hybrid approach:
 * 1. For production: Use external OCR service (Google Cloud Vision, AWS Textract, etc.)
 * 2. For development: Simple pattern-based extraction
 * 
 * Note: Tesseract.js is not compatible with Cloudflare Workers due to WASM limitations.
 * For production, configure external OCR service credentials.
 */

import { getUserIdFromToken } from './auth.js';
import { createErrorResponse, createSuccessResponse, ErrorType, HttpStatus } from '../utils/errors.js';
import { withErrorHandling } from '../utils/errors.js';
import { validateFile } from '../utils/validation.js';
import { logDebug, logError } from '../utils/logging.js';

/**
 * Maximum file size for OCR processing (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for OCR processing
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf'
];

/**
 * Process OCR request
 * POST /api/process-document-ocr
 */
export async function onRequestPost(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    
    // Phase 41: Authentication check
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse(
        { message: 'Valid authentication token required', type: ErrorType.AUTH, statusCode: HttpStatus.UNAUTHORIZED },
        request,
        env
      );
    }
    
    logDebug('OCR processing request received', { userId }, env);
    
    try {
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return createErrorResponse(
          { message: 'No file provided', type: ErrorType.VALIDATION, statusCode: HttpStatus.BAD_REQUEST },
          request,
          env
        );
      }
      
      // Validate file
      const validation = validateFile(file, ALLOWED_MIME_TYPES, MAX_FILE_SIZE / (1024 * 1024));
      
      if (!validation.valid) {
        return createErrorResponse(
          { message: validation.error, type: ErrorType.VALIDATION, statusCode: HttpStatus.BAD_REQUEST },
          request,
          env
        );
      }
      
      logDebug('File validation passed', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      }, env);
      
      // Process OCR based on environment configuration
      let ocrResult;
      
      if (env.GOOGLE_CLOUD_VISION_API_KEY) {
        // Use Google Cloud Vision API
        ocrResult = await processWithGoogleVision(file, env);
      } else if (env.AWS_TEXTRACT_ENABLED === 'true') {
        // Use AWS Textract
        ocrResult = await processWithAWSTextract(file, env);
      } else {
        // Fallback to pattern-based extraction
        logDebug('Using fallback pattern-based extraction', {}, env);
        ocrResult = await processWithPatternExtraction(file, env);
      }
      
      logDebug('OCR processing completed', {
        confidence: ocrResult.confidence,
        textLength: ocrResult.text?.length || 0
      }, env);
      
      // Return processed result
      return createSuccessResponse({
        success: true,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        extractedData: ocrResult.extractedData,
        processingMethod: ocrResult.method,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logError(error, { operation: 'ocr_processing' }, env);
      return createErrorResponse(error, request, env);
    }
  })(context);
}

/**
 * Process image with Google Cloud Vision API
 * @param {File} file - Image file
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} OCR result
 */
async function processWithGoogleVision(file, env) {
  const apiKey = env.GOOGLE_CLOUD_VISION_API_KEY;
  const endpoint = 'https://vision.googleapis.com/v1/images:annotate';
  
  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  // Call Google Vision API
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        image: {
          content: base64
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  const textAnnotations = result.responses[0]?.textAnnotations || [];
  
  if (textAnnotations.length === 0) {
    return {
      method: 'google-vision',
      text: '',
      confidence: 0,
      extractedData: {}
    };
  }
  
  const fullText = textAnnotations[0].description;
  
  return {
    method: 'google-vision',
    text: fullText,
    confidence: 0.95, // Google Vision typically has high confidence
    extractedData: extractStructuredData(fullText)
  };
}

/**
 * Process image with AWS Textract (placeholder)
 * @param {File} file - Image file
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} OCR result
 */
async function processWithAWSTextract(file, env) {
  // TODO: Implement AWS Textract integration
  // Requires AWS SDK for JavaScript and proper credentials
  throw new Error('AWS Textract integration not yet implemented');
}

/**
 * Fallback pattern-based extraction
 * This is a simple fallback when no external OCR service is configured.
 * It doesn't perform actual OCR but returns a helpful message.
 * 
 * @param {File} file - Image file
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} OCR result
 */
async function processWithPatternExtraction(file, env) {
  logDebug('Pattern extraction fallback - no actual OCR performed', {}, env);
  
  return {
    method: 'pattern-fallback',
    text: '',
    confidence: 0,
    extractedData: {},
    message: 'OCR service not configured. Please configure GOOGLE_CLOUD_VISION_API_KEY or AWS_TEXTRACT_ENABLED in environment variables.'
  };
}

/**
 * Extract structured data from OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} Structured data
 */
function extractStructuredData(text) {
  if (!text) {
    return {
      amount: null,
      date: null,
      merchant: null,
      items: [],
      total: null,
      subtotal: null,
      tax: null
    };
  }
  
  return {
    amount: extractAmount(text),
    date: extractDate(text),
    merchant: extractMerchant(text),
    items: extractItems(text),
    total: extractTotal(text),
    subtotal: extractSubtotal(text),
    tax: extractTax(text),
    rawText: text
  };
}

/**
 * Extract monetary amount from text
 */
function extractAmount(text) {
  const patterns = [
    /total[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/,
    /mxn\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.?\d*)\s*pesos/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  
  return null;
}

/**
 * Extract date from text
 */
function extractDate(text) {
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i
  ];
  
  const monthNames = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (match[2] && monthNames[match[2].toLowerCase()]) {
          const day = match[1].padStart(2, '0');
          const month = monthNames[match[2].toLowerCase()];
          const year = match[3];
          return `${year}-${month}-${day}`;
        } else if (match[3].length === 4) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          let year = match[3];
          if (year.length === 2) {
            year = '20' + year;
          }
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Silent error - date parsing failures are expected
      }
    }
  }
  
  return null;
}

/**
 * Extract merchant/store name
 */
function extractMerchant(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 50) {
      const letterCount = (line.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || []).length;
      if (letterCount > line.length * 0.5) {
        return line;
      }
    }
  }
  
  return null;
}

/**
 * Extract line items
 */
function extractItems(text) {
  const items = [];
  const lines = text.split('\n');
  const itemPattern = /^(.+?)\s+\$?\s*([\d,]+\.?\d*)\s*$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(itemPattern);
    
    if (match) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      
      if (description.length > 3 && !isNaN(amount) && amount > 0) {
        items.push({ description, amount });
      }
    }
  }
  
  return items.slice(0, 20);
}

/**
 * Extract total amount
 */
function extractTotal(text) {
  const patterns = [
    /total[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /importe[:\s]+\$?\s*([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  
  return null;
}

/**
 * Extract subtotal amount
 */
function extractSubtotal(text) {
  const patterns = [
    /subtotal[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /sub-total[:\s]+\$?\s*([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  
  return null;
}

/**
 * Extract tax amount (IVA)
 */
function extractTax(text) {
  const patterns = [
    /iva[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /impuesto[:\s]+\$?\s*([\d,]+\.?\d*)/i,
    /tax[:\s]+\$?\s*([\d,]+\.?\d*)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  
  return null;
}
