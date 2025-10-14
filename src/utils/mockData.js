// Mock data service for development (DEPRECATED)
// This file is kept for reference only - the app now uses real backend endpoints
// See: functions/api/ for the actual backend implementation with Cloudflare D1
// 
// Historical note: This was used during initial development to simulate API responses
// before the backend was fully implemented

// Mock transactions data
const mockTransactions = [
  {
    id: 1,
    date: '2025-01-15',
    description: 'Pago cliente - Proyecto videoclip',
    amount: 15000,
    type: 'ingreso',
    category: 'avanta',
    account: 'BBVA',
    is_deductible: false,
    economic_activity: '512191',
    receipt_url: null,
    created_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    date: '2025-01-14',
    description: 'Compra equipo de cámara',
    amount: 8500,
    type: 'gasto',
    category: 'avanta',
    account: 'BBVA',
    is_deductible: true,
    economic_activity: '512191',
    receipt_url: '/receipts/camera-receipt.pdf',
    created_at: '2025-01-14T15:20:00Z'
  },
  {
    id: 3,
    date: '2025-01-13',
    description: 'Supermercado',
    amount: 1200,
    type: 'gasto',
    category: 'personal',
    account: 'BBVA',
    is_deductible: false,
    economic_activity: null,
    receipt_url: null,
    created_at: '2025-01-13T18:45:00Z'
  },
  {
    id: 4,
    date: '2025-01-12',
    description: 'Servicio de internet',
    amount: 800,
    type: 'gasto',
    category: 'avanta',
    account: 'BBVA',
    is_deductible: true,
    economic_activity: '512191',
    receipt_url: '/receipts/internet-bill.pdf',
    created_at: '2025-01-12T09:15:00Z'
  },
  {
    id: 5,
    date: '2025-01-11',
    description: 'Venta artesanías - Mercado',
    amount: 3200,
    type: 'ingreso',
    category: 'avanta',
    account: 'BBVA',
    is_deductible: false,
    economic_activity: '463111',
    receipt_url: null,
    created_at: '2025-01-11T14:30:00Z'
  },
  {
    id: 6,
    date: '2025-01-10',
    description: 'Gasolina',
    amount: 600,
    type: 'gasto',
    category: 'avanta',
    account: 'BBVA',
    is_deductible: true,
    economic_activity: '512191',
    receipt_url: '/receipts/gas-receipt.pdf',
    created_at: '2025-01-10T11:20:00Z'
  }
];

// Mock accounts data
const mockAccounts = [
  {
    id: 1,
    name: 'BBVA Cuenta Principal',
    type: 'banco',
    balance: 125000,
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Tarjeta de Crédito BBVA',
    type: 'credito',
    balance: -8500,
    updated_at: '2025-01-14T15:20:00Z'
  }
];

// Mock invoices data
const mockInvoices = [
  {
    id: 1,
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    rfc_emisor: 'REGX000101ABC',
    rfc_receptor: 'REGM000905T24',
    date: '2025-01-15',
    subtotal: 12931.03,
    iva: 2068.97,
    total: 15000,
    xml_url: '/invoices/invoice-001.xml',
    status: 'vigente',
    created_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    uuid: 'B2C3D4E5-F6G7-8901-BCDE-F23456789012',
    rfc_emisor: 'REGM000905T24',
    rfc_receptor: 'REGX000101ABC',
    date: '2025-01-14',
    subtotal: 7327.59,
    iva: 1172.41,
    total: 8500,
    xml_url: '/invoices/invoice-002.xml',
    status: 'vigente',
    created_at: '2025-01-14T15:20:00Z'
  }
];

// Mock fiscal data
const mockFiscalData = {
  month: 1,
  year: 2025,
  income: 18200,
  deductible: 9900,
  utilidad: 8300,
  isr: 1660,
  iva: 1328,
  dueDate: '2025-02-17',
  status: 'pending'
};

// Helper functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

// Mock API functions
export const mockAPI = {
  // Dashboard
  async fetchDashboard() {
    await delay(500); // Simulate network delay
    
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    
    // Calculate totals for current month
    const thisMonthTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() + 1 === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const income = thisMonthTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = thisMonthTransactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total balance
    const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    return {
      totalBalance,
      thisMonth: {
        income,
        expenses
      },
      recentTransactions: mockTransactions.slice(0, 5)
    };
  },

  // Transactions
  async fetchTransactions(params = {}) {
    await delay(300);
    
    let filtered = [...mockTransactions];
    
    if (params.category) {
      filtered = filtered.filter(t => t.category === params.category);
    }
    
    if (params.type) {
      filtered = filtered.filter(t => t.type === params.type);
    }
    
    if (params.limit) {
      filtered = filtered.slice(0, parseInt(params.limit));
    }
    
    return filtered;
  },

  async createTransaction(data) {
    await delay(400);
    
    const newTransaction = {
      id: mockTransactions.length + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    
    mockTransactions.unshift(newTransaction);
    return newTransaction;
  },

  async updateTransaction(id, data) {
    await delay(300);
    
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    mockTransactions[index] = { ...mockTransactions[index], ...data };
    return mockTransactions[index];
  },

  async deleteTransaction(id) {
    await delay(300);
    
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    mockTransactions.splice(index, 1);
    return { success: true };
  },

  // Accounts
  async fetchAccounts() {
    await delay(200);
    return mockAccounts;
  },

  async updateAccount(id, data) {
    await delay(300);
    
    const index = mockAccounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');
    
    mockAccounts[index] = { ...mockAccounts[index], ...data };
    return mockAccounts[index];
  },

  // Fiscal
  async fetchFiscal(month, year) {
    await delay(400);
    
    const currentMonth = month || getCurrentMonth();
    const currentYear = year || getCurrentYear();
    
    // Calculate fiscal data for the specified month/year
    const monthTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() + 1 === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    const income = monthTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const deductible = monthTransactions
      .filter(t => t.type === 'gasto' && t.is_deductible)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const utilidad = income - deductible;
    const isr = utilidad * 0.20; // 20% simplified rate
    const iva = (income * 0.16) - (deductible * 0.16);
    
    return {
      month: currentMonth,
      year: currentYear,
      income,
      deductible,
      utilidad,
      isr,
      iva,
      dueDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-17`,
      status: 'pending'
    };
  },

  // Invoices
  async fetchInvoices(params = {}) {
    await delay(300);
    
    let filtered = [...mockInvoices];
    
    if (params.type) {
      // Filter by emitter/receiver based on type
      if (params.type === 'emitido') {
        filtered = filtered.filter(i => i.rfc_emisor === 'REGM000905T24');
      } else if (params.type === 'recibido') {
        filtered = filtered.filter(i => i.rfc_receptor === 'REGM000905T24');
      }
    }
    
    return filtered;
  },

  async createInvoice(data) {
    await delay(400);
    
    const newInvoice = {
      id: mockInvoices.length + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    
    mockInvoices.unshift(newInvoice);
    return newInvoice;
  },

  // File upload
  async uploadFile(file) {
    await delay(800);
    
    // Simulate file upload
    const fileName = `upload_${Date.now()}_${file.name}`;
    const url = `/uploads/${fileName}`;
    
    return { url };
  }
};

export default mockAPI;
