export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  taxRate: number; // e.g., 15 for 15% VAT
  image?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Outstandings for Credit (الآجل)
  email?: string;
  creditLimit?: number;
  companyId?: string;
  branchId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
  companyId?: string;
  branchId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  companyId?: string;
  branchId?: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault?: boolean;
}

export interface Tax {
  id: string;
  name: string;
  code: string;
  rate: number;
  isInclusive?: boolean;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  accountId?: string;
}

export interface CartItem {
  id: string; // matches product id
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    discount: number;
    discountType: 'fixed' | 'percentage';
    total: number;
    taxAmount: number;
  }[];
  totalWithoutTax: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'split';
  paymentDetails: {
    cashAmount: number;
    cardAmount: number;
    creditAmount?: number;
  };
  status: 'paid' | 'unpaid' | 'partially_paid' | 'returned';
  customerId?: string;
  customerName?: string;
  taxNumber?: string;
  cashierName: string;
}

export interface StoreSettings {
  name: string;
  logo: string;
  address: string;
  phone: string;
  taxNumber: string;
  taxRate: number; // Default VAT e.g. 15
  currency: string; // e.g. "ر.س"
  thermalPrinterWidth: '80mm' | '58mm';
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalProfit: number;
  totalTax: number;
  invoiceCount: number;
}
