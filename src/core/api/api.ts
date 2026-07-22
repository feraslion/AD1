import { Product, Category, Customer, Unit, StoreSettings, Invoice } from '../../types';
import { apiClient } from './client';

export const ProductService = {
  getProducts: (params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<Product[]> => 
    apiClient.get<Product[]>('/api/products', params),
  
  createProduct: (p: Product): Promise<Product> => 
    apiClient.post<Product>('/api/products', p),
  
  deleteProduct: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/products/${id}`),
};

export const CustomerService = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string }): Promise<Customer[]> => 
    apiClient.get<Customer[]>('/api/customers', params),
  
  createCustomer: (c: Customer): Promise<Customer> => 
    apiClient.post<Customer>('/api/customers', c),
  
  deleteCustomer: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/customers/${id}`),
};

export const SupplierService = {
  getSuppliers: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/suppliers'),
  
  createSupplier: (s: any): Promise<any> => 
    apiClient.post<any>('/api/suppliers', s),

  deleteSupplier: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/suppliers/${id}`),

  getSupplierLedger: (id: string): Promise<any> =>
    apiClient.get<any>(`/api/suppliers/${id}/ledger`),
};

export const InvoiceService = {
  getInvoices: (params?: { page?: number; limit?: number; customerId?: string; status?: string; date?: string }): Promise<Invoice[]> => 
    apiClient.get<Invoice[]>('/api/invoices', params),
  
  createInvoice: (invoiceData: any): Promise<Invoice> => 
    apiClient.post<Invoice>('/api/invoices', invoiceData),

  returnInvoice: (id: string): Promise<any> =>
    apiClient.post<any>(`/api/invoices/${id}/return`, {}),
};

export const SettingsService = {
  getSettings: (): Promise<StoreSettings> => 
    apiClient.get<StoreSettings>('/api/settings'),
  
  updateSettings: (s: StoreSettings): Promise<StoreSettings> => 
    apiClient.post<StoreSettings>('/api/settings', s),
};

export const CategoryService = {
  getCategories: (): Promise<Category[]> => 
    apiClient.get<Category[]>('/api/categories'),
  
  createCategory: (c: Category): Promise<Category> => 
    apiClient.post<Category>('/api/categories', c),
  
  deleteCategory: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/categories/${id}`),
};

export const UnitService = {
  getUnits: (): Promise<Unit[]> => 
    apiClient.get<Unit[]>('/api/units'),
  
  createUnit: (u: Unit): Promise<Unit> => 
    apiClient.post<Unit>('/api/units', u),
  
  deleteUnit: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/units/${id}`),
};

export const PurchaseService = {
  getPurchases: (): Promise<any[]> =>
    apiClient.get<any[]>('/api/purchases'),

  createPurchase: (purchaseData: any): Promise<any> => 
    apiClient.post<any>('/api/purchases', purchaseData),

  receiveGoods: (id: string, data: any): Promise<any> =>
    apiClient.post<any>(`/api/purchases/${id}/receive`, data),

  issueSupplierInvoice: (id: string, data: any): Promise<any> =>
    apiClient.post<any>(`/api/purchases/${id}/invoice`, data)
};

export const PaymentService = {
  payCustomer: (data: any): Promise<any> => 
    apiClient.post<any>('/api/payments/customer', data),

  paySupplier: (data: any): Promise<any> => 
    apiClient.post<any>('/api/payments/supplier', data)
};

export const AccountingService = {
  getAccounts: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/accounting/accounts'),

  createAccount: (accountData: any): Promise<any> => 
    apiClient.post<any>('/api/accounting/accounts', accountData),

  deleteAccount: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/accounting/accounts/${id}`),

  getLedger: (accountId: string): Promise<any> => 
    apiClient.get<any>(`/api/accounting/ledger`, { accountId }),

  getJournalEntries: (params?: { page?: number; limit?: number; search?: string; date?: string }): Promise<any[]> => 
    apiClient.get<any[]>('/api/accounting/journal-entries', params),

  createJournalEntry: (entryData: any): Promise<any> => 
    apiClient.post<any>('/api/accounting/journal-entries', entryData),

  getTrialBalance: (): Promise<any> =>
    apiClient.get<any>('/api/accounting/trial-balance'),

  getPostingRules: (): Promise<any[]> =>
    apiClient.get<any[]>('/api/accounting/posting-rules'),

  updatePostingRule: (ruleCode: string, accountId: string): Promise<any> =>
    apiClient.post<any>('/api/accounting/posting-rules', { ruleCode, accountId }),
};

export const UserService = {
  getUsers: (params?: { page?: number; limit?: number; role?: string }): Promise<any[]> => 
    apiClient.get<any[]>('/api/users', params),

  createUser: (userData: any): Promise<any> => 
    apiClient.post<any>('/api/users', userData),

  deleteUser: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/users/${id}`),

  getRoles: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/roles'),

  createRole: (roleData: any): Promise<any> => 
    apiClient.post<any>('/api/roles', roleData),

  deleteRole: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/roles/${id}`),

  getPermissions: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/permissions')
};

export const CashboxService = {
  getCashboxes: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/cashboxes'),

  createCashbox: (boxData: any): Promise<any> => 
    apiClient.post<any>('/api/cashboxes', boxData),

  openCashbox: (id: string, startBalance: number): Promise<any> => 
    apiClient.post<any>('/api/cashboxes/open', { id, startBalance }),

  closeCashbox: (id: string, endBalance: number): Promise<any> => 
    apiClient.post<any>('/api/cashboxes/close', { id, endBalance })
};

export const WarehouseService = {
  getWarehouses: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/warehouses'),

  createWarehouse: (data: any): Promise<any> => 
    apiClient.post<any>('/api/warehouses', data),

  deleteWarehouse: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/warehouses/${id}`),

  getStockMoves: (params?: { productId?: string; warehouseId?: string; type?: string }): Promise<any[]> =>
    apiClient.get<any[]>('/api/stock-moves', params),

  transferStock: (data: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; notes?: string }): Promise<any> =>
    apiClient.post<any>('/api/stock-moves/transfer', data),

  adjustPhysicalStock: (data: { productId: string; warehouseId: string; actualQuantity: number; notes?: string }): Promise<any> =>
    apiClient.post<any>('/api/stock-moves/adjustment', data),

  getProductStockLedger: (productId: string): Promise<any> =>
    apiClient.get<any>(`/api/inventory/ledger/${productId}`),

  getInventoryValuation: (): Promise<any> =>
    apiClient.get<any>('/api/inventory/valuation'),

  getLowStockAlerts: (): Promise<any[]> =>
    apiClient.get<any[]>('/api/inventory/low-stock'),
};

export const CurrencyService = {
  getCurrencies: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/currencies'),

  createCurrency: (data: any): Promise<any> => 
    apiClient.post<any>('/api/currencies', data),

  deleteCurrency: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/currencies/${id}`),
};

export const TaxService = {
  getTaxes: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/taxes'),

  createTax: (data: any): Promise<any> => 
    apiClient.post<any>('/api/taxes', data),

  deleteTax: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/taxes/${id}`),
};

export const PaymentMethodService = {
  getPaymentMethods: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/payment-methods'),

  createPaymentMethod: (data: any): Promise<any> => 
    apiClient.post<any>('/api/payment-methods', data),

  deletePaymentMethod: (id: string): Promise<void> => 
    apiClient.delete<void>(`/api/payment-methods/${id}`),
};
