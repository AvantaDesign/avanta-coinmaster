/**
 * CFDI (Comprobante Fiscal Digital por Internet) Utilities
 * Handles CFDI usage code suggestions and validation for Mexican invoicing
 */

/**
 * Complete list of CFDI usage codes as per SAT catalog
 */
export const CFDI_CODES = [
  // Adquisiciones
  {
    code: 'G01',
    name: 'Adquisición de mercancías',
    description: 'Compra de productos para reventa o producción',
    keywords: ['compra', 'mercancía', 'producto', 'inventario', 'materia prima']
  },
  {
    code: 'G02',
    name: 'Devoluciones, descuentos o bonificaciones',
    description: 'Notas de crédito y ajustes',
    keywords: ['devolución', 'descuento', 'bonificación', 'nota de crédito', 'ajuste']
  },
  {
    code: 'G03',
    name: 'Gastos en general',
    description: 'Gastos operativos generales del negocio',
    keywords: ['gasto', 'operativo', 'general', 'diversos']
  },
  
  // Inversiones
  {
    code: 'I01',
    name: 'Construcciones',
    description: 'Inversión en construcción o remodelación',
    keywords: ['construcción', 'obra', 'edificio', 'remodelación', 'inmueble']
  },
  {
    code: 'I02',
    name: 'Mobilario y equipo de oficina por inversiones',
    description: 'Compra de muebles y equipo para oficina',
    keywords: ['mueble', 'escritorio', 'silla', 'archivero', 'mobiliario', 'oficina']
  },
  {
    code: 'I03',
    name: 'Equipo de transporte',
    description: 'Vehículos y equipo de transporte',
    keywords: ['vehículo', 'auto', 'camión', 'transporte', 'automóvil', 'coche']
  },
  {
    code: 'I04',
    name: 'Equipo de computo y accesorios',
    description: 'Computadoras y accesorios tecnológicos',
    keywords: ['computadora', 'laptop', 'pc', 'monitor', 'teclado', 'mouse', 'tecnología']
  },
  {
    code: 'I05',
    name: 'Dados, troqueles, moldes, matrices y herramental',
    description: 'Herramientas especializadas de producción',
    keywords: ['herramienta', 'molde', 'troquel', 'matriz', 'herramental']
  },
  {
    code: 'I06',
    name: 'Comunicaciones telefónicas',
    description: 'Servicios de telefonía',
    keywords: ['teléfono', 'celular', 'telefonía', 'comunicación']
  },
  {
    code: 'I07',
    name: 'Comunicaciones satelitales',
    description: 'Servicios de comunicación satelital',
    keywords: ['satelital', 'satélite', 'comunicación']
  },
  {
    code: 'I08',
    name: 'Otra maquinaria y equipo',
    description: 'Otro equipo industrial o de producción',
    keywords: ['maquinaria', 'equipo', 'industrial', 'producción']
  },
  
  // Deducciones personales
  {
    code: 'D01',
    name: 'Honorarios médicos, dentales y gastos hospitalarios',
    description: 'Gastos médicos deducibles',
    keywords: ['médico', 'doctor', 'hospital', 'clínica', 'dental', 'salud']
  },
  {
    code: 'D02',
    name: 'Gastos médicos por incapacidad o discapacidad',
    description: 'Gastos médicos por discapacidad',
    keywords: ['incapacidad', 'discapacidad', 'médico', 'rehabilitación']
  },
  {
    code: 'D03',
    name: 'Gastos funerales',
    description: 'Servicios funerarios',
    keywords: ['funeral', 'funerario', 'defunción']
  },
  {
    code: 'D04',
    name: 'Donativos',
    description: 'Donaciones a instituciones autorizadas',
    keywords: ['donativo', 'donación', 'caridad', 'fundación']
  },
  {
    code: 'D05',
    name: 'Intereses reales efectivamente pagados por créditos hipotecarios',
    description: 'Intereses de crédito hipotecario',
    keywords: ['hipoteca', 'intereses', 'crédito', 'casa', 'vivienda']
  },
  {
    code: 'D06',
    name: 'Aportaciones voluntarias al SAR',
    description: 'Aportaciones al sistema de ahorro para el retiro',
    keywords: ['sar', 'retiro', 'ahorro', 'pensión', 'afore']
  },
  {
    code: 'D07',
    name: 'Primas por seguros de gastos médicos',
    description: 'Seguros de gastos médicos mayores',
    keywords: ['seguro', 'médico', 'gastos médicos', 'prima']
  },
  {
    code: 'D08',
    name: 'Gastos de transportación escolar obligatoria',
    description: 'Transporte escolar obligatorio',
    keywords: ['transporte', 'escolar', 'escuela', 'colegio']
  },
  {
    code: 'D09',
    name: 'Depósitos en cuentas para el ahorro',
    description: 'Depósitos en cuentas de ahorro especiales',
    keywords: ['ahorro', 'depósito', 'cuenta']
  },
  {
    code: 'D10',
    name: 'Pagos por servicios educativos (colegiaturas)',
    description: 'Colegiaturas y servicios educativos',
    keywords: ['colegiatura', 'escuela', 'educación', 'universidad', 'curso']
  },
  
  // Otros usos
  {
    code: 'P01',
    name: 'Por definir',
    description: 'Uso a definir (no recomendado para deducción)',
    keywords: ['indefinido', 'otro', 'definir']
  },
  {
    code: 'S01',
    name: 'Sin efectos fiscales',
    description: 'Facturas sin efectos fiscales',
    keywords: ['sin efectos', 'no deducible']
  },
  {
    code: 'CP01',
    name: 'Pagos',
    description: 'Complemento de pago',
    keywords: ['pago', 'complemento']
  },
  {
    code: 'CN01',
    name: 'Nómina',
    description: 'Recibos de nómina',
    keywords: ['nómina', 'salario', 'sueldo', 'empleado']
  }
];

/**
 * Get all CFDI codes
 * @returns {Array} All CFDI codes
 */
export function getCFDICodes() {
  return CFDI_CODES;
}

/**
 * Suggest appropriate CFDI code based on transaction details
 * @param {string} category - Transaction category
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type (ingreso/egreso)
 * @param {string} description - Transaction description
 * @returns {Array} Array of suggested CFDI codes with confidence scores
 */
export function suggestCFDICode(category = '', amount = 0, type = 'egreso', description = '') {
  const suggestions = [];
  const searchText = `${category} ${description}`.toLowerCase();

  // Only suggest for expense transactions (egresos)
  if (type !== 'egreso') {
    return [{
      code: 'P01',
      confidence: 0.5,
      reason: 'Uso general para ingresos'
    }];
  }

  // Match against keywords
  CFDI_CODES.forEach(cfdi => {
    let confidence = 0;
    const matchedKeywords = [];

    // Check if any keyword matches
    cfdi.keywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        confidence += 0.3;
        matchedKeywords.push(keyword);
      }
    });

    // Boost confidence if category name matches
    if (category && cfdi.name.toLowerCase().includes(category.toLowerCase())) {
      confidence += 0.4;
    }

    // Add to suggestions if there's any match
    if (confidence > 0) {
      suggestions.push({
        ...cfdi,
        confidence: Math.min(confidence, 1.0),
        matchedKeywords: matchedKeywords,
        reason: matchedKeywords.length > 0 
          ? `Coincide con: ${matchedKeywords.join(', ')}`
          : 'Coincidencia de categoría'
      });
    }
  });

  // Sort by confidence (highest first)
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // If no suggestions, provide defaults based on amount
  if (suggestions.length === 0) {
    if (amount > 50000) {
      suggestions.push({
        code: 'I08',
        name: 'Otra maquinaria y equipo',
        confidence: 0.3,
        reason: 'Monto alto - posible inversión'
      });
    }
    
    suggestions.push({
      code: 'G03',
      name: 'Gastos en general',
      confidence: 0.2,
      reason: 'Código genérico de respaldo'
    });
  }

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Validate CFDI code requirements
 * @param {string} code - CFDI code
 * @param {Object} transaction - Transaction details
 * @returns {Object} Validation result
 */
export function validateCFDIRequirement(code, transaction) {
  const cfdi = CFDI_CODES.find(c => c.code === code);
  
  if (!cfdi) {
    return {
      valid: false,
      errors: ['Código CFDI no válido']
    };
  }

  const errors = [];
  const warnings = [];

  // Validate based on transaction type
  if (transaction.transaction_type === 'ingreso') {
    if (!['P01', 'S01', 'CP01', 'CN01'].includes(code)) {
      warnings.push('Este código es típicamente para gastos, no ingresos');
    }
  }

  // Validate amount for investment codes
  if (code.startsWith('I') && transaction.amount < 1000) {
    warnings.push('Este código es para inversiones, el monto parece bajo');
  }

  // Validate deduction codes
  if (code.startsWith('D') && transaction.transaction_type !== 'egreso') {
    errors.push('Las deducciones personales deben ser gastos');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    code: cfdi.code,
    name: cfdi.name,
    description: cfdi.description
  };
}

/**
 * Get CFDI code description
 * @param {string} code - CFDI code
 * @returns {Object} CFDI details
 */
export function getCFDIDescription(code) {
  const cfdi = CFDI_CODES.find(c => c.code === code);
  return cfdi || {
    code: code,
    name: 'Código desconocido',
    description: 'No se encontró información para este código',
    keywords: []
  };
}

/**
 * Get CFDI usage history from localStorage
 * @param {number} userId - User ID
 * @returns {Array} Array of frequently used CFDI codes
 */
export function getCFDIHistory(userId) {
  try {
    const history = localStorage.getItem(`cfdi_history_${userId}`);
    if (history) {
      const parsed = JSON.parse(history);
      // Sort by usage count
      return parsed.sort((a, b) => b.count - a.count).slice(0, 5);
    }
  } catch (error) {
    console.error('Error loading CFDI history:', error);
  }
  return [];
}

/**
 * Save CFDI code usage to history
 * @param {number} userId - User ID
 * @param {string} code - CFDI code used
 */
export function saveCFDIUsage(userId, code) {
  try {
    const history = getCFDIHistory(userId);
    const existing = history.find(h => h.code === code);
    
    if (existing) {
      existing.count += 1;
      existing.lastUsed = new Date().toISOString();
    } else {
      const cfdi = getCFDIDescription(code);
      history.push({
        code: code,
        name: cfdi.name,
        count: 1,
        lastUsed: new Date().toISOString()
      });
    }
    
    localStorage.setItem(`cfdi_history_${userId}`, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving CFDI usage:', error);
  }
}

/**
 * Get CFDI codes by category
 * @param {string} categoryPrefix - Category prefix (G, I, D, etc.)
 * @returns {Array} Filtered CFDI codes
 */
export function getCFDIByCategory(categoryPrefix) {
  return CFDI_CODES.filter(cfdi => cfdi.code.startsWith(categoryPrefix));
}

/**
 * Search CFDI codes
 * @param {string} query - Search query
 * @returns {Array} Matching CFDI codes
 */
export function searchCFDICodes(query) {
  if (!query) return CFDI_CODES;
  
  const searchLower = query.toLowerCase();
  return CFDI_CODES.filter(cfdi => 
    cfdi.code.toLowerCase().includes(searchLower) ||
    cfdi.name.toLowerCase().includes(searchLower) ||
    cfdi.description.toLowerCase().includes(searchLower) ||
    cfdi.keywords.some(k => k.toLowerCase().includes(searchLower))
  );
}
