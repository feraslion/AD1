// Core ERP Domain Models
export interface CustomerModel {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  creditLimit?: number;
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierModel {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductModel {
  id: string;
  name: string;
  barcode: string;
  price: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  taxRate: number;
  image?: string;
  description?: string;
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryModel {
  id: string;
  name: string;
  icon?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitModel {
  id: string;
  name: string;
}

export interface WarehouseModel {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  code: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyModel {
  id: string;
  code: string; // e.g. 'SAR', 'USD'
  name: string; // e.g. 'ريال سعودي'
  symbol: string; // e.g. 'ر.س'
  exchangeRate: number;
  isDefault: boolean;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxModel {
  id: string;
  name: string; // e.g. 'ضريبة القيمة المضافة 15%'
  code: string; // e.g. 'VAT_15'
  rate: number; // e.g. 15
  isInclusive: boolean;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentMethodModel {
  id: string;
  code: string; // e.g. 'cash', 'card', 'bank_transfer'
  name: string; // e.g. 'نقداً', 'بطاقة ائتمان'
  accountId?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}
