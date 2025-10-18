import { Link, useLocation } from 'react-router-dom';
import Icon from './icons/IconLibrary';

/**
 * Breadcrumbs Navigation Component
 * Provides contextual navigation showing user's current location
 * with clickable path segments for easy traversal
 */
export default function Breadcrumbs() {
  const location = useLocation();

  // Route name mappings
  const routeNames = {
    '/': 'Dashboard',
    '/transactions': 'Transacciones',
    '/accounts': 'Cuentas',
    '/categories': 'Categorías',
    '/credits': 'Créditos',
    '/budgets': 'Presupuestos',
    '/fiscal': 'Fiscal',
    '/invoices': 'Facturas',
    '/receipts': 'Recibos',
    '/import': 'Importar Datos',
    '/receivables': 'Cuentas por Cobrar',
    '/payables': 'Cuentas por Pagar',
    '/recurring-freelancers': 'Freelancers Recurrentes',
    '/recurring-services': 'Servicios Recurrentes',
    '/cash-flow-projection': 'Proyección de Flujo',
    '/savings-goals': 'Metas de Ahorro',
    '/debts': 'Deudas',
    '/investments': 'Inversiones',
    '/automation': 'Automatización',
    '/invoice-automation': 'Automatización de Facturas',
    '/analytics': 'Analytics',
    '/reports': 'Reportes',
    '/help': 'Centro de Ayuda',
    '/financial-tasks': 'Tareas Financieras',
    '/notifications': 'Notificaciones',
    '/quick-actions': 'Acciones Rápidas',
    '/audit-log': 'Registro de Auditoría',
    '/admin': 'Administración',
  };

  // Get route icon
  const getRouteIcon = (path) => {
    const iconMap = {
      '/': 'home',
      '/transactions': 'chartBar',
      '/accounts': 'buildingLibrary',
      '/categories': 'folder',
      '/credits': 'creditCard',
      '/budgets': 'documentCheck',
      '/fiscal': 'document',
      '/invoices': 'documentText',
      '/receipts': 'receipt',
      '/import': 'arrowDownTray',
      '/receivables': 'arrowTrendingUp',
      '/payables': 'arrowTrendingDown',
      '/recurring-freelancers': 'users',
      '/recurring-services': 'cog',
      '/cash-flow-projection': 'banknotes',
      '/savings-goals': 'flag',
      '/debts': 'creditCard',
      '/investments': 'chartPie',
      '/automation': 'cog',
      '/invoice-automation': 'documentCheck',
      '/analytics': 'presentationChartLine',
      '/reports': 'documentText',
      '/help': 'questionMarkCircle',
      '/financial-tasks': 'clipboardDocumentCheck',
      '/notifications': 'bell',
      '/quick-actions': 'bolt',
      '/audit-log': 'shieldCheck',
      '/admin': 'cog',
    };
    return iconMap[path] || 'chevronRight';
  };

  // Build breadcrumb path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbs = [];
  
  // Always add Home
  breadcrumbs.push({
    name: 'Dashboard',
    path: '/',
    icon: 'home'
  });

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const name = routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const icon = getRouteIcon(currentPath);
    
    breadcrumbs.push({
      name,
      path: currentPath,
      icon,
      isLast: index === pathSegments.length - 1
    });
  });

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4 overflow-x-auto" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center space-x-2 flex-shrink-0">
          {index > 0 && (
            <Icon 
              name="chevronRight" 
              size="sm" 
              className="text-gray-400 dark:text-gray-600" 
            />
          )}
          
          {crumb.isLast ? (
            <span className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 font-medium">
              <Icon name={crumb.icon} size="sm" className="text-primary-600 dark:text-primary-400" />
              {crumb.name}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Icon name={crumb.icon} size="sm" />
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
