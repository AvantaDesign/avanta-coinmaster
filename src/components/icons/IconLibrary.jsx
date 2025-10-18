import {
  // Navigation Icons
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  
  // Context Icons
  UserIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  UsersIcon,
  
  // Financial Icons
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  
  // Action Icons
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CursorArrowRaysIcon,
  LightBulbIcon,
  BoltIcon,
  FlagIcon,
  ScaleIcon,
  MinusIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  
  // Status Icons
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  
  // Trend Icons
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  
  // Other Icons
  CalendarIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  DocumentIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  BellIcon as BellIconSolid,
  UserIcon as UserIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
} from '@heroicons/react/24/solid';

/**
 * Icon wrapper component that provides consistent styling and accessibility
 */
export default function Icon({ 
  name, 
  variant = 'outline', 
  size = 'md', 
  className = '', 
  label,
  ...props 
}) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  };

  const IconComponent = getIconComponent(name, variant);
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      className={`${sizeClasses[size]} ${className}`}
      aria-label={label}
      aria-hidden={!label}
      {...props}
    />
  );
}

/**
 * Get the appropriate icon component based on name and variant
 */
function getIconComponent(name, variant) {
  const outlineIcons = {
    // Navigation
    home: HomeIcon,
    chart: ChartBarIcon,
    chartBar: ChartBarIcon,
    settings: Cog6ToothIcon,
    cog: Cog6ToothIcon,
    document: DocumentTextIcon,
    documentText: DocumentTextIcon,
    bell: BellIcon,
    help: QuestionMarkCircleIcon,
    questionMarkCircle: QuestionMarkCircleIcon,
    chevronRight: ChevronRightIcon,
    chevronUp: ChevronUpIcon,
    chevronDown: ChevronDownIcon,
    
    // Context
    user: UserIcon,
    personal: UserIcon,
    briefcase: BriefcaseIcon,
    business: BriefcaseIcon,
    building: BuildingOfficeIcon,
    buildingLibrary: BuildingLibraryIcon,
    'home-modern': HomeModernIcon,
    users: UsersIcon,
    
    // Financial
    banknotes: BanknotesIcon,
    money: BanknotesIcon,
    cash: BanknotesIcon,
    'credit-card': CreditCardIcon,
    creditCard: CreditCardIcon,
    card: CreditCardIcon,
    bank: BuildingLibraryIcon,
    receipt: ReceiptPercentIcon,
    currency: CurrencyDollarIcon,
    dollar: CurrencyDollarIcon,
    scale: ScaleIcon,
    piggyBank: BanknotesIcon, // Using banknotes as closest alternative
    
    // Actions
    plus: PlusIcon,
    add: PlusIcon,
    pencil: PencilIcon,
    edit: PencilIcon,
    trash: TrashIcon,
    delete: TrashIcon,
    check: CheckIcon,
    close: XMarkIcon,
    x: XMarkIcon,
    refresh: ArrowPathIcon,
    search: MagnifyingGlassIcon,
    filter: FunnelIcon,
    upload: ArrowUpTrayIcon,
    arrowUpTray: ArrowUpTrayIcon,
    download: ArrowDownTrayIcon,
    arrowDownTray: ArrowDownTrayIcon,
    cursor: CursorArrowRaysIcon,
    lightBulb: LightBulbIcon,
    bolt: BoltIcon,
    flag: FlagIcon,
    minus: MinusIcon,
    clipboardDocumentCheck: ClipboardDocumentCheckIcon,
    shieldCheck: ShieldCheckIcon,
    documentCheck: DocumentCheckIcon,
    
    // Status
    'check-circle': CheckCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    alert: ExclamationTriangleIcon,
    error: ExclamationCircleIcon,
    danger: ExclamationCircleIcon,
    info: InformationCircleIcon,
    information: InformationCircleIcon,
    
    // Trends
    'trending-up': ArrowTrendingUpIcon,
    arrowTrendingUp: ArrowTrendingUpIcon,
    up: ArrowTrendingUpIcon,
    increase: ArrowTrendingUpIcon,
    'trending-down': ArrowTrendingDownIcon,
    arrowTrendingDown: ArrowTrendingDownIcon,
    down: ArrowTrendingDownIcon,
    decrease: ArrowTrendingDownIcon,
    'chart-pie': ChartPieIcon,
    chartPie: ChartPieIcon,
    pie: ChartPieIcon,
    'chart-line': PresentationChartLineIcon,
    presentationChartLine: PresentationChartLineIcon,
    analytics: PresentationChartLineIcon,
    
    // Other
    calendar: CalendarIcon,
    clock: ClockIcon,
    tag: TagIcon,
    folder: FolderIcon,
    file: DocumentIcon,
    camera: CameraIcon,
    eye: EyeIcon,
    'eye-slash': EyeSlashIcon,
    adjustments: AdjustmentsHorizontalIcon,
  };

  const solidIcons = {
    home: HomeIconSolid,
    chart: ChartBarIconSolid,
    settings: Cog6ToothIconSolid,
    document: DocumentTextIconSolid,
    bell: BellIconSolid,
    user: UserIconSolid,
    personal: UserIconSolid,
    briefcase: BriefcaseIconSolid,
    business: BriefcaseIconSolid,
    'check-circle': CheckCircleIconSolid,
    success: CheckCircleIconSolid,
    warning: ExclamationTriangleIconSolid,
    alert: ExclamationTriangleIconSolid,
    error: ExclamationCircleIconSolid,
    danger: ExclamationCircleIconSolid,
    info: InformationCircleIconSolid,
    information: InformationCircleIconSolid,
  };

  return variant === 'solid' ? solidIcons[name] : outlineIcons[name];
}

/**
 * Export individual icon components for direct use
 */
export {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  FolderIcon,
  DocumentIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
};
