import { pgTable, text, numeric, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('cashier'), // manager, accountant, cashier, inventory
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    usersEmailIdx: index('users_email_idx').on(table.email),
    roleCheck: check('users_role_check', sql`${table.role} in ('manager', 'accountant', 'cashier', 'inventory')`),
  };
});

// 2. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
}, (table) => {
  return {
    categoriesNameIdx: index('categories_name_idx').on(table.name),
  };
});

// 3. Units Table
export const units = pgTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
}, (table) => {
  return {
    unitsNameIdx: index('units_name_idx').on(table.name),
  };
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
}, (table) => {
  return {
    customersNameIdx: index('customers_name_idx').on(table.name),
    customersPhoneIdx: index('customers_phone_idx').on(table.phone),
  };
});

// 5. Suppliers Table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  balance: numeric('balance').default('0'), // Positive means we owe the supplier (credit purchases)
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    suppliersNameIdx: index('suppliers_name_idx').on(table.name),
  };
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
  category: text('category').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  unit: text('unit').notNull().references(() => units.name, { onDelete: 'restrict' }),
  taxRate: numeric('tax_rate').default('15'),
  image: text('image'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    productsNameIdx: index('products_name_idx').on(table.name),
    productsCategoryIdx: index('products_category_idx').on(table.category),
    productsUnitIdx: index('products_unit_idx').on(table.unit),
    priceCheck: check('products_price_check', sql`${table.price} >= 0`),
    purchasePriceCheck: check('products_purchase_price_check', sql`${table.purchasePrice} >= 0`),
  };
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
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name'),
  taxNumber: text('tax_number'),
  cashierName: text('cashier_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    invoicesDateIdx: index('invoices_date_idx').on(table.date),
    invoicesCustomerIdIdx: index('invoices_customer_id_idx').on(table.customerId),
    paymentMethodCheck: check('invoices_payment_method_check', sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`),
    statusCheck: check('invoices_status_check', sql`${table.status} in ('paid', 'unpaid', 'partially_paid')`),
  };
});

// 8. Invoice Items Table
export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  productName: text('product_name').notNull(),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').notNull(),
  discount: numeric('discount').default('0'),
  discountType: text('discount_type').default('percentage'), // fixed, percentage
  total: numeric('total').notNull(),
  taxAmount: numeric('tax_amount').notNull(),
}, (table) => {
  return {
    invoiceItemsInvoiceIdIdx: index('invoice_items_invoice_id_idx').on(table.invoiceId),
    invoiceItemsProductIdIdx: index('invoice_items_product_id_idx').on(table.productId),
    discountTypeCheck: check('invoice_items_discount_type_check', sql`${table.discountType} in ('fixed', 'percentage')`),
  };
});

// 9. Accounts Table (Chart of Accounts)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "1101", "1201"
  name: text('name').notNull(),
  type: text('type').notNull(), // asset, liability, equity, revenue, expense
  balance: numeric('balance').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    accountsTypeCheck: check('accounts_type_check', sql`${table.type} in ('asset', 'liability', 'equity', 'revenue', 'expense')`),
  };
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
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  debit: numeric('debit').default('0'),
  credit: numeric('credit').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    journalDetailsEntryIdIdx: index('journal_details_entry_id_idx').on(table.journalEntryId),
    journalDetailsAccountIdIdx: index('journal_details_account_id_idx').on(table.accountId),
    debitCheck: check('journal_details_debit_check', sql`${table.debit} >= 0`),
    creditCheck: check('journal_details_credit_check', sql`${table.credit} >= 0`),
  };
});

// 12. Expenses Table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'restrict' }),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    expensesAccountIdIdx: index('expenses_account_id_idx').on(table.accountId),
    expensesDateIdx: index('expenses_date_idx').on(table.date),
    amountCheck: check('expenses_amount_check', sql`${table.amount} >= 0`),
  };
});

// 13. Cashboxes Table
export const cashboxes = pgTable('cashboxes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').default('closed'), // open, closed
  currentBalance: numeric('current_balance').default('0'),
  lastOpenedAt: text('last_opened_at'),
  lastClosedAt: text('last_closed_at'),
}, (table) => {
  return {
    cashboxStatusCheck: check('cashboxes_status_check', sql`${table.status} in ('open', 'closed')`),
  };
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
