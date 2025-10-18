// CFDI Validation API - Internal validation logic for CFDI metadata
//
// This API provides validation services including:
// - XML structure validation
// - RFC format validation
// - Duplicate detection
// - Status management
// - Business rule validation

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * POST /api/cfdi-validation
 * Validate CFDI data before upload
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { xmlContent, cfdiData, checkDuplicates = true } = data;

    const validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      duplicates: []
    };

    // Validate XML structure if provided
    if (xmlContent) {
      const xmlValidation = validateXMLStructure(xmlContent);
      if (!xmlValidation.valid) {
        validationResults.valid = false;
        validationResults.errors.push(...xmlValidation.errors);
      }
    }

    // Validate CFDI data if provided
    if (cfdiData) {
      const dataValidation = validateCFDIData(cfdiData);
      if (!dataValidation.valid) {
        validationResults.valid = false;
        validationResults.errors.push(...dataValidation.errors);
      }

      // Validate RFC against user's RFC
      const userProfile = await env.DB.prepare(
        'SELECT preferences FROM users WHERE id = ?'
      ).bind(userId).first();

      const userRFC = userProfile?.preferences ? 
        JSON.parse(userProfile.preferences)?.rfc : null;

      if (userRFC && cfdiData.receptor) {
        const rfcValidation = validateUserRFC(cfdiData, userRFC);
        if (!rfcValidation.valid) {
          validationResults.warnings.push(...rfcValidation.warnings);
        }
      }

      // Check for duplicates
      if (checkDuplicates && cfdiData.uuid) {
        const duplicates = await checkDuplicateCFDI(env, userId, cfdiData.uuid);
        if (duplicates.length > 0) {
          validationResults.duplicates = duplicates;
          validationResults.warnings.push(
            `Found ${duplicates.length} existing CFDI(s) with the same UUID`
          );
        }
      }

      // Validate date range
      const dateValidation = validateDateRange(cfdiData);
      if (!dateValidation.valid) {
        validationResults.warnings.push(...dateValidation.warnings);
      }

      // Validate amounts
      const amountValidation = validateAmounts(cfdiData);
      if (!amountValidation.valid) {
        validationResults.errors.push(...amountValidation.errors);
        validationResults.valid = false;
      }
    }

    return new Response(JSON.stringify(validationResults), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in cfdi-validation POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Validation failed',
      message: error.message,
      code: 'VALIDATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/cfdi-validation/duplicates/:uuid
 * Check for duplicate CFDIs by UUID
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Get UUID from URL
    const pathParts = url.pathname.split('/').filter(p => p);
    const uuid = pathParts[pathParts.length - 1];

    if (!uuid) {
      return new Response(JSON.stringify({ 
        error: 'UUID is required',
        code: 'MISSING_UUID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const duplicates = await checkDuplicateCFDI(env, userId, uuid);

    return new Response(JSON.stringify({ 
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      duplicates
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in cfdi-validation GET:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check duplicates',
      message: error.message,
      code: 'CHECK_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate XML structure
 */
function validateXMLStructure(xmlContent) {
  const errors = [];

  // Check if XML is not empty
  if (!xmlContent || typeof xmlContent !== 'string') {
    errors.push('XML content is required and must be a string');
    return { valid: false, errors };
  }

  // Check for basic XML structure
  if (!xmlContent.includes('<?xml') && !xmlContent.includes('<Comprobante')) {
    errors.push('Invalid XML structure: Missing XML declaration or Comprobante element');
  }

  // Check for required elements
  const requiredElements = [
    'Comprobante',
    'Emisor',
    'Receptor',
    'TimbreFiscalDigital'
  ];

  for (const element of requiredElements) {
    if (!xmlContent.includes(`<${element}`) && 
        !xmlContent.includes(`<cfdi:${element}`) &&
        !xmlContent.includes(`<tfd:${element}`)) {
      errors.push(`Missing required element: ${element}`);
    }
  }

  // Check for UUID in TimbreFiscalDigital
  if (!xmlContent.includes('UUID=') && !xmlContent.includes('uuid=')) {
    errors.push('Missing UUID in TimbreFiscalDigital');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate CFDI data structure
 */
function validateCFDIData(cfdiData) {
  const errors = [];

  // UUID validation
  if (!cfdiData.uuid) {
    errors.push('UUID is required');
  } else if (cfdiData.uuid.length !== 36) {
    errors.push('UUID must be exactly 36 characters');
  } else if (!/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i.test(cfdiData.uuid)) {
    errors.push('UUID format is invalid (must be in format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)');
  }

  // Emisor validation
  if (!cfdiData.emisor) {
    errors.push('Emisor (issuer) information is required');
  } else {
    if (!cfdiData.emisor.rfc) {
      errors.push('Emisor RFC is required');
    } else if (!validateRFCFormat(cfdiData.emisor.rfc)) {
      errors.push('Emisor RFC format is invalid');
    }
  }

  // Receptor validation
  if (!cfdiData.receptor) {
    errors.push('Receptor (receiver) information is required');
  } else {
    if (!cfdiData.receptor.rfc) {
      errors.push('Receptor RFC is required');
    } else if (!validateRFCFormat(cfdiData.receptor.rfc)) {
      errors.push('Receptor RFC format is invalid');
    }
  }

  // Date validation
  if (!cfdiData.date && !cfdiData.fecha) {
    errors.push('Issue date is required');
  }

  // Amount validation
  if (!cfdiData.total && cfdiData.total !== 0) {
    errors.push('Total amount is required');
  }

  if (!cfdiData.subtotal && cfdiData.subtotal !== 0) {
    errors.push('Subtotal is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate RFC format
 * Formats:
 * - Persona Moral (company): 3 letters + 6 digits + 3 alphanumeric
 * - Persona Física (individual): 4 letters + 6 digits + 3 alphanumeric
 */
function validateRFCFormat(rfc) {
  if (!rfc || typeof rfc !== 'string') {
    return false;
  }

  // Remove spaces and convert to uppercase
  const cleanRFC = rfc.trim().toUpperCase();

  // Check length (12 or 13 characters)
  if (cleanRFC.length !== 12 && cleanRFC.length !== 13) {
    return false;
  }

  // Validate format
  // Allow letters (including Ñ and &), digits, and specific structure
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(cleanRFC);
}

/**
 * Validate user RFC against CFDI
 */
function validateUserRFC(cfdiData, userRFC) {
  const warnings = [];

  if (!userRFC) {
    warnings.push('User RFC not configured. Cannot verify CFDI ownership.');
    return { valid: true, warnings };
  }

  const cleanUserRFC = userRFC.trim().toUpperCase();
  const emisorRFC = cfdiData.emisor?.rfc?.trim().toUpperCase();
  const receptorRFC = cfdiData.receptor?.rfc?.trim().toUpperCase();

  // Check if user is either emisor or receptor
  const isEmisor = emisorRFC === cleanUserRFC;
  const isReceptor = receptorRFC === cleanUserRFC;

  if (!isEmisor && !isReceptor) {
    warnings.push(
      `CFDI does not belong to user. User RFC: ${cleanUserRFC}, ` +
      `Emisor: ${emisorRFC}, Receptor: ${receptorRFC}`
    );
  }

  return {
    valid: true,
    warnings,
    isEmisor,
    isReceptor
  };
}

/**
 * Check for duplicate CFDIs
 */
async function checkDuplicateCFDI(env, userId, uuid) {
  const duplicates = await env.DB.prepare(`
    SELECT 
      id, uuid, type, status, 
      emitter_rfc, receiver_rfc,
      total_amount, issue_date,
      created_at
    FROM cfdi_metadata 
    WHERE user_id = ? AND uuid = ?
    ORDER BY created_at DESC
  `).bind(userId, uuid).all();

  return duplicates.results || [];
}

/**
 * Validate date range
 */
function validateDateRange(cfdiData) {
  const warnings = [];
  const now = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  const issueDate = new Date(cfdiData.date || cfdiData.fecha);

  // Check if date is too old (more than 5 years)
  if (issueDate < fiveYearsAgo) {
    warnings.push(
      `CFDI is more than 5 years old (${issueDate.toISOString().split('T')[0]}). ` +
      'This may be outside the tax deduction period.'
    );
  }

  // Check if date is in the future
  if (issueDate > now) {
    warnings.push(
      `CFDI issue date is in the future (${issueDate.toISOString().split('T')[0]}). ` +
      'This may indicate an error.'
    );
  }

  return {
    valid: true,
    warnings
  };
}

/**
 * Validate amounts
 */
function validateAmounts(cfdiData) {
  const errors = [];

  const total = parseFloat(cfdiData.total) || 0;
  const subtotal = parseFloat(cfdiData.subtotal) || 0;
  const iva = parseFloat(cfdiData.impuestos?.totalTraslados) || 0;
  const discount = parseFloat(cfdiData.descuento) || 0;

  // Check that amounts are positive
  if (total <= 0) {
    errors.push('Total amount must be greater than 0');
  }

  if (subtotal <= 0) {
    errors.push('Subtotal must be greater than 0');
  }

  // Check that total >= subtotal
  if (total < subtotal) {
    errors.push(
      `Total (${total}) cannot be less than subtotal (${subtotal})`
    );
  }

  // Validate calculation: total should equal subtotal + iva - discount (approximately)
  const calculatedTotal = subtotal + iva - discount;
  const difference = Math.abs(total - calculatedTotal);
  const tolerance = 0.02; // 2 cents tolerance for rounding

  if (difference > tolerance) {
    errors.push(
      `Amount calculation mismatch: Total (${total}) does not match ` +
      `Subtotal (${subtotal}) + IVA (${iva}) - Discount (${discount}) = ${calculatedTotal.toFixed(2)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Determine CFDI status based on validation results
 */
export function determineCFDIStatus(validationResults, userRFC, cfdiData) {
  // If there are validation errors, status is Error
  if (!validationResults.valid) {
    return 'Error';
  }

  // If there are RFC mismatches, status is Invalid RFC
  if (userRFC && cfdiData) {
    const rfcValidation = validateUserRFC(cfdiData, userRFC);
    if (!rfcValidation.isEmisor && !rfcValidation.isReceptor) {
      return 'Invalid RFC';
    }
  }

  // If there are duplicates, keep as Pending Validation
  if (validationResults.duplicates && validationResults.duplicates.length > 0) {
    return 'Pending Validation';
  }

  // Otherwise, it's Valid
  return 'Valid';
}
