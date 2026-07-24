export interface ProductBarcode {
  id: string;
  productId: string;
  barcode: string;
  type?: 'main' | 'box' | 'alternative';
  label?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  purchasePrice: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface ProductHistoryEntry {
  id: string;
  date: string;
  type: 'sale' | 'purchase' | 'transfer' | 'adjustment' | 'initial' | 'return';
  typeLabel: string;
  reference: string;
  quantityIn: number;
  quantityOut: number;
  balanceAfter: number;
  unitPrice: number;
  warehouseName?: string;
  notes?: string;
  user?: string;
}

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
  isTaxInclusive?: boolean;
  minSellingPrice?: number;
  image?: string;
  description?: string;
  sku?: string;
  currency?: string;
  barcodes?: ProductBarcode[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
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
  balance: number; // Positive = customer owes us
  email?: string;
  creditLimit?: number;
  taxNumber?: string;
  crNumber?: string;
  address?: string;
  type?: 'retail' | 'wholesale' | 'company' | 'vip';
  status?: 'active' | 'inactive' | 'blocked';
  notes?: string;
  openingBalance?: number;
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerPayment {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'check' | 'card';
  date: string;
  reference?: string;
  notes?: string;
  invoiceId?: string;
  createdAt?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  type: 'opening_balance' | 'sales_invoice' | 'return_invoice' | 'receipt_payment';
  typeLabel?: string;
  reference: string;
  invoiceNumber?: string;
  description?: string;
  debit: number;   // مدين (يزيد مديونية العميل)
  credit: number;  // دائن (يقلل مديونية العميل)
  runningBalance: number;
  notes?: string;
}

export interface DebtAgingItem {
  customerId: string;
  customerName: string;
  phone: string;
  creditLimit: number;
  totalBalance: number;
  current0To30: number;
  days31To60: number;
  days61To90: number;
  daysOver90: number;
  status: 'safe' | 'warning' | 'exceeded';
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

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId?: string;
  customerName?: string;
  date: string;
  validUntil?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'sent' | 'accepted' | 'converted' | 'rejected';
  notes?: string;
  items: {
    id?: string;
    productId?: string;
    productName: string;
    price: number;
    quantity: number;
    discount?: number;
    taxAmount?: number;
    total: number;
  }[];
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId?: string;
  customerId?: string;
  customerName?: string;
  date: string;
  deliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'confirmed' | 'fulfilled' | 'converted' | 'cancelled';
  notes?: string;
  items: {
    id?: string;
    productId?: string;
    productName: string;
    price: number;
    quantity: number;
    discount?: number;
    taxAmount?: number;
    total: number;
  }[];
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
