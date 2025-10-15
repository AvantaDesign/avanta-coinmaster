// API helper functions
// All functions now use real backend endpoints (Cloudflare Workers + D1)
// With authentication support

import { authFetch, getAuthHeaders } from './auth';

const API_BASE = '/api';

export async function fetchDashboard(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/dashboard${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function fetchTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/transactions${queryString ? '?' + queryString : ''}`;
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function createTransaction(data) {
  const response = await authFetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
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
  const response = await authFetch(`${API_BASE}/accounts`, {
    headers: getAuthHeaders()
  });
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
  const response = await authFetch(`${API_BASE}/fiscal?${params}`, {
    headers: getAuthHeaders()
  });
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
  const response = await authFetch(url, {
    headers: getAuthHeaders()
  });
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
