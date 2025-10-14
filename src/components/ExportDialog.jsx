import { useState } from 'react';
import { exportToCSV, downloadCSV } from '../utils/csvParser';

/**
 * Export Dialog Component
 * Provides options to export transactions to CSV or Excel format
 */
export default function ExportDialog({ transactions, filters, onClose }) {
  const [format, setFormat] = useState('csv');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [selectedFields, setSelectedFields] = useState({
    date: true,
    description: true,
    amount: true,
    type: true,
    category: true,
    account: true,
    is_deductible: true,
    economic_activity: false,
    receipt_url: false
  });
  const [exporting, setExporting] = useState(false);

  const availableFields = [
    { key: 'date', label: 'Fecha', default: true },
    { key: 'description', label: 'Descripción', default: true },
    { key: 'amount', label: 'Monto', default: true },
    { key: 'type', label: 'Tipo', default: true },
    { key: 'category', label: 'Categoría', default: true },
    { key: 'account', label: 'Cuenta', default: true },
    { key: 'is_deductible', label: 'Deducible', default: true },
    { key: 'economic_activity', label: 'Actividad Económica', default: false },
    { key: 'receipt_url', label: 'URL de Comprobante', default: false },
  ];

  const handleFieldToggle = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    availableFields.forEach(field => {
      allSelected[field.key] = true;
    });
    setSelectedFields(allSelected);
  };

  const handleSelectDefault = () => {
    const defaultSelected = {};
    availableFields.forEach(field => {
      defaultSelected[field.key] = field.default;
    });
    setSelectedFields(defaultSelected);
  };

  const generateFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    return `transacciones-${date}.${extension}`;
  };

  const exportToExcel = async (transactions, metadata) => {
    // Create a simple HTML table that Excel can open
    // This is a lightweight alternative to using a heavy library like xlsx
    let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head>';
    html += '<meta charset="utf-8">';
    html += '<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>Transacciones</x:Name>';
    html += '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>';
    html += '</head><body>';

    // Add metadata if requested
    if (includeMetadata && metadata) {
      html += '<table border="0" style="margin-bottom: 20px;">';
      html += `<tr><td style="font-weight: bold;">Exportado:</td><td>${metadata.exportDate}</td></tr>`;
      html += `<tr><td style="font-weight: bold;">Total registros:</td><td>${metadata.totalRecords}</td></tr>`;
      if (metadata.filters && Object.keys(metadata.filters).length > 0) {
        html += '<tr><td style="font-weight: bold;">Filtros aplicados:</td><td>';
        html += Object.entries(metadata.filters)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        html += '</td></tr>';
      }
      html += '</table>';
      html += '<br/>';
    }

    // Create main data table
    html += '<table border="1" style="border-collapse: collapse;">';
    
    // Headers
    html += '<thead style="background-color: #f0f0f0;"><tr>';
    const fields = availableFields.filter(f => selectedFields[f.key]);
    fields.forEach(field => {
      html += `<th style="padding: 8px; text-align: left;">${field.label}</th>`;
    });
    html += '</tr></thead>';

    // Data rows
    html += '<tbody>';
    transactions.forEach(transaction => {
      html += '<tr>';
      fields.forEach(field => {
        let value = transaction[field.key] || '';
        
        // Format specific fields
        if (field.key === 'is_deductible') {
          value = value ? 'Sí' : 'No';
        } else if (field.key === 'type') {
          value = value === 'ingreso' ? 'Ingreso' : 'Gasto';
        } else if (field.key === 'category') {
          value = value === 'personal' ? 'Personal' : 'Avanta';
        } else if (field.key === 'amount') {
          value = `$${parseFloat(value).toFixed(2)}`;
        }
        
        html += `<td style="padding: 8px;">${value}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</body></html>';

    // Download as Excel file
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Filter transactions to only include selected fields
      const filteredTransactions = transactions.map(transaction => {
        const filtered = {};
        Object.keys(selectedFields).forEach(field => {
          if (selectedFields[field]) {
            filtered[field] = transaction[field];
          }
        });
        return filtered;
      });

      // Prepare metadata
      const metadata = includeMetadata ? {
        exportDate: new Date().toLocaleString('es-MX'),
        totalRecords: transactions.length,
        filters: filters || {}
      } : null;

      if (format === 'excel') {
        await exportToExcel(filteredTransactions, metadata);
      } else {
        // CSV export
        let csvContent = '';

        // Add metadata as comments
        if (includeMetadata && metadata) {
          csvContent += `# Exportado: ${metadata.exportDate}\n`;
          csvContent += `# Total registros: ${metadata.totalRecords}\n`;
          if (metadata.filters && Object.keys(metadata.filters).length > 0) {
            csvContent += `# Filtros: ${JSON.stringify(metadata.filters)}\n`;
          }
          csvContent += '\n';
        }

        // Add transaction data
        const transactionCSV = exportToCSV(filteredTransactions);
        csvContent += transactionCSV;

        downloadCSV(csvContent, generateFilename());
      }

      // Close dialog after successful export
      setTimeout(() => {
        onClose(true);
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Error al exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Exportar Transacciones</h2>
            <button
              onClick={() => onClose(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Exportando {transactions.length} transacción(es)
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de exportación
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  format === 'csv'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📄</div>
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500">Compatible con Excel, Google Sheets</div>
              </button>
              <button
                onClick={() => setFormat('excel')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  format === 'excel'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📊</div>
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500">Archivo .xlsx con formato</div>
              </button>
            </div>
          </div>

          {/* Metadata option */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Incluir metadatos (fecha de exportación, filtros aplicados)
              </span>
            </label>
          </div>

          {/* Field selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Campos a exportar ({selectedCount} seleccionados)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectDefault}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Por defecto
                </button>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Seleccionar todos
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
              {availableFields.map(field => (
                <label key={field.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedFields[field.key]}
                    onChange={() => handleFieldToggle(field.key)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="text-sm text-blue-800">
                <strong>Archivo a generar:</strong> {generateFilename()}
                <br />
                <strong>Registros:</strong> {transactions.length}
                <br />
                <strong>Campos:</strong> {selectedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={() => onClose(false)}
            disabled={exporting}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || selectedCount === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <span className="animate-spin">⏳</span>
                Exportando...
              </>
            ) : (
              <>
                📥 Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
