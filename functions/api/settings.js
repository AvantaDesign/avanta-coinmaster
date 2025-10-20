/**
 * Settings Management API
 * Phase 35: Centralized Settings Panel
 * 
 * Handles user settings CRUD operations
 */

import { createErrorResponse, createSuccessResponse, ErrorType, HttpStatus } from '../utils/errors.js';
import { withErrorHandling } from '../utils/errors.js';
import { validateEnum } from '../utils/validation.js';
import { logDebug, logError } from '../utils/logging.js';
import { getUserIdFromToken } from './auth.js';

/**
 * Default settings for new users
 */
const DEFAULT_SETTINGS = {
  theme: 'system',
  language: 'es',
  currency: 'MXN',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  notifications_enabled: true,
  email_notifications: true,
  fiscal_regime: '',
  tax_residence: 'MX',
  decimal_separator: '.',
  thousands_separator: ',',
  dashboard_layout: 'default'
};

/**
 * Valid setting keys and their validation rules
 */
const SETTING_VALIDATIONS = {
  theme: { type: 'enum', values: ['light', 'dark', 'system'] },
  language: { type: 'enum', values: ['es', 'en'] },
  currency: { type: 'enum', values: ['MXN', 'USD', 'EUR'] },
  date_format: { type: 'enum', values: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
  time_format: { type: 'enum', values: ['12h', '24h'] },
  notifications_enabled: { type: 'boolean' },
  email_notifications: { type: 'boolean' },
  fiscal_regime: { type: 'string' },
  tax_residence: { type: 'string' },
  decimal_separator: { type: 'enum', values: ['.', ','] },
  thousands_separator: { type: 'enum', values: ['.', ',', ' ', ''] },
  dashboard_layout: { type: 'string' }
};

/**
 * Setting categories for organization
 */
const SETTING_CATEGORIES = {
  appearance: {
    name: 'Apariencia',
    description: 'Personaliza el aspecto de la aplicación',
    settings: ['theme', 'language']
  },
  regional: {
    name: 'Regional',
    description: 'Configuración regional y de formato',
    settings: ['currency', 'date_format', 'time_format', 'decimal_separator', 'thousands_separator', 'tax_residence']
  },
  notifications: {
    name: 'Notificaciones',
    description: 'Gestiona tus preferencias de notificación',
    settings: ['notifications_enabled', 'email_notifications']
  },
  fiscal: {
    name: 'Fiscal',
    description: 'Configuración fiscal y tributaria',
    settings: ['fiscal_regime', 'tax_residence']
  },
  dashboard: {
    name: 'Dashboard',
    description: 'Personaliza tu panel de control',
    settings: ['dashboard_layout']
  }
};

/**
 * GET /api/settings
 * Get all user settings
 */
export async function onRequestGet(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    
    // Verify authentication
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse(
        { message: 'Valid authentication token required', type: ErrorType.AUTH, statusCode: HttpStatus.UNAUTHORIZED },
        request,
        env
      );
    }
    
    logDebug('Fetching user settings', { userId }, env);
    
    try {
      // Fetch user settings from database
      const db = env.DB;
      const { results } = await db.prepare(
        'SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?'
      ).bind(userId).all();
      
      // Convert array to object
      const settings = {};
      results.forEach(row => {
        try {
          // Try to parse JSON values
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch {
          // If not JSON, use as-is
          settings[row.setting_key] = row.setting_value;
        }
      });
      
      // Merge with defaults for any missing settings
      const completeSettings = { ...DEFAULT_SETTINGS, ...settings };
      
      logDebug('User settings fetched', { userId, settingCount: Object.keys(settings).length }, env);
      
      return createSuccessResponse({
        settings: completeSettings,
        categories: SETTING_CATEGORIES
      }, request, env);
      
    } catch (error) {
      logError('Error fetching user settings', error, env);
      return createErrorResponse(
        { message: 'Error al obtener configuración', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * PUT /api/settings
 * Update user settings
 */
export async function onRequestPut(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    
    // Verify authentication
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse(
        { message: 'Valid authentication token required', type: ErrorType.AUTH, statusCode: HttpStatus.UNAUTHORIZED },
        request,
        env
      );
    }
    
    try {
      const data = await request.json();
      const { settings } = data;
      
      if (!settings || typeof settings !== 'object') {
        return createErrorResponse(
          { message: 'Se requiere un objeto de configuración', type: ErrorType.VALIDATION, statusCode: HttpStatus.BAD_REQUEST },
          request,
          env
        );
      }
      
      logDebug('Updating user settings', { userId, keys: Object.keys(settings) }, env);
      
      const db = env.DB;
      const updatedSettings = {};
      const errors = [];
      
      // Validate and update each setting
      for (const [key, value] of Object.entries(settings)) {
        // Validate setting key
        if (!SETTING_VALIDATIONS[key]) {
          errors.push(`Configuración desconocida: ${key}`);
          continue;
        }
        
        const validation = SETTING_VALIDATIONS[key];
        
        // Validate setting value
        if (validation.type === 'enum' && !validation.values.includes(value)) {
          errors.push(`Valor inválido para ${key}: ${value}`);
          continue;
        }
        
        if (validation.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Valor inválido para ${key}: debe ser true o false`);
          continue;
        }
        
        // Store setting (as JSON string)
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
        
        await db.prepare(`
          INSERT INTO user_settings (user_id, setting_key, setting_value)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, setting_key) 
          DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
        `).bind(userId, key, valueStr).run();
        
        updatedSettings[key] = value;
      }
      
      logDebug('User settings updated', { 
        userId, 
        updatedCount: Object.keys(updatedSettings).length,
        errorCount: errors.length 
      }, env);
      
      return createSuccessResponse({
        message: 'Configuración actualizada exitosamente',
        updated: updatedSettings,
        errors: errors.length > 0 ? errors : undefined
      }, request, env);
      
    } catch (error) {
      logError('Error updating user settings', error, env);
      return createErrorResponse(
        { message: 'Error al actualizar configuración', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}

/**
 * POST /api/settings/reset
 * Reset user settings to defaults
 */
export async function onRequestPost(context) {
  return withErrorHandling(async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Only handle /reset endpoint
    if (!url.pathname.endsWith('/reset')) {
      return new Response('Not Found', { status: 404 });
    }
    
    // Verify authentication
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse(
        { message: 'Valid authentication token required', type: ErrorType.AUTH, statusCode: HttpStatus.UNAUTHORIZED },
        request,
        env
      );
    }
    
    try {
      logDebug('Resetting user settings to defaults', { userId }, env);
      
      const db = env.DB;
      
      // Delete all user settings
      await db.prepare('DELETE FROM user_settings WHERE user_id = ?').bind(userId).run();
      
      logDebug('User settings reset complete', { userId }, env);
      
      return createSuccessResponse({
        message: 'Configuración restablecida a valores predeterminados',
        settings: DEFAULT_SETTINGS
      }, request, env);
      
    } catch (error) {
      logError('Error resetting user settings', error, env);
      return createErrorResponse(
        { message: 'Error al restablecer configuración', type: ErrorType.DATABASE, statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
        request,
        env
      );
    }
  })(context);
}
