// Payables utility functions
// Calculations, payment schedules, and vendor management

/**
 * Calculate payment schedule summary
 * @param {Array} payables - Array of payable objects
 * @returns {Object} Payment schedule by period
 */
export function calculatePaymentSchedule(payables) {
  const today = new Date();
  const schedule = {
    overdue: { count: 0, total: 0, items: [] },
    thisWeek: { count: 0, total: 0, items: [] },
    thisMonth: { count: 0, total: 0, items: [] },
    nextMonth: { count: 0, total: 0, items: [] },
    future: { count: 0, total: 0, items: [] }
  };

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  payables.forEach(payable => {
    if (payable.status === 'paid' || payable.status === 'cancelled') {
      return;
    }

    const dueDate = new Date(payable.due_date);
    const outstanding = payable.amount - (payable.amount_paid || 0);

    let period;
    if (dueDate < today) {
      period = 'overdue';
    } else if (dueDate <= endOfWeek) {
      period = 'thisWeek';
    } else if (dueDate <= endOfMonth) {
      period = 'thisMonth';
    } else if (dueDate <= endOfNextMonth) {
      period = 'nextMonth';
    } else {
      period = 'future';
    }

    schedule[period].count++;
    schedule[period].total += outstanding;
    schedule[period].items.push({
      ...payable,
      outstanding,
      daysUntilDue: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
    });
  });

  // Calculate totals
  schedule.totalCount = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length;
  schedule.totalAmount = Object.values(schedule).reduce((sum, period) => {
    return typeof period === 'object' && period.total ? sum + period.total : sum;
  }, 0);

  return schedule;
}

/**
 * Get vendor payment summary
 * @param {Array} payables - Array of payable objects
 * @returns {Array} Vendor summaries
 */
export function getVendorSummary(payables) {
  const vendors = {};

  payables.forEach(payable => {
    const vendorName = payable.vendor_name;
    if (!vendors[vendorName]) {
      vendors[vendorName] = {
        vendor_name: vendorName,
        vendor_rfc: payable.vendor_rfc,
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        payableCount: 0,
        paidCount: 0,
        overdueCount: 0
      };
    }

    vendors[vendorName].payableCount++;
    vendors[vendorName].totalAmount += payable.amount;
    vendors[vendorName].paidAmount += payable.amount_paid || 0;
    
    if (payable.status !== 'paid' && payable.status !== 'cancelled') {
      vendors[vendorName].outstandingAmount += payable.amount - (payable.amount_paid || 0);
    }
    
    if (payable.status === 'paid') {
      vendors[vendorName].paidCount++;
    }
    
    if (payable.status === 'overdue') {
      vendors[vendorName].overdueCount++;
    }
  });

  return Object.values(vendors).sort((a, b) => b.outstandingAmount - a.outstandingAmount);
}

/**
 * Calculate payment efficiency metrics
 * @param {Array} payables - Array of payable objects
 * @returns {Object} Payment metrics
 */
export function calculatePaymentMetrics(payables) {
  const paid = payables.filter(p => p.status === 'paid');
  const overdue = payables.filter(p => p.status === 'overdue');
  const pending = payables.filter(p => p.status === 'pending' || p.status === 'partial');

  const totalBilled = payables.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payables.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalOutstanding = payables.reduce((sum, p) => {
    if (p.status !== 'paid' && p.status !== 'cancelled') {
      return sum + (p.amount - (p.amount_paid || 0));
    }
    return sum;
  }, 0);

  // Calculate average days to pay
  const averageDaysToPay = paid.length > 0 ? paid.reduce((sum, p) => {
    const billDate = new Date(p.bill_date);
    const paidDate = new Date(p.updated_at);
    const days = Math.floor((paidDate - billDate) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0) / paid.length : 0;

  // Calculate on-time payment rate
  const onTimePayments = paid.filter(p => {
    const dueDate = new Date(p.due_date);
    const paidDate = new Date(p.updated_at);
    return paidDate <= dueDate;
  }).length;

  return {
    totalBilled,
    totalPaid,
    totalOutstanding,
    paymentRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0,
    paidCount: paid.length,
    overdueCount: overdue.length,
    pendingCount: pending.length,
    averageDaysToPay: Math.round(averageDaysToPay),
    onTimePaymentRate: paid.length > 0 ? (onTimePayments / paid.length) * 100 : 0
  };
}

/**
 * Get payables requiring immediate attention
 * @param {Array} payables - Array of payable objects
 * @returns {Array} Urgent payables
 */
export function getUrgentPayables(payables) {
  const today = new Date();
  const urgent = [];

  payables.forEach(payable => {
    if (payable.status === 'paid' || payable.status === 'cancelled') {
      return;
    }

    const dueDate = new Date(payable.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    let priority = 'low';
    let reason = '';

    if (daysUntilDue < 0) {
      priority = 'critical';
      reason = `Overdue by ${Math.abs(daysUntilDue)} days`;
    } else if (daysUntilDue <= 3) {
      priority = 'high';
      reason = `Due in ${daysUntilDue} days`;
    } else if (daysUntilDue <= 7) {
      priority = 'medium';
      reason = `Due in ${daysUntilDue} days`;
    }

    if (priority !== 'low') {
      urgent.push({
        ...payable,
        priority,
        reason,
        daysUntilDue,
        outstanding: payable.amount - (payable.amount_paid || 0)
      });
    }
  });

  // Sort by priority and days
  return urgent.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
}

/**
 * Calculate expected cash outflow from payables
 * @param {Array} payables - Array of payable objects
 * @param {Number} daysAhead - Days to forecast
 * @returns {Array} Expected cash outflow by date
 */
export function calculateExpectedCashOutflow(payables, daysAhead = 90) {
  const today = new Date();
  const cashOutflow = [];

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const expectedAmount = payables.reduce((sum, p) => {
      if (p.status !== 'paid' && p.status !== 'cancelled' && p.due_date === dateStr) {
        return sum + (p.amount - (p.amount_paid || 0));
      }
      return sum;
    }, 0);

    if (expectedAmount > 0) {
      cashOutflow.push({
        date: dateStr,
        amount: expectedAmount,
        formattedDate: date.toLocaleDateString('es-MX', {
          month: 'short',
          day: 'numeric'
        })
      });
    }
  }

  return cashOutflow;
}

/**
 * Group payables by category
 * @param {Array} payables - Array of payable objects
 * @returns {Object} Payables grouped by category
 */
export function groupByCategory(payables) {
  const categories = {};

  payables.forEach(payable => {
    const category = payable.category || 'Sin categoría';
    if (!categories[category]) {
      categories[category] = {
        category,
        count: 0,
        total: 0,
        outstanding: 0,
        items: []
      };
    }

    categories[category].count++;
    categories[category].total += payable.amount;
    
    if (payable.status !== 'paid' && payable.status !== 'cancelled') {
      categories[category].outstanding += payable.amount - (payable.amount_paid || 0);
    }
    
    categories[category].items.push(payable);
  });

  return Object.values(categories).sort((a, b) => b.outstanding - a.outstanding);
}

/**
 * Calculate aging report for payables
 * @param {Array} payables - Array of payable objects
 * @returns {Object} Aging report with buckets
 */
export function calculateAgingReport(payables) {
  const today = new Date();
  const aging = {
    current: { count: 0, total: 0, items: [] },
    days_1_30: { count: 0, total: 0, items: [] },
    days_31_60: { count: 0, total: 0, items: [] },
    days_61_90: { count: 0, total: 0, items: [] },
    days_90_plus: { count: 0, total: 0, items: [] }
  };

  payables.forEach(payable => {
    if (payable.status === 'paid' || payable.status === 'cancelled') {
      return;
    }

    const dueDate = new Date(payable.due_date);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const outstanding = payable.amount - (payable.amount_paid || 0);

    let bucket;
    if (daysOverdue <= 0) {
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
      ...payable,
      outstanding,
      daysOverdue
    });
  });

  aging.totalCount = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length;
  aging.totalOutstanding = Object.values(aging).reduce((sum, bucket) => {
    return typeof bucket === 'object' && bucket.total ? sum + bucket.total : sum;
  }, 0);

  return aging;
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
