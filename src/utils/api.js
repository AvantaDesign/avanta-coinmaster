// API helper functions

import mockAPI from './mockData.js';

const API_BASE = '/api';
const USE_MOCK_DATA = import.meta.env.DEV; // Use mock data in development

export async function fetchDashboard() {
  if (USE_MOCK_DATA) {
    return await mockAPI.fetchDashboard();
  }
  
  const response = await fetch(`${API_BASE}/dashboard`);
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function fetchTransactions(params = {}) {
  if (USE_MOCK_DATA) {
    return await mockAPI.fetchTransactions(params);
  }
  
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/transactions${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export async function createTransaction(data) {
  if (USE_MOCK_DATA) {
    return await mockAPI.createTransaction(data);
  }
  
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create transaction');
  return response.json();
}

export async function updateTransaction(id, data) {
  if (USE_MOCK_DATA) {
    return await mockAPI.updateTransaction(id, data);
  }
  
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update transaction');
  return response.json();
}

export async function deleteTransaction(id) {
  if (USE_MOCK_DATA) {
    return await mockAPI.deleteTransaction(id);
  }
  
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete transaction');
  return response.json();
}

export async function fetchAccounts() {
  if (USE_MOCK_DATA) {
    return await mockAPI.fetchAccounts();
  }
  
  const response = await fetch(`${API_BASE}/accounts`);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function updateAccount(id, data) {
  if (USE_MOCK_DATA) {
    return await mockAPI.updateAccount(id, data);
  }
  
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update account');
  return response.json();
}

export async function fetchFiscal(month, year) {
  if (USE_MOCK_DATA) {
    return await mockAPI.fetchFiscal(month, year);
  }
  
  const params = new URLSearchParams({ month, year }).toString();
  const response = await fetch(`${API_BASE}/fiscal?${params}`);
  if (!response.ok) throw new Error('Failed to fetch fiscal data');
  return response.json();
}

export async function fetchInvoices(params = {}) {
  if (USE_MOCK_DATA) {
    return await mockAPI.fetchInvoices(params);
  }
  
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/invoices${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch invoices');
  return response.json();
}

export async function createInvoice(data) {
  if (USE_MOCK_DATA) {
    return await mockAPI.createInvoice(data);
  }
  
  const response = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create invoice');
  return response.json();
}

export async function uploadFile(file) {
  if (USE_MOCK_DATA) {
    return await mockAPI.uploadFile(file);
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Failed to upload file');
  return response.json();
}
