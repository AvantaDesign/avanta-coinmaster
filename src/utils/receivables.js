// Receivables utility functions
// Calculations, aging reports, reminders, and payment tracking

/**
 * Calculate aging buckets for receivables
 * @param {Array} receivables - Array of receivable objects
 * @returns {Object} Aging report with buckets
 */
export function calculateAgingReport(receivables) {
  const today = new Date();
  const aging = {
    current: { count: 0, total: 0, items: [] },
    days_1_30: { count: 0, total: 0, items: [] },
    days_31_60: { count: 0, total: 0, items: [] },
    days_61_90: { count: 0, total: 0, items: [] },
    days_90_plus: { count: 0, total: 0, items: [] }
  };

  receivables.forEach(receivable => {
    if (receivable.status === 'paid' || receivable.status === 'cancelled') {
      return; // Skip paid and cancelled receivables
    }

    const dueDate = new Date(receivable.due_date);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const outstanding = receivable.amount - (receivable.amount_paid || 0);

    let bucket;
    if (daysOverdue < 0) {
      bucket = 'current';
    } else if (daysOverdue <= 30) {
      bucket = 'days_1_30';
    } else if (daysOverdue <= 60) {
      bucket = 'days_31_60';
    } else if (daysOverdue <= 90) {
      bucket = 'days_61_90';
    } else {
      bucket = 'days_90_plus';
    }

    aging[bucket].count++;
    aging[bucket].total += outstanding;
    aging[bucket].items.push({
      ...receivable,
      daysOverdue,
      outstanding
    });
  });

  // Calculate totals
  aging.totalCount = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled').length;
  aging.totalOutstanding = Object.values(aging).reduce((sum, bucket) => {
    return typeof bucket === 'object' && bucket.total ? sum + bucket.total : sum;
  }, 0);

  return aging;
}

/**
 * Check if reminder should be sent
 * @param {Object} receivable - Receivable object
 * @returns {Boolean} Whether to send reminder
 */
export function shouldSendReminder(receivable) {
  if (receivable.status === 'paid' || receivable.status === 'cancelled') {
    return false;
  }

  const today = new Date();
  const dueDate = new Date(receivable.due_date);
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  // Send reminder 7 days before due date
  if (daysUntilDue === 7) {
    return true;
  }

  // Send reminder on due date
  if (daysUntilDue === 0) {
    return true;
  }

  // Send reminders every 7 days after overdue
  if (daysUntilDue < 0 && Math.abs(daysUntilDue) % 7 === 0) {
    return true;
  }

  return false;
}

/**
 * Calculate collection efficiency metrics
 * @param {Array} receivables - Array of receivable objects
 * @returns {Object} Collection metrics
 */
export function calculateCollectionMetrics(receivables) {
  const paid = receivables.filter(r => r.status === 'paid');
  const overdue = receivables.filter(r => r.status === 'overdue');
  const pending = receivables.filter(r => r.status === 'pending' || r.status === 'partial');

  const totalInvoiced = receivables.reduce((sum, r) => sum + r.amount, 0);
  const totalCollected = receivables.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const totalOutstanding = receivables.reduce((sum, r) => {
    if (r.status !== 'paid' && r.status !== 'cancelled') {
      return sum + (r.amount - (r.amount_paid || 0));
    }
    return sum;
  }, 0);

  // Calculate average days to collect
  const averageDaysToCollect = paid.length > 0 ? paid.reduce((sum, r) => {
    const invoiceDate = new Date(r.invoice_date);
    const paidDate = new Date(r.updated_at); // Assuming updated_at is when it was marked paid
    const days = Math.floor((paidDate - invoiceDate) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0) / paid.length : 0;

  return {
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
    paidCount: paid.length,
    overdueCount: overdue.length,
    pendingCount: pending.length,
    averageDaysToCollect: Math.round(averageDaysToCollect)
  };
}

/**
 * Get receivables that need attention
 * @param {Array} receivables - Array of receivable objects
 * @returns {Array} Receivables requiring action
 */
export function getReceivablesNeedingAttention(receivables) {
  const today = new Date();
  const needsAttention = [];

  receivables.forEach(receivable => {
    if (receivable.status === 'paid' || receivable.status === 'cancelled') {
      return;
    }

    const dueDate = new Date(receivable.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    let priority = 'low';
    let reason = '';

    if (daysUntilDue < -30) {
      priority = 'critical';
      reason = `Overdue by ${Math.abs(daysUntilDue)} days`;
    } else if (daysUntilDue < 0) {
      priority = 'high';
      reason = `Overdue by ${Math.abs(daysUntilDue)} days`;
    } else if (daysUntilDue <= 7) {
      priority = 'medium';
      reason = `Due in ${daysUntilDue} days`;
    }

    if (priority !== 'low') {
      needsAttention.push({
        ...receivable,
        priority,
        reason,
        daysUntilDue
      });
    }
  });

  // Sort by priority and days
  return needsAttention.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
}

/**
 * Format payment history for display
 * @param {Array} payments - Array of payment objects
 * @returns {Array} Formatted payment history
 */
export function formatPaymentHistory(payments) {
  return payments.map(payment => ({
    ...payment,
    formattedDate: new Date(payment.payment_date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    formattedAmount: new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(payment.amount)
  }));
}

/**
 * Calculate expected cash flow from receivables
 * @param {Array} receivables - Array of receivable objects
 * @param {Number} daysAhead - Days to forecast
 * @returns {Array} Expected cash flow by date
 */
export function calculateExpectedCashFlow(receivables, daysAhead = 90) {
  const today = new Date();
  const cashFlow = [];

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const expectedAmount = receivables.reduce((sum, r) => {
      if (r.status !== 'paid' && r.status !== 'cancelled' && r.due_date === dateStr) {
        return sum + (r.amount - (r.amount_paid || 0));
      }
      return sum;
    }, 0);

    if (expectedAmount > 0) {
      cashFlow.push({
        date: dateStr,
        amount: expectedAmount,
        formattedDate: date.toLocaleDateString('es-MX', {
          month: 'short',
          day: 'numeric'
        })
      });
    }
  }

  return cashFlow;
}
