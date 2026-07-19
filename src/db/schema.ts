import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('cashier'), // manager, accountant, cashier, inventory
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
});

// 3. Units Table
export const units = pgTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

// 4. Customers Table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  balance: numeric('balance').default('0'), // Positive means the customer owes us (credit sales)
  creditLimit: numeric('credit_limit').default('5000'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Suppliers Table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  balance: numeric('balance').default('0'), // Positive means we owe the supplier (credit purchases)
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Products Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  barcode: text('barcode').notNull().unique(),
  price: numeric('price').default('0'),
  purchasePrice: numeric('purchase_price').default('0'),
  stock: numeric('stock').default('0'),
  minStock: numeric('min_stock').default('0'),
  category: text('category').notNull(),
  unit: text('unit').notNull(),
  taxRate: numeric('tax_rate').default('15'),
  image: text('image'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Invoices Table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  totalWithoutTax: numeric('total_without_tax').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  paymentMethod: text('payment_method').default('cash'), // cash, card, credit, split
  cashAmount: numeric('cash_amount').default('0'),
  cardAmount: numeric('card_amount').default('0'),
  status: text('status').default('paid'), // paid, unpaid, partially_paid
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  taxNumber: text('tax_number'),
  cashierName: text('cashier_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Invoice Items Table
export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').notNull(),
  discount: numeric('discount').default('0'),
  discountType: text('discount_type').default('percentage'), // fixed, percentage
  total: numeric('total').notNull(),
  taxAmount: numeric('tax_amount').notNull(),
});

// 9. Accounts Table (Chart of Accounts)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "1101", "1201"
  name: text('name').notNull(),
  type: text('type').notNull(), // asset, liability, equity, revenue, expense
  balance: numeric('balance').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Journal Entries Table
export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  entryNumber: text('entry_number').notNull().unique(),
  description: text('description'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Journal Details Table (Debit and Credit Items)
export const journalDetails = pgTable('journal_details', {
  id: text('id').primaryKey(),
  journalEntryId: text('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id),
  debit: numeric('debit').default('0'),
  credit: numeric('credit').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Expenses Table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  accountId: text('account_id').references(() => accounts.id),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Cashboxes Table
export const cashboxes = pgTable('cashboxes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').default('closed'), // open, closed
  currentBalance: numeric('current_balance').default('0'),
  lastOpenedAt: text('last_opened_at'),
  lastClosedAt: text('last_closed_at'),
});

// 14. Store Settings Table
export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo'),
  address: text('address'),
  phone: text('phone'),
  taxNumber: text('tax_number'),
  taxRate: numeric('tax_rate').default('15'),
  currency: text('currency').default('ر.س'),
  thermalPrinterWidth: text('thermal_printer_width').default('80mm'),
});

// Relationships
export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  details: many(journalDetails),
}));

export const journalDetailsRelations = relations(journalDetails, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [journalDetails.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalDetails.accountId],
    references: [accounts.id],
  }),
}));
