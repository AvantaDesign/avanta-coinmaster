import { Link } from 'react-router-dom';
import { 
  BanknotesIcon, 
  DocumentTextIcon, 
  BuildingLibraryIcon,
  TagIcon
} from '@heroicons/react/24/outline';

/**
 * SearchResults Component - Phase 50: Advanced Search & Filtering
 * 
 * Displays search results grouped by entity type
 */
export default function SearchResults({ results, query, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Buscando...</span>
      </div>
    );
  }

  if (!results || results.total === 0) {
    return (
      <div className="text-center py-12">
        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No se encontraron resultados
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No se encontraron resultados para "{query}"
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Intenta con otros términos de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Se encontraron <span className="font-semibold">{results.total}</span> resultados para "{query}"
        </p>
      </div>

      {/* Transactions Results */}
      {results.transactions && results.transactions.length > 0 && (
        <ResultSection
          title="Transacciones"
          icon={BanknotesIcon}
          results={results.transactions}
          renderItem={(transaction) => (
            <TransactionResult key={transaction.id} transaction={transaction} />
          )}
        />
      )}

      {/* Invoices Results */}
      {results.invoices && results.invoices.length > 0 && (
        <ResultSection
          title="Facturas"
          icon={DocumentTextIcon}
          results={results.invoices}
          renderItem={(invoice) => (
            <InvoiceResult key={invoice.id} invoice={invoice} />
          )}
        />
      )}

      {/* Accounts Results */}
      {results.accounts && results.accounts.length > 0 && (
        <ResultSection
          title="Cuentas"
          icon={BuildingLibraryIcon}
          results={results.accounts}
          renderItem={(account) => (
            <AccountResult key={account.id} account={account} />
          )}
        />
      )}

      {/* Categories Results */}
      {results.categories && results.categories.length > 0 && (
        <ResultSection
          title="Categorías"
          icon={TagIcon}
          results={results.categories}
          renderItem={(category) => (
            <CategoryResult key={category.id} category={category} />
          )}
        />
      )}
    </div>
  );
}

/**
 * Result Section Component
 */
function ResultSection({ title, icon: Icon, results, renderItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            ({results.length})
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {results.map(renderItem)}
      </div>
    </div>
  );
}

/**
 * Transaction Result Item
 */
function TransactionResult({ transaction }) {
  return (
    <Link
      to={`/transactions?id=${transaction.id}`}
      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {transaction.description}
          </p>
          <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(transaction.date).toLocaleDateString('es-MX')}</span>
            {transaction.category_name && (
              <span className="flex items-center">
                <TagIcon className="h-3 w-3 mr-1" />
                {transaction.category_name}
              </span>
            )}
            {transaction.account_name && (
              <span className="flex items-center">
                <BuildingLibraryIcon className="h-3 w-3 mr-1" />
                {transaction.account_name}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 text-right">
          <p className={`text-sm font-semibold ${
            transaction.transaction_type === 'ingreso' 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {transaction.transaction_type === 'ingreso' ? '+' : '-'}
            ${parseFloat(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          {transaction.relevance && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Relevancia: {(transaction.relevance * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Invoice Result Item
 */
function InvoiceResult({ invoice }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };

  return (
    <Link
      to={`/invoices?id=${invoice.id}`}
      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {invoice.invoice_number}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {invoice.description}
          </p>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(invoice.date).toLocaleDateString('es-MX')}
            </span>
            {invoice.status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[invoice.status] || statusColors.draft}`}>
                {invoice.status}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${parseFloat(invoice.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Account Result Item
 */
function AccountResult({ account }) {
  return (
    <Link
      to={`/accounts?id=${account.id}`}
      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {account.name}
          </p>
          {account.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {account.description}
            </p>
          )}
          {account.account_type && (
            <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400">
              {account.account_type}
            </span>
          )}
        </div>
        <div className="ml-4 text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${parseFloat(account.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Category Result Item
 */
function CategoryResult({ category }) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {category.name}
          </p>
          {category.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {category.description}
            </p>
          )}
          <div className="flex items-center mt-1 space-x-2">
            {category.category_type && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {category.category_type}
              </span>
            )}
            {category.is_deductible && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                Deducible
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
