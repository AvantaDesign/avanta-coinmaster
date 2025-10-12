// API helper functions

const API_BASE = '/api';

export async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function fetchTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/transactions${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function createTransaction(data) {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create transaction');
  return response.json();
}

export async function updateTransaction(id, data) {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update transaction');
  return response.json();
}

export async function deleteTransaction(id) {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete transaction');
  return response.json();
}

export async function fetchAccounts() {
  const response = await fetch(`${API_BASE}/accounts`);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function updateAccount(id, data) {
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update account');
  return response.json();
}

export async function fetchFiscal(month, year) {
  const params = new URLSearchParams({ month, year }).toString();
  const response = await fetch(`${API_BASE}/fiscal?${params}`);
  if (!response.ok) throw new Error('Failed to fetch fiscal data');
  return response.json();
}

export async function fetchInvoices(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/invoices${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export async function createInvoice(data) {
  const response = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create invoice');
  return response.json();
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
}
