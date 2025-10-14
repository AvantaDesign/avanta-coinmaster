// Account Reconciliation Utilities
// Match transactions, identify transfers, and detect duplicates

/**
 * Match transactions between accounts by amount and date
 * @param {Array} transactions - Array of all transactions
 * @param {number} toleranceDays - Days tolerance for date matching (default: 3)
 * @param {number} toleranceAmount - Amount tolerance in percentage (default: 0.01 = 1%)
 * @returns {Array} - Array of matched transaction pairs
 */
export function matchTransactions(transactions, toleranceDays = 3, toleranceAmount = 0.01) {
  const matches = [];
  const processed = new Set();

  transactions.forEach((tx1, idx1) => {
    if (processed.has(idx1)) return;

    transactions.forEach((tx2, idx2) => {
      if (idx1 >= idx2 || processed.has(idx2)) return;

      // Check if amounts match (within tolerance)
      const amountDiff = Math.abs(Math.abs(tx1.amount) - Math.abs(tx2.amount));
      const amountThreshold = Math.abs(tx1.amount) * toleranceAmount;
      
      if (amountDiff > amountThreshold) return;

      // Check if dates are close (within tolerance days)
      const date1 = new Date(tx1.date);
      const date2 = new Date(tx2.date);
      const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > toleranceDays) return;

      // Check if they're from different accounts
      if (tx1.account === tx2.account) return;

      // Check if one is income and other is expense (potential transfer)
      const isTransfer = (tx1.type === 'ingreso' && tx2.type === 'gasto') ||
                        (tx1.type === 'gasto' && tx2.type === 'ingreso');

      if (!isTransfer) return;

      // Found a match!
      matches.push({
        tx1: { ...tx1, index: idx1 },
        tx2: { ...tx2, index: idx2 },
        amountDiff,
        daysDiff,
        confidence: calculateMatchConfidence(tx1, tx2, amountDiff, daysDiff, toleranceDays, toleranceAmount),
        type: 'transfer'
      });

      processed.add(idx1);
      processed.add(idx2);
    });
  });

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate confidence score for a match
 * @param {Object} tx1 - First transaction
 * @param {Object} tx2 - Second transaction
 * @param {number} amountDiff - Amount difference
 * @param {number} daysDiff - Days difference
 * @param {number} toleranceDays - Days tolerance
 * @param {number} toleranceAmount - Amount tolerance percentage
 * @returns {number} - Confidence score (0-100)
 */
function calculateMatchConfidence(tx1, tx2, amountDiff, daysDiff, toleranceDays, toleranceAmount) {
  // Start with 100% confidence
  let confidence = 100;

  // Reduce confidence based on amount difference
  const maxAmountDiff = Math.abs(tx1.amount) * toleranceAmount;
  if (maxAmountDiff > 0) {
    const amountPenalty = (amountDiff / maxAmountDiff) * 20;
    confidence -= amountPenalty;
  }

  // Reduce confidence based on date difference
  if (toleranceDays > 0) {
    const datePenalty = (daysDiff / toleranceDays) * 20;
    confidence -= datePenalty;
  }

  // Boost confidence if descriptions are similar
  const descriptionSimilarity = calculateStringSimilarity(tx1.description, tx2.description);
  confidence += descriptionSimilarity * 10;

  // Boost confidence if both are marked as transfers
  if (tx1.transaction_type === 'transfer' && tx2.transaction_type === 'transfer') {
    confidence += 10;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Calculate string similarity (Levenshtein distance)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function calculateStringSimilarity(str1, str2) {
  const s1 = (str1 || '').toLowerCase();
  const s2 = (str2 || '').toLowerCase();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return 1 - (distance / maxLength);
}

/**
 * Identify potential duplicate transactions
 * @param {Array} transactions - Array of transactions
 * @param {number} toleranceHours - Hours tolerance for date matching (default: 24)
 * @returns {Array} - Array of potential duplicates
 */
export function findDuplicates(transactions, toleranceHours = 24) {
  const duplicates = [];
  const processed = new Set();

  transactions.forEach((tx1, idx1) => {
    if (processed.has(idx1)) return;

    const potentialDuplicates = [];

    transactions.forEach((tx2, idx2) => {
      if (idx1 >= idx2 || processed.has(idx2)) return;

      // Check if amounts are exactly the same
      if (Math.abs(tx1.amount) !== Math.abs(tx2.amount)) return;

      // Check if types are the same
      if (tx1.type !== tx2.type) return;

      // Check if dates are very close (within tolerance hours)
      const date1 = new Date(tx1.date);
      const date2 = new Date(tx2.date);
      const hoursDiff = Math.abs((date2 - date1) / (1000 * 60 * 60));
      
      if (hoursDiff > toleranceHours) return;

      // Check description similarity
      const similarity = calculateStringSimilarity(tx1.description, tx2.description);
      
      if (similarity < 0.7) return; // Less than 70% similar

      // Found a potential duplicate!
      potentialDuplicates.push({
        tx: { ...tx2, index: idx2 },
        similarity,
        hoursDiff,
        confidence: calculateDuplicateConfidence(tx1, tx2, similarity, hoursDiff, toleranceHours)
      });
    });

    if (potentialDuplicates.length > 0) {
      duplicates.push({
        original: { ...tx1, index: idx1 },
        duplicates: potentialDuplicates.sort((a, b) => b.confidence - a.confidence)
      });
      
      processed.add(idx1);
      potentialDuplicates.forEach(dup => processed.add(dup.tx.index));
    }
  });

  return duplicates.sort((a, b) => b.duplicates[0].confidence - a.duplicates[0].confidence);
}

/**
 * Calculate confidence score for duplicate detection
 * @param {Object} tx1 - First transaction
 * @param {Object} tx2 - Second transaction
 * @param {number} similarity - Description similarity
 * @param {number} hoursDiff - Hours difference
 * @param {number} toleranceHours - Hours tolerance
 * @returns {number} - Confidence score (0-100)
 */
function calculateDuplicateConfidence(tx1, tx2, similarity, hoursDiff, toleranceHours) {
  let confidence = 50; // Base confidence for duplicates

  // High similarity in description = high confidence
  confidence += similarity * 40;

  // Close in time = higher confidence
  if (toleranceHours > 0) {
    const timeBonus = (1 - (hoursDiff / toleranceHours)) * 10;
    confidence += timeBonus;
  }

  // Same account = very high confidence of duplicate
  if (tx1.account === tx2.account) {
    confidence += 20;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Reconcile account balance
 * @param {Array} transactions - Transactions for the account
 * @param {number} expectedBalance - Expected balance from bank statement
 * @returns {Object} - Reconciliation result
 */
export function reconcileAccountBalance(transactions, expectedBalance) {
  let calculatedBalance = 0;

  transactions.forEach(tx => {
    if (tx.type === 'ingreso') {
      calculatedBalance += Math.abs(tx.amount);
    } else {
      calculatedBalance -= Math.abs(tx.amount);
    }
  });

  const discrepancy = expectedBalance - calculatedBalance;
  const isReconciled = Math.abs(discrepancy) < 0.01; // Within 1 cent

  return {
    calculatedBalance,
    expectedBalance,
    discrepancy,
    isReconciled,
    status: isReconciled ? 'reconciled' : 'discrepancy',
    percentDiff: expectedBalance !== 0 ? (discrepancy / expectedBalance) * 100 : 0
  };
}

/**
 * Generate reconciliation report
 * @param {Object} reconciliation - Reconciliation data
 * @returns {Object} - Formatted report
 */
export function generateReconciliationReport(reconciliation) {
  const { matches, duplicates, accountBalances } = reconciliation;

  const report = {
    summary: {
      totalMatches: matches.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicates.length, 0),
      accountsReconciled: accountBalances.filter(acc => acc.isReconciled).length,
      accountsWithDiscrepancy: accountBalances.filter(acc => !acc.isReconciled).length
    },
    matches: matches.map(m => ({
      tx1: {
        id: m.tx1.id,
        date: m.tx1.date,
        description: m.tx1.description,
        amount: m.tx1.amount,
        account: m.tx1.account
      },
      tx2: {
        id: m.tx2.id,
        date: m.tx2.date,
        description: m.tx2.description,
        amount: m.tx2.amount,
        account: m.tx2.account
      },
      confidence: m.confidence,
      type: m.type
    })),
    duplicates: duplicates.map(group => ({
      original: {
        id: group.original.id,
        date: group.original.date,
        description: group.original.description,
        amount: group.original.amount
      },
      duplicates: group.duplicates.map(dup => ({
        id: dup.tx.id,
        confidence: dup.confidence
      }))
    })),
    accountBalances: accountBalances.map(acc => ({
      account: acc.account,
      status: acc.status,
      calculatedBalance: acc.calculatedBalance,
      expectedBalance: acc.expectedBalance,
      discrepancy: acc.discrepancy,
      percentDiff: acc.percentDiff
    }))
  };

  return report;
}

/**
 * Auto-categorize transfers
 * @param {Array} matches - Matched transaction pairs
 * @returns {Array} - Suggested updates for transactions
 */
export function suggestTransferCategories(matches) {
  return matches
    .filter(m => m.confidence > 70) // Only high-confidence matches
    .map(m => ({
      tx1Id: m.tx1.id,
      tx2Id: m.tx2.id,
      suggestedType: 'transfer',
      confidence: m.confidence,
      linkedTransactionId: m.tx2.id // Link them together
    }));
}

/**
 * Get reconciliation statistics
 * @param {Array} transactions - Array of transactions
 * @returns {Object} - Statistics
 */
export function getReconciliationStats(transactions) {
  const transfers = transactions.filter(tx => tx.transaction_type === 'transfer');
  const unmatched = transactions.filter(tx => !tx.linked_transaction_id && tx.transaction_type !== 'transfer');
  
  const byAccount = {};
  transactions.forEach(tx => {
    const account = tx.account || 'Sin cuenta';
    if (!byAccount[account]) {
      byAccount[account] = {
        total: 0,
        transfers: 0,
        unmatched: 0
      };
    }
    byAccount[account].total += 1;
    if (tx.transaction_type === 'transfer') {
      byAccount[account].transfers += 1;
    }
    if (!tx.linked_transaction_id && tx.transaction_type !== 'transfer') {
      byAccount[account].unmatched += 1;
    }
  });

  return {
    totalTransactions: transactions.length,
    totalTransfers: transfers.length,
    totalUnmatched: unmatched.length,
    matchedPercentage: transactions.length > 0 ? 
      ((transactions.length - unmatched.length) / transactions.length) * 100 : 0,
    accountStats: byAccount
  };
}

/**
 * Format currency in Mexican Pesos
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
