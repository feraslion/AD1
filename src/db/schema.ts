import { pgTable, text, numeric, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// 1. Companies Table
export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  taxNumber: text('tax_number'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  logo: text('logo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    companiesNameIdx: index('companies_name_idx').on(table.name),
  };
});

// 2. Branches Table
export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  address: text('address'),
  phone: text('phone'),
  taxNumber: text('tax_number'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    branchesCompanyIdx: index('branches_company_idx').on(table.companyId),
    branchesCodeIdx: index('branches_code_idx').on(table.code),
  };
});

// 3. Roles Table
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    rolesCodeIdx: index('roles_code_idx').on(table.code),
  };
});

// 4. Permissions Table
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  module: text('module').notNull(), // e.g. 'sales', 'inventory', 'accounting'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    permissionsCodeIdx: index('permissions_code_idx').on(table.code),
    permissionsModuleIdx: index('permissions_module_idx').on(table.module),
  };
});

// 5. Role Permissions Table
export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    rolePermissionsRoleIdx: index('role_permissions_role_idx').on(table.roleId),
    rolePermissionsPermissionIdx: index('role_permissions_permission_idx').on(table.permissionId),
  };
});

// 6. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('cashier'), // manager, accountant, cashier, inventory (backward compatible)
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  roleId: text('role_id').references(() => roles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    usersEmailIdx: index('users_email_idx').on(table.email),
    usersCompanyIdx: index('users_company_idx').on(table.companyId),
    usersBranchIdx: index('users_branch_idx').on(table.branchId),
    usersRoleIdIdx: index('users_role_id_idx').on(table.roleId),
    roleCheck: check('users_role_check', sql`${table.role} in ('manager', 'accountant', 'cashier', 'inventory')`),
  };
});

// 7. Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    categoriesNameIdx: index('categories_name_idx').on(table.name),
    categoriesCompanyIdx: index('categories_company_idx').on(table.companyId),
  };
});

// 8. Units Table
export const units = pgTable('units', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
}, (table) => {
  return {
    unitsNameIdx: index('units_name_idx').on(table.name),
  };
});

// 9. Customers Table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  balance: numeric('balance').default('0'), // Positive means customer owes us
  creditLimit: numeric('credit_limit').default('5000'),
  taxNumber: text('tax_number'),
  crNumber: text('cr_number'),
  address: text('address'),
  type: text('type').default('retail'), // 'retail', 'wholesale', 'company', 'vip'
  status: text('status').default('active'), // 'active', 'inactive', 'blocked'
  notes: text('notes'),
  openingBalance: numeric('opening_balance').default('0'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    customersNameIdx: index('customers_name_idx').on(table.name),
    customersPhoneIdx: index('customers_phone_idx').on(table.phone),
    customersCompanyIdx: index('customers_company_idx').on(table.companyId),
    customersBranchIdx: index('customers_branch_idx').on(table.branchId),
  };
});

// 10. Suppliers Table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  balance: numeric('balance').default('0'), // Positive means we owe the supplier
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    suppliersNameIdx: index('suppliers_name_idx').on(table.name),
    suppliersCompanyIdx: index('suppliers_company_idx').on(table.companyId),
    suppliersBranchIdx: index('suppliers_branch_idx').on(table.branchId),
  };
});

// 11. Products Table
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
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    productsNameIdx: index('products_name_idx').on(table.name),
    productsCategoryIdx: index('products_category_idx').on(table.category),
    productsUnitIdx: index('products_unit_idx').on(table.unit),
    productsCompanyIdx: index('products_company_idx').on(table.companyId),
    productsBranchIdx: index('products_branch_idx').on(table.branchId),
    priceCheck: check('products_price_check', sql`${table.price} >= 0`),
    purchasePriceCheck: check('products_purchase_price_check', sql`${table.purchasePrice} >= 0`),
  };
});

// 12. Warehouses Table
export const warehouses = pgTable('warehouses', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    warehousesCompanyIdx: index('warehouses_company_idx').on(table.companyId),
    warehousesBranchIdx: index('warehouses_branch_idx').on(table.branchId),
    warehousesCodeIdx: index('warehouses_code_idx').on(table.code),
  };
});

// 13. Stock Moves Table
export const stockMoves = pgTable('stock_moves', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  fromWarehouseId: text('from_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  toWarehouseId: text('to_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  quantity: numeric('quantity').notNull(),
  unitCost: numeric('unit_cost').default('0'),
  type: text('type').notNull(), // 'purchase', 'sale', 'transfer', 'adjustment', 'initial'
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    stockMovesCompanyIdx: index('stock_moves_company_idx').on(table.companyId),
    stockMovesProductIdx: index('stock_moves_product_idx').on(table.productId),
    stockMovesTypeCheck: check('stock_moves_type_check', sql`${table.type} in ('purchase', 'sale', 'transfer', 'adjustment', 'initial')`),
  };
});

// 14. Invoices Table (Backward compatibility for retail)
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

// 15. Invoice Items Table (Backward compatibility for retail)
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

// 16. Sales Table (ERP Sales Module)
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  paymentMethod: text('payment_method').default('cash'), // cash, card, credit, split
  status: text('status').default('paid'), // paid, unpaid, partially_paid
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  cashierId: text('cashier_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    salesCompanyIdx: index('sales_company_idx').on(table.companyId),
    salesDateIdx: index('sales_date_idx').on(table.date),
    salesCustomerIdx: index('sales_customer_idx').on(table.customerId),
    salesPaymentMethodCheck: check('sales_payment_method_check', sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`),
    salesStatusCheck: check('sales_status_check', sql`${table.status} in ('paid', 'unpaid', 'partially_paid')`),
  };
});

// 17. Sales Items Table (ERP Sales Module)
export const salesItems = pgTable('sales_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').notNull(),
  discount: numeric('discount').default('0'),
  total: numeric('total').notNull(),
  taxAmount: numeric('tax_amount').notNull(),
}, (table) => {
  return {
    salesItemsSaleIdx: index('sales_items_sale_idx').on(table.saleId),
    salesItemsProductIdx: index('sales_items_product_idx').on(table.productId),
  };
});

// 18. Purchases Table (ERP Procurement)
export const purchases = pgTable('purchases', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  purchaseNumber: text('purchase_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  status: text('status').default('ordered'), // draft, ordered, received, completed, cancelled
  paymentMethod: text('payment_method').default('cash'), // cash, card, credit
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  supplierInvoiceNumber: text('supplier_invoice_number'),
  warehouseId: text('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    purchasesCompanyIdx: index('purchases_company_idx').on(table.companyId),
    purchasesSupplierIdx: index('purchases_supplier_idx').on(table.supplierId),
    purchasesStatusCheck: check('purchases_status_check', sql`${table.status} in ('draft', 'ordered', 'received', 'completed', 'cancelled')`),
  };
});

// 19. Purchase Items Table (ERP Procurement)
export const purchaseItems = pgTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  purchasePrice: numeric('purchase_price').notNull(),
  quantity: numeric('quantity').notNull(),
  total: numeric('total').notNull(),
  taxAmount: numeric('tax_amount').notNull(),
}, (table) => {
  return {
    purchaseItemsPurchaseIdx: index('purchase_items_purchase_idx').on(table.purchaseId),
    purchaseItemsProductIdx: index('purchase_items_product_idx').on(table.productId),
  };
});

// 20. Accounts Table (Chart of Accounts)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. "1101", "1201"
  name: text('name').notNull(),
  type: text('type').notNull(), // asset, liability, equity, revenue, expense
  balance: numeric('balance').default('0'),
  currency: text('currency').default('SAR'), // account default currency
  foreignBalance: numeric('foreign_balance').default('0'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'), // hierarchical structure
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    accountsCompanyIdx: index('accounts_company_idx').on(table.companyId),
    accountsTypeCheck: check('accounts_type_check', sql`${table.type} in ('asset', 'liability', 'equity', 'revenue', 'expense')`),
  };
});

// 21. Journal Entries Table
export const journalEntries = pgTable('journal_entries', {
  id: text('id').primaryKey(),
  entryNumber: text('entry_number').notNull().unique(),
  description: text('description'),
  date: text('date').notNull(),
  status: text('status').default('posted'), // draft, posted
  currency: text('currency').default('SAR'), // Transaction currency (USD, SYP, TRY, SAR)
  baseCurrency: text('base_currency').default('SAR'), // System base currency (SAR)
  exchangeRate: numeric('exchange_rate').default('1.0'), // Rate to convert to base currency
  foreignAmount: numeric('foreign_amount').default('0'), // Total amount in transaction currency
  baseAmount: numeric('base_amount').default('0'), // Total amount in base currency
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    journalEntriesCompanyIdx: index('journal_entries_company_idx').on(table.companyId),
    journalEntriesStatusCheck: check('journal_entries_status_check', sql`${table.status} in ('draft', 'posted')`),
  };
});

// 22. Journal Details Table (Debit and Credit Items - backward compatibility)
export const journalDetails = pgTable('journal_details', {
  id: text('id').primaryKey(),
  journalEntryId: text('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  foreignDebit: numeric('foreign_debit').default('0'),
  foreignCredit: numeric('foreign_credit').default('0'),
  debit: numeric('debit').default('0'), // Base currency debit
  credit: numeric('credit').default('0'), // Base currency credit
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    journalDetailsEntryIdIdx: index('journal_details_entry_id_idx').on(table.journalEntryId),
    journalDetailsAccountIdIdx: index('journal_details_account_id_idx').on(table.accountId),
    debitCheck: check('journal_details_debit_check', sql`${table.debit} >= 0`),
    creditCheck: check('journal_details_credit_check', sql`${table.credit} >= 0`),
  };
});

// 23. Journal Lines Table (ERP GL Entries)
export const journalLines = pgTable('journal_lines', {
  id: text('id').primaryKey(),
  journalEntryId: text('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  foreignDebit: numeric('foreign_debit').default('0'),
  foreignCredit: numeric('foreign_credit').default('0'),
  debit: numeric('debit').default('0'), // Base currency debit
  credit: numeric('credit').default('0'), // Base currency credit
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    journalLinesEntryIdx: index('journal_lines_entry_idx').on(table.journalEntryId),
    journalLinesAccountIdx: index('journal_lines_account_idx').on(table.accountId),
    debitCheck: check('journal_lines_debit_check', sql`${table.debit} >= 0`),
    creditCheck: check('journal_lines_credit_check', sql`${table.credit} >= 0`),
  };
});

// 24. Payments Table
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  paymentNumber: text('payment_number').notNull().unique(),
  date: text('date').notNull(), // YYYY-MM-DD
  type: text('type').notNull(), // 'receipt' (incoming), 'payment' (outgoing)
  partyId: text('party_id'), // customerId or supplierId
  partyType: text('party_type'), // 'customer', 'supplier'
  amount: numeric('amount').notNull(),
  method: text('method').notNull(), // 'cash', 'bank', 'check'
  reference: text('reference'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    paymentsCompanyIdx: index('payments_company_idx').on(table.companyId),
    paymentsTypeCheck: check('payments_type_check', sql`${table.type} in ('receipt', 'payment')`),
    paymentsMethodCheck: check('payments_method_check', sql`${table.method} in ('cash', 'bank', 'check')`),
  };
});

// 25. Expenses Table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'restrict' }),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    expensesAccountIdIdx: index('expenses_account_id_idx').on(table.accountId),
    expensesDateIdx: index('expenses_date_idx').on(table.date),
    expensesCompanyIdx: index('expenses_company_idx').on(table.companyId),
    expensesBranchIdx: index('expenses_branch_idx').on(table.branchId),
    amountCheck: check('expenses_amount_check', sql`${table.amount} >= 0`),
  };
});

// 26. Store Settings Table
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

// 27. Cashboxes Table (Backward compatibility)
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


// 28. Posting Rules Table
export const postingRules = pgTable('posting_rules', {
  id: text('id').primaryKey(),
  ruleCode: text('rule_code').notNull().unique(), // e.g., 'sales_cash_debit', 'sales_bank_debit', etc.
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  description: text('description').notNull(),
});

// 29. Currencies Table
export const currencies = pgTable('currencies', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'SAR', 'USD', 'SYP', 'TRY'
  name: text('name').notNull(), // e.g. 'ريال سعودي', 'دولار أمريكي', 'ليرة سورية', 'ليرة تركية'
  symbol: text('symbol').notNull(), // e.g. 'ر.س', '$', 'ل.س', '₺'
  exchangeRate: numeric('exchange_rate').default('1.0'),
  isDefault: text('is_default').default('false'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    currenciesCodeIdx: index('currencies_code_idx').on(table.code),
    currenciesCompanyIdx: index('currencies_company_idx').on(table.companyId),
  };
});

// 29b. Exchange Rates History Table
export const exchangeRatesHistory = pgTable('exchange_rates_history', {
  id: text('id').primaryKey(),
  currencyId: text('currency_id').notNull().references(() => currencies.id, { onDelete: 'cascade' }),
  currencyCode: text('currency_code').notNull(),
  rate: numeric('rate').notNull(),
  effectiveDate: text('effective_date').notNull(),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    historyCurrencyIdx: index('exchange_rates_history_curr_idx').on(table.currencyId),
    historyDateIdx: index('exchange_rates_history_date_idx').on(table.effectiveDate),
  };
});

// 30. Taxes Table
export const taxes = pgTable('taxes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g. 'ضريبة القيمة المضافة 15%'
  code: text('code').notNull().unique(), // e.g. 'VAT_15'
  rate: numeric('rate').notNull().default('15'),
  isInclusive: text('is_inclusive').default('false'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    taxesCodeIdx: index('taxes_code_idx').on(table.code),
    taxesCompanyIdx: index('taxes_company_idx').on(table.companyId),
  };
});

// 31. Payment Methods Table
export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'cash', 'card', 'bank_transfer'
  name: text('name').notNull(), // e.g. 'نقداً', 'بطاقة ائتمان'
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    paymentMethodsCodeIdx: index('payment_methods_code_idx').on(table.code),
    paymentMethodsCompanyIdx: index('payment_methods_company_idx').on(table.companyId),
  };
});

// 32. Exchange Rates Table
export const exchangeRates = pgTable('exchange_rates', {
  id: text('id').primaryKey(),
  currencyId: text('currency_id').notNull().references(() => currencies.id, { onDelete: 'cascade' }),
  currencyCode: text('currency_code').notNull(),
  rate: numeric('rate').notNull(),
  effectiveDate: text('effective_date').notNull(),
  notes: text('notes'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    exchangeRatesCurrencyIdx: index('exchange_rates_currency_idx').on(table.currencyId),
    exchangeRatesCodeIdx: index('exchange_rates_code_idx').on(table.currencyCode),
    exchangeRatesDateIdx: index('exchange_rates_date_idx').on(table.effectiveDate),
    rateCheck: check('exchange_rates_rate_check', sql`${table.rate} > 0`),
  };
});

// 33. Sales Invoices Table
export const salesInvoices = pgTable('sales_invoices', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  paidAmount: numeric('paid_amount').default('0'),
  remainingAmount: numeric('remaining_amount').default('0'),
  paymentMethod: text('payment_method').default('cash'),
  status: text('status').default('paid'), // paid, unpaid, partially_paid, draft, cancelled
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  cashierId: text('cashier_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    salesInvoicesCompanyIdx: index('sales_invoices_company_idx').on(table.companyId),
    salesInvoicesBranchIdx: index('sales_invoices_branch_idx').on(table.branchId),
    salesInvoicesDateIdx: index('sales_invoices_date_idx').on(table.date),
    salesInvoicesCustomerIdx: index('sales_invoices_customer_idx').on(table.customerId),
    salesInvoicesStatusCheck: check('sales_invoices_status_check', sql`${table.status} in ('paid', 'unpaid', 'partially_paid', 'draft', 'cancelled')`),
    salesInvoicesPaymentMethodCheck: check('sales_invoices_payment_method_check', sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`),
  };
});

// 34. Purchase Invoices Table
export const purchaseInvoices = pgTable('purchase_invoices', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  supplierInvoiceNumber: text('supplier_invoice_number'),
  date: text('date').notNull(),
  dueDate: text('due_date'),
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  paidAmount: numeric('paid_amount').default('0'),
  remainingAmount: numeric('remaining_amount').default('0'),
  paymentMethod: text('payment_method').default('cash'),
  status: text('status').default('ordered'), // draft, ordered, received, completed, cancelled
  supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  warehouseId: text('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    purchaseInvoicesCompanyIdx: index('purchase_invoices_company_idx').on(table.companyId),
    purchaseInvoicesBranchIdx: index('purchase_invoices_branch_idx').on(table.branchId),
    purchaseInvoicesDateIdx: index('purchase_invoices_date_idx').on(table.date),
    purchaseInvoicesSupplierIdx: index('purchase_invoices_supplier_idx').on(table.supplierId),
    purchaseInvoicesStatusCheck: check('purchase_invoices_status_check', sql`${table.status} in ('draft', 'ordered', 'received', 'completed', 'cancelled')`),
  };
});

// 35. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: text('user_name'),
  userEmail: text('user_email'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, POST, APPROVE, CANCEL
  module: text('module').notNull(), // sales, purchases, inventory, accounting, users, settings
  recordId: text('record_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  branchId: text('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    auditLogsUserIdx: index('audit_logs_user_idx').on(table.userId),
    auditLogsModuleIdx: index('audit_logs_module_idx').on(table.module),
    auditLogsCompanyIdx: index('audit_logs_company_idx').on(table.companyId),
    auditLogsCreatedAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  };
});

// 36. Quotations Table
export const quotations = pgTable('quotations', {
  id: text('id').primaryKey(),
  quotationNumber: text('quotation_number').notNull().unique(),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name'),
  date: text('date').notNull(),
  validUntil: text('valid_until'),
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  status: text('status').default('draft'), // draft, sent, accepted, converted, rejected
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 37. Quotation Items Table
export const quotationItems = pgTable('quotation_items', {
  id: text('id').primaryKey(),
  quotationId: text('quotation_id').notNull().references(() => quotations.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').notNull(),
  discount: numeric('discount').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  total: numeric('total').notNull(),
});

// 38. Sales Orders Table
export const salesOrders = pgTable('sales_orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  quotationId: text('quotation_id').references(() => quotations.id, { onDelete: 'set null' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name'),
  date: text('date').notNull(),
  deliveryDate: text('delivery_date'),
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  discountAmount: numeric('discount_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  status: text('status').default('confirmed'), // draft, confirmed, fulfilled, converted, cancelled
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 39. Sales Order Items Table
export const salesOrderItems = pgTable('sales_order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => salesOrders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').notNull(),
  discount: numeric('discount').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  total: numeric('total').notNull(),
});

// 40. Purchase Requests Table (طلب شراء)
export const purchaseRequests = pgTable('purchase_requests', {
  id: text('id').primaryKey(),
  requestNumber: text('request_number').notNull().unique(),
  requesterName: text('requester_name'),
  department: text('department'),
  date: text('date').notNull(),
  requiredDate: text('required_date'),
  subtotal: numeric('subtotal').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  grandTotal: numeric('grand_total').default('0'),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  status: text('status').default('pending'), // draft, pending, approved, converted, rejected
  notes: text('notes'),
  supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 41. Purchase Request Items Table
export const purchaseRequestItems = pgTable('purchase_request_items', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => purchaseRequests.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  estimatedPrice: numeric('estimated_price').notNull(),
  quantity: numeric('quantity').notNull(),
  total: numeric('total').notNull(),
});

// 42. Bank Accounts Table
export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(),
  bankName: text('bank_name').notNull(),
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(),
  iban: text('iban'),
  swift: text('swift'),
  branch: text('branch'),
  currency: text('currency').default('SAR'),
  currentBalance: numeric('current_balance').default('0'),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 43. Treasury Transactions Table (Deposits, Withdrawals, Transfers)
export const treasuryTransactions = pgTable('treasury_transactions', {
  id: text('id').primaryKey(),
  transactionType: text('transaction_type').notNull(), // 'deposit', 'withdrawal', 'transfer'
  sourceType: text('source_type'), // 'cashbox', 'bank_account', 'customer', 'supplier', 'account', 'other'
  sourceId: text('source_id'),
  destinationType: text('destination_type'), // 'cashbox', 'bank_account', 'customer', 'supplier', 'account', 'other'
  destinationId: text('destination_id'),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('SAR'),
  exchangeRate: numeric('exchange_rate').default('1.0'),
  transferFee: numeric('transfer_fee').default('0'),
  date: text('date').notNull(),
  referenceNumber: text('reference_number'),
  description: text('description'),
  journalEntryId: text('journal_entry_id'),
  reconciled: text('reconciled').default('false'),
  reconciliationId: text('reconciliation_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 44. Bank Reconciliations Table
export const bankReconciliations = pgTable('bank_reconciliations', {
  id: text('id').primaryKey(),
  bankAccountId: text('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  statementDate: text('statement_date').notNull(),
  statementEndingBalance: numeric('statement_ending_balance').notNull(),
  ledgerEndingBalance: numeric('ledger_ending_balance').notNull(),
  difference: numeric('difference').default('0'),
  matchedCount: numeric('matched_count').default('0'),
  status: text('status').default('completed'), // 'draft', 'completed'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 45. Expense Categories Table
export const expenseCategories = pgTable('expense_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  budget: numeric('budget').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 46. Expense Requests Table (Expenses with Approval Workflow)
export const expenseRequests = pgTable('expense_requests', {
  id: text('id').primaryKey(),
  requestNumber: text('request_number').notNull(),
  categoryId: text('category_id').references(() => expenseCategories.id, { onDelete: 'set null' }),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  taxAmount: numeric('tax_amount').default('0'),
  totalAmount: numeric('total_amount').notNull(),
  currency: text('currency').default('SAR'),
  beneficiary: text('beneficiary'),
  paymentMethod: text('payment_method').default('cash'), // 'cash', 'bank', 'payable'
  paymentAccountId: text('payment_account_id'), // cashbox or bank account ID
  requestedBy: text('requested_by'),
  approvedBy: text('approved_by'),
  approvalDate: text('approval_date'),
  rejectionReason: text('rejection_reason'),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected', 'paid'
  journalEntryId: text('journal_entry_id'),
  receiptRef: text('receipt_ref'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Alias Exports for direct snake_case references
export const expense_categories = expenseCategories;
export const expense_requests = expenseRequests;
export const bank_accounts = bankAccounts;
export const treasury_transactions = treasuryTransactions;
export const bank_reconciliations = bankReconciliations;
export const exchange_rates = exchangeRates;
export const sales_invoices = salesInvoices;
export const purchase_invoices = purchaseInvoices;
export const audit_logs = auditLogs;
export const journal_entries = journalEntries;
export const journal_lines = journalLines;
export const stock_moves = stockMoves;
export const quotation_items = quotationItems;
export const sales_order_items = salesOrderItems;
export const purchase_requests = purchaseRequests;
export const purchase_request_items = purchaseRequestItems;


// ==================== Relationships ====================

export const companiesRelations = relations(companies, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  categories: many(categories),
  customers: many(customers),
  suppliers: many(suppliers),
  products: many(products),
  warehouses: many(warehouses),
  sales: many(sales),
  purchases: many(purchases),
  accounts: many(accounts),
  payments: many(payments),
  expenses: many(expenses),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, {
    fields: [branches.companyId],
    references: [companies.id],
  }),
  users: many(users),
  customers: many(customers),
  suppliers: many(suppliers),
  products: many(products),
  warehouses: many(warehouses),
  sales: many(sales),
  purchases: many(purchases),
  accounts: many(accounts),
  payments: many(payments),
  expenses: many(expenses),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  roleDef: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sales: many(sales),
  purchases: many(purchases),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  company: one(companies, {
    fields: [categories.companyId],
    references: [companies.id],
  }),
  products: many(products),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [customers.branchId],
    references: [branches.id],
  }),
  sales: many(sales),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [suppliers.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [suppliers.branchId],
    references: [branches.id],
  }),
  purchases: many(purchases),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category],
    references: [categories.id],
  }),
  unit: one(units, {
    fields: [products.unit],
    references: [units.name],
  }),
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [products.branchId],
    references: [branches.id],
  }),
  stockMoves: many(stockMoves),
  salesItems: many(salesItems),
  purchaseItems: many(purchaseItems),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  company: one(companies, {
    fields: [warehouses.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [warehouses.branchId],
    references: [branches.id],
  }),
  incomingMoves: many(stockMoves, { relationName: 'toWarehouse' }),
  outgoingMoves: many(stockMoves, { relationName: 'fromWarehouse' }),
}));

export const stockMovesRelations = relations(stockMoves, ({ one }) => ({
  company: one(companies, {
    fields: [stockMoves.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [stockMoves.branchId],
    references: [branches.id],
  }),
  product: one(products, {
    fields: [stockMoves.productId],
    references: [products.id],
  }),
  fromWarehouse: one(warehouses, {
    fields: [stockMoves.fromWarehouseId],
    references: [warehouses.id],
    relationName: 'fromWarehouse',
  }),
  toWarehouse: one(warehouses, {
    fields: [stockMoves.toWarehouseId],
    references: [warehouses.id],
    relationName: 'toWarehouse',
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  company: one(companies, {
    fields: [sales.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [sales.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    fields: [sales.cashierId],
    references: [users.id],
  }),
  items: many(salesItems),
}));

export const salesItemsRelations = relations(salesItems, ({ one }) => ({
  sale: one(sales, {
    fields: [salesItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [salesItems.productId],
    references: [products.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchases.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [purchases.branchId],
    references: [branches.id],
  }),
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  creator: one(users, {
    fields: [purchases.createdBy],
    references: [users.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  product: one(products, {
    fields: [purchaseItems.productId],
    references: [products.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [accounts.branchId],
    references: [branches.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: 'parentChild',
  }),
  children: many(accounts, { relationName: 'parentChild' }),
  journalDetails: many(journalDetails),
  journalLines: many(journalLines),
  expenses: many(expenses),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [journalEntries.branchId],
    references: [branches.id],
  }),
  details: many(journalDetails),
  lines: many(journalLines),
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

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [payments.branchId],
    references: [branches.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  account: one(accounts, {
    fields: [expenses.accountId],
    references: [accounts.id],
  }),
  company: one(companies, {
    fields: [expenses.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [expenses.branchId],
    references: [branches.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const currenciesRelations = relations(currencies, ({ one, many }) => ({
  company: one(companies, {
    fields: [currencies.companyId],
    references: [companies.id],
  }),
  rateHistory: many(exchangeRatesHistory),
}));

export const exchangeRatesHistoryRelations = relations(exchangeRatesHistory, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRatesHistory.currencyId],
    references: [currencies.id],
  }),
}));

export const taxesRelations = relations(taxes, ({ one }) => ({
  company: one(companies, {
    fields: [taxes.companyId],
    references: [companies.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  company: one(companies, {
    fields: [paymentMethods.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [paymentMethods.accountId],
    references: [accounts.id],
  }),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRates.currencyId],
    references: [currencies.id],
  }),
  company: one(companies, {
    fields: [exchangeRates.companyId],
    references: [companies.id],
  }),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one }) => ({
  company: one(companies, {
    fields: [salesInvoices.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [salesInvoices.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [salesInvoices.customerId],
    references: [customers.id],
  }),
  cashier: one(users, {
    fields: [salesInvoices.cashierId],
    references: [users.id],
  }),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one }) => ({
  company: one(companies, {
    fields: [purchaseInvoices.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [purchaseInvoices.branchId],
    references: [branches.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseInvoices.supplierId],
    references: [suppliers.id],
  }),
  warehouse: one(warehouses, {
    fields: [purchaseInvoices.warehouseId],
    references: [warehouses.id],
  }),
  creator: one(users, {
    fields: [purchaseInvoices.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [auditLogs.branchId],
    references: [branches.id],
  }),
}));
