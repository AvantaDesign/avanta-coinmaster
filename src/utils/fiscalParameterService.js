/**
 * Fiscal Parameter Service
 * Manage and retrieve dynamic fiscal parameters by date
 */

import Decimal from 'decimal.js';

// In-memory cache for fiscal parameters
const parameterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get ISR brackets for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<array>} ISR bracket array
 */
export async function getISRBrackets(date, fetchFn) {
  const cacheKey = `isr_bracket_${date}`;
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const year = date.split('-')[0];
    const parameter = await fetchParameter('isr_bracket', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      // Return default brackets if not found
      return getDefaultISRBrackets();
    }

    const brackets = JSON.parse(parameter.value);
    
    // Store in cache
    setInCache(cacheKey, brackets);
    
    return brackets;
  } catch (error) {
    console.error('Error fetching ISR brackets:', error);
    return getDefaultISRBrackets();
  }
}

/**
 * Get IVA rate for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} IVA rate (e.g., 0.16 for 16%)
 */
export async function getIVARate(date, fetchFn) {
  const cacheKey = `iva_rate_${date}`;
  
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const parameter = await fetchParameter('iva_rate', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      return 0.16; // Default IVA rate
    }

    const rate = parseFloat(parameter.value);
    setInCache(cacheKey, rate);
    
    return rate;
  } catch (error) {
    console.error('Error fetching IVA rate:', error);
    return 0.16;
  }
}

/**
 * Get IVA retention rate for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} IVA retention rate (e.g., 0.1067 for 10.67%)
 */
export async function getIVARetentionRate(date, fetchFn) {
  const cacheKey = `iva_retention_${date}`;
  
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const parameter = await fetchParameter('iva_retention', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      return 0.1067; // Default retention rate
    }

    const rate = parseFloat(parameter.value);
    setInCache(cacheKey, rate);
    
    return rate;
  } catch (error) {
    console.error('Error fetching IVA retention rate:', error);
    return 0.1067;
  }
}

/**
 * Get DIOT threshold for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} DIOT threshold amount
 */
export async function getDIOTThreshold(date, fetchFn) {
  const cacheKey = `diot_threshold_${date}`;
  
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const parameter = await fetchParameter('diot_threshold', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      return 50000; // Default threshold
    }

    const threshold = parseFloat(parameter.value);
    setInCache(cacheKey, threshold);
    
    return threshold;
  } catch (error) {
    console.error('Error fetching DIOT threshold:', error);
    return 50000;
  }
}

/**
 * Get UMA (Unidad de Medida y Actualización) value for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} Daily UMA value
 */
export async function getUMAValue(date, fetchFn) {
  const cacheKey = `uma_value_${date}`;
  
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const parameter = await fetchParameter('uma_value', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      return 108.57; // Default UMA 2024
    }

    const uma = parseFloat(parameter.value);
    setInCache(cacheKey, uma);
    
    return uma;
  } catch (error) {
    console.error('Error fetching UMA value:', error);
    return 108.57;
  }
}

/**
 * Get minimum wage for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} Daily minimum wage
 */
export async function getMinimumWage(date, fetchFn) {
  const cacheKey = `minimum_wage_${date}`;
  
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const parameter = await fetchParameter('minimum_wage', date, fetchFn);
    
    if (!parameter || !parameter.value) {
      return 248.93; // Default minimum wage 2024
    }

    const wage = parseFloat(parameter.value);
    setInCache(cacheKey, wage);
    
    return wage;
  } catch (error) {
    console.error('Error fetching minimum wage:', error);
    return 248.93;
  }
}

/**
 * Calculate ISR using parameters for a specific date
 * @param {number} taxableIncome - Taxable income amount
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} fetchFn - Function to fetch from API
 * @returns {Promise<number>} Calculated ISR amount
 */
export async function calculateISRForDate(taxableIncome, date, fetchFn) {
  const income = new Decimal(taxableIncome);
  
  if (income.lte(0)) return 0;

  const brackets = await getISRBrackets(date, fetchFn);
  
  // Find applicable bracket
  const bracket = brackets.find(b => {
    const min = new Decimal(b.min);
    const max = b.max === null ? Decimal(Infinity) : new Decimal(b.max);
    return income.gte(min) && income.lte(max);
  });
  
  if (!bracket) {
    // Use last bracket if none found
    const lastBracket = brackets[brackets.length - 1];
    return income.minus(new Decimal(lastBracket.lowerLimit))
      .times(new Decimal(lastBracket.rate))
      .plus(new Decimal(lastBracket.fixedFee))
      .toNumber();
  }

  const isr = new Decimal(bracket.fixedFee)
    .plus(income.minus(new Decimal(bracket.lowerLimit)).times(new Decimal(bracket.rate)));
  
  return isr.toNumber();
}

/**
 * Fetch parameter from API for a specific date
 * @private
 */
async function fetchParameter(parameterType, date, fetchFn) {
  if (!fetchFn) {
    throw new Error('Fetch function not provided');
  }

  try {
    const response = await fetchFn(`/api/fiscal-parameters/${parameterType}/${date}`);
    return response;
  } catch (error) {
    console.error(`Error fetching parameter ${parameterType} for ${date}:`, error);
    return null;
  }
}

/**
 * Get from cache
 * @private
 */
function getFromCache(key) {
  const cached = parameterCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    parameterCache.delete(key);
    return null;
  }

  return cached.value;
}

/**
 * Set in cache
 * @private
 */
function setInCache(key, value) {
  parameterCache.set(key, {
    value,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache
 */
export function clearCache() {
  parameterCache.clear();
}

/**
 * Get default ISR brackets (2024/2025 structure)
 * @private
 */
function getDefaultISRBrackets() {
  return [
    { min: 0, max: 7735.00, rate: 0.0192, fixedFee: 0, lowerLimit: 0 },
    { min: 7735.01, max: 65651.07, rate: 0.0640, fixedFee: 148.51, lowerLimit: 7735.00 },
    { min: 65651.08, max: 115375.90, rate: 0.1088, fixedFee: 3855.14, lowerLimit: 65651.07 },
    { min: 115375.91, max: 134119.41, rate: 0.1600, fixedFee: 9265.20, lowerLimit: 115375.90 },
    { min: 134119.42, max: 160577.65, rate: 0.1792, fixedFee: 12264.16, lowerLimit: 134119.41 },
    { min: 160577.66, max: 323862.00, rate: 0.2136, fixedFee: 17005.47, lowerLimit: 160577.65 },
    { min: 323862.01, max: 510451.00, rate: 0.2352, fixedFee: 51883.01, lowerLimit: 323862.00 },
    { min: 510451.01, max: 974535.03, rate: 0.3000, fixedFee: 95768.74, lowerLimit: 510451.00 },
    { min: 974535.04, max: 1299380.04, rate: 0.3200, fixedFee: 234993.95, lowerLimit: 974535.03 },
    { min: 1299380.05, max: 3898140.12, rate: 0.3400, fixedFee: 338944.34, lowerLimit: 1299380.04 },
    { min: 3898140.13, max: null, rate: 0.3500, fixedFee: 1222522.76, lowerLimit: 3898140.12 }
  ];
}

/**
 * Get all parameter types
 */
export function getParameterTypes() {
  return [
    { value: 'isr_bracket', label: 'Tablas ISR' },
    { value: 'iva_rate', label: 'Tasa IVA' },
    { value: 'iva_retention', label: 'Retención IVA' },
    { value: 'diot_threshold', label: 'Umbral DIOT' },
    { value: 'uma_value', label: 'Valor UMA' },
    { value: 'minimum_wage', label: 'Salario Mínimo' },
    { value: 'other', label: 'Otro' },
  ];
}

/**
 * Get period types
 */
export function getPeriodTypes() {
  return [
    { value: 'monthly', label: 'Mensual' },
    { value: 'annual', label: 'Anual' },
    { value: 'permanent', label: 'Permanente' },
  ];
}

/**
 * Validate parameter value format
 */
export function validateParameterValue(parameterType, value) {
  try {
    if (parameterType === 'isr_bracket') {
      // Should be valid JSON array
      const brackets = JSON.parse(value);
      if (!Array.isArray(brackets)) {
        return { valid: false, error: 'Debe ser un arreglo JSON válido' };
      }
      
      // Validate bracket structure
      for (const bracket of brackets) {
        if (typeof bracket.min === 'undefined' || 
            typeof bracket.rate === 'undefined' ||
            typeof bracket.fixedFee === 'undefined' ||
            typeof bracket.lowerLimit === 'undefined') {
          return { valid: false, error: 'Estructura de bracket inválida' };
        }
      }
      
      return { valid: true };
    } else {
      // Should be a valid number
      const num = parseFloat(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Debe ser un número válido' };
      }
      
      if (num < 0) {
        return { valid: false, error: 'El valor no puede ser negativo' };
      }
      
      return { valid: true };
    }
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Format parameter value for display
 */
export function formatParameterValue(parameterType, value) {
  try {
    if (parameterType === 'isr_bracket') {
      const brackets = JSON.parse(value);
      return `${brackets.length} brackets`;
    } else if (parameterType === 'iva_rate' || parameterType === 'iva_retention') {
      const rate = parseFloat(value);
      return `${(rate * 100).toFixed(2)}%`;
    } else {
      const num = parseFloat(value);
      return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    }
  } catch (error) {
    return value;
  }
}
