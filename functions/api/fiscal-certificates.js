/**
 * Fiscal Certificates Management API
 * Phase 35: Centralized Settings Panel
 * 
 * Handles upload, storage, and OCR analysis of fiscal certificates
 */

import { createErrorResponse, createSuccessResponse, ErrorType, HttpStatus } from '../utils/errors.js';
import { withErrorHandling } from '../utils/errors.js';
import { validateFile } from '../utils/validation.js';
import { logDebug, logError } from '../utils/logging.js';
import { verifyAuth } from '../utils/security.js';

/**
 * Maximum file size for certificate upload (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed MIME types for certificates
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];

/**
 * GET /api/fiscal-certificates
 * List all fiscal certificates for the authenticated user
 */
export async function onRequestGet(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Check if this is a detail request (has ID in path)
    const pathParts = url.pathname.split('/').filter(p => p);
    const isDetailRequest = pathParts.length > 2; // /api/fiscal-certificates/:id
    
    if (isDetailRequest) {
      return handleGetCertificate(context);
    }
    
    // Verify authentication
    const authResult = await verifyAuth(request, env);
    if (!authResult.valid) {
      return createErrorResponse(authResult.error, request, env);
    }
    
    const userId = authResult.userId;
    logDebug('Fetching fiscal certificates', { userId }, env);
    
    try {
      const db = env.DB;
      const { results } = await db.prepare(`
        SELECT 
          id, filename, file_size, mime_type, certificate_type,
          status, uploaded_at, processed_at
        FROM fiscal_certificates
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
      `).bind(userId).all();
      
      logDebug('Fiscal certificates fetched', { userId, count: results.length }, env);
      
      return createSuccessResponse({
        certificates: results,
        total: results.length
      }, request, env);
      
    } catch (error) {
      logError('Error fetching fiscal certificates', error, env);
      return createErrorResponse(
        { message: 'Error al obtener certificados', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * GET /api/fiscal-certificates/:id
 * Get details of a specific certificate
 */
async function handleGetCertificate(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const certificateId = pathParts[pathParts.length - 1];
    
    // Verify authentication
    const authResult = await verifyAuth(request, env);
    if (!authResult.valid) {
      return createErrorResponse(authResult.error, request, env);
    }
    
    const userId = authResult.userId;
    
    try {
      const db = env.DB;
      const certificate = await db.prepare(`
        SELECT *
        FROM fiscal_certificates
        WHERE id = ? AND user_id = ?
      `).bind(certificateId, userId).first();
      
      if (!certificate) {
        return createErrorResponse(
          { message: 'Certificado no encontrado', type: ErrorType.NOT_FOUND, statusCode: HttpStatus.NOT_FOUND },
          request,
          env
        );
      }
      
      // Parse analysis_data if it exists
      if (certificate.analysis_data) {
        try {
          certificate.analysis_data = JSON.parse(certificate.analysis_data);
        } catch (e) {
          logError('Error parsing certificate analysis data', e, env);
        }
      }
      
      logDebug('Certificate details fetched', { certificateId, userId }, env);
      
      return createSuccessResponse({
        certificate
      }, request, env);
      
    } catch (error) {
      logError('Error fetching certificate details', error, env);
      return createErrorResponse(
        { message: 'Error al obtener detalles del certificado', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * POST /api/fiscal-certificates
 * Upload and analyze a new fiscal certificate
 */
export async function onRequestPost(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    
    // Verify authentication
    const authResult = await verifyAuth(request, env);
    if (!authResult.valid) {
      return createErrorResponse(authResult.error, request, env);
    }
    
    const userId = authResult.userId;
    
    try {
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file');
      const certificateType = formData.get('type') || 'situacion_fiscal';
      
      if (!file) {
        return createErrorResponse(
          { message: 'No se proporcionó archivo', type: ErrorType.VALIDATION, statusCode: HttpStatus.BAD_REQUEST },
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
      
      logDebug('Uploading fiscal certificate', {
        userId,
        fileName: file.name,
        fileSize: file.size,
        certificateType
      }, env);
      
      const db = env.DB;
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const storagePath = `fiscal-certificates/${userId}/${timestamp}.${fileExtension}`;
      
      // Upload file to R2 storage
      try {
        const arrayBuffer = await file.arrayBuffer();
        await env.R2_BUCKET.put(storagePath, arrayBuffer, {
          httpMetadata: {
            contentType: file.type
          }
        });
        
        logDebug('File uploaded to R2', { storagePath }, env);
      } catch (error) {
        logError('Error uploading to R2', error, env);
        return createErrorResponse(
          { message: 'Error al subir archivo', type: ErrorType.STORAGE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
          request,
          env
        );
      }
      
      // Create database record
      const result = await db.prepare(`
        INSERT INTO fiscal_certificates (
          user_id, filename, file_path, file_size, mime_type, 
          certificate_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `).bind(
        userId,
        file.name,
        storagePath,
        file.size,
        file.type,
        certificateType
      ).run();
      
      const certificateId = result.meta.last_row_id;
      
      // TODO: Trigger OCR processing asynchronously
      // For now, we'll process it immediately in a simple way
      let analysisData = null;
      try {
        // Update status to processing
        await db.prepare(
          'UPDATE fiscal_certificates SET status = ? WHERE id = ?'
        ).bind('processing', certificateId).run();
        
        // Perform OCR analysis (simplified for now)
        analysisData = await performOCRAnalysis(file, certificateType, env);
        
        // Update with analysis results
        await db.prepare(`
          UPDATE fiscal_certificates 
          SET analysis_data = ?, status = ?, processed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(analysisData), 'completed', certificateId).run();
        
      } catch (error) {
        logError('Error processing certificate', error, env);
        // Update status to failed
        await db.prepare(`
          UPDATE fiscal_certificates 
          SET status = ?, error_message = ?
          WHERE id = ?
        `).bind('failed', error.message, certificateId).run();
      }
      
      // Fetch the complete record
      const certificate = await db.prepare(
        'SELECT * FROM fiscal_certificates WHERE id = ?'
      ).bind(certificateId).first();
      
      if (certificate.analysis_data) {
        try {
          certificate.analysis_data = JSON.parse(certificate.analysis_data);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      logDebug('Certificate uploaded and processed', { certificateId, userId, status: certificate.status }, env);
      
      return createSuccessResponse({
        message: 'Certificado subido exitosamente',
        certificate
      }, request, env);
      
    } catch (error) {
      logError('Error uploading certificate', error, env);
      return createErrorResponse(
        { message: 'Error al subir certificado', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * DELETE /api/fiscal-certificates/:id
 * Delete a fiscal certificate
 */
export async function onRequestDelete(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const certificateId = pathParts[pathParts.length - 1];
    
    // Verify authentication
    const authResult = await verifyAuth(request, env);
    if (!authResult.valid) {
      return createErrorResponse(authResult.error, request, env);
    }
    
    const userId = authResult.userId;
    
    try {
      const db = env.DB;
      
      // Get certificate to verify ownership and get file path
      const certificate = await db.prepare(
        'SELECT * FROM fiscal_certificates WHERE id = ? AND user_id = ?'
      ).bind(certificateId, userId).first();
      
      if (!certificate) {
        return createErrorResponse(
          { message: 'Certificado no encontrado', type: ErrorType.NOT_FOUND, statusCode: HttpStatus.NOT_FOUND },
          request,
          env
        );
      }
      
      // Delete from R2 storage
      try {
        await env.R2_BUCKET.delete(certificate.file_path);
        logDebug('File deleted from R2', { filePath: certificate.file_path }, env);
      } catch (error) {
        logError('Error deleting from R2 (continuing anyway)', error, env);
      }
      
      // Delete from database
      await db.prepare(
        'DELETE FROM fiscal_certificates WHERE id = ? AND user_id = ?'
      ).bind(certificateId, userId).run();
      
      logDebug('Certificate deleted', { certificateId, userId }, env);
      
      return createSuccessResponse({
        message: 'Certificado eliminado exitosamente'
      }, request, env);
      
    } catch (error) {
      logError('Error deleting certificate', error, env);
      return createErrorResponse(
        { message: 'Error al eliminar certificado', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * Perform OCR analysis on uploaded certificate
 * This is a simplified version - in production, this would call the OCR endpoint
 */
async function performOCRAnalysis(file, certificateType, env) {
  // For now, return mock data structure
  // In production, this would process the file through OCR
  
  logDebug('Performing OCR analysis (mock)', { certificateType }, env);
  
  return {
    extracted: true,
    certificateType,
    data: {
      rfc: '',
      nombre: '',
      regimen_fiscal: '',
      domicilio_fiscal: '',
      actividad_economica: '',
      fecha_inicio_operaciones: '',
      situacion_contribuyente: 'Activo'
    },
    confidence: 0.0,
    processedAt: new Date().toISOString(),
    note: 'Análisis OCR pendiente de implementación completa'
  };
}
