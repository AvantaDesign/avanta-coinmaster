// OCR Processor - Client-side receipt text extraction using Tesseract.js
//
// This utility provides OCR functionality for receipt processing.
// Currently uses Tesseract.js for client-side processing (Phase 9 MVP).
// Future enhancement: Google Cloud Vision API for server-side processing.

import { createWorker } from 'tesseract.js';

/**
 * Process receipt image and extract text using OCR
 * @param {File|Blob|string} image - Image file, blob, or data URL
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} OCR result with text and confidence
 */
export async function processReceipt(image, progressCallback = null) {
  try {
    console.log('[OCR] Starting receipt processing...');
    
    // Create Tesseract worker
    const worker = await createWorker('spa', 1, {
      logger: (m) => {
        console.log('[OCR]', m);
        if (progressCallback && m.status === 'recognizing text') {
          progressCallback({
            status: 'processing',
            progress: m.progress,
            message: `Procesando: ${Math.round(m.progress * 100)}%`
          });
        }
      }
    });

    // Perform OCR
    const result = await worker.recognize(image);
    
    // Cleanup worker
    await worker.terminate();

    console.log('[OCR] Processing complete', {
      confidence: result.data.confidence,
      textLength: result.data.text.length
    });

    // Extract structured data from text
    const extractedData = extractTransactionData(result.data.text);
    
    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence / 100, // Convert to 0-1 scale
      extractedData,
      words: result.data.words,
      lines: result.data.lines
    };
  } catch (error) {
    console.error('[OCR] Processing error:', error);
    return {
      success: false,
      error: error.message,
      text: null,
      confidence: 0,
      extractedData: null
    };
  }
}

/**
 * Extract structured transaction data from OCR text
 * Uses pattern matching to identify amounts, dates, merchants, etc.
 * @param {string} text - Raw OCR text
 * @returns {Object} Structured data
 */
export function extractTransactionData(text) {
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

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  return {
    amount: extractAmount(text),
    date: extractDate(text),
    merchant: extractMerchant(lines),
    items: extractItems(text),
    total: extractTotal(text),
    subtotal: extractSubtotal(text),
    tax: extractTax(text),
    rawText: text
  };
}

/**
 * Extract monetary amount from text
 * Looks for common patterns like "Total: $123.45" or "MXN 123.45"
 */
function extractAmount(text) {
  // Patterns for Mexican currency
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
 * Looks for common date formats used in Mexico
 */
function extractDate(text) {
  // Common Mexican date formats
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
        // Handle different date formats
        if (match[2] && monthNames[match[2].toLowerCase()]) {
          // Format: "15 de marzo de 2024"
          const day = match[1].padStart(2, '0');
          const month = monthNames[match[2].toLowerCase()];
          const year = match[3];
          return `${year}-${month}-${day}`;
        } else if (match[3].length === 4) {
          // Format: "2024-03-15" or "2024/03/15"
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // Format: "15/03/24" or "15-03-2024"
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          let year = match[3];
          if (year.length === 2) {
            year = '20' + year;
          }
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        console.error('[OCR] Date parsing error:', e);
      }
    }
  }

  return null;
}

/**
 * Extract merchant/store name from receipt
 * Usually appears in the first few lines
 */
function extractMerchant(lines) {
  // Take first non-empty line that's not too long and not just numbers/symbols
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 50) {
      // Check if line contains mostly letters
      const letterCount = (line.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/g) || []).length;
      if (letterCount > line.length * 0.5) {
        return line;
      }
    }
  }
  return null;
}

/**
 * Extract line items from receipt
 * Looks for patterns like "Product name 123.45"
 */
function extractItems(text) {
  const items = [];
  const lines = text.split('\n');
  
  // Pattern: text followed by amount
  const itemPattern = /^(.+?)\s+\$?\s*([\d,]+\.?\d*)\s*$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(itemPattern);
    
    if (match) {
      const description = match[1].trim();
      const amount = parseFloat(match[2].replace(/,/g, ''));
      
      if (description.length > 3 && !isNaN(amount) && amount > 0) {
        items.push({
          description,
          amount
        });
      }
    }
  }
  
  return items.slice(0, 20); // Limit to first 20 items
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

/**
 * Calculate confidence score for extracted data
 * @param {string} ocrText - Raw OCR text
 * @param {Object} extractedData - Parsed structured data
 * @returns {number} Confidence score (0-1)
 */
export function calculateConfidence(ocrText, extractedData) {
  let score = 0;
  let maxScore = 0;

  // Check if we found an amount
  maxScore += 40;
  if (extractedData.amount || extractedData.total) {
    score += 40;
  }

  // Check if we found a date
  maxScore += 20;
  if (extractedData.date) {
    score += 20;
  }

  // Check if we found a merchant
  maxScore += 20;
  if (extractedData.merchant) {
    score += 20;
  }

  // Check if we found items
  maxScore += 10;
  if (extractedData.items && extractedData.items.length > 0) {
    score += 10;
  }

  // Check if we found tax
  maxScore += 10;
  if (extractedData.tax) {
    score += 10;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Validate extracted transaction data
 * @param {Object} data - Extracted data
 * @returns {Object} Validation result
 */
export function validateExtractedData(data) {
  const errors = [];
  const warnings = [];

  if (!data.amount && !data.total) {
    errors.push('No se encontró el monto total');
  }

  if (!data.date) {
    warnings.push('No se encontró la fecha de la transacción');
  }

  if (!data.merchant) {
    warnings.push('No se encontró el nombre del comercio');
  }

  // Check if amount is reasonable
  if (data.amount && (data.amount < 0 || data.amount > 1000000)) {
    warnings.push('El monto detectado parece inusual');
  }

  // Check if date is in reasonable range
  if (data.date) {
    const date = new Date(data.date);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    if (date > now) {
      warnings.push('La fecha detectada está en el futuro');
    } else if (date < oneYearAgo) {
      warnings.push('La fecha detectada es de hace más de un año');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
