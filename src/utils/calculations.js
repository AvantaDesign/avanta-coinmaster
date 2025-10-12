// Fiscal calculation utilities

export function calculateISR(utilidad) {
  // Simplified ISR calculation at 20% rate
  return utilidad > 0 ? utilidad * 0.20 : 0;
}

export function calculateIVA(income, deductible) {
  // IVA calculation at 16% rate
  const ivaCobrado = income * 0.16;
  const ivaPagado = deductible * 0.16;
  return Math.max(0, ivaCobrado - ivaPagado);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function getDueDate(year, month) {
  // Due date is the 17th of the following month
  const dueMonth = month === 12 ? 1 : month + 1;
  const dueYear = month === 12 ? year + 1 : year;
  return new Date(dueYear, dueMonth - 1, 17);
}
