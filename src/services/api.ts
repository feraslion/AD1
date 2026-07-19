import { Product, Category, Customer, Unit, StoreSettings, Invoice } from '../common/types';

// Helper to get authorization headers
const getHeaders = (headers: Record<string, string> = {}) => {
  const activeUser = localStorage.getItem('erp_active_user');
  const result: Record<string, string> = { 
    'Content-Type': 'application/json',
    ...headers 
  };
  if (activeUser) {
    try {
      const u = JSON.parse(activeUser);
      if (u && u.code) {
        result['Authorization'] = `Bearer ${u.code}`;
      }
    } catch (e) {
      console.error('Error parsing user for auth header:', e);
    }
  }
  return result;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'حدث خطأ في الاتصال بالخادم');
  }
  const json = await res.json();
  // Standardize unpacking
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data;
  }
  return json;
};

export const ProductService = {
  getProducts: (params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<Product[]> => {
    let url = '/api/products';
    if (params) {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.category) q.append('category', params.category);
      if (params.search) q.append('search', params.search);
      url += `?${q.toString()}`;
    }
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },
  
  createProduct: (p: Product): Promise<Product> => 
    fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(p),
    }).then(handleResponse),
  
  deleteProduct: (id: string): Promise<void> => 
    fetch(`/api/products/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export const CustomerService = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string }): Promise<Customer[]> => {
    let url = '/api/customers';
    if (params) {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.search) q.append('search', params.search);
      url += `?${q.toString()}`;
    }
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },
  
  createCustomer: (c: Customer): Promise<Customer> => 
    fetch('/api/customers', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(c),
    }).then(handleResponse),
  
  deleteCustomer: (id: string): Promise<void> => 
    fetch(`/api/customers/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export const SupplierService = {
  getSuppliers: (): Promise<any[]> => 
    fetch('/api/suppliers', { headers: getHeaders() }).then(handleResponse),
  
  createSupplier: (s: any): Promise<any> => 
    fetch('/api/suppliers', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(s),
    }).then(handleResponse),

  deleteSupplier: (id: string): Promise<void> => 
    fetch(`/api/suppliers/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export const InvoiceService = {
  getInvoices: (params?: { page?: number; limit?: number; customerId?: string; status?: string; date?: string }): Promise<Invoice[]> => {
    let url = '/api/invoices';
    if (params) {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.customerId) q.append('customerId', params.customerId);
      if (params.status) q.append('status', params.status);
      if (params.date) q.append('date', params.date);
      url += `?${q.toString()}`;
    }
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },
  
  createInvoice: (invoiceData: any): Promise<Invoice> => 
    fetch('/api/invoices', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(invoiceData),
    }).then(handleResponse),
};

export const SettingsService = {
  getSettings: (): Promise<StoreSettings> => 
    fetch('/api/settings', { headers: getHeaders() }).then(handleResponse),
  
  updateSettings: (s: StoreSettings): Promise<StoreSettings> => 
    fetch('/api/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(s),
    }).then(handleResponse),
};

export const CategoryService = {
  getCategories: (): Promise<Category[]> => 
    fetch('/api/categories', { headers: getHeaders() }).then(handleResponse),
  
  createCategory: (c: Category): Promise<Category> => 
    fetch('/api/categories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(c),
    }).then(handleResponse),
  
  deleteCategory: (id: string): Promise<void> => 
    fetch(`/api/categories/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export const UnitService = {
  getUnits: (): Promise<Unit[]> => 
    fetch('/api/units', { headers: getHeaders() }).then(handleResponse),
  
  createUnit: (u: Unit): Promise<Unit> => 
    fetch('/api/units', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(u),
    }).then(handleResponse),
  
  deleteUnit: (id: string): Promise<void> => 
    fetch(`/api/units/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

export const PurchaseService = {
  createPurchase: (purchaseData: any): Promise<any> => 
    fetch('/api/purchases', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(purchaseData)
    }).then(handleResponse)
};

export const PaymentService = {
  payCustomer: (data: any): Promise<any> => 
    fetch('/api/payments/customer', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  paySupplier: (data: any): Promise<any> => 
    fetch('/api/payments/supplier', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse)
};

export const AccountingService = {
  getAccounts: (): Promise<any[]> => 
    fetch('/api/accounting/accounts', { headers: getHeaders() }).then(handleResponse),

  createAccount: (accountData: any): Promise<any> => 
    fetch('/api/accounting/accounts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(accountData),
    }).then(handleResponse),

  deleteAccount: (id: string): Promise<void> => 
    fetch(`/api/accounting/accounts/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  getLedger: (accountId: string): Promise<any> => 
    fetch(`/api/accounting/ledger?accountId=${accountId}`, { headers: getHeaders() }).then(handleResponse),

  getJournalEntries: (params?: { page?: number; limit?: number; search?: string; date?: string }): Promise<any[]> => {
    let url = '/api/accounting/journal-entries';
    if (params) {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.search) q.append('search', params.search);
      if (params.date) q.append('date', params.date);
      url += `?${q.toString()}`;
    }
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },

  createJournalEntry: (entryData: any): Promise<any> => 
    fetch('/api/accounting/journal-entries', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(entryData),
    }).then(handleResponse),
};

export const UserService = {
  getUsers: (params?: { page?: number; limit?: number; role?: string }): Promise<any[]> => {
    let url = '/api/users';
    if (params) {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());
      if (params.role) q.append('role', params.role);
      url += `?${q.toString()}`;
    }
    return fetch(url, { headers: getHeaders() }).then(handleResponse);
  },

  createUser: (userData: any): Promise<any> => 
    fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    }).then(handleResponse),

  deleteUser: (id: string): Promise<void> => 
    fetch(`/api/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse)
};

export const CashboxService = {
  getCashboxes: (): Promise<any[]> => 
    fetch('/api/cashboxes', { headers: getHeaders() }).then(handleResponse),

  createCashbox: (boxData: any): Promise<any> => 
    fetch('/api/cashboxes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(boxData)
    }).then(handleResponse),

  openCashbox: (id: string, startBalance: number): Promise<any> => 
    fetch('/api/cashboxes/open', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, startBalance })
    }).then(handleResponse),

  closeCashbox: (id: string, endBalance: number): Promise<any> => 
    fetch('/api/cashboxes/close', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, endBalance })
    }).then(handleResponse)
};
