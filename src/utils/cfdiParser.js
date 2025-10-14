// CFDI XML Parser for Mexican Tax Invoices (Comprobantes Fiscales Digitales por Internet)
// Supports CFDI 3.3 and 4.0 formats

/**
 * Parse CFDI XML content into structured data
 * @param {string} xmlContent - Raw XML content of CFDI
 * @returns {object} Parsed CFDI data
 */
export function parseCFDI(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('XML content is required and must be a string');
  }

  try {
    // Parse XML using DOMParser (browser API)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: Invalid XML format');
    }

    // Get root element (Comprobante)
    const comprobante = xmlDoc.querySelector('Comprobante') || 
                        xmlDoc.querySelector('cfdi\\:Comprobante') ||
                        xmlDoc.querySelectorAll('*')[0]; // Fallback to root element

    if (!comprobante) {
      throw new Error('No se encontró el elemento Comprobante en el XML');
    }

    // Extract CFDI version
    const version = getAttribute(comprobante, ['Version', 'version']);

    // Extract basic invoice data
    const cfdiData = {
      // UUID (Folio Fiscal) - most important field
      uuid: extractUUID(xmlDoc),
      
      // Version
      version: version,
      
      // Serie and Folio
      serie: getAttribute(comprobante, ['Serie', 'serie']) || '',
      folio: getAttribute(comprobante, ['Folio', 'folio']) || '',
      
      // Date
      fecha: getAttribute(comprobante, ['Fecha', 'fecha']),
      date: formatCFDIDate(getAttribute(comprobante, ['Fecha', 'fecha'])),
      
      // Amounts
      subtotal: parseFloat(getAttribute(comprobante, ['SubTotal', 'Subtotal', 'subtotal']) || '0'),
      total: parseFloat(getAttribute(comprobante, ['Total', 'total']) || '0'),
      descuento: parseFloat(getAttribute(comprobante, ['Descuento', 'descuento']) || '0'),
      
      // Payment method and form
      metodoPago: getAttribute(comprobante, ['MetodoPago', 'metodoPago']) || '',
      formaPago: getAttribute(comprobante, ['FormaPago', 'formaPago']) || '',
      
      // Currency
      moneda: getAttribute(comprobante, ['Moneda', 'moneda']) || 'MXN',
      tipoCambio: getAttribute(comprobante, ['TipoCambio', 'tipoCambio']) || '1',
      
      // Type of document
      tipoDeComprobante: getAttribute(comprobante, ['TipoDeComprobante', 'tipoDeComprobante']) || 'I',
      
      // Emisor (Issuer)
      emisor: extractEmisor(xmlDoc),
      
      // Receptor (Receiver)
      receptor: extractReceptor(xmlDoc),
      
      // Conceptos (Items)
      conceptos: extractConceptos(xmlDoc),
      
      // Impuestos (Taxes)
      impuestos: extractImpuestos(xmlDoc),
      
      // Timbre Fiscal Digital (Digital Stamp)
      timbreFiscal: extractTimbreFiscal(xmlDoc),
      
      // Raw XML for storage
      xml: xmlContent
    };

    // Calculate IVA from total and subtotal if not explicitly provided
    if (!cfdiData.impuestos.totalTraslados) {
      cfdiData.impuestos.totalTraslados = cfdiData.total - cfdiData.subtotal;
    }

    // Validate required fields
    if (!cfdiData.uuid) {
      throw new Error('UUID (Folio Fiscal) no encontrado en el CFDI');
    }

    return cfdiData;
  } catch (error) {
    throw new Error(`Error parsing CFDI: ${error.message}`);
  }
}

/**
 * Extract UUID (Folio Fiscal) from TimbreFiscalDigital
 */
function extractUUID(xmlDoc) {
  // Try different possible locations for UUID
  const selectors = [
    'TimbreFiscalDigital',
    'tfd\\:TimbreFiscalDigital',
    'cfdi\\:Complemento TimbreFiscalDigital',
    'Complemento TimbreFiscalDigital'
  ];

  for (const selector of selectors) {
    const timbre = xmlDoc.querySelector(selector);
    if (timbre) {
      const uuid = getAttribute(timbre, ['UUID', 'uuid']);
      if (uuid) return uuid.toUpperCase();
    }
  }

  return null;
}

/**
 * Extract Emisor (Issuer) information
 */
function extractEmisor(xmlDoc) {
  const emisor = xmlDoc.querySelector('Emisor') || 
                 xmlDoc.querySelector('cfdi\\:Emisor');

  if (!emisor) return null;

  return {
    rfc: getAttribute(emisor, ['Rfc', 'rfc', 'RFC']),
    nombre: getAttribute(emisor, ['Nombre', 'nombre']),
    regimenFiscal: getAttribute(emisor, ['RegimenFiscal', 'regimenFiscal'])
  };
}

/**
 * Extract Receptor (Receiver) information
 */
function extractReceptor(xmlDoc) {
  const receptor = xmlDoc.querySelector('Receptor') || 
                   xmlDoc.querySelector('cfdi\\:Receptor');

  if (!receptor) return null;

  return {
    rfc: getAttribute(receptor, ['Rfc', 'rfc', 'RFC']),
    nombre: getAttribute(receptor, ['Nombre', 'nombre']),
    usoCFDI: getAttribute(receptor, ['UsoCFDI', 'usoCFDI'])
  };
}

/**
 * Extract Conceptos (Line Items)
 */
function extractConceptos(xmlDoc) {
  const conceptos = [];
  const conceptoNodes = xmlDoc.querySelectorAll('Concepto, cfdi\\:Concepto');

  for (const concepto of conceptoNodes) {
    conceptos.push({
      claveProdServ: getAttribute(concepto, ['ClaveProdServ', 'claveProdServ']),
      cantidad: parseFloat(getAttribute(concepto, ['Cantidad', 'cantidad']) || '1'),
      claveUnidad: getAttribute(concepto, ['ClaveUnidad', 'claveUnidad']),
      unidad: getAttribute(concepto, ['Unidad', 'unidad']),
      descripcion: getAttribute(concepto, ['Descripcion', 'descripcion']),
      valorUnitario: parseFloat(getAttribute(concepto, ['ValorUnitario', 'valorUnitario']) || '0'),
      importe: parseFloat(getAttribute(concepto, ['Importe', 'importe']) || '0'),
      descuento: parseFloat(getAttribute(concepto, ['Descuento', 'descuento']) || '0')
    });
  }

  return conceptos;
}

/**
 * Extract Impuestos (Taxes) information
 */
function extractImpuestos(xmlDoc) {
  const impuestosNode = xmlDoc.querySelector('Impuestos, cfdi\\:Impuestos');
  
  if (!impuestosNode) {
    return {
      totalTraslados: 0,
      totalRetenciones: 0,
      traslados: [],
      retenciones: []
    };
  }

  const result = {
    totalTraslados: parseFloat(getAttribute(impuestosNode, ['TotalImpuestosTrasladados', 'totalImpuestosTrasladados']) || '0'),
    totalRetenciones: parseFloat(getAttribute(impuestosNode, ['TotalImpuestosRetenidos', 'totalImpuestosRetenidos']) || '0'),
    traslados: [],
    retenciones: []
  };

  // Extract Traslados (Transferred taxes like IVA)
  const trasladosNodes = impuestosNode.querySelectorAll('Traslado, cfdi\\:Traslado');
  for (const traslado of trasladosNodes) {
    result.traslados.push({
      impuesto: getAttribute(traslado, ['Impuesto', 'impuesto']),
      tipoFactor: getAttribute(traslado, ['TipoFactor', 'tipoFactor']),
      tasaOCuota: getAttribute(traslado, ['TasaOCuota', 'tasaOCuota']),
      importe: parseFloat(getAttribute(traslado, ['Importe', 'importe']) || '0')
    });
  }

  // Extract Retenciones (Withheld taxes)
  const retencionesNodes = impuestosNode.querySelectorAll('Retencion, cfdi\\:Retencion');
  for (const retencion of retencionesNodes) {
    result.retenciones.push({
      impuesto: getAttribute(retencion, ['Impuesto', 'impuesto']),
      importe: parseFloat(getAttribute(retencion, ['Importe', 'importe']) || '0')
    });
  }

  return result;
}

/**
 * Extract Timbre Fiscal Digital (Digital Tax Stamp) information
 */
function extractTimbreFiscal(xmlDoc) {
  const selectors = [
    'TimbreFiscalDigital',
    'tfd\\:TimbreFiscalDigital',
    'cfdi\\:Complemento TimbreFiscalDigital'
  ];

  for (const selector of selectors) {
    const timbre = xmlDoc.querySelector(selector);
    if (timbre) {
      return {
        uuid: getAttribute(timbre, ['UUID', 'uuid']),
        fechaTimbrado: getAttribute(timbre, ['FechaTimbrado', 'fechaTimbrado']),
        selloCFD: getAttribute(timbre, ['SelloCFD', 'selloCFD']),
        noCertificadoSAT: getAttribute(timbre, ['NoCertificadoSAT', 'noCertificadoSAT']),
        selloSAT: getAttribute(timbre, ['SelloSAT', 'selloSAT'])
      };
    }
  }

  return null;
}

/**
 * Helper: Get attribute from element with fallback names
 */
function getAttribute(element, names) {
  if (!element) return null;
  
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value) return value;
  }
  
  return null;
}

/**
 * Helper: Format CFDI date to YYYY-MM-DD
 */
function formatCFDIDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // CFDI dates are in ISO 8601 format: 2025-01-15T10:30:00
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fallback
  }
  
  return new Date().toISOString().split('T')[0];
}

/**
 * Convert CFDI data to transaction format
 */
export function cfdiToTransaction(cfdiData, options = {}) {
  const {
    userRFC = 'REGM000905T24', // Default RFC from README
    defaultCategory = 'avanta',
    defaultAccount = 'BBVA Cuenta'
  } = options;

  // Determine if this is an issued or received invoice
  const isIssued = cfdiData.emisor?.rfc === userRFC;
  const isReceived = cfdiData.receptor?.rfc === userRFC;

  // Determine transaction type
  let type = 'gasto';
  let category = defaultCategory;

  if (isIssued) {
    // We issued this invoice = income
    type = 'ingreso';
    category = 'avanta'; // Business income
  } else if (isReceived) {
    // We received this invoice = expense
    type = 'gasto';
    // Check if it's deductible (business expense)
    category = defaultCategory;
  }

  // Build description from conceptos
  let description = 'Factura CFDI';
  if (cfdiData.conceptos && cfdiData.conceptos.length > 0) {
    const firstConcepto = cfdiData.conceptos[0];
    description = firstConcepto.descripcion || description;
    
    // Add more items if multiple
    if (cfdiData.conceptos.length > 1) {
      description += ` (+${cfdiData.conceptos.length - 1} más)`;
    }
  }

  // Add serie/folio to description if available
  if (cfdiData.serie || cfdiData.folio) {
    description += ` [${cfdiData.serie || ''}${cfdiData.folio || ''}]`;
  }

  return {
    date: cfdiData.date,
    description: description,
    amount: cfdiData.total,
    type: type,
    category: category,
    account: defaultAccount,
    is_deductible: type === 'gasto' && category === 'avanta', // Business expenses are deductible
    economic_activity: '', // User should set this
    receipt_url: '', // Will be set when XML is uploaded
    cfdi_uuid: cfdiData.uuid,
    source: 'CFDI Import'
  };
}

/**
 * Convert CFDI data to invoice format for storage
 */
export function cfdiToInvoice(cfdiData) {
  return {
    uuid: cfdiData.uuid,
    rfc_emisor: cfdiData.emisor?.rfc || '',
    rfc_receptor: cfdiData.receptor?.rfc || '',
    date: cfdiData.date,
    subtotal: cfdiData.subtotal,
    iva: cfdiData.impuestos?.totalTraslados || 0,
    total: cfdiData.total,
    xml_url: '', // Will be set after upload
    status: 'active',
    // Additional metadata (not in database but useful)
    serie: cfdiData.serie,
    folio: cfdiData.folio,
    metodoPago: cfdiData.metodoPago,
    formaPago: cfdiData.formaPago,
    moneda: cfdiData.moneda,
    conceptos: cfdiData.conceptos
  };
}

/**
 * Validate CFDI data
 */
export function validateCFDI(cfdiData) {
  const errors = [];

  // Required fields
  if (!cfdiData.uuid || cfdiData.uuid.length !== 36) {
    errors.push('UUID inválido (debe tener 36 caracteres)');
  }

  if (!cfdiData.emisor || !cfdiData.emisor.rfc) {
    errors.push('RFC del emisor es requerido');
  }

  if (!cfdiData.receptor || !cfdiData.receptor.rfc) {
    errors.push('RFC del receptor es requerido');
  }

  if (!cfdiData.date) {
    errors.push('Fecha es requerida');
  }

  if (!cfdiData.total || cfdiData.total <= 0) {
    errors.push('Total debe ser mayor a 0');
  }

  if (!cfdiData.subtotal || cfdiData.subtotal <= 0) {
    errors.push('Subtotal debe ser mayor a 0');
  }

  // Validate RFC format (basic validation)
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (cfdiData.emisor?.rfc && !rfcRegex.test(cfdiData.emisor.rfc)) {
    errors.push('RFC del emisor tiene formato inválido');
  }

  if (cfdiData.receptor?.rfc && !rfcRegex.test(cfdiData.receptor.rfc)) {
    errors.push('RFC del receptor tiene formato inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract basic info from CFDI for preview (without full parsing)
 */
export function extractCFDIPreview(xmlContent) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const comprobante = xmlDoc.querySelector('Comprobante') || 
                        xmlDoc.querySelector('cfdi\\:Comprobante') ||
                        xmlDoc.querySelectorAll('*')[0];

    if (!comprobante) {
      return null;
    }

    const uuid = extractUUID(xmlDoc);
    const total = getAttribute(comprobante, ['Total', 'total']);
    const fecha = getAttribute(comprobante, ['Fecha', 'fecha']);

    return {
      uuid: uuid,
      total: parseFloat(total || '0'),
      fecha: formatCFDIDate(fecha),
      preview: true
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if XML content is a valid CFDI
 */
export function isCFDI(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') {
    return false;
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parser errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) return false;

    // Check for Comprobante element
    const comprobante = xmlDoc.querySelector('Comprobante') || 
                        xmlDoc.querySelector('cfdi\\:Comprobante');

    if (!comprobante) return false;

    // Check for UUID
    const uuid = extractUUID(xmlDoc);
    if (!uuid) return false;

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format CFDI data for display
 */
export function formatCFDIDisplay(cfdiData) {
  return {
    folio: `${cfdiData.serie || ''}${cfdiData.folio || 'S/N'}`,
    uuid: cfdiData.uuid,
    fecha: new Date(cfdiData.fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    emisor: `${cfdiData.emisor?.nombre || 'N/A'} (${cfdiData.emisor?.rfc || 'N/A'})`,
    receptor: `${cfdiData.receptor?.nombre || 'N/A'} (${cfdiData.receptor?.rfc || 'N/A'})`,
    subtotal: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: cfdiData.moneda || 'MXN'
    }).format(cfdiData.subtotal),
    iva: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: cfdiData.moneda || 'MXN'
    }).format(cfdiData.impuestos?.totalTraslados || 0),
    total: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: cfdiData.moneda || 'MXN'
    }).format(cfdiData.total),
    conceptos: cfdiData.conceptos?.map(c => ({
      descripcion: c.descripcion,
      cantidad: c.cantidad,
      importe: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: cfdiData.moneda || 'MXN'
      }).format(c.importe)
    })) || []
  };
}
