// API helper functions
// All functions now use real backend endpoints (Cloudflare Workers + D1)
// With authentication support

import { authFetch, getAuthHeaders } from './auth';

const API_BASE = '/api';

export async function fetchDashboard(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/dashboard${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function fetchTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/transactions${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function createTransaction(data) {
  const response = await authFetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create transaction');
  return response.json();
}

export async function updateTransaction(id, data) {
  const response = await authFetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update transaction');
  return response.json();
}

export async function deleteTransaction(id) {
  const response = await authFetch(`${API_BASE}/transactions/${id}?confirm=true`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete transaction');
  return response.json();
}

export async function restoreTransaction(id) {
  const response = await authFetch(`${API_BASE}/transactions/${id}/restore`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  if (!response.ok) throw new Error('Failed to restore transaction');
  return response.json();
}

export async function fetchAccounts() {
  const response = await authFetch(`${API_BASE}/accounts`);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function createAccount(data) {
  const response = await authFetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create account');
  return response.json();
}

export async function updateAccount(id, data) {
  const response = await authFetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update account');
  return response.json();
}

export async function deleteAccount(id) {
  const response = await authFetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete account');
  return response.json();
}

export async function fetchCategories() {
  const response = await authFetch(`${API_BASE}/categories`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function createCategory(data) {
  const response = await authFetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
}

export async function updateCategory(id, data) {
  const response = await authFetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update category');
  return response.json();
}

export async function deleteCategory(id) {
  const response = await authFetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete category');
  return response.json();
}

export async function fetchFiscal(month, year) {
  const params = new URLSearchParams({ month, year }).toString();
  const response = await authFetch(`${API_BASE}/fiscal?${params}`);
  if (!response.ok) throw new Error('Failed to fetch fiscal data');
  return response.json();
}

export async function fetchInvoices(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/invoices${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export async function createInvoice(data) {
  const response = await authFetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create invoice');
  return response.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await authFetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
}

export async function fetchReconciliation(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/reconciliation${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch reconciliation data');
  return response.json();
}

export async function applyReconciliation(action, transactionIds) {
  const response = await authFetch(`${API_BASE}/reconciliation`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ action, transactionIds })
  });
  if (!response.ok) throw new Error('Failed to apply reconciliation');
  return response.json();
}

// Receivables API
export async function fetchReceivables(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/receivables${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch receivables');
  return response.json();
}

export async function createReceivable(data) {
  const response = await authFetch(`${API_BASE}/receivables`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create receivable');
  return response.json();
}

export async function updateReceivable(id, data) {
  const response = await authFetch(`${API_BASE}/receivables`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update receivable');
  return response.json();
}

export async function deleteReceivable(id) {
  const response = await authFetch(`${API_BASE}/receivables?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete receivable');
  return response.json();
}

// Payables API
export async function fetchPayables(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/payables${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch payables');
  return response.json();
}

export async function createPayable(data) {
  const response = await authFetch(`${API_BASE}/payables`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create payable');
  return response.json();
}

export async function updatePayable(id, data) {
  const response = await authFetch(`${API_BASE}/payables`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update payable');
  return response.json();
}

export async function deletePayable(id) {
  const response = await authFetch(`${API_BASE}/payables?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete payable');
  return response.json();
}

// Automation API
export async function fetchAutomationRules(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/automation${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch automation rules');
  return response.json();
}

export async function createAutomationRule(data) {
  const response = await authFetch(`${API_BASE}/automation`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create automation rule');
  return response.json();
}

export async function updateAutomationRule(id, data) {
  const response = await authFetch(`${API_BASE}/automation`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update automation rule');
  return response.json();
}

export async function deleteAutomationRule(id) {
  const response = await authFetch(`${API_BASE}/automation?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete automation rule');
  return response.json();
}

// Credits API
export async function fetchCredits(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/credits${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url);
  if (!response.ok) throw new Error('Failed to fetch credits');
  return response.json();
}

export async function fetchCreditById(id) {
  const response = await authFetch(`${API_BASE}/credits/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch credit');
  return response.json();
}

export async function createCredit(data) {
  const response = await authFetch(`${API_BASE}/credits`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create credit');
  return response.json();
}

export async function updateCredit(id, data) {
  const response = await authFetch(`${API_BASE}/credits/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update credit');
  return response.json();
}

export async function deleteCredit(id) {
  const response = await authFetch(`${API_BASE}/credits/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete credit');
  return response.json();
}

export async function fetchCreditMovements(creditId, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/credits/${creditId}/movements${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch credit movements');
  return response.json();
}

export async function createCreditMovement(creditId, data) {
  const response = await authFetch(`${API_BASE}/credits/${creditId}/movements`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create credit movement');
  return response.json();
}

// Recurring Freelancers API
export async function fetchRecurringFreelancers(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/recurring-freelancers${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch recurring freelancers');
  return response.json();
}

export async function createRecurringFreelancer(data) {
  const response = await authFetch(`${API_BASE}/recurring-freelancers`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create recurring freelancer');
  return response.json();
}

export async function updateRecurringFreelancer(id, data) {
  const response = await authFetch(`${API_BASE}/recurring-freelancers`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update recurring freelancer');
  return response.json();
}

export async function deleteRecurringFreelancer(id) {
  const response = await authFetch(`${API_BASE}/recurring-freelancers?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete recurring freelancer');
  return response.json();
}

// Recurring Services API
export async function fetchRecurringServices(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/recurring-services${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch recurring services');
  return response.json();
}

export async function createRecurringService(data) {
  const response = await authFetch(`${API_BASE}/recurring-services`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create recurring service');
  return response.json();
}

export async function updateRecurringService(id, data) {
  const response = await authFetch(`${API_BASE}/recurring-services`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update recurring service');
  return response.json();
}

export async function deleteRecurringService(id) {
  const response = await authFetch(`${API_BASE}/recurring-services?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete recurring service');
  return response.json();
}

// Cash Flow Projection API
export async function fetchCashFlowProjection(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/cash-flow-projection${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch cash flow projection');
  return response.json();
}

// Debts API
export async function fetchDebts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/debts${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch debts');
  return response.json();
}

export async function fetchDebt(id, includeAmortization = false) {
  const params = { id };
  if (includeAmortization) {
    params.amortization = 'true';
  }
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/debts?${queryString}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch debt');
  return response.json();
}

export async function createDebt(data) {
  const response = await authFetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create debt');
  return response.json();
}

export async function updateDebt(id, data) {
  const response = await authFetch(`${API_BASE}/debts`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update debt');
  return response.json();
}

export async function deleteDebt(id) {
  const response = await authFetch(`${API_BASE}/debts?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete debt');
  return response.json();
}

// Investments API
export async function fetchInvestments(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/investments${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch investments');
  return response.json();
}

export async function fetchInvestment(id, includeTransactions = false) {
  const params = { id };
  if (includeTransactions) {
    params.transactions = 'true';
  }
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/investments?${queryString}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch investment');
  return response.json();
}

export async function fetchPortfolioSummary() {
  const url = `${API_BASE}/investments?portfolio=true`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch portfolio summary');
  return response.json();
}

export async function createInvestment(data) {
  const response = await authFetch(`${API_BASE}/investments`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create investment');
  return response.json();
}

export async function updateInvestment(id, data) {
  const response = await authFetch(`${API_BASE}/investments`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ id, ...data })
  });
  if (!response.ok) throw new Error('Failed to update investment');
  return response.json();
}

export async function deleteInvestment(id) {
  const response = await authFetch(`${API_BASE}/investments?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete investment');
  return response.json();
}

// Notifications API
export async function fetchNotifications(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/notifications${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function createNotification(data) {
  const response = await authFetch(`${API_BASE}/notifications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create notification');
  return response.json();
}

export async function markNotificationAsRead(id) {
  const response = await authFetch(`${API_BASE}/notifications?id=${id}&action=mark-read`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
}

export async function dismissNotification(id) {
  const response = await authFetch(`${API_BASE}/notifications?id=${id}&action=dismiss`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  if (!response.ok) throw new Error('Failed to dismiss notification');
  return response.json();
}

export async function snoozeNotification(id, snoozedUntil) {
  const response = await authFetch(`${API_BASE}/notifications?id=${id}&action=snooze`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ snoozed_until: snoozedUntil })
  });
  if (!response.ok) throw new Error('Failed to snooze notification');
  return response.json();
}

export async function deleteNotification(id) {
  const response = await authFetch(`${API_BASE}/notifications?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete notification');
  return response.json();
}

// Financial Tasks API
export async function fetchFinancialTasks(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/financial-tasks${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch financial tasks');
  return response.json();
}

export async function createFinancialTask(data) {
  const response = await authFetch(`${API_BASE}/financial-tasks`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create financial task');
  return response.json();
}

export async function updateFinancialTask(id, data) {
  const response = await authFetch(`${API_BASE}/financial-tasks?id=${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update financial task');
  return response.json();
}

export async function toggleTaskCompletion(id) {
  const response = await authFetch(`${API_BASE}/financial-tasks?id=${id}&action=toggle`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  });
  if (!response.ok) throw new Error('Failed to toggle task completion');
  return response.json();
}

export async function deleteFinancialTask(id) {
  const response = await authFetch(`${API_BASE}/financial-tasks?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete financial task');
  return response.json();
}
