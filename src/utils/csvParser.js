// CSV Parser Utility for Mexican Bank Statements
// Supports: BBVA, Banco Azteca, and generic CSV formats

/**
 * Parse CSV text content into an array of objects
 * @param {string} csvText - Raw CSV content
 * @param {object} options - Parser options
 * @returns {Array} Array of parsed rows as objects
 */
export function parseCSV(csvText, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true,
    encoding = 'utf-8'
  } = options;

  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV text is required and must be a string');
  }

  // Split into lines, handling different line endings
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse CSV line handling quoted values
  const parseLine = (line) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add last value
    values.push(currentValue.trim());
    return values;
  };

  // Extract headers
  const headers = hasHeader ? parseLine(lines[0]) : 
    Array.from({ length: parseLine(lines[0]).length }, (_, i) => `column${i + 1}`);

  // Parse data rows
  const startRow = hasHeader ? 1 : 0;
  const data = [];

  for (let i = startRow; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    
    // Skip empty rows
    if (values.every(v => !v)) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
}

/**
 * Parse BBVA bank statement CSV
 * Format: Fecha, Descripción, Cargo, Abono, Saldo
 */
export function parseBBVAStatement(csvText) {
  try {
    const rows = parseCSV(csvText);
    const transactions = [];

    for (const row of rows) {
      // BBVA format variations
      const date = row['Fecha'] || row['fecha'] || row['FECHA'];
      const description = row['Descripción'] || row['Descripcion'] || row['descripcion'] || row['DESCRIPCIÓN'];
      const cargo = row['Cargo'] || row['cargo'] || row['CARGO'];
      const abono = row['Abono'] || row['abono'] || row['ABONO'];
      const saldo = row['Saldo'] || row['saldo'] || row['SALDO'];

      if (!date) continue; // Skip invalid rows

      // Parse amounts
      const cargoAmount = parseAmount(cargo);
      const abonoAmount = parseAmount(abono);

      // Determine transaction type and amount
      const isExpense = cargoAmount > 0;
      const amount = isExpense ? cargoAmount : abonoAmount;

      if (amount > 0) {
        transactions.push({
          date: formatDate(date),
          description: cleanDescription(description),
          amount: amount,
          type: isExpense ? 'gasto' : 'ingreso',
          category: 'personal', // Default, user can change
          account: 'BBVA Cuenta',
          is_deductible: false, // Default, user can change
          balance: parseAmount(saldo),
          source: 'BBVA CSV Import'
        });
      }
    }

    return transactions;
  } catch (error) {
    throw new Error(`Error parsing BBVA statement: ${error.message}`);
  }
}

/**
 * Parse Banco Azteca bank statement CSV
 * Format: Fecha, Concepto, Retiro, Depósito, Saldo
 */
export function parseAztecaStatement(csvText) {
  try {
    const rows = parseCSV(csvText);
    const transactions = [];

    for (const row of rows) {
      // Azteca format variations
      const date = row['Fecha'] || row['fecha'] || row['FECHA'];
      const description = row['Concepto'] || row['concepto'] || row['CONCEPTO'];
      const retiro = row['Retiro'] || row['retiro'] || row['RETIRO'];
      const deposito = row['Depósito'] || row['Deposito'] || row['deposito'] || row['DEPÓSITO'];
      const saldo = row['Saldo'] || row['saldo'] || row['SALDO'];

      if (!date) continue; // Skip invalid rows

      // Parse amounts
      const retiroAmount = parseAmount(retiro);
      const depositoAmount = parseAmount(deposito);

      // Determine transaction type and amount
      const isExpense = retiroAmount > 0;
      const amount = isExpense ? retiroAmount : depositoAmount;

      if (amount > 0) {
        transactions.push({
          date: formatDate(date),
          description: cleanDescription(description),
          amount: amount,
          type: isExpense ? 'gasto' : 'ingreso',
          category: 'personal', // Default, user can change
          account: 'Banco Azteca',
          is_deductible: false, // Default, user can change
          balance: parseAmount(saldo),
          source: 'Azteca CSV Import'
        });
      }
    }

    return transactions;
  } catch (error) {
    throw new Error(`Error parsing Azteca statement: ${error.message}`);
  }
}

/**
 * Auto-detect bank format and parse accordingly
 */
export function parseGenericBankStatement(csvText) {
  try {
    // Try to detect format based on headers
    const firstLine = csvText.split(/\r?\n/)[0].toLowerCase();
    
    if (firstLine.includes('cargo') && firstLine.includes('abono')) {
      return parseBBVAStatement(csvText);
    } else if (firstLine.includes('retiro') && firstLine.includes('depósito')) {
      return parseAztecaStatement(csvText);
    }

    // Generic format: try to parse standard columns
    const rows = parseCSV(csvText);
    const transactions = [];

    for (const row of rows) {
      // Try to find common column names
      const date = findValue(row, ['fecha', 'date', 'fec']);
      const description = findValue(row, ['descripcion', 'descripción', 'concepto', 'description', 'desc']);
      const amount = findValue(row, ['monto', 'importe', 'cantidad', 'amount']);
      const type = findValue(row, ['tipo', 'type', 'transaccion']);

      if (!date || !amount) continue;

      const parsedAmount = parseAmount(amount);
      if (parsedAmount <= 0) continue;

      // Determine type from type field or look for expense/income keywords
      let transactionType = 'gasto';
      if (type) {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('ingreso') || typeLower.includes('income') || typeLower.includes('depósito') || typeLower.includes('deposito')) {
          transactionType = 'ingreso';
        }
      }

      transactions.push({
        date: formatDate(date),
        description: cleanDescription(description),
        amount: parsedAmount,
        type: transactionType,
        category: 'personal',
        account: 'Importado CSV',
        is_deductible: false,
        source: 'Generic CSV Import'
      });
    }

    if (transactions.length === 0) {
      throw new Error('No se pudieron encontrar transacciones válidas. Verifique el formato del CSV.');
    }

    return transactions;
  } catch (error) {
    throw new Error(`Error parsing bank statement: ${error.message}`);
  }
}

/**
 * Helper: Find value in object by multiple possible keys (case-insensitive)
 */
function findValue(obj, keys) {
  for (const key of keys) {
    const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    if (found && obj[found]) {
      return obj[found];
    }
  }
  return null;
}

/**
 * Parse CSV with custom column mapping
 * @param {string} csvText - Raw CSV content
 * @param {object} mapping - Column mapping { field: csvColumn }
 * @returns {Array} Array of parsed transactions
 */
export function parseWithMapping(csvText, mapping) {
  try {
    const rows = parseCSV(csvText);
    const transactions = [];

    for (const row of rows) {
      // Map fields based on provided mapping
      const transaction = {};
      
      // Required fields
      if (mapping.date && row[mapping.date]) {
        transaction.date = formatDate(row[mapping.date]);
      }
      
      if (mapping.description && row[mapping.description]) {
        transaction.description = cleanDescription(row[mapping.description]);
      }
      
      if (mapping.amount && row[mapping.amount]) {
        transaction.amount = parseAmount(row[mapping.amount]);
      }
      
      // Optional fields
      if (mapping.type && row[mapping.type]) {
        const typeValue = row[mapping.type].toLowerCase();
        transaction.type = typeValue.includes('ingreso') || typeValue.includes('income') || typeValue.includes('depósito') || typeValue.includes('deposito') || typeValue.includes('abono')
          ? 'ingreso'
          : 'gasto';
      } else {
        // Default to gasto if not specified
        transaction.type = 'gasto';
      }
      
      if (mapping.category && row[mapping.category]) {
        const catValue = row[mapping.category].toLowerCase();
        transaction.category = catValue.includes('avanta') || catValue.includes('negocio') || catValue.includes('business')
          ? 'avanta'
          : 'personal';
      } else {
        transaction.category = 'personal';
      }
      
      if (mapping.account && row[mapping.account]) {
        transaction.account = row[mapping.account];
      } else {
        transaction.account = 'Importado CSV';
      }
      
      if (mapping.balance && row[mapping.balance]) {
        transaction.balance = parseAmount(row[mapping.balance]);
      }
      
      transaction.is_deductible = false;
      transaction.source = 'Custom CSV Import';
      
      // Only add if we have the required fields
      if (transaction.date && transaction.description && transaction.amount > 0) {
        transactions.push(transaction);
      }
    }

    if (transactions.length === 0) {
      throw new Error('No se pudieron encontrar transacciones válidas con el mapeo proporcionado.');
    }

    return transactions;
  } catch (error) {
    throw new Error(`Error parsing CSV with mapping: ${error.message}`);
  }
}

/**
 * Helper: Parse monetary amount from string
 * Handles: $1,234.56, 1.234,56, 1234.56, (1234.56) for negatives
 */
export function parseAmount(amountStr) {
  if (!amountStr) return 0;
  
  // Remove currency symbols and spaces
  let cleaned = String(amountStr).replace(/[$€£¥\s]/g, '');
  
  // Handle parentheses as negative
  const isNegative = cleaned.includes('(') || cleaned.includes(')');
  cleaned = cleaned.replace(/[()]/g, '');
  
  // Determine decimal separator
  // If there's a comma followed by 2 digits at the end, it's likely decimal
  // Otherwise, comma is thousands separator
  const hasCommaDecimal = /,\d{2}$/.test(cleaned);
  
  if (hasCommaDecimal) {
    // European format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // American format: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const amount = parseFloat(cleaned);
  return isNegative ? -Math.abs(amount) : Math.abs(amount);
}

/**
 * Helper: Format date to YYYY-MM-DD
 * Handles: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
 */
function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Remove extra spaces
  const cleaned = String(dateStr).trim();
  
  // Try to parse common formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, //
    // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, //
    // DD/MM/YY or DD-MM-YY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      if (match[0].startsWith('20') || match[0].startsWith('19')) {
        // YYYY-MM-DD format
        const [_, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // DD-MM-YYYY or DD-MM-YY format
        let [_, day, month, year] = match;
        if (year.length === 2) {
          year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  // Try native Date parsing as last resort
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fall through
  }
  
  // Return today's date if parsing fails
  return new Date().toISOString().split('T')[0];
}

// Exported parseDate for external usage (functions import parseDate)
export function parseDate(dateStr) {
  return formatDate(dateStr);
}

// Heuristic column detection helper (used by functions import code)
export function detectColumns(headers = []) {
  if (!Array.isArray(headers)) return {};
  const normalized = headers.map(h => (h || '').toString().toLowerCase());
  const mapping = {};
  normalized.forEach((h, i) => {
    if (h.match(/date|fecha/)) mapping.date = headers[i];
    else if (h.match(/amount|importe|monto|cantidad/)) mapping.amount = headers[i];
    else if (h.match(/description|descripcion|concepto|detalle/)) mapping.description = headers[i];
    else if (h.match(/balance/)) mapping.balance = headers[i];
    else if (h.match(/transaction|tipo|transaccion/)) mapping.type = headers[i];
  });
  return mapping;
}

// Detect transaction type from description or amount sign
export function detectTransactionType({ description = '', amount = 0 } = {}) {
  const desc = String(description).toLowerCase();
  if (typeof amount === 'number') {
    if (amount < 0) return 'gasto';
    if (amount > 0) return 'ingreso';
  }
  if (desc.match(/deposit|pago|ingreso|abono|deposito|depósito/)) return 'ingreso';
  if (desc.match(/retiro|cargo|compra|pago a|retirada/)) return 'gasto';
  return 'unknown';
}

// Naive duplicate detection: exact same date + amount + normalized description
export function detectDuplicates(rows = [], existing = []) {
  const normalize = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim();
  const keySet = new Set();
  (existing || []).forEach(tx => {
    const key = `${tx.date || ''}|||${tx.amount || ''}|||${normalize(tx.description)}`;
    keySet.add(key);
  });
  const duplicates = [];
  rows.forEach((r, idx) => {
    const date = r.date ? (r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date)) : '';
    const amount = r.amount != null ? String(r.amount) : '';
    const key = `${date}|||${amount}|||${normalize(r.description)}`;
    if (keySet.has(key)) duplicates.push({ index: idx, row: r });
  });
  return duplicates;
}

/**
 * Helper: Clean and normalize description text
 */
function cleanDescription(desc) {
  if (!desc) return 'Sin descripción';
  
  return String(desc)
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 500); // Limit length as per schema
}

/**
 * Export transactions to CSV format
 */
export function exportToCSV(transactions, options = {}) {
  const {
    includeHeaders = true,
    delimiter = ',',
    filename = 'transacciones.csv'
  } = options;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  // Define columns to export
  const columns = [
    { key: 'date', label: 'Fecha' },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'type', label: 'Tipo' },
    { key: 'category', label: 'Categoría' },
    { key: 'account', label: 'Cuenta' },
    { key: 'is_deductible', label: 'Deducible' },
    { key: 'economic_activity', label: 'Actividad Económica' }
  ];

  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  let csv = '';

  // Add headers
  if (includeHeaders) {
    csv += columns.map(col => escapeCSV(col.label)).join(delimiter) + '\n';
  }

  // Add data rows
  for (const transaction of transactions) {
    const row = columns.map(col => {
      let value = transaction[col.key];
      
      // Format specific fields
      if (col.key === 'is_deductible') {
        value = value ? 'Sí' : 'No';
      } else if (col.key === 'type') {
        value = value === 'ingreso' ? 'Ingreso' : 'Gasto';
      } else if (col.key === 'category') {
        value = value === 'personal' ? 'Personal' : 'Avanta';
      }
      
      return escapeCSV(value);
    });
    
    csv += row.join(delimiter) + '\n';
  }

  return csv;
}

/**
 * Trigger download of CSV file in browser
 */
export function downloadCSV(csvContent, filename = 'transacciones.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    throw new Error('Browser does not support file downloads');
  }
}

/**
 * Validate imported transaction data
 */
export function validateTransaction(transaction) {
  const errors = [];

  // Required fields
  if (!transaction.date) {
    errors.push('Fecha es requerida');
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transaction.date)) {
      errors.push('Fecha debe estar en formato YYYY-MM-DD');
    }
  }

  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Descripción es requerida');
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('Monto debe ser mayor a 0');
  } else if (transaction.amount > 999999999.99) {
    errors.push('Monto es demasiado grande');
  }

  if (!transaction.type || !['ingreso', 'gasto'].includes(transaction.type)) {
    errors.push('Tipo debe ser "ingreso" o "gasto"');
  }

  if (!transaction.category || !['personal', 'avanta'].includes(transaction.category)) {
    errors.push('Categoría debe ser "personal" o "avanta"');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Batch validate all transactions
 */
export function validateTransactions(transactions) {
  const results = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const validation = validateTransaction(transactions[i]);
    results.push({
      index: i,
      transaction: transactions[i],
      ...validation
    });

    if (validation.valid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }

  return {
    results,
    validCount,
    invalidCount,
    totalCount: transactions.length,
    allValid: invalidCount === 0
  };
}