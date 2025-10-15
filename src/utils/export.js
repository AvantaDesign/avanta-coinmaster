/**
 * Advanced Export Utility
 * 
 * Provides export functionality for various formats:
 * - CSV (Comma-Separated Values)
 * - Excel (XLSX)
 * - PDF (via browser print)
 * - JSON (backup/restore)
 * 
 * @module export
 */

/**
 * Export data to CSV format
 * 
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Output filename
 * @param {Array} columns - Optional column definitions [{key, label}]
 */
export function exportToCSV(data, filename = 'export.csv', columns = null) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Determine columns
  let cols = columns;
  if (!cols) {
    // Auto-detect columns from first object
    const firstRow = data[0];
    cols = Object.keys(firstRow).map(key => ({ key, label: key }));
  }

  // Build CSV content
  const headers = cols.map(col => escapeCSV(col.label)).join(',');
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key];
      return escapeCSV(formatValue(value));
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');

  // Trigger download
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to Excel format (XLSX)
 * 
 * Note: This creates a simple Excel-compatible CSV
 * For true XLSX, use a library like xlsx
 * 
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Output filename
 * @param {Array} columns - Optional column definitions
 */
export function exportToExcel(data, filename = 'export.xlsx', columns = null) {
  // For now, we'll create an Excel-compatible CSV
  // To create true XLSX, you'd need to add the 'xlsx' library
  
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Use tab-separated values for better Excel compatibility
  let cols = columns;
  if (!cols) {
    const firstRow = data[0];
    cols = Object.keys(firstRow).map(key => ({ key, label: key }));
  }

  const headers = cols.map(col => escapeExcel(col.label)).join('\t');
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key];
      return escapeExcel(formatValue(value));
    }).join('\t');
  });

  const tsv = [headers, ...rows].join('\n');

  // Add BOM for Excel UTF-8 recognition
  const bom = '\uFEFF';
  downloadFile(bom + tsv, filename, 'application/vnd.ms-excel;charset=utf-8;');
}

/**
 * Export data to JSON format (for backup/restore)
 * 
 * @param {Object} data - Data to export
 * @param {String} filename - Output filename
 * @param {Boolean} pretty - Whether to pretty-print JSON
 */
export function exportToJSON(data, filename = 'export.json', pretty = true) {
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadFile(json, filename, 'application/json;charset=utf-8;');
}

/**
 * Prepare data for PDF export
 * This creates an HTML table that can be printed to PDF
 * 
 * @param {Array} data - Array of objects to export
 * @param {String} title - Report title
 * @param {Array} columns - Column definitions
 * @returns {String} HTML string
 */
export function preparePDFExport(data, title = 'Report', columns = null) {
  if (!data || data.length === 0) {
    return '<p>No data to export</p>';
  }

  let cols = columns;
  if (!cols) {
    const firstRow = data[0];
    cols = Object.keys(firstRow).map(key => ({ key, label: key }));
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #d1d5db;
      font-weight: bold;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
  
  <table>
    <thead>
      <tr>
        ${cols.map(col => `<th>${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${cols.map(col => `<td>${formatValue(row[col.key])}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Avanta Finance - © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Export to PDF (opens print dialog)
 * 
 * @param {Array} data - Array of objects to export
 * @param {String} title - Report title
 * @param {Array} columns - Column definitions
 */
export function exportToPDF(data, title = 'Report', columns = null) {
  const html = preparePDFExport(data, title, columns);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Create a data backup (exports all data as JSON)
 * 
 * @param {Object} allData - All application data
 * @param {String} filename - Output filename
 */
export function createBackup(allData, filename = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `avanta-finance-backup-${timestamp}.json`;
  
  const backup = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    data: allData
  };

  exportToJSON(backup, filename || defaultFilename, true);
}

/**
 * Parse and validate backup file
 * 
 * @param {File} file - Backup file
 * @returns {Promise<Object>} Parsed backup data
 */
export async function parseBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        // Validate backup structure
        if (!backup.version || !backup.timestamp || !backup.data) {
          reject(new Error('Invalid backup file format'));
          return;
        }
        
        resolve(backup);
      } catch (error) {
        reject(new Error('Failed to parse backup file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Export transactions in multiple formats
 * 
 * @param {Array} transactions - Transaction data
 * @param {String} format - Export format (csv, excel, pdf, json)
 * @param {String} filename - Output filename
 */
export function exportTransactions(transactions, format = 'csv', filename = null) {
  const columns = [
    { key: 'date', label: 'Fecha' },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto' },
    { key: 'type', label: 'Tipo' },
    { key: 'category', label: 'Categoría' },
    { key: 'account', label: 'Cuenta' }
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `transacciones-${timestamp}`;

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(transactions, filename || `${defaultFilename}.csv`, columns);
      break;
    case 'excel':
    case 'xlsx':
      exportToExcel(transactions, filename || `${defaultFilename}.xlsx`, columns);
      break;
    case 'pdf':
      exportToPDF(transactions, 'Reporte de Transacciones', columns);
      break;
    case 'json':
      exportToJSON(transactions, filename || `${defaultFilename}.json`);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export fiscal report
 * 
 * @param {Object} fiscalData - Fiscal calculation data
 * @param {String} format - Export format
 * @param {String} filename - Output filename
 */
export function exportFiscalReport(fiscalData, format = 'pdf', filename = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `reporte-fiscal-${timestamp}`;

  // Prepare data for export
  const data = [
    { concepto: 'Ingresos Totales', valor: formatCurrency(fiscalData.ingresos) },
    { concepto: 'Gastos Deducibles', valor: formatCurrency(fiscalData.gastos) },
    { concepto: 'Utilidad', valor: formatCurrency(fiscalData.utilidad) },
    { concepto: 'ISR', valor: formatCurrency(fiscalData.isr) },
    { concepto: 'IVA Cobrado', valor: formatCurrency(fiscalData.ivaCobrado) },
    { concepto: 'IVA Pagado', valor: formatCurrency(fiscalData.ivaPagado) },
    { concepto: 'IVA a Pagar', valor: formatCurrency(fiscalData.ivaPorPagar) }
  ];

  const columns = [
    { key: 'concepto', label: 'Concepto' },
    { key: 'valor', label: 'Valor' }
  ];

  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(data, filename || `${defaultFilename}.csv`, columns);
      break;
    case 'excel':
    case 'xlsx':
      exportToExcel(data, filename || `${defaultFilename}.xlsx`, columns);
      break;
    case 'pdf':
      exportToPDF(data, 'Reporte Fiscal', columns);
      break;
    case 'json':
      exportToJSON(fiscalData, filename || `${defaultFilename}.json`);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

// Helper functions

/**
 * Escape value for CSV
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Escape value for Excel
 */
function escapeExcel(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape tabs and wrap in quotes if needed
  if (str.includes('\t') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Format value for display
 */
function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') {
    // Check if it looks like currency
    if (Math.abs(value) >= 1) {
      return value.toFixed(2);
    }
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('es-MX');
  }
  return String(value);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

/**
 * Trigger file download
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
  preparePDFExport,
  createBackup,
  parseBackup,
  exportTransactions,
  exportFiscalReport
};
