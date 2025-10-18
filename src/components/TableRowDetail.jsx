import { useState } from 'react';
import Icon from './icons/IconLibrary';
import { formatCurrency, formatDate } from '../utils/calculations';

/**
 * TableRowDetail Component
 * Expandable row detail view for displaying additional transaction information
 */
export default function TableRowDetail({ transaction, onClose }) {
  const [activeTab, setActiveTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Detalles', icon: 'document-text' },
    { id: 'metadata', label: 'Metadatos', icon: 'information-circle' },
    { id: 'audit', label: 'Auditoría', icon: 'clock' }
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-800 border-t border-b border-gray-200 dark:border-slate-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detalles de la Transacción
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 border-b border-gray-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4">
          {activeTab === 'details' && (
            <div className="space-y-3">
              <DetailRow label="ID" value={transaction.id} />
              <DetailRow label="Fecha" value={formatDate(transaction.date)} />
              <DetailRow label="Descripción" value={transaction.description} />
              <DetailRow
                label="Monto"
                value={formatCurrency(transaction.amount)}
                highlight={transaction.type === 'ingreso' ? 'green' : 'red'}
              />
              <DetailRow label="Tipo" value={transaction.type} />
              <DetailRow label="Categoría" value={transaction.category} />
              <DetailRow label="Clasificación" value={transaction.transaction_type || 'personal'} />
              <DetailRow label="Cuenta" value={transaction.account || 'No especificada'} />
              <DetailRow
                label="Deducible"
                value={transaction.is_deductible ? 'Sí' : 'No'}
                highlight={transaction.is_deductible ? 'purple' : null}
              />
              {transaction.economic_activity && (
                <DetailRow label="Actividad Económica" value={transaction.economic_activity} />
              )}
              {transaction.notes && (
                <DetailRow label="Notas" value={transaction.notes} multiline />
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-3">
              {transaction.linked_invoice_id && (
                <DetailRow
                  label="Factura Vinculada"
                  value={`ID: ${transaction.linked_invoice_id}`}
                  icon="document-check"
                />
              )}
              {transaction.category_id && (
                <DetailRow
                  label="Categoría Personalizada"
                  value={`ID: ${transaction.category_id}`}
                  icon="tag"
                />
              )}
              {transaction.savings_goal_id && (
                <DetailRow
                  label="Meta de Ahorro"
                  value={`ID: ${transaction.savings_goal_id}`}
                  icon="flag"
                />
              )}
              {transaction.receipt_url && (
                <DetailRow label="Comprobante" value="Ver comprobante" icon="photo" link={transaction.receipt_url} />
              )}
              {!transaction.linked_invoice_id && !transaction.category_id && !transaction.savings_goal_id && !transaction.receipt_url && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No hay metadatos adicionales disponibles
                </p>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <DetailRow
                label="Creado"
                value={transaction.created_at ? new Date(transaction.created_at).toLocaleString('es-MX') : 'No disponible'}
                icon="clock"
              />
              <DetailRow
                label="Última Actualización"
                value={transaction.updated_at ? new Date(transaction.updated_at).toLocaleString('es-MX') : 'No disponible'}
                icon="clock"
              />
              {transaction.deleted_at && (
                <DetailRow
                  label="Eliminado"
                  value={new Date(transaction.deleted_at).toLocaleString('es-MX')}
                  highlight="red"
                  icon="trash"
                />
              )}
              <DetailRow
                label="Usuario"
                value={transaction.user_id || 'No disponible'}
                icon="user"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DetailRow Component
 * Displays a single detail row with label and value
 */
function DetailRow({ label, value, highlight, icon, link, multiline = false }) {
  const highlightColors = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} className="w-4 h-4 text-gray-400" />}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}:
        </span>
      </div>
      <div className={`text-sm text-right flex-1 ml-4 ${highlightColors[highlight] || 'text-gray-900 dark:text-gray-100'} ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
