var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc16) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc16 = __getOwnPropDesc(from, key)) || desc16.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/db/schema.ts
var import_pg_core, import_drizzle_orm, companies, branches, roles, permissions, rolePermissions, users, userSessions, categories, units, customers, suppliers, products, warehouses, stockMoves, invoices, invoiceItems, sales, salesItems, purchases, purchaseItems, accounts, journalEntries, journalDetails, journalLines, payments, expenses, settings, cashboxes, postingRules, currencies, exchangeRatesHistory, taxes, paymentMethods, exchangeRates, salesInvoices, purchaseInvoices, auditLogs, quotations, quotationItems, salesOrders, salesOrderItems, purchaseRequests, purchaseRequestItems, bankAccounts, treasuryTransactions, bankReconciliations, expenseCategories, expenseRequests, expense_categories, expense_requests, bank_accounts, treasury_transactions, bank_reconciliations, exchange_rates, sales_invoices, purchase_invoices, audit_logs, journal_entries, journal_lines, stock_moves, quotation_items, sales_order_items, purchase_requests, purchase_request_items, companiesRelations, branchesRelations, rolesRelations, permissionsRelations, rolePermissionsRelations, usersRelations, categoriesRelations, customersRelations, suppliersRelations, productsRelations, warehousesRelations, stockMovesRelations, salesRelations, salesItemsRelations, purchasesRelations, purchaseItemsRelations, accountsRelations, journalEntriesRelations, journalDetailsRelations, journalLinesRelations, paymentsRelations, expensesRelations, invoicesRelations, invoiceItemsRelations, currenciesRelations, exchangeRatesHistoryRelations, taxesRelations, paymentMethodsRelations, exchangeRatesRelations, salesInvoicesRelations, purchaseInvoicesRelations, auditLogsRelations;
var init_schema = __esm({
  "src/db/schema.ts"() {
    import_pg_core = require("drizzle-orm/pg-core");
    import_drizzle_orm = require("drizzle-orm");
    companies = (0, import_pg_core.pgTable)("companies", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      email: (0, import_pg_core.text)("email"),
      phone: (0, import_pg_core.text)("phone"),
      address: (0, import_pg_core.text)("address"),
      logo: (0, import_pg_core.text)("logo"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        companiesNameIdx: (0, import_pg_core.index)("companies_name_idx").on(table.name)
      };
    });
    branches = (0, import_pg_core.pgTable)("branches", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      name: (0, import_pg_core.text)("name").notNull(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      address: (0, import_pg_core.text)("address"),
      phone: (0, import_pg_core.text)("phone"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        branchesCompanyIdx: (0, import_pg_core.index)("branches_company_idx").on(table.companyId),
        branchesCodeIdx: (0, import_pg_core.index)("branches_code_idx").on(table.code)
      };
    });
    roles = (0, import_pg_core.pgTable)("roles", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      description: (0, import_pg_core.text)("description"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        rolesCodeIdx: (0, import_pg_core.index)("roles_code_idx").on(table.code)
      };
    });
    permissions = (0, import_pg_core.pgTable)("permissions", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      module: (0, import_pg_core.text)("module").notNull(),
      // e.g. 'sales', 'inventory', 'accounting'
      description: (0, import_pg_core.text)("description"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        permissionsCodeIdx: (0, import_pg_core.index)("permissions_code_idx").on(table.code),
        permissionsModuleIdx: (0, import_pg_core.index)("permissions_module_idx").on(table.module)
      };
    });
    rolePermissions = (0, import_pg_core.pgTable)("role_permissions", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      roleId: (0, import_pg_core.text)("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
      permissionId: (0, import_pg_core.text)("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" })
    }, (table) => {
      return {
        rolePermissionsRoleIdx: (0, import_pg_core.index)("role_permissions_role_idx").on(table.roleId),
        rolePermissionsPermissionIdx: (0, import_pg_core.index)("role_permissions_permission_idx").on(table.permissionId)
      };
    });
    users = (0, import_pg_core.pgTable)("users", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      uid: (0, import_pg_core.text)("uid").notNull().unique(),
      // Firebase Auth UID
      email: (0, import_pg_core.text)("email").notNull(),
      name: (0, import_pg_core.text)("name"),
      role: (0, import_pg_core.text)("role").default("cashier"),
      // manager, accountant, cashier, inventory (backward compatible)
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "set null" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "set null" }),
      roleId: (0, import_pg_core.text)("role_id").references(() => roles.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        usersEmailIdx: (0, import_pg_core.index)("users_email_idx").on(table.email),
        usersCompanyIdx: (0, import_pg_core.index)("users_company_idx").on(table.companyId),
        usersBranchIdx: (0, import_pg_core.index)("users_branch_idx").on(table.branchId),
        usersRoleIdIdx: (0, import_pg_core.index)("users_role_id_idx").on(table.roleId),
        roleCheck: (0, import_pg_core.check)("users_role_check", import_drizzle_orm.sql`${table.role} in ('manager', 'accountant', 'cashier', 'inventory')`)
      };
    });
    userSessions = (0, import_pg_core.pgTable)("user_sessions", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      refreshToken: (0, import_pg_core.text)("refresh_token").notNull(),
      ipAddress: (0, import_pg_core.text)("ip_address"),
      userAgent: (0, import_pg_core.text)("user_agent"),
      isRevoked: (0, import_pg_core.boolean)("is_revoked").default(false),
      expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        sessionsUserIdx: (0, import_pg_core.index)("user_sessions_user_idx").on(table.userId),
        sessionsTokenIdx: (0, import_pg_core.index)("user_sessions_token_idx").on(table.refreshToken)
      };
    });
    categories = (0, import_pg_core.pgTable)("categories", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      icon: (0, import_pg_core.text)("icon"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        categoriesNameIdx: (0, import_pg_core.index)("categories_name_idx").on(table.name),
        categoriesCompanyIdx: (0, import_pg_core.index)("categories_company_idx").on(table.companyId)
      };
    });
    units = (0, import_pg_core.pgTable)("units", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull().unique()
    }, (table) => {
      return {
        unitsNameIdx: (0, import_pg_core.index)("units_name_idx").on(table.name)
      };
    });
    customers = (0, import_pg_core.pgTable)("customers", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      phone: (0, import_pg_core.text)("phone"),
      email: (0, import_pg_core.text)("email"),
      balance: (0, import_pg_core.numeric)("balance").default("0"),
      // Positive means customer owes us
      creditLimit: (0, import_pg_core.numeric)("credit_limit").default("5000"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      crNumber: (0, import_pg_core.text)("cr_number"),
      address: (0, import_pg_core.text)("address"),
      type: (0, import_pg_core.text)("type").default("retail"),
      // 'retail', 'wholesale', 'company', 'vip'
      status: (0, import_pg_core.text)("status").default("active"),
      // 'active', 'inactive', 'blocked'
      notes: (0, import_pg_core.text)("notes"),
      openingBalance: (0, import_pg_core.numeric)("opening_balance").default("0"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        customersNameIdx: (0, import_pg_core.index)("customers_name_idx").on(table.name),
        customersPhoneIdx: (0, import_pg_core.index)("customers_phone_idx").on(table.phone),
        customersCompanyIdx: (0, import_pg_core.index)("customers_company_idx").on(table.companyId),
        customersBranchIdx: (0, import_pg_core.index)("customers_branch_idx").on(table.branchId)
      };
    });
    suppliers = (0, import_pg_core.pgTable)("suppliers", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      phone: (0, import_pg_core.text)("phone"),
      email: (0, import_pg_core.text)("email"),
      balance: (0, import_pg_core.numeric)("balance").default("0"),
      // Positive means we owe the supplier
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        suppliersNameIdx: (0, import_pg_core.index)("suppliers_name_idx").on(table.name),
        suppliersCompanyIdx: (0, import_pg_core.index)("suppliers_company_idx").on(table.companyId),
        suppliersBranchIdx: (0, import_pg_core.index)("suppliers_branch_idx").on(table.branchId)
      };
    });
    products = (0, import_pg_core.pgTable)("products", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      barcode: (0, import_pg_core.text)("barcode").notNull().unique(),
      price: (0, import_pg_core.numeric)("price").default("0"),
      purchasePrice: (0, import_pg_core.numeric)("purchase_price").default("0"),
      stock: (0, import_pg_core.numeric)("stock").default("0"),
      minStock: (0, import_pg_core.numeric)("min_stock").default("0"),
      category: (0, import_pg_core.text)("category").notNull().references(() => categories.id, { onDelete: "restrict" }),
      unit: (0, import_pg_core.text)("unit").notNull().references(() => units.name, { onDelete: "restrict" }),
      taxRate: (0, import_pg_core.numeric)("tax_rate").default("15"),
      image: (0, import_pg_core.text)("image"),
      description: (0, import_pg_core.text)("description"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        productsNameIdx: (0, import_pg_core.index)("products_name_idx").on(table.name),
        productsCategoryIdx: (0, import_pg_core.index)("products_category_idx").on(table.category),
        productsUnitIdx: (0, import_pg_core.index)("products_unit_idx").on(table.unit),
        productsCompanyIdx: (0, import_pg_core.index)("products_company_idx").on(table.companyId),
        productsBranchIdx: (0, import_pg_core.index)("products_branch_idx").on(table.branchId),
        priceCheck: (0, import_pg_core.check)("products_price_check", import_drizzle_orm.sql`${table.price} >= 0`),
        purchasePriceCheck: (0, import_pg_core.check)("products_purchase_price_check", import_drizzle_orm.sql`${table.purchasePrice} >= 0`)
      };
    });
    warehouses = (0, import_pg_core.pgTable)("warehouses", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      name: (0, import_pg_core.text)("name").notNull(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      location: (0, import_pg_core.text)("location"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        warehousesCompanyIdx: (0, import_pg_core.index)("warehouses_company_idx").on(table.companyId),
        warehousesBranchIdx: (0, import_pg_core.index)("warehouses_branch_idx").on(table.branchId),
        warehousesCodeIdx: (0, import_pg_core.index)("warehouses_code_idx").on(table.code)
      };
    });
    stockMoves = (0, import_pg_core.pgTable)("stock_moves", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
      fromWarehouseId: (0, import_pg_core.text)("from_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
      toWarehouseId: (0, import_pg_core.text)("to_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      unitCost: (0, import_pg_core.numeric)("unit_cost").default("0"),
      type: (0, import_pg_core.text)("type").notNull(),
      // 'purchase', 'sale', 'transfer', 'adjustment', 'initial'
      referenceId: (0, import_pg_core.text)("reference_id"),
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        stockMovesCompanyIdx: (0, import_pg_core.index)("stock_moves_company_idx").on(table.companyId),
        stockMovesProductIdx: (0, import_pg_core.index)("stock_moves_product_idx").on(table.productId),
        stockMovesTypeCheck: (0, import_pg_core.check)("stock_moves_type_check", import_drizzle_orm.sql`${table.type} in ('purchase', 'sale', 'transfer', 'adjustment', 'initial')`)
      };
    });
    invoices = (0, import_pg_core.pgTable)("invoices", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      invoiceNumber: (0, import_pg_core.text)("invoice_number").notNull().unique(),
      date: (0, import_pg_core.text)("date").notNull(),
      // YYYY-MM-DD
      totalWithoutTax: (0, import_pg_core.numeric)("total_without_tax").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      // cash, card, credit, split
      cashAmount: (0, import_pg_core.numeric)("cash_amount").default("0"),
      cardAmount: (0, import_pg_core.numeric)("card_amount").default("0"),
      status: (0, import_pg_core.text)("status").default("paid"),
      // paid, unpaid, partially_paid
      customerId: (0, import_pg_core.text)("customer_id").references(() => customers.id, { onDelete: "set null" }),
      customerName: (0, import_pg_core.text)("customer_name"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      cashierName: (0, import_pg_core.text)("cashier_name").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        invoicesDateIdx: (0, import_pg_core.index)("invoices_date_idx").on(table.date),
        invoicesCustomerIdIdx: (0, import_pg_core.index)("invoices_customer_id_idx").on(table.customerId),
        paymentMethodCheck: (0, import_pg_core.check)("invoices_payment_method_check", import_drizzle_orm.sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`),
        statusCheck: (0, import_pg_core.check)("invoices_status_check", import_drizzle_orm.sql`${table.status} in ('paid', 'unpaid', 'partially_paid', 'returned')`)
      };
    });
    invoiceItems = (0, import_pg_core.pgTable)("invoice_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      invoiceId: (0, import_pg_core.text)("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
      productName: (0, import_pg_core.text)("product_name").notNull(),
      price: (0, import_pg_core.numeric)("price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      discount: (0, import_pg_core.numeric)("discount").default("0"),
      discountType: (0, import_pg_core.text)("discount_type").default("percentage"),
      // fixed, percentage
      total: (0, import_pg_core.numeric)("total").notNull(),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").notNull()
    }, (table) => {
      return {
        invoiceItemsInvoiceIdIdx: (0, import_pg_core.index)("invoice_items_invoice_id_idx").on(table.invoiceId),
        invoiceItemsProductIdIdx: (0, import_pg_core.index)("invoice_items_product_id_idx").on(table.productId),
        discountTypeCheck: (0, import_pg_core.check)("invoice_items_discount_type_check", import_drizzle_orm.sql`${table.discountType} in ('fixed', 'percentage')`)
      };
    });
    sales = (0, import_pg_core.pgTable)("sales", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      invoiceNumber: (0, import_pg_core.text)("invoice_number").notNull().unique(),
      date: (0, import_pg_core.text)("date").notNull(),
      // YYYY-MM-DD
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      // cash, card, credit, split
      status: (0, import_pg_core.text)("status").default("paid"),
      // paid, unpaid, partially_paid
      customerId: (0, import_pg_core.text)("customer_id").references(() => customers.id, { onDelete: "set null" }),
      cashierId: (0, import_pg_core.text)("cashier_id").references(() => users.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        salesCompanyIdx: (0, import_pg_core.index)("sales_company_idx").on(table.companyId),
        salesDateIdx: (0, import_pg_core.index)("sales_date_idx").on(table.date),
        salesCustomerIdx: (0, import_pg_core.index)("sales_customer_idx").on(table.customerId),
        salesPaymentMethodCheck: (0, import_pg_core.check)("sales_payment_method_check", import_drizzle_orm.sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`),
        salesStatusCheck: (0, import_pg_core.check)("sales_status_check", import_drizzle_orm.sql`${table.status} in ('paid', 'unpaid', 'partially_paid')`)
      };
    });
    salesItems = (0, import_pg_core.pgTable)("sales_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      saleId: (0, import_pg_core.text)("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
      price: (0, import_pg_core.numeric)("price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      discount: (0, import_pg_core.numeric)("discount").default("0"),
      total: (0, import_pg_core.numeric)("total").notNull(),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").notNull()
    }, (table) => {
      return {
        salesItemsSaleIdx: (0, import_pg_core.index)("sales_items_sale_idx").on(table.saleId),
        salesItemsProductIdx: (0, import_pg_core.index)("sales_items_product_idx").on(table.productId)
      };
    });
    purchases = (0, import_pg_core.pgTable)("purchases", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      purchaseNumber: (0, import_pg_core.text)("purchase_number").notNull().unique(),
      date: (0, import_pg_core.text)("date").notNull(),
      // YYYY-MM-DD
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      status: (0, import_pg_core.text)("status").default("ordered"),
      // draft, ordered, received, completed, cancelled
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      // cash, card, credit
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      supplierInvoiceNumber: (0, import_pg_core.text)("supplier_invoice_number"),
      warehouseId: (0, import_pg_core.text)("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
      supplierId: (0, import_pg_core.text)("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
      notes: (0, import_pg_core.text)("notes"),
      createdBy: (0, import_pg_core.text)("created_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        purchasesCompanyIdx: (0, import_pg_core.index)("purchases_company_idx").on(table.companyId),
        purchasesSupplierIdx: (0, import_pg_core.index)("purchases_supplier_idx").on(table.supplierId),
        purchasesStatusCheck: (0, import_pg_core.check)("purchases_status_check", import_drizzle_orm.sql`${table.status} in ('draft', 'ordered', 'received', 'completed', 'cancelled')`)
      };
    });
    purchaseItems = (0, import_pg_core.pgTable)("purchase_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      purchaseId: (0, import_pg_core.text)("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
      purchasePrice: (0, import_pg_core.numeric)("purchase_price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      total: (0, import_pg_core.numeric)("total").notNull(),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").notNull()
    }, (table) => {
      return {
        purchaseItemsPurchaseIdx: (0, import_pg_core.index)("purchase_items_purchase_idx").on(table.purchaseId),
        purchaseItemsProductIdx: (0, import_pg_core.index)("purchase_items_product_idx").on(table.productId)
      };
    });
    accounts = (0, import_pg_core.pgTable)("accounts", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      // e.g. "1101", "1201"
      name: (0, import_pg_core.text)("name").notNull(),
      type: (0, import_pg_core.text)("type").notNull(),
      // asset, liability, equity, revenue, expense
      balance: (0, import_pg_core.numeric)("balance").default("0"),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      // account default currency
      foreignBalance: (0, import_pg_core.numeric)("foreign_balance").default("0"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      parentId: (0, import_pg_core.text)("parent_id"),
      // hierarchical structure
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        accountsCompanyIdx: (0, import_pg_core.index)("accounts_company_idx").on(table.companyId),
        accountsTypeCheck: (0, import_pg_core.check)("accounts_type_check", import_drizzle_orm.sql`${table.type} in ('asset', 'liability', 'equity', 'revenue', 'expense')`)
      };
    });
    journalEntries = (0, import_pg_core.pgTable)("journal_entries", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      entryNumber: (0, import_pg_core.text)("entry_number").notNull().unique(),
      description: (0, import_pg_core.text)("description"),
      date: (0, import_pg_core.text)("date").notNull(),
      status: (0, import_pg_core.text)("status").default("posted"),
      // draft, posted, reversed
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      // Transaction currency (USD, SYP, TRY, SAR)
      baseCurrency: (0, import_pg_core.text)("base_currency").default("SAR"),
      // System base currency (SAR)
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      // Rate to convert to base currency
      foreignAmount: (0, import_pg_core.numeric)("foreign_amount").default("0"),
      // Total amount in transaction currency
      baseAmount: (0, import_pg_core.numeric)("base_amount").default("0"),
      // Total amount in base currency
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        journalEntriesCompanyIdx: (0, import_pg_core.index)("journal_entries_company_idx").on(table.companyId),
        journalEntriesStatusCheck: (0, import_pg_core.check)("journal_entries_status_check", import_drizzle_orm.sql`${table.status} in ('draft', 'posted', 'reversed')`)
      };
    });
    journalDetails = (0, import_pg_core.pgTable)("journal_details", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      journalEntryId: (0, import_pg_core.text)("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
      accountId: (0, import_pg_core.text)("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      foreignDebit: (0, import_pg_core.numeric)("foreign_debit").default("0"),
      foreignCredit: (0, import_pg_core.numeric)("foreign_credit").default("0"),
      debit: (0, import_pg_core.numeric)("debit").default("0"),
      // Base currency debit
      credit: (0, import_pg_core.numeric)("credit").default("0"),
      // Base currency credit
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        journalDetailsEntryIdIdx: (0, import_pg_core.index)("journal_details_entry_id_idx").on(table.journalEntryId),
        journalDetailsAccountIdIdx: (0, import_pg_core.index)("journal_details_account_id_idx").on(table.accountId),
        debitCheck: (0, import_pg_core.check)("journal_details_debit_check", import_drizzle_orm.sql`${table.debit} >= 0`),
        creditCheck: (0, import_pg_core.check)("journal_details_credit_check", import_drizzle_orm.sql`${table.credit} >= 0`)
      };
    });
    journalLines = (0, import_pg_core.pgTable)("journal_lines", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      journalEntryId: (0, import_pg_core.text)("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
      accountId: (0, import_pg_core.text)("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      foreignDebit: (0, import_pg_core.numeric)("foreign_debit").default("0"),
      foreignCredit: (0, import_pg_core.numeric)("foreign_credit").default("0"),
      debit: (0, import_pg_core.numeric)("debit").default("0"),
      // Base currency debit
      credit: (0, import_pg_core.numeric)("credit").default("0"),
      // Base currency credit
      description: (0, import_pg_core.text)("description"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        journalLinesEntryIdx: (0, import_pg_core.index)("journal_lines_entry_idx").on(table.journalEntryId),
        journalLinesAccountIdx: (0, import_pg_core.index)("journal_lines_account_idx").on(table.accountId),
        debitCheck: (0, import_pg_core.check)("journal_lines_debit_check", import_drizzle_orm.sql`${table.debit} >= 0`),
        creditCheck: (0, import_pg_core.check)("journal_lines_credit_check", import_drizzle_orm.sql`${table.credit} >= 0`)
      };
    });
    payments = (0, import_pg_core.pgTable)("payments", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      paymentNumber: (0, import_pg_core.text)("payment_number").notNull().unique(),
      date: (0, import_pg_core.text)("date").notNull(),
      // YYYY-MM-DD
      type: (0, import_pg_core.text)("type").notNull(),
      // 'receipt' (incoming), 'payment' (outgoing)
      partyId: (0, import_pg_core.text)("party_id"),
      // customerId or supplierId
      partyType: (0, import_pg_core.text)("party_type"),
      // 'customer', 'supplier'
      amount: (0, import_pg_core.numeric)("amount").notNull(),
      method: (0, import_pg_core.text)("method").notNull(),
      // 'cash', 'bank', 'check'
      reference: (0, import_pg_core.text)("reference"),
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        paymentsCompanyIdx: (0, import_pg_core.index)("payments_company_idx").on(table.companyId),
        paymentsTypeCheck: (0, import_pg_core.check)("payments_type_check", import_drizzle_orm.sql`${table.type} in ('receipt', 'payment')`),
        paymentsMethodCheck: (0, import_pg_core.check)("payments_method_check", import_drizzle_orm.sql`${table.method} in ('cash', 'bank', 'check')`)
      };
    });
    expenses = (0, import_pg_core.pgTable)("expenses", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      description: (0, import_pg_core.text)("description").notNull(),
      amount: (0, import_pg_core.numeric)("amount").notNull(),
      accountId: (0, import_pg_core.text)("account_id").references(() => accounts.id, { onDelete: "restrict" }),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      date: (0, import_pg_core.text)("date").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        expensesAccountIdIdx: (0, import_pg_core.index)("expenses_account_id_idx").on(table.accountId),
        expensesDateIdx: (0, import_pg_core.index)("expenses_date_idx").on(table.date),
        expensesCompanyIdx: (0, import_pg_core.index)("expenses_company_idx").on(table.companyId),
        expensesBranchIdx: (0, import_pg_core.index)("expenses_branch_idx").on(table.branchId),
        amountCheck: (0, import_pg_core.check)("expenses_amount_check", import_drizzle_orm.sql`${table.amount} >= 0`)
      };
    });
    settings = (0, import_pg_core.pgTable)("settings", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      logo: (0, import_pg_core.text)("logo"),
      address: (0, import_pg_core.text)("address"),
      phone: (0, import_pg_core.text)("phone"),
      taxNumber: (0, import_pg_core.text)("tax_number"),
      taxRate: (0, import_pg_core.numeric)("tax_rate").default("15"),
      currency: (0, import_pg_core.text)("currency").default("\u0631.\u0633"),
      thermalPrinterWidth: (0, import_pg_core.text)("thermal_printer_width").default("80mm")
    });
    cashboxes = (0, import_pg_core.pgTable)("cashboxes", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      status: (0, import_pg_core.text)("status").default("closed"),
      // open, closed
      currentBalance: (0, import_pg_core.numeric)("current_balance").default("0"),
      lastOpenedAt: (0, import_pg_core.text)("last_opened_at"),
      lastClosedAt: (0, import_pg_core.text)("last_closed_at")
    }, (table) => {
      return {
        cashboxStatusCheck: (0, import_pg_core.check)("cashboxes_status_check", import_drizzle_orm.sql`${table.status} in ('open', 'closed')`)
      };
    });
    postingRules = (0, import_pg_core.pgTable)("posting_rules", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      ruleCode: (0, import_pg_core.text)("rule_code").notNull().unique(),
      // e.g., 'sales_cash_debit', 'sales_bank_debit', etc.
      accountId: (0, import_pg_core.text)("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
      description: (0, import_pg_core.text)("description").notNull()
    });
    currencies = (0, import_pg_core.pgTable)("currencies", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      // e.g. 'SAR', 'USD', 'SYP', 'TRY'
      name: (0, import_pg_core.text)("name").notNull(),
      // e.g. 'ريال سعودي', 'دولار أمريكي', 'ليرة سورية', 'ليرة تركية'
      symbol: (0, import_pg_core.text)("symbol").notNull(),
      // e.g. 'ر.س', '$', 'ل.س', '₺'
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      isDefault: (0, import_pg_core.text)("is_default").default("false"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        currenciesCodeIdx: (0, import_pg_core.index)("currencies_code_idx").on(table.code),
        currenciesCompanyIdx: (0, import_pg_core.index)("currencies_company_idx").on(table.companyId)
      };
    });
    exchangeRatesHistory = (0, import_pg_core.pgTable)("exchange_rates_history", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      currencyId: (0, import_pg_core.text)("currency_id").notNull().references(() => currencies.id, { onDelete: "cascade" }),
      currencyCode: (0, import_pg_core.text)("currency_code").notNull(),
      rate: (0, import_pg_core.numeric)("rate").notNull(),
      effectiveDate: (0, import_pg_core.text)("effective_date").notNull(),
      notes: (0, import_pg_core.text)("notes"),
      createdBy: (0, import_pg_core.text)("created_by"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        historyCurrencyIdx: (0, import_pg_core.index)("exchange_rates_history_curr_idx").on(table.currencyId),
        historyDateIdx: (0, import_pg_core.index)("exchange_rates_history_date_idx").on(table.effectiveDate)
      };
    });
    taxes = (0, import_pg_core.pgTable)("taxes", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      name: (0, import_pg_core.text)("name").notNull(),
      // e.g. 'ضريبة القيمة المضافة 15%'
      code: (0, import_pg_core.text)("code").notNull().unique(),
      // e.g. 'VAT_15'
      rate: (0, import_pg_core.numeric)("rate").notNull().default("15"),
      isInclusive: (0, import_pg_core.text)("is_inclusive").default("false"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        taxesCodeIdx: (0, import_pg_core.index)("taxes_code_idx").on(table.code),
        taxesCompanyIdx: (0, import_pg_core.index)("taxes_company_idx").on(table.companyId)
      };
    });
    paymentMethods = (0, import_pg_core.pgTable)("payment_methods", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      code: (0, import_pg_core.text)("code").notNull().unique(),
      // e.g. 'cash', 'card', 'bank_transfer'
      name: (0, import_pg_core.text)("name").notNull(),
      // e.g. 'نقداً', 'بطاقة ائتمان'
      accountId: (0, import_pg_core.text)("account_id").references(() => accounts.id, { onDelete: "set null" }),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        paymentMethodsCodeIdx: (0, import_pg_core.index)("payment_methods_code_idx").on(table.code),
        paymentMethodsCompanyIdx: (0, import_pg_core.index)("payment_methods_company_idx").on(table.companyId)
      };
    });
    exchangeRates = (0, import_pg_core.pgTable)("exchange_rates", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      currencyId: (0, import_pg_core.text)("currency_id").notNull().references(() => currencies.id, { onDelete: "cascade" }),
      currencyCode: (0, import_pg_core.text)("currency_code").notNull(),
      rate: (0, import_pg_core.numeric)("rate").notNull(),
      effectiveDate: (0, import_pg_core.text)("effective_date").notNull(),
      notes: (0, import_pg_core.text)("notes"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      createdBy: (0, import_pg_core.text)("created_by"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        exchangeRatesCurrencyIdx: (0, import_pg_core.index)("exchange_rates_currency_idx").on(table.currencyId),
        exchangeRatesCodeIdx: (0, import_pg_core.index)("exchange_rates_code_idx").on(table.currencyCode),
        exchangeRatesDateIdx: (0, import_pg_core.index)("exchange_rates_date_idx").on(table.effectiveDate),
        rateCheck: (0, import_pg_core.check)("exchange_rates_rate_check", import_drizzle_orm.sql`${table.rate} > 0`)
      };
    });
    salesInvoices = (0, import_pg_core.pgTable)("sales_invoices", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      invoiceNumber: (0, import_pg_core.text)("invoice_number").notNull().unique(),
      date: (0, import_pg_core.text)("date").notNull(),
      dueDate: (0, import_pg_core.text)("due_date"),
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      paidAmount: (0, import_pg_core.numeric)("paid_amount").default("0"),
      remainingAmount: (0, import_pg_core.numeric)("remaining_amount").default("0"),
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      status: (0, import_pg_core.text)("status").default("paid"),
      // paid, unpaid, partially_paid, draft, cancelled
      customerId: (0, import_pg_core.text)("customer_id").references(() => customers.id, { onDelete: "set null" }),
      cashierId: (0, import_pg_core.text)("cashier_id").references(() => users.id, { onDelete: "set null" }),
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        salesInvoicesCompanyIdx: (0, import_pg_core.index)("sales_invoices_company_idx").on(table.companyId),
        salesInvoicesBranchIdx: (0, import_pg_core.index)("sales_invoices_branch_idx").on(table.branchId),
        salesInvoicesDateIdx: (0, import_pg_core.index)("sales_invoices_date_idx").on(table.date),
        salesInvoicesCustomerIdx: (0, import_pg_core.index)("sales_invoices_customer_idx").on(table.customerId),
        salesInvoicesStatusCheck: (0, import_pg_core.check)("sales_invoices_status_check", import_drizzle_orm.sql`${table.status} in ('paid', 'unpaid', 'partially_paid', 'draft', 'cancelled')`),
        salesInvoicesPaymentMethodCheck: (0, import_pg_core.check)("sales_invoices_payment_method_check", import_drizzle_orm.sql`${table.paymentMethod} in ('cash', 'card', 'credit', 'split')`)
      };
    });
    purchaseInvoices = (0, import_pg_core.pgTable)("purchase_invoices", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      invoiceNumber: (0, import_pg_core.text)("invoice_number").notNull().unique(),
      supplierInvoiceNumber: (0, import_pg_core.text)("supplier_invoice_number"),
      date: (0, import_pg_core.text)("date").notNull(),
      dueDate: (0, import_pg_core.text)("due_date"),
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      paidAmount: (0, import_pg_core.numeric)("paid_amount").default("0"),
      remainingAmount: (0, import_pg_core.numeric)("remaining_amount").default("0"),
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      status: (0, import_pg_core.text)("status").default("ordered"),
      // draft, ordered, received, completed, cancelled
      supplierId: (0, import_pg_core.text)("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
      warehouseId: (0, import_pg_core.text)("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
      notes: (0, import_pg_core.text)("notes"),
      createdBy: (0, import_pg_core.text)("created_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        purchaseInvoicesCompanyIdx: (0, import_pg_core.index)("purchase_invoices_company_idx").on(table.companyId),
        purchaseInvoicesBranchIdx: (0, import_pg_core.index)("purchase_invoices_branch_idx").on(table.branchId),
        purchaseInvoicesDateIdx: (0, import_pg_core.index)("purchase_invoices_date_idx").on(table.date),
        purchaseInvoicesSupplierIdx: (0, import_pg_core.index)("purchase_invoices_supplier_idx").on(table.supplierId),
        purchaseInvoicesStatusCheck: (0, import_pg_core.check)("purchase_invoices_status_check", import_drizzle_orm.sql`${table.status} in ('draft', 'ordered', 'received', 'completed', 'cancelled')`)
      };
    });
    auditLogs = (0, import_pg_core.pgTable)("audit_logs", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      userId: (0, import_pg_core.text)("user_id").references(() => users.id, { onDelete: "set null" }),
      userName: (0, import_pg_core.text)("user_name"),
      userEmail: (0, import_pg_core.text)("user_email"),
      action: (0, import_pg_core.text)("action").notNull(),
      // CREATE, UPDATE, DELETE, LOGIN, POST, APPROVE, CANCEL
      module: (0, import_pg_core.text)("module").notNull(),
      // sales, purchases, inventory, accounting, users, settings
      recordId: (0, import_pg_core.text)("record_id"),
      details: (0, import_pg_core.text)("details"),
      ipAddress: (0, import_pg_core.text)("ip_address"),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
    }, (table) => {
      return {
        auditLogsUserIdx: (0, import_pg_core.index)("audit_logs_user_idx").on(table.userId),
        auditLogsModuleIdx: (0, import_pg_core.index)("audit_logs_module_idx").on(table.module),
        auditLogsCompanyIdx: (0, import_pg_core.index)("audit_logs_company_idx").on(table.companyId),
        auditLogsCreatedAtIdx: (0, import_pg_core.index)("audit_logs_created_at_idx").on(table.createdAt)
      };
    });
    quotations = (0, import_pg_core.pgTable)("quotations", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      quotationNumber: (0, import_pg_core.text)("quotation_number").notNull().unique(),
      customerId: (0, import_pg_core.text)("customer_id").references(() => customers.id, { onDelete: "set null" }),
      customerName: (0, import_pg_core.text)("customer_name"),
      date: (0, import_pg_core.text)("date").notNull(),
      validUntil: (0, import_pg_core.text)("valid_until"),
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      status: (0, import_pg_core.text)("status").default("draft"),
      // draft, sent, accepted, converted, rejected
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    quotationItems = (0, import_pg_core.pgTable)("quotation_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      quotationId: (0, import_pg_core.text)("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").references(() => products.id, { onDelete: "set null" }),
      productName: (0, import_pg_core.text)("product_name").notNull(),
      price: (0, import_pg_core.numeric)("price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      discount: (0, import_pg_core.numeric)("discount").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      total: (0, import_pg_core.numeric)("total").notNull()
    });
    salesOrders = (0, import_pg_core.pgTable)("sales_orders", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      orderNumber: (0, import_pg_core.text)("order_number").notNull().unique(),
      quotationId: (0, import_pg_core.text)("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
      customerId: (0, import_pg_core.text)("customer_id").references(() => customers.id, { onDelete: "set null" }),
      customerName: (0, import_pg_core.text)("customer_name"),
      date: (0, import_pg_core.text)("date").notNull(),
      deliveryDate: (0, import_pg_core.text)("delivery_date"),
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      discountAmount: (0, import_pg_core.numeric)("discount_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      status: (0, import_pg_core.text)("status").default("confirmed"),
      // draft, confirmed, fulfilled, converted, cancelled
      notes: (0, import_pg_core.text)("notes"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    salesOrderItems = (0, import_pg_core.pgTable)("sales_order_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      orderId: (0, import_pg_core.text)("order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").references(() => products.id, { onDelete: "set null" }),
      productName: (0, import_pg_core.text)("product_name").notNull(),
      price: (0, import_pg_core.numeric)("price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      discount: (0, import_pg_core.numeric)("discount").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      total: (0, import_pg_core.numeric)("total").notNull()
    });
    purchaseRequests = (0, import_pg_core.pgTable)("purchase_requests", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      requestNumber: (0, import_pg_core.text)("request_number").notNull().unique(),
      requesterName: (0, import_pg_core.text)("requester_name"),
      department: (0, import_pg_core.text)("department"),
      date: (0, import_pg_core.text)("date").notNull(),
      requiredDate: (0, import_pg_core.text)("required_date"),
      subtotal: (0, import_pg_core.numeric)("subtotal").default("0"),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      grandTotal: (0, import_pg_core.numeric)("grand_total").default("0"),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      status: (0, import_pg_core.text)("status").default("pending"),
      // draft, pending, approved, converted, rejected
      notes: (0, import_pg_core.text)("notes"),
      supplierId: (0, import_pg_core.text)("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    purchaseRequestItems = (0, import_pg_core.pgTable)("purchase_request_items", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      requestId: (0, import_pg_core.text)("request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
      productId: (0, import_pg_core.text)("product_id").references(() => products.id, { onDelete: "set null" }),
      productName: (0, import_pg_core.text)("product_name").notNull(),
      estimatedPrice: (0, import_pg_core.numeric)("estimated_price").notNull(),
      quantity: (0, import_pg_core.numeric)("quantity").notNull(),
      total: (0, import_pg_core.numeric)("total").notNull(),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    bankAccounts = (0, import_pg_core.pgTable)("bank_accounts", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      bankName: (0, import_pg_core.text)("bank_name").notNull(),
      accountName: (0, import_pg_core.text)("account_name").notNull(),
      accountNumber: (0, import_pg_core.text)("account_number").notNull(),
      iban: (0, import_pg_core.text)("iban"),
      swift: (0, import_pg_core.text)("swift"),
      branch: (0, import_pg_core.text)("branch"),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      currentBalance: (0, import_pg_core.numeric)("current_balance").default("0"),
      accountId: (0, import_pg_core.text)("account_id").references(() => accounts.id, { onDelete: "set null" }),
      status: (0, import_pg_core.text)("status").default("active"),
      createdBy: (0, import_pg_core.text)("created_by"),
      updatedBy: (0, import_pg_core.text)("updated_by"),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false),
      deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        bankAccountsCompanyIdx: (0, import_pg_core.index)("bank_accounts_company_idx").on(table.companyId),
        bankAccountsBranchIdx: (0, import_pg_core.index)("bank_accounts_branch_idx").on(table.branchId),
        bankAccountsDeletedIdx: (0, import_pg_core.index)("bank_accounts_deleted_idx").on(table.isDeleted)
      };
    });
    treasuryTransactions = (0, import_pg_core.pgTable)("treasury_transactions", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      transactionType: (0, import_pg_core.text)("transaction_type").notNull(),
      // 'deposit', 'withdrawal', 'transfer'
      sourceType: (0, import_pg_core.text)("source_type"),
      // 'cashbox', 'bank_account', 'customer', 'supplier', 'account', 'other'
      sourceId: (0, import_pg_core.text)("source_id"),
      destinationType: (0, import_pg_core.text)("destination_type"),
      // 'cashbox', 'bank_account', 'customer', 'supplier', 'account', 'other'
      destinationId: (0, import_pg_core.text)("destination_id"),
      amount: (0, import_pg_core.numeric)("amount").notNull(),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      exchangeRate: (0, import_pg_core.numeric)("exchange_rate").default("1.0"),
      transferFee: (0, import_pg_core.numeric)("transfer_fee").default("0"),
      date: (0, import_pg_core.text)("date").notNull(),
      referenceNumber: (0, import_pg_core.text)("reference_number"),
      description: (0, import_pg_core.text)("description"),
      journalEntryId: (0, import_pg_core.text)("journal_entry_id"),
      reconciled: (0, import_pg_core.text)("reconciled").default("false"),
      reconciliationId: (0, import_pg_core.text)("reconciliation_id"),
      createdBy: (0, import_pg_core.text)("created_by"),
      updatedBy: (0, import_pg_core.text)("updated_by"),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false),
      deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        treasuryTransactionsCompanyIdx: (0, import_pg_core.index)("treasury_transactions_company_idx").on(table.companyId),
        treasuryTransactionsBranchIdx: (0, import_pg_core.index)("treasury_transactions_branch_idx").on(table.branchId),
        treasuryTransactionsDeletedIdx: (0, import_pg_core.index)("treasury_transactions_deleted_idx").on(table.isDeleted)
      };
    });
    bankReconciliations = (0, import_pg_core.pgTable)("bank_reconciliations", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      bankAccountId: (0, import_pg_core.text)("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
      statementDate: (0, import_pg_core.text)("statement_date").notNull(),
      statementEndingBalance: (0, import_pg_core.numeric)("statement_ending_balance").notNull(),
      ledgerEndingBalance: (0, import_pg_core.numeric)("ledger_ending_balance").notNull(),
      difference: (0, import_pg_core.numeric)("difference").default("0"),
      matchedCount: (0, import_pg_core.numeric)("matched_count").default("0"),
      status: (0, import_pg_core.text)("status").default("completed"),
      // 'draft', 'completed'
      notes: (0, import_pg_core.text)("notes"),
      createdBy: (0, import_pg_core.text)("created_by"),
      updatedBy: (0, import_pg_core.text)("updated_by"),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false),
      deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    expenseCategories = (0, import_pg_core.pgTable)("expense_categories", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      name: (0, import_pg_core.text)("name").notNull(),
      code: (0, import_pg_core.text)("code"),
      description: (0, import_pg_core.text)("description"),
      accountId: (0, import_pg_core.text)("account_id").references(() => accounts.id, { onDelete: "set null" }),
      budget: (0, import_pg_core.numeric)("budget").default("0"),
      createdBy: (0, import_pg_core.text)("created_by"),
      updatedBy: (0, import_pg_core.text)("updated_by"),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false),
      deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    });
    expenseRequests = (0, import_pg_core.pgTable)("expense_requests", {
      id: (0, import_pg_core.text)("id").primaryKey(),
      requestNumber: (0, import_pg_core.text)("request_number").notNull(),
      companyId: (0, import_pg_core.text)("company_id").references(() => companies.id, { onDelete: "cascade" }),
      branchId: (0, import_pg_core.text)("branch_id").references(() => branches.id, { onDelete: "cascade" }),
      categoryId: (0, import_pg_core.text)("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
      accountId: (0, import_pg_core.text)("account_id").references(() => accounts.id, { onDelete: "set null" }),
      title: (0, import_pg_core.text)("title").notNull(),
      description: (0, import_pg_core.text)("description"),
      amount: (0, import_pg_core.numeric)("amount").notNull(),
      taxAmount: (0, import_pg_core.numeric)("tax_amount").default("0"),
      totalAmount: (0, import_pg_core.numeric)("total_amount").notNull(),
      currency: (0, import_pg_core.text)("currency").default("SAR"),
      beneficiary: (0, import_pg_core.text)("beneficiary"),
      paymentMethod: (0, import_pg_core.text)("payment_method").default("cash"),
      // 'cash', 'bank', 'payable'
      paymentAccountId: (0, import_pg_core.text)("payment_account_id"),
      // cashbox or bank account ID
      requestedBy: (0, import_pg_core.text)("requested_by"),
      approvedBy: (0, import_pg_core.text)("approved_by"),
      approvalDate: (0, import_pg_core.text)("approval_date"),
      rejectionReason: (0, import_pg_core.text)("rejection_reason"),
      status: (0, import_pg_core.text)("status").default("pending"),
      // 'pending', 'approved', 'rejected', 'paid'
      journalEntryId: (0, import_pg_core.text)("journal_entry_id"),
      receiptRef: (0, import_pg_core.text)("receipt_ref"),
      date: (0, import_pg_core.text)("date").notNull(),
      createdBy: (0, import_pg_core.text)("created_by"),
      updatedBy: (0, import_pg_core.text)("updated_by"),
      isDeleted: (0, import_pg_core.boolean)("is_deleted").default(false),
      deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
      createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
    }, (table) => {
      return {
        expenseRequestsCompanyIdx: (0, import_pg_core.index)("expense_requests_company_idx").on(table.companyId),
        expenseRequestsBranchIdx: (0, import_pg_core.index)("expense_requests_branch_idx").on(table.branchId),
        expenseRequestsDeletedIdx: (0, import_pg_core.index)("expense_requests_deleted_idx").on(table.isDeleted)
      };
    });
    expense_categories = expenseCategories;
    expense_requests = expenseRequests;
    bank_accounts = bankAccounts;
    treasury_transactions = treasuryTransactions;
    bank_reconciliations = bankReconciliations;
    exchange_rates = exchangeRates;
    sales_invoices = salesInvoices;
    purchase_invoices = purchaseInvoices;
    audit_logs = auditLogs;
    journal_entries = journalEntries;
    journal_lines = journalLines;
    stock_moves = stockMoves;
    quotation_items = quotationItems;
    sales_order_items = salesOrderItems;
    purchase_requests = purchaseRequests;
    purchase_request_items = purchaseRequestItems;
    companiesRelations = (0, import_drizzle_orm.relations)(companies, ({ many }) => ({
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
      expenses: many(expenses)
    }));
    branchesRelations = (0, import_drizzle_orm.relations)(branches, ({ one, many }) => ({
      company: one(companies, {
        fields: [branches.companyId],
        references: [companies.id]
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
      expenses: many(expenses)
    }));
    rolesRelations = (0, import_drizzle_orm.relations)(roles, ({ many }) => ({
      permissions: many(rolePermissions),
      users: many(users)
    }));
    permissionsRelations = (0, import_drizzle_orm.relations)(permissions, ({ many }) => ({
      roles: many(rolePermissions)
    }));
    rolePermissionsRelations = (0, import_drizzle_orm.relations)(rolePermissions, ({ one }) => ({
      role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id]
      }),
      permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id]
      })
    }));
    usersRelations = (0, import_drizzle_orm.relations)(users, ({ one, many }) => ({
      company: one(companies, {
        fields: [users.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [users.branchId],
        references: [branches.id]
      }),
      roleDef: one(roles, {
        fields: [users.roleId],
        references: [roles.id]
      }),
      sales: many(sales),
      purchases: many(purchases)
    }));
    categoriesRelations = (0, import_drizzle_orm.relations)(categories, ({ one, many }) => ({
      company: one(companies, {
        fields: [categories.companyId],
        references: [companies.id]
      }),
      products: many(products)
    }));
    customersRelations = (0, import_drizzle_orm.relations)(customers, ({ one, many }) => ({
      company: one(companies, {
        fields: [customers.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [customers.branchId],
        references: [branches.id]
      }),
      sales: many(sales)
    }));
    suppliersRelations = (0, import_drizzle_orm.relations)(suppliers, ({ one, many }) => ({
      company: one(companies, {
        fields: [suppliers.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [suppliers.branchId],
        references: [branches.id]
      }),
      purchases: many(purchases)
    }));
    productsRelations = (0, import_drizzle_orm.relations)(products, ({ one, many }) => ({
      category: one(categories, {
        fields: [products.category],
        references: [categories.id]
      }),
      unit: one(units, {
        fields: [products.unit],
        references: [units.name]
      }),
      company: one(companies, {
        fields: [products.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [products.branchId],
        references: [branches.id]
      }),
      stockMoves: many(stockMoves),
      salesItems: many(salesItems),
      purchaseItems: many(purchaseItems)
    }));
    warehousesRelations = (0, import_drizzle_orm.relations)(warehouses, ({ one, many }) => ({
      company: one(companies, {
        fields: [warehouses.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [warehouses.branchId],
        references: [branches.id]
      }),
      incomingMoves: many(stockMoves, { relationName: "toWarehouse" }),
      outgoingMoves: many(stockMoves, { relationName: "fromWarehouse" })
    }));
    stockMovesRelations = (0, import_drizzle_orm.relations)(stockMoves, ({ one }) => ({
      company: one(companies, {
        fields: [stockMoves.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [stockMoves.branchId],
        references: [branches.id]
      }),
      product: one(products, {
        fields: [stockMoves.productId],
        references: [products.id]
      }),
      fromWarehouse: one(warehouses, {
        fields: [stockMoves.fromWarehouseId],
        references: [warehouses.id],
        relationName: "fromWarehouse"
      }),
      toWarehouse: one(warehouses, {
        fields: [stockMoves.toWarehouseId],
        references: [warehouses.id],
        relationName: "toWarehouse"
      })
    }));
    salesRelations = (0, import_drizzle_orm.relations)(sales, ({ one, many }) => ({
      company: one(companies, {
        fields: [sales.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [sales.branchId],
        references: [branches.id]
      }),
      customer: one(customers, {
        fields: [sales.customerId],
        references: [customers.id]
      }),
      cashier: one(users, {
        fields: [sales.cashierId],
        references: [users.id]
      }),
      items: many(salesItems)
    }));
    salesItemsRelations = (0, import_drizzle_orm.relations)(salesItems, ({ one }) => ({
      sale: one(sales, {
        fields: [salesItems.saleId],
        references: [sales.id]
      }),
      product: one(products, {
        fields: [salesItems.productId],
        references: [products.id]
      })
    }));
    purchasesRelations = (0, import_drizzle_orm.relations)(purchases, ({ one, many }) => ({
      company: one(companies, {
        fields: [purchases.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [purchases.branchId],
        references: [branches.id]
      }),
      supplier: one(suppliers, {
        fields: [purchases.supplierId],
        references: [suppliers.id]
      }),
      creator: one(users, {
        fields: [purchases.createdBy],
        references: [users.id]
      }),
      items: many(purchaseItems)
    }));
    purchaseItemsRelations = (0, import_drizzle_orm.relations)(purchaseItems, ({ one }) => ({
      purchase: one(purchases, {
        fields: [purchaseItems.purchaseId],
        references: [purchases.id]
      }),
      product: one(products, {
        fields: [purchaseItems.productId],
        references: [products.id]
      })
    }));
    accountsRelations = (0, import_drizzle_orm.relations)(accounts, ({ one, many }) => ({
      company: one(companies, {
        fields: [accounts.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [accounts.branchId],
        references: [branches.id]
      }),
      parent: one(accounts, {
        fields: [accounts.parentId],
        references: [accounts.id],
        relationName: "parentChild"
      }),
      children: many(accounts, { relationName: "parentChild" }),
      journalDetails: many(journalDetails),
      journalLines: many(journalLines),
      expenses: many(expenses)
    }));
    journalEntriesRelations = (0, import_drizzle_orm.relations)(journalEntries, ({ one, many }) => ({
      company: one(companies, {
        fields: [journalEntries.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [journalEntries.branchId],
        references: [branches.id]
      }),
      details: many(journalDetails),
      lines: many(journalLines)
    }));
    journalDetailsRelations = (0, import_drizzle_orm.relations)(journalDetails, ({ one }) => ({
      entry: one(journalEntries, {
        fields: [journalDetails.journalEntryId],
        references: [journalEntries.id]
      }),
      account: one(accounts, {
        fields: [journalDetails.accountId],
        references: [accounts.id]
      })
    }));
    journalLinesRelations = (0, import_drizzle_orm.relations)(journalLines, ({ one }) => ({
      entry: one(journalEntries, {
        fields: [journalLines.journalEntryId],
        references: [journalEntries.id]
      }),
      account: one(accounts, {
        fields: [journalLines.accountId],
        references: [accounts.id]
      })
    }));
    paymentsRelations = (0, import_drizzle_orm.relations)(payments, ({ one }) => ({
      company: one(companies, {
        fields: [payments.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [payments.branchId],
        references: [branches.id]
      })
    }));
    expensesRelations = (0, import_drizzle_orm.relations)(expenses, ({ one }) => ({
      account: one(accounts, {
        fields: [expenses.accountId],
        references: [accounts.id]
      }),
      company: one(companies, {
        fields: [expenses.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [expenses.branchId],
        references: [branches.id]
      })
    }));
    invoicesRelations = (0, import_drizzle_orm.relations)(invoices, ({ many }) => ({
      items: many(invoiceItems)
    }));
    invoiceItemsRelations = (0, import_drizzle_orm.relations)(invoiceItems, ({ one }) => ({
      invoice: one(invoices, {
        fields: [invoiceItems.invoiceId],
        references: [invoices.id]
      })
    }));
    currenciesRelations = (0, import_drizzle_orm.relations)(currencies, ({ one, many }) => ({
      company: one(companies, {
        fields: [currencies.companyId],
        references: [companies.id]
      }),
      rateHistory: many(exchangeRatesHistory)
    }));
    exchangeRatesHistoryRelations = (0, import_drizzle_orm.relations)(exchangeRatesHistory, ({ one }) => ({
      currency: one(currencies, {
        fields: [exchangeRatesHistory.currencyId],
        references: [currencies.id]
      })
    }));
    taxesRelations = (0, import_drizzle_orm.relations)(taxes, ({ one }) => ({
      company: one(companies, {
        fields: [taxes.companyId],
        references: [companies.id]
      })
    }));
    paymentMethodsRelations = (0, import_drizzle_orm.relations)(paymentMethods, ({ one }) => ({
      company: one(companies, {
        fields: [paymentMethods.companyId],
        references: [companies.id]
      }),
      account: one(accounts, {
        fields: [paymentMethods.accountId],
        references: [accounts.id]
      })
    }));
    exchangeRatesRelations = (0, import_drizzle_orm.relations)(exchangeRates, ({ one }) => ({
      currency: one(currencies, {
        fields: [exchangeRates.currencyId],
        references: [currencies.id]
      }),
      company: one(companies, {
        fields: [exchangeRates.companyId],
        references: [companies.id]
      })
    }));
    salesInvoicesRelations = (0, import_drizzle_orm.relations)(salesInvoices, ({ one }) => ({
      company: one(companies, {
        fields: [salesInvoices.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [salesInvoices.branchId],
        references: [branches.id]
      }),
      customer: one(customers, {
        fields: [salesInvoices.customerId],
        references: [customers.id]
      }),
      cashier: one(users, {
        fields: [salesInvoices.cashierId],
        references: [users.id]
      })
    }));
    purchaseInvoicesRelations = (0, import_drizzle_orm.relations)(purchaseInvoices, ({ one }) => ({
      company: one(companies, {
        fields: [purchaseInvoices.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [purchaseInvoices.branchId],
        references: [branches.id]
      }),
      supplier: one(suppliers, {
        fields: [purchaseInvoices.supplierId],
        references: [suppliers.id]
      }),
      warehouse: one(warehouses, {
        fields: [purchaseInvoices.warehouseId],
        references: [warehouses.id]
      }),
      creator: one(users, {
        fields: [purchaseInvoices.createdBy],
        references: [users.id]
      })
    }));
    auditLogsRelations = (0, import_drizzle_orm.relations)(auditLogs, ({ one }) => ({
      user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id]
      }),
      company: one(companies, {
        fields: [auditLogs.companyId],
        references: [companies.id]
      }),
      branch: one(branches, {
        fields: [auditLogs.branchId],
        references: [branches.id]
      })
    }));
  }
});

// src/core/database/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  accountsRelations: () => accountsRelations,
  auditLogs: () => auditLogs,
  auditLogsRelations: () => auditLogsRelations,
  audit_logs: () => audit_logs,
  bankAccounts: () => bankAccounts,
  bankReconciliations: () => bankReconciliations,
  bank_accounts: () => bank_accounts,
  bank_reconciliations: () => bank_reconciliations,
  branches: () => branches,
  branchesRelations: () => branchesRelations,
  cashboxes: () => cashboxes,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  companies: () => companies,
  companiesRelations: () => companiesRelations,
  currencies: () => currencies,
  currenciesRelations: () => currenciesRelations,
  customers: () => customers,
  customersRelations: () => customersRelations,
  exchangeRates: () => exchangeRates,
  exchangeRatesHistory: () => exchangeRatesHistory,
  exchangeRatesHistoryRelations: () => exchangeRatesHistoryRelations,
  exchangeRatesRelations: () => exchangeRatesRelations,
  exchange_rates: () => exchange_rates,
  expenseCategories: () => expenseCategories,
  expenseRequests: () => expenseRequests,
  expense_categories: () => expense_categories,
  expense_requests: () => expense_requests,
  expenses: () => expenses,
  expensesRelations: () => expensesRelations,
  invoiceItems: () => invoiceItems,
  invoiceItemsRelations: () => invoiceItemsRelations,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  journalDetails: () => journalDetails,
  journalDetailsRelations: () => journalDetailsRelations,
  journalEntries: () => journalEntries,
  journalEntriesRelations: () => journalEntriesRelations,
  journalLines: () => journalLines,
  journalLinesRelations: () => journalLinesRelations,
  journal_entries: () => journal_entries,
  journal_lines: () => journal_lines,
  paymentMethods: () => paymentMethods,
  paymentMethodsRelations: () => paymentMethodsRelations,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  permissions: () => permissions,
  permissionsRelations: () => permissionsRelations,
  postingRules: () => postingRules,
  products: () => products,
  productsRelations: () => productsRelations,
  purchaseInvoices: () => purchaseInvoices,
  purchaseInvoicesRelations: () => purchaseInvoicesRelations,
  purchaseItems: () => purchaseItems,
  purchaseItemsRelations: () => purchaseItemsRelations,
  purchaseRequestItems: () => purchaseRequestItems,
  purchaseRequests: () => purchaseRequests,
  purchase_invoices: () => purchase_invoices,
  purchase_request_items: () => purchase_request_items,
  purchase_requests: () => purchase_requests,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  quotationItems: () => quotationItems,
  quotation_items: () => quotation_items,
  quotations: () => quotations,
  rolePermissions: () => rolePermissions,
  rolePermissionsRelations: () => rolePermissionsRelations,
  roles: () => roles,
  rolesRelations: () => rolesRelations,
  sales: () => sales,
  salesInvoices: () => salesInvoices,
  salesInvoicesRelations: () => salesInvoicesRelations,
  salesItems: () => salesItems,
  salesItemsRelations: () => salesItemsRelations,
  salesOrderItems: () => salesOrderItems,
  salesOrders: () => salesOrders,
  salesRelations: () => salesRelations,
  sales_invoices: () => sales_invoices,
  sales_order_items: () => sales_order_items,
  settings: () => settings,
  stockMoves: () => stockMoves,
  stockMovesRelations: () => stockMovesRelations,
  stock_moves: () => stock_moves,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  taxes: () => taxes,
  taxesRelations: () => taxesRelations,
  treasuryTransactions: () => treasuryTransactions,
  treasury_transactions: () => treasury_transactions,
  units: () => units,
  userSessions: () => userSessions,
  users: () => users,
  usersRelations: () => usersRelations,
  warehouses: () => warehouses,
  warehousesRelations: () => warehousesRelations
});
var init_schema2 = __esm({
  "src/core/database/schema.ts"() {
    init_schema();
  }
});

// src/core/database/index.ts
var database_exports = {};
__export(database_exports, {
  createPool: () => createPool,
  db: () => db
});
var import_node_postgres, import_pg, Pool, createPool, pool, db;
var init_database = __esm({
  "src/core/database/index.ts"() {
    import_node_postgres = require("drizzle-orm/node-postgres");
    import_pg = __toESM(require("pg"), 1);
    init_schema2();
    ({ Pool } = import_pg.default);
    createPool = () => {
      const isUnixSocket = process.env.SQL_HOST?.startsWith("/");
      return new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : isUnixSocket ? void 0 : 5432,
        connectionTimeoutMillis: 15e3,
        idleTimeoutMillis: 3e4,
        max: 20
      });
    };
    pool = createPool();
    pool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
    db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
  }
});

// src/core/repositories/CurrencyRepository.ts
var CurrencyRepository_exports = {};
__export(CurrencyRepository_exports, {
  CurrencyRepository: () => CurrencyRepository
});
var import_drizzle_orm3, CurrencyRepository;
var init_CurrencyRepository = __esm({
  "src/core/repositories/CurrencyRepository.ts"() {
    init_database();
    init_schema2();
    import_drizzle_orm3 = require("drizzle-orm");
    CurrencyRepository = class {
      static async getCurrencies() {
        return await db.select().from(currencies);
      }
      static async findCurrencyById(id) {
        const res = await db.select().from(currencies).where((0, import_drizzle_orm3.eq)(currencies.id, id));
        return res[0] || null;
      }
      static async findCurrencyByCode(code) {
        const res = await db.select().from(currencies).where((0, import_drizzle_orm3.eq)(currencies.code, code.toUpperCase()));
        return res[0] || null;
      }
      static async getBaseCurrency() {
        const all = await this.getCurrencies();
        const base = all.find((c) => c.isDefault === "true" || c.isDefault === "1");
        if (base) return base;
        if (all.length > 0) return all[0];
        return {
          id: "curr_usd",
          code: "USD",
          name: "\u062F\u0648\u0644\u0627\u0631 \u0623\u0645\u0631\u064A\u0643\u064A",
          symbol: "$",
          exchangeRate: "1.0",
          isDefault: "true"
        };
      }
      static async getBaseCurrencyCode() {
        const base = await this.getBaseCurrency();
        return base.code || "USD";
      }
      static async setBaseCurrency(currencyIdOrCode, changedBy) {
        let target = await this.findCurrencyById(currencyIdOrCode);
        if (!target) {
          target = await this.findCurrencyByCode(currencyIdOrCode);
        }
        if (!target) {
          throw new Error("\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
        }
        const oldRate = parseFloat(target.exchangeRate || "1.0") || 1;
        const all = await this.getCurrencies();
        for (const curr of all) {
          if (curr.id === target.id) {
            await db.update(currencies).set({
              isDefault: "true",
              exchangeRate: "1.0",
              updatedAt: /* @__PURE__ */ new Date()
            }).where((0, import_drizzle_orm3.eq)(currencies.id, curr.id));
          } else {
            const currentRate = parseFloat(curr.exchangeRate || "1.0") || 1;
            const newRate = oldRate > 0 ? currentRate / oldRate : 1;
            const formattedRate = Number(newRate.toFixed(6)).toString();
            await db.update(currencies).set({
              isDefault: "false",
              exchangeRate: formattedRate,
              updatedAt: /* @__PURE__ */ new Date()
            }).where((0, import_drizzle_orm3.eq)(currencies.id, curr.id));
            await this.addExchangeRateHistory({
              currencyId: curr.id,
              currencyCode: curr.code,
              rate: formattedRate,
              notes: `\u0625\u0639\u0627\u062F\u0629 \u0627\u062D\u062A\u0633\u0627\u0628 \u0646\u0633\u0628\u0629 \u0627\u0644\u0635\u0631\u0641 \u0628\u0639\u062F \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0625\u0644\u0649 (${target.code})`,
              createdBy: changedBy || "system"
            });
          }
        }
        await this.addExchangeRateHistory({
          currencyId: target.id,
          currencyCode: target.code,
          rate: "1.0",
          notes: `\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0639\u0645\u0644\u0629 (${target.code}) \u0643\u0639\u0645\u0644\u0629 \u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0634\u0631\u0643\u0629`,
          createdBy: changedBy || "system"
        });
        return await this.getCurrencies();
      }
      static async upsertCurrency(data) {
        const id = data.id || "curr_" + Math.random().toString(36).substr(2, 9);
        const code = (data.code || "").toUpperCase();
        const isDef = data.isDefault === true || data.isDefault === "true";
        if (isDef) {
          await db.update(currencies).set({ isDefault: "false" });
        }
        const dbValue = {
          id,
          code,
          name: data.name,
          symbol: data.symbol || code,
          exchangeRate: isDef ? "1.0" : (data.exchangeRate !== void 0 ? data.exchangeRate : 1).toString(),
          isDefault: isDef ? "true" : "false",
          companyId: data.companyId || null
        };
        const existing = await this.findCurrencyById(id);
        if (existing) {
          await db.update(currencies).set(dbValue).where((0, import_drizzle_orm3.eq)(currencies.id, id));
        } else {
          await db.insert(currencies).values(dbValue);
        }
        await this.addExchangeRateHistory({
          currencyId: id,
          currencyCode: code,
          rate: dbValue.exchangeRate,
          effectiveDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          notes: "\u0625\u0646\u0634\u0627\u0621/\u062A\u062D\u062F\u064A\u062B \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0629",
          createdBy: data.recordedBy || "system"
        });
        return await this.findCurrencyById(id);
      }
      static async updateRate(id, exchangeRate, changedBy) {
        const currency = await this.findCurrencyById(id);
        if (!currency) {
          throw new Error("\u0627\u0644\u0639\u0645\u0644\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
        }
        await db.update(currencies).set({
          exchangeRate: exchangeRate.toString(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm3.eq)(currencies.id, id));
        const historyRecord = {
          id: "rate_h_" + Math.random().toString(36).substr(2, 9),
          currencyId: id,
          currencyCode: currency.code,
          rate: exchangeRate.toString(),
          effectiveDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          notes: "\u062A\u0639\u062F\u064A\u0644 \u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u0631\u0633\u0645\u064A",
          createdBy: changedBy || "system"
        };
        await this.addExchangeRateHistory(historyRecord);
        return await this.findCurrencyById(id);
      }
      static async deleteCurrency(id) {
        const currency = await this.findCurrencyById(id);
        if (currency?.isDefault === "true") {
          throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0646\u0638\u0627\u0645.");
        }
        await db.delete(currencies).where((0, import_drizzle_orm3.eq)(currencies.id, id));
        return { success: true };
      }
      static async getExchangeRateHistory(currencyId) {
        if (currencyId) {
          return await db.select().from(exchangeRatesHistory).where((0, import_drizzle_orm3.eq)(exchangeRatesHistory.currencyId, currencyId)).orderBy((0, import_drizzle_orm3.desc)(exchangeRatesHistory.createdAt));
        }
        return await db.select().from(exchangeRatesHistory).orderBy((0, import_drizzle_orm3.desc)(exchangeRatesHistory.createdAt));
      }
      static async getHistoricalRate(currencyCode, targetDate) {
        const code = (currencyCode || "").toUpperCase();
        const baseCode = (await this.getBaseCurrencyCode()).toUpperCase();
        if (!code || code === baseCode) return 1;
        const dateStr = targetDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const history = await db.select().from(exchangeRatesHistory).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(exchangeRatesHistory.currencyCode, code), (0, import_drizzle_orm3.lte)(exchangeRatesHistory.effectiveDate, dateStr))).orderBy((0, import_drizzle_orm3.desc)(exchangeRatesHistory.effectiveDate), (0, import_drizzle_orm3.desc)(exchangeRatesHistory.createdAt)).limit(1);
        if (history.length > 0 && history[0].rate) {
          return parseFloat(history[0].rate) || 1;
        }
        const curr = await this.findCurrencyByCode(code);
        if (curr && curr.exchangeRate) {
          return parseFloat(curr.exchangeRate) || 1;
        }
        return 1;
      }
      static async addExchangeRateHistory(data) {
        const id = data.id || "rate_h_" + Math.random().toString(36).substr(2, 9);
        const dbValue = {
          id,
          currencyId: data.currencyId,
          currencyCode: data.currencyCode,
          rate: data.rate.toString(),
          effectiveDate: data.effectiveDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          notes: data.notes || "\u062A\u062D\u062F\u064A\u062B \u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641",
          createdBy: data.createdBy || "system"
        };
        await db.insert(exchangeRatesHistory).values(dbValue);
        return dbValue;
      }
    };
  }
});

// src/core/services/JournalEngine.ts
var JournalEngine_exports = {};
__export(JournalEngine_exports, {
  JournalEngine: () => JournalEngine
});
var import_drizzle_orm4, JournalEngine;
var init_JournalEngine = __esm({
  "src/core/services/JournalEngine.ts"() {
    init_database();
    init_schema2();
    import_drizzle_orm4 = require("drizzle-orm");
    init_CurrencyRepository();
    JournalEngine = class {
      /**
       * Validate double entry arithmetic and account status
       */
      static async validateLines(lines, options) {
        if (!lines || !Array.isArray(lines) || lines.length < 2) {
          throw new Error("\u064A\u062C\u0628 \u0623\u0646 \u064A\u062D\u062A\u0648\u064A \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u0639\u0644\u0649 \u0633\u0637\u0631\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 (\u0645\u062F\u064A\u0646 \u0648\u062F\u0627\u0626\u0646).");
        }
        const baseCurrency = options?.baseCurrency || await CurrencyRepository.getBaseCurrencyCode();
        const globalCurrency = options?.currency || lines[0]?.currency || baseCurrency;
        const globalRate = options?.exchangeRate || lines[0]?.exchangeRate || 1;
        let totalBaseDebit = 0;
        let totalBaseCredit = 0;
        let totalForeignDebit = 0;
        let totalForeignCredit = 0;
        const normalizedLines = [];
        for (const line of lines) {
          if (!line.accountId) {
            throw new Error("\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0643\u0627\u0641\u0629 \u0633\u0637\u0648\u0631 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A.");
          }
          const [acc] = await db.select().from(accounts).where((0, import_drizzle_orm4.eq)(accounts.id, line.accountId));
          if (!acc) {
            throw new Error(`\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A (ID: ${line.accountId}) \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0634\u062C\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A.`);
          }
          if (acc.isActive === false) {
            throw new Error(`\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A (${acc.name} - ${acc.code}) \u0645\u0639\u0637\u0644 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0639\u0644\u064A\u0647.`);
          }
          const lineCurrency = line.currency || globalCurrency;
          const rate = Number(line.exchangeRate) || Number(globalRate) || 1;
          let fDebit = Math.max(0, Number(line.foreignDebit) || 0);
          let fCredit = Math.max(0, Number(line.foreignCredit) || 0);
          let bDebit = Math.max(0, Number(line.debit) || 0);
          let bCredit = Math.max(0, Number(line.credit) || 0);
          if (fDebit > 0 && bDebit === 0) bDebit = fDebit * rate;
          if (fCredit > 0 && bCredit === 0) bCredit = fCredit * rate;
          if (bDebit > 0 && fDebit === 0) fDebit = rate > 0 ? bDebit / rate : bDebit;
          if (bCredit > 0 && fCredit === 0) fCredit = rate > 0 ? bCredit / rate : bCredit;
          totalBaseDebit += bDebit;
          totalBaseCredit += bCredit;
          totalForeignDebit += fDebit;
          totalForeignCredit += fCredit;
          normalizedLines.push({
            ...line,
            currency: lineCurrency,
            exchangeRate: rate,
            foreignDebit: fDebit,
            foreignCredit: fCredit,
            debit: bDebit,
            credit: bCredit,
            accountCode: acc.code,
            accountName: acc.name,
            accountType: acc.type
          });
        }
        const roundedBaseDebit = Math.round(totalBaseDebit * 100) / 100;
        const roundedBaseCredit = Math.round(totalBaseCredit * 100) / 100;
        const difference = Math.abs(roundedBaseDebit - roundedBaseCredit);
        const isBalanced = difference <= 0.01;
        return {
          normalizedLines,
          baseCurrency,
          globalCurrency,
          globalRate,
          totalBaseDebit: roundedBaseDebit,
          totalBaseCredit: roundedBaseCredit,
          totalForeignDebit: Math.round(totalForeignDebit * 100) / 100,
          totalForeignCredit: Math.round(totalForeignCredit * 100) / 100,
          isBalanced,
          difference
        };
      }
      /**
       * Post or save a journal entry with strict double-entry balance check
       */
      static async postJournalEntry(entryNumber, description, date, lines, options) {
        const status = options?.status || "posted";
        const validation = await this.validateLines(lines, options);
        if (status === "posted" && !validation.isBalanced) {
          throw new Error(
            `\u0627\u0644\u0642\u064A\u062F \u063A\u064A\u0631 \u0645\u062A\u0632\u0646! \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u062F\u064A\u0646 (${validation.totalBaseDebit.toFixed(2)} ${validation.baseCurrency}) \u0644\u0627 \u064A\u0633\u0627\u0648\u064A \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u0627\u0626\u0646 (${validation.totalBaseCredit.toFixed(2)} ${validation.baseCurrency}). \u0627\u0644\u0641\u0631\u0642: ${validation.difference.toFixed(2)}`
          );
        }
        const entryId = "je_" + Math.random().toString(36).substr(2, 9);
        const foreignAmount = Math.max(validation.totalForeignDebit, validation.totalForeignCredit);
        const baseAmount = validation.totalBaseDebit;
        await db.insert(journalEntries).values({
          id: entryId,
          entryNumber,
          description,
          date,
          status,
          currency: validation.globalCurrency,
          baseCurrency: validation.baseCurrency,
          exchangeRate: validation.globalRate.toString(),
          foreignAmount: foreignAmount.toString(),
          baseAmount: baseAmount.toString()
        });
        const detailValues = validation.normalizedLines.map((line) => ({
          id: "jd_" + Math.random().toString(36).substr(2, 9),
          journalEntryId: entryId,
          accountId: line.accountId,
          currency: line.currency,
          exchangeRate: line.exchangeRate.toString(),
          foreignDebit: line.foreignDebit.toString(),
          foreignCredit: line.foreignCredit.toString(),
          debit: line.debit.toString(),
          credit: line.credit.toString()
        }));
        await db.insert(journalDetails).values(detailValues);
        const lineValues = validation.normalizedLines.map((line) => ({
          id: "jl_" + Math.random().toString(36).substr(2, 9),
          journalEntryId: entryId,
          accountId: line.accountId,
          currency: line.currency,
          exchangeRate: line.exchangeRate.toString(),
          foreignDebit: line.foreignDebit.toString(),
          foreignCredit: line.foreignCredit.toString(),
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          description: line.description || description
        }));
        await db.insert(journalLines).values(lineValues);
        if (status === "posted") {
          await this.updateAccountBalances(validation.normalizedLines);
        }
        return {
          id: entryId,
          entryNumber,
          reference: options?.reference || null,
          description,
          date,
          status,
          totalDebit: validation.totalBaseDebit,
          totalCredit: validation.totalBaseCredit,
          currency: validation.globalCurrency,
          baseCurrency: validation.baseCurrency,
          foreignAmount,
          baseAmount
        };
      }
      /**
       * Post a draft entry (transitions status from 'draft' to 'posted' and updates GL account balances)
       */
      static async postDraftEntry(entryId) {
        const [entry] = await db.select().from(journalEntries).where((0, import_drizzle_orm4.eq)(journalEntries.id, entryId));
        if (!entry) throw new Error("\u0627\u0644\u0642\u064A\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
        if (entry.status !== "draft") {
          throw new Error(`\u0627\u0644\u0642\u064A\u062F \u0628\u0627\u0644\u062D\u0627\u0644\u0629 (${entry.status}) \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0631\u062D\u064A\u0644\u0647 \u0643\u0642\u064A\u062F \u0645\u0633\u0648\u062F\u0629.`);
        }
        const lines = await db.select().from(journalLines).where((0, import_drizzle_orm4.eq)(journalLines.journalEntryId, entryId));
        const linesInput = lines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit || "0"),
          credit: parseFloat(l.credit || "0"),
          currency: l.currency || entry.currency || "SAR",
          exchangeRate: parseFloat(l.exchangeRate || "1.0"),
          foreignDebit: parseFloat(l.foreignDebit || "0"),
          foreignCredit: parseFloat(l.foreignCredit || "0"),
          description: l.description || entry.description || ""
        }));
        const validation = await this.validateLines(linesInput, {
          currency: entry.currency || "SAR",
          baseCurrency: entry.baseCurrency || "SAR",
          exchangeRate: parseFloat(entry.exchangeRate || "1.0")
        });
        if (!validation.isBalanced) {
          throw new Error(`\u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u0633\u0648\u062F\u0629 \u063A\u064A\u0631 \u0645\u062A\u0632\u0646! \u0627\u0644\u0645\u062F\u064A\u0646: ${validation.totalBaseDebit} \u0648\u0627\u0644\u062F\u0627\u0626\u0646: ${validation.totalBaseCredit}`);
        }
        await db.update(journalEntries).set({ status: "posted", updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm4.eq)(journalEntries.id, entryId));
        await this.updateAccountBalances(validation.normalizedLines);
        return { success: true, entryId, status: "posted" };
      }
      /**
       * Safely reverse a posted journal entry with strict audit trail
       */
      static async reverseJournalEntry(entryId, reason, createdBy) {
        const [entry] = await db.select().from(journalEntries).where((0, import_drizzle_orm4.eq)(journalEntries.id, entryId));
        if (!entry) throw new Error("\u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
        if (entry.status !== "posted") {
          throw new Error("\u064A\u0645\u0643\u0646 \u0639\u0643\u0633 \u0627\u0644\u0642\u064A\u0648\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629 \u0627\u0644\u0645\u0631\u062D\u0651\u0644\u0629 \u0641\u0642\u0637.");
        }
        const originalLines = await db.select().from(journalLines).where((0, import_drizzle_orm4.eq)(journalLines.journalEntryId, entryId));
        if (originalLines.length === 0) {
          throw new Error("\u0633\u0637\u0648\u0631 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.");
        }
        const reversingLines = originalLines.map((line) => ({
          accountId: line.accountId,
          debit: parseFloat(line.credit || "0"),
          // Original credit becomes debit
          credit: parseFloat(line.debit || "0"),
          // Original debit becomes credit
          foreignDebit: parseFloat(line.foreignCredit || "0"),
          foreignCredit: parseFloat(line.foreignDebit || "0"),
          currency: line.currency || entry.currency || "SAR",
          exchangeRate: parseFloat(line.exchangeRate || "1.0"),
          description: `\u0639\u0643\u0633 \u0642\u064A\u062F \u0631\u0642\u0645 (${entry.entryNumber}) - ${reason}`
        }));
        const revEntryNum = `REV-${entry.entryNumber}`;
        const revDesc = `\u0642\u064A\u062F \u0639\u0643\u0633\u064A \u0644\u0644\u0642\u064A\u062F \u0631\u0642\u0645 (${entry.entryNumber}) - \u0627\u0644\u0633\u0628\u0628: ${reason}`;
        const reversingResult = await this.postJournalEntry(
          revEntryNum,
          revDesc,
          (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          reversingLines,
          {
            reference: `REF-REV-${entry.entryNumber}`,
            currency: entry.currency || "SAR",
            baseCurrency: entry.baseCurrency || "SAR",
            exchangeRate: parseFloat(entry.exchangeRate || "1.0"),
            status: "posted",
            createdBy: createdBy || "\u0646\u0638\u0627\u0645 \u0627\u0644\u0631\u0642\u0627\u0628\u0629 \u0648\u0627\u0644\u062A\u0623\u0642\u064A\u0642"
          }
        );
        await db.update(journalEntries).set({
          status: "posted",
          description: `${entry.description || ""} [\u0645\u0639\u0643\u0648\u0633 \u0628\u0627\u0644\u0642\u064A\u062F ${revEntryNum}]`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm4.eq)(journalEntries.id, entryId));
        return {
          success: true,
          originalEntryId: entryId,
          reversingEntry: reversingResult,
          message: `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0648\u0639\u0643\u0633 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A (${entry.entryNumber}) \u0628\u0646\u062C\u0627\u062D \u0628\u0642\u064A\u062F \u0639\u0643\u0633\u064A (${revEntryNum}).`
        };
      }
      /**
       * Internal helper to update account balances on posting
       */
      static async updateAccountBalances(normalizedLines) {
        const accountIds = Array.from(new Set(normalizedLines.map((line) => line.accountId)));
        const accountsList = await db.select().from(accounts).where((0, import_drizzle_orm4.inArray)(accounts.id, accountIds));
        const accountsMap = new Map(accountsList.map((a) => [a.id, a]));
        for (const line of normalizedLines) {
          const acc = accountsMap.get(line.accountId);
          if (acc) {
            let bal = parseFloat(acc.balance || "0");
            let foreignBal = parseFloat(acc.foreignBalance || "0");
            const baseNet = line.debit - line.credit;
            const foreignNet = line.foreignDebit - line.foreignCredit;
            if (acc.type === "asset" || acc.type === "expense") {
              bal += baseNet;
              foreignBal += foreignNet;
            } else {
              bal -= baseNet;
              foreignBal -= foreignNet;
            }
            await db.update(accounts).set({
              balance: bal.toString(),
              foreignBalance: foreignBal.toString(),
              updatedAt: /* @__PURE__ */ new Date()
            }).where((0, import_drizzle_orm4.eq)(accounts.id, line.accountId));
          }
        }
      }
      /**
       * Run complete accounting accuracy & audit check
       */
      static async verifyAccountingIntegrity() {
        const allEntries = await db.select().from(journalEntries);
        const allLines = await db.select().from(journalLines);
        const allAccounts = await db.select().from(accounts);
        let totalGLDebit = 0;
        let totalGLCredit = 0;
        for (const l of allLines) {
          const d = parseFloat(l.debit || "0");
          const c = parseFloat(l.credit || "0");
          totalGLDebit += d;
          totalGLCredit += c;
        }
        const isTrialBalanceEqual = Math.abs(totalGLDebit - totalGLCredit) <= 0.01;
        const unbalancedEntries = [];
        for (const entry of allEntries) {
          const entryLines = allLines.filter((l) => l.journalEntryId === entry.id);
          const entryDebit = entryLines.reduce((s, l) => s + parseFloat(l.debit || "0"), 0);
          const entryCredit = entryLines.reduce((s, l) => s + parseFloat(l.credit || "0"), 0);
          if (Math.abs(entryDebit - entryCredit) > 0.01) {
            unbalancedEntries.push({
              id: entry.id,
              entryNumber: entry.entryNumber,
              description: entry.description,
              debit: entryDebit,
              credit: entryCredit,
              diff: Math.abs(entryDebit - entryCredit)
            });
          }
        }
        return {
          isTrialBalanceEqual,
          totalGLDebit: Math.round(totalGLDebit * 100) / 100,
          totalGLCredit: Math.round(totalGLCredit * 100) / 100,
          unbalancedEntriesCount: unbalancedEntries.length,
          unbalancedEntries,
          totalEntriesCount: allEntries.length,
          postedEntriesCount: allEntries.filter((e) => e.status === "posted").length,
          draftEntriesCount: allEntries.filter((e) => e.status === "draft").length,
          reversedEntriesCount: allEntries.filter((e) => e.status === "reversed").length,
          activeAccountsCount: allAccounts.filter((a) => a.isActive !== false).length,
          checkedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    };
  }
});

// server.ts
var import_express17 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
init_database();

// src/core/database/initSchema.ts
init_database();
var import_drizzle_orm2 = require("drizzle-orm");
async function execSql(query, name) {
  try {
    await db.execute(query);
  } catch (err) {
    try {
      await db.execute(import_drizzle_orm2.sql`ROLLBACK`);
    } catch (_) {
    }
  }
}
async function withAutoMigration(fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn("[AutoMigration] Query failed due to missing schema or relation, executing self-healing migration...", err);
    try {
      await db.execute(import_drizzle_orm2.sql`ROLLBACK`);
    } catch (_) {
    }
    await ensureDatabaseTables(true);
    try {
      await db.execute(import_drizzle_orm2.sql`ROLLBACK`);
    } catch (_) {
    }
    return await fn();
  }
}
var isSchemaEnsured = false;
var ddlSupported = null;
async function ensureDatabaseTables(force = false) {
  if (force) {
    isSchemaEnsured = false;
    ddlSupported = null;
  }
  if (isSchemaEnsured) {
    return;
  }
  console.log("Ensuring all database tables and schema migrations exist...");
  const testPool = createPool();
  try {
    const client = await testPool.connect();
    try {
      await client.query("CREATE TABLE IF NOT EXISTS _ddl_test (id INT)");
      await client.query("DROP TABLE IF EXISTS _ddl_test");
      ddlSupported = true;
    } finally {
      client.release(true);
    }
  } catch (err) {
    console.log("[Schema Migration] DDL check failed (no CREATE TABLE privilege). Skipping DDL execution:", err?.message || err);
    ddlSupported = false;
    isSchemaEnsured = true;
    await testPool.end().catch(() => {
    });
    return;
  }
  await testPool.end().catch(() => {
  });
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tax_number TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      logo TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "companies");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      phone TEXT,
      tax_number TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "branches");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "roles");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      module TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "permissions");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL
    );
  `, "role_permissions");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'cashier',
      company_id TEXT,
      branch_id TEXT,
      role_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "users");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      is_revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "user_sessions");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "categories");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `, "units");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      balance NUMERIC DEFAULT '0',
      credit_limit NUMERIC DEFAULT '5000',
      tax_number TEXT,
      cr_number TEXT,
      address TEXT,
      type TEXT DEFAULT 'retail',
      status TEXT DEFAULT 'active',
      notes TEXT,
      opening_balance NUMERIC DEFAULT '0',
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "customers");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      balance NUMERIC DEFAULT '0',
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "suppliers");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      price NUMERIC DEFAULT '0',
      purchase_price NUMERIC DEFAULT '0',
      stock NUMERIC DEFAULT '0',
      min_stock NUMERIC DEFAULT '0',
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      tax_rate NUMERIC DEFAULT '15',
      image TEXT,
      description TEXT,
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "products");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      location TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "warehouses");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS stock_moves (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      product_id TEXT NOT NULL,
      from_warehouse_id TEXT,
      to_warehouse_id TEXT,
      quantity NUMERIC NOT NULL,
      unit_cost NUMERIC DEFAULT '0',
      type TEXT NOT NULL,
      reference_id TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "stock_moves");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      total_without_tax NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      cash_amount NUMERIC DEFAULT '0',
      card_amount NUMERIC DEFAULT '0',
      status TEXT DEFAULT 'paid',
      customer_id TEXT,
      customer_name TEXT,
      tax_number TEXT,
      cashier_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "invoices");
  await execSql(import_drizzle_orm2.sql`
    DO $$ 
    DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'invoices' AND column_name = 'status'
      ) LOOP
        EXECUTE 'ALTER TABLE invoices DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
      END LOOP;
    END $$;
    ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status in ('paid', 'unpaid', 'partially_paid', 'returned'));
  `, "invoices_status_check_update");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      discount NUMERIC DEFAULT '0',
      discount_type TEXT DEFAULT 'percentage',
      total NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL
    );
  `, "invoice_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'paid',
      customer_id TEXT,
      cashier_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "sales");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS sales_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL
    );
  `, "sales_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      supplier_invoice_number TEXT,
      date TEXT NOT NULL,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'completed',
      warehouse_id TEXT,
      supplier_id TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "purchases");
  await execSql(import_drizzle_orm2.sql`
    DO $$ 
    DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT constraint_name 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'purchases' AND column_name = 'status'
      ) LOOP
        EXECUTE 'ALTER TABLE purchases DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
      END LOOP;
    END $$;
    ALTER TABLE purchases ADD CONSTRAINT purchases_status_check CHECK (status in ('draft', 'ordered', 'received', 'completed', 'cancelled'));
  `, "purchases_status_check_update");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      purchase_price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL
    );
  `, "purchase_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance NUMERIC DEFAULT '0',
      currency TEXT DEFAULT 'SAR',
      foreign_balance NUMERIC DEFAULT '0',
      company_id TEXT,
      branch_id TEXT,
      parent_id TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "accounts");
  await execSql(import_drizzle_orm2.sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS foreign_balance NUMERIC DEFAULT '0';`, "accounts_col_foreign_balance");
  await execSql(import_drizzle_orm2.sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';`, "accounts_col_currency");
  await execSql(import_drizzle_orm2.sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_id TEXT;`, "accounts_col_parent_id");
  await execSql(import_drizzle_orm2.sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`, "accounts_col_is_active");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      entry_number TEXT NOT NULL UNIQUE,
      reference TEXT,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'posted',
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "journal_entries");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS journal_details (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      debit NUMERIC DEFAULT '0',
      credit NUMERIC DEFAULT '0',
      currency TEXT,
      exchange_rate NUMERIC,
      foreign_debit NUMERIC,
      foreign_credit NUMERIC,
      notes TEXT
    );
  `, "journal_details");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      debit NUMERIC DEFAULT '0',
      credit NUMERIC DEFAULT '0',
      currency TEXT,
      exchange_rate NUMERIC,
      foreign_debit NUMERIC,
      foreign_credit NUMERIC,
      notes TEXT
    );
  `, "journal_lines");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      customer_id TEXT,
      supplier_id TEXT,
      amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      foreign_amount NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      account_id TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "payments");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT,
      payment_method TEXT DEFAULT 'cash',
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      company_id TEXT,
      branch_id TEXT,
      date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "expenses");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      address TEXT,
      phone TEXT,
      tax_number TEXT,
      tax_rate NUMERIC DEFAULT '15',
      currency TEXT DEFAULT 'ر.س',
      thermal_printer_width TEXT DEFAULT '80mm'
    );
  `, "settings");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS cashboxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'closed',
      current_balance NUMERIC DEFAULT '0',
      last_opened_at TEXT,
      last_closed_at TEXT
    );
  `, "cashboxes");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS posting_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT NOT NULL UNIQUE,
      account_id TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `, "posting_rules");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      exchange_rate NUMERIC DEFAULT '1.0',
      is_default TEXT DEFAULT 'false',
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "currencies");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS exchange_rates_history (
      id TEXT PRIMARY KEY,
      currency_id TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      effective_date TEXT NOT NULL,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "exchange_rates_history");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      rate NUMERIC NOT NULL DEFAULT '15',
      is_inclusive TEXT DEFAULT 'false',
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "taxes");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      account_id TEXT,
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "payment_methods");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY,
      currency_id TEXT NOT NULL,
      currency_code TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      effective_date TEXT NOT NULL,
      notes TEXT,
      company_id TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "exchange_rates");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      due_date TEXT,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      paid_amount NUMERIC DEFAULT '0',
      remaining_amount NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'paid',
      customer_id TEXT,
      cashier_id TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "sales_invoices");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      supplier_invoice_number TEXT,
      date TEXT NOT NULL,
      due_date TEXT,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      paid_amount NUMERIC DEFAULT '0',
      remaining_amount NUMERIC DEFAULT '0',
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'ordered',
      supplier_id TEXT,
      warehouse_id TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "purchase_invoices");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      ip_address TEXT,
      company_id TEXT,
      branch_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "audit_logs");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT NOT NULL UNIQUE,
      company_id TEXT,
      branch_id TEXT,
      customer_id TEXT,
      customer_name TEXT,
      date TEXT NOT NULL,
      valid_until TEXT,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "quotations");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      company_id TEXT,
      branch_id TEXT,
      product_id TEXT,
      product_name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      discount NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      total NUMERIC NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "quotation_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      company_id TEXT,
      branch_id TEXT,
      quotation_id TEXT,
      customer_id TEXT,
      customer_name TEXT,
      date TEXT NOT NULL,
      delivery_date TEXT,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      discount_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "sales_orders");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      company_id TEXT,
      branch_id TEXT,
      product_id TEXT,
      product_name TEXT NOT NULL,
      price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      discount NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      total NUMERIC NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "sales_order_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS purchase_requests (
      id TEXT PRIMARY KEY,
      request_number TEXT NOT NULL UNIQUE,
      company_id TEXT,
      branch_id TEXT,
      requester_name TEXT,
      department TEXT,
      date TEXT NOT NULL,
      required_date TEXT,
      subtotal NUMERIC DEFAULT '0',
      tax_amount NUMERIC DEFAULT '0',
      grand_total NUMERIC DEFAULT '0',
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      status TEXT DEFAULT 'pending',
      notes TEXT,
      supplier_id TEXT,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "purchase_requests");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS purchase_request_items (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      company_id TEXT,
      branch_id TEXT,
      product_id TEXT,
      product_name TEXT NOT NULL,
      estimated_price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "purchase_request_items");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      iban TEXT,
      swift TEXT,
      branch TEXT,
      currency TEXT DEFAULT 'SAR',
      current_balance NUMERIC DEFAULT '0',
      account_id TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "bank_accounts");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS treasury_transactions (
      id TEXT PRIMARY KEY,
      transaction_type TEXT NOT NULL,
      source_type TEXT,
      source_id TEXT,
      destination_type TEXT,
      destination_id TEXT,
      amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'SAR',
      exchange_rate NUMERIC DEFAULT '1.0',
      transfer_fee NUMERIC DEFAULT '0',
      date TEXT NOT NULL,
      reference_number TEXT,
      description TEXT,
      journal_entry_id TEXT,
      reconciled TEXT DEFAULT 'false',
      reconciliation_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "treasury_transactions");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS bank_reconciliations (
      id TEXT PRIMARY KEY,
      bank_account_id TEXT NOT NULL,
      statement_date TEXT NOT NULL,
      statement_ending_balance NUMERIC NOT NULL,
      ledger_ending_balance NUMERIC NOT NULL,
      difference NUMERIC DEFAULT '0',
      matched_count NUMERIC DEFAULT '0',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "bank_reconciliations");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      account_id TEXT,
      budget NUMERIC DEFAULT '0',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, "expense_categories");
  await execSql(import_drizzle_orm2.sql`
    CREATE TABLE IF NOT EXISTS expense_requests (
      id TEXT PRIMARY KEY,
      request_number TEXT NOT NULL,
      category_id TEXT,
      account_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      amount NUMERIC NOT NULL,
      tax_amount NUMERIC DEFAULT '0',
      total_amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'SAR',
      beneficiary TEXT,
      payment_method TEXT DEFAULT 'cash',
      payment_account_id TEXT,
      requested_by TEXT,
      approved_by TEXT,
      approval_date TEXT,
      rejection_reason TEXT,
      status TEXT DEFAULT 'pending',
      journal_entry_id TEXT,
      receipt_ref TEXT,
      date TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, "expense_requests");
  console.log("Running self-healing Enterprise ERP database schema migration...");
  const erpTables = [
    "companies",
    "branches",
    "roles",
    "permissions",
    "role_permissions",
    "users",
    "categories",
    "units",
    "customers",
    "suppliers",
    "products",
    "warehouses",
    "stock_moves",
    "invoices",
    "invoice_items",
    "sales",
    "sales_items",
    "purchases",
    "purchase_items",
    "accounts",
    "journal_entries",
    "journal_details",
    "journal_lines",
    "payments",
    "expenses",
    "settings",
    "cashboxes",
    "posting_rules",
    "currencies",
    "exchange_rates_history",
    "taxes",
    "payment_methods",
    "exchange_rates",
    "sales_invoices",
    "purchase_invoices",
    "audit_logs",
    "quotations",
    "quotation_items",
    "sales_orders",
    "sales_order_items",
    "purchase_requests",
    "purchase_request_items",
    "bank_accounts",
    "treasury_transactions",
    "bank_reconciliations",
    "expense_categories",
    "expense_requests"
  ];
  for (const tbl of erpTables) {
    const isSpecial = ["companies", "roles", "permissions", "units", "settings"].includes(tbl);
    let alterSql = `
      ALTER TABLE ${tbl} 
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS created_by TEXT,
        ADD COLUMN IF NOT EXISTS updated_by TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;
    if (!isSpecial) {
      alterSql += `,
        ADD COLUMN IF NOT EXISTS company_id TEXT,
        ADD COLUMN IF NOT EXISTS branch_id TEXT
      `;
    }
    if (tbl === "users") {
      alterSql += `, ADD COLUMN IF NOT EXISTS role_id TEXT`;
    }
    await execSql(import_drizzle_orm2.sql.raw(alterSql), `${tbl}_columns`);
    if (!isSpecial) {
      await execSql(import_drizzle_orm2.sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_company_id ON ${tbl}(company_id);`), `${tbl}_idx_company_id`);
      await execSql(import_drizzle_orm2.sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_branch_id ON ${tbl}(branch_id);`), `${tbl}_idx_branch_id`);
    }
    await execSql(import_drizzle_orm2.sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_is_deleted ON ${tbl}(is_deleted);`), `${tbl}_idx_is_deleted`);
  }
  const multiCurrencyTables = [
    "invoices",
    "sales",
    "sales_invoices",
    "purchases",
    "purchase_invoices",
    "quotations",
    "sales_orders",
    "purchase_requests",
    "payments",
    "expenses",
    "journal_entries",
    "journal_details",
    "journal_lines",
    "customers",
    "suppliers",
    "bank_accounts",
    "treasury_transactions",
    "expense_requests"
  ];
  for (const tbl of multiCurrencyTables) {
    await execSql(import_drizzle_orm2.sql.raw(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';`), `${tbl}_currency`);
    await execSql(import_drizzle_orm2.sql.raw(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT '1.0';`), `${tbl}_exchange_rate`);
  }
  isSchemaEnsured = true;
  console.log("Database tables ensured successfully.");
}

// server.ts
init_schema2();

// src/services/CurrencyService.ts
var DEFAULT_CURRENCIES = [
  {
    id: "curr_sar",
    code: "SAR",
    name: "\u0631\u064A\u0627\u0644 \u0633\u0639\u0648\u062F\u064A (\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629)",
    symbol: "\u0631.\u0633",
    exchangeRate: 1,
    isDefault: true
  },
  {
    id: "curr_usd",
    code: "USD",
    name: "\u062F\u0648\u0644\u0627\u0631 \u0623\u0645\u0631\u064A\u0643\u064A",
    symbol: "$",
    exchangeRate: 3.75,
    isDefault: false
  },
  {
    id: "curr_syp",
    code: "SYP",
    name: "\u0644\u064A\u0631\u0629 \u0633\u0648\u0631\u064A\u0629",
    symbol: "\u0644.\u0633",
    exchangeRate: 28e-5,
    // 1 SAR = ~3,571 SYP -> 1 SYP = 0.00028 SAR
    isDefault: false
  },
  {
    id: "curr_try",
    code: "TRY",
    name: "\u0644\u064A\u0631\u0629 \u062A\u0631\u0643\u064A\u0629",
    symbol: "\u20BA",
    exchangeRate: 0.11,
    // 1 TRY = 0.11 SAR
    isDefault: false
  }
];
var CurrencyService = class {
  /**
   * Convert an amount from one currency to another using exchange rates relative to the base currency.
   */
  static convertAmount(amount, fromCurrencyCode, toCurrencyCode, currenciesList) {
    const fromCurr = currenciesList.find((c) => c.code.toUpperCase() === fromCurrencyCode.toUpperCase()) || {
      code: fromCurrencyCode,
      exchangeRate: 1
    };
    const toCurr = currenciesList.find((c) => c.code.toUpperCase() === toCurrencyCode.toUpperCase()) || {
      code: toCurrencyCode,
      exchangeRate: 1
    };
    const fromRate = Number(fromCurr.exchangeRate) || 1;
    const toRate = Number(toCurr.exchangeRate) || 1;
    const baseAmount = amount * fromRate;
    const targetAmount = toRate > 0 ? baseAmount / toRate : baseAmount;
    const effectiveRate = amount > 0 ? targetAmount / amount : fromRate / toRate;
    return {
      sourceAmount: amount,
      sourceCurrency: fromCurrencyCode,
      targetAmount: Number(targetAmount.toFixed(4)),
      targetCurrency: toCurrencyCode,
      effectiveRate: Number(effectiveRate.toFixed(6)),
      baseAmount: Number(baseAmount.toFixed(4))
    };
  }
  /**
   * Get historical rate for a currency code at a specific date
   */
  static async getHistoricalRate(currencyCode, targetDate) {
    const { CurrencyRepository: CurrencyRepository2 } = await Promise.resolve().then(() => (init_CurrencyRepository(), CurrencyRepository_exports));
    return await CurrencyRepository2.getHistoricalRate(currencyCode, targetDate);
  }
  /**
   * Convert an amount using historical rate on a specific date
   */
  static async convertWithHistoricalRate(amount, fromCurrencyCode, toCurrencyCode, targetDate) {
    const fromRate = await this.getHistoricalRate(fromCurrencyCode, targetDate);
    const toRate = await this.getHistoricalRate(toCurrencyCode, targetDate);
    const baseAmount = amount * fromRate;
    const targetAmount = toRate > 0 ? baseAmount / toRate : baseAmount;
    const effectiveRate = amount > 0 ? targetAmount / amount : fromRate / toRate;
    return {
      sourceAmount: amount,
      sourceCurrency: fromCurrencyCode,
      targetAmount: Number(targetAmount.toFixed(4)),
      targetCurrency: toCurrencyCode,
      effectiveRate: Number(effectiveRate.toFixed(6)),
      baseAmount: Number(baseAmount.toFixed(4))
    };
  }
  /**
   * Convert Invoice amounts to target currency or recalculate base currency amounts
   */
  static convertInvoice(invoice, targetCurrency, customRate) {
    const sourceCurrency = invoice.currency || "SAR";
    const rate = customRate || Number(invoice.exchangeRate) || 1;
    const subtotal = Number(invoice.subtotal || invoice.totalWithoutTax) || 0;
    const taxAmount = Number(invoice.taxAmount) || 0;
    const discountAmount = Number(invoice.discountAmount) || 0;
    const grandTotal = Number(invoice.grandTotal) || 0;
    if (sourceCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
      return {
        ...invoice,
        convertedSubtotal: subtotal,
        convertedTax: taxAmount,
        convertedDiscount: discountAmount,
        convertedGrandTotal: grandTotal,
        rateUsed: 1,
        targetCurrency
      };
    }
    const convertedSubtotal = Number((subtotal * rate).toFixed(2));
    const convertedTax = Number((taxAmount * rate).toFixed(2));
    const convertedDiscount = Number((discountAmount * rate).toFixed(2));
    const convertedGrandTotal = Number((grandTotal * rate).toFixed(2));
    return {
      ...invoice,
      convertedSubtotal,
      convertedTax,
      convertedDiscount,
      convertedGrandTotal,
      rateUsed: rate,
      targetCurrency
    };
  }
  /**
   * Revaluation Engine: Revalue all foreign currency accounts or specified account
   */
  static async revalueForeignBalances(options) {
    const { db: db2 } = await Promise.resolve().then(() => (init_database(), database_exports));
    const { accounts: accounts3 } = await Promise.resolve().then(() => (init_schema2(), schema_exports));
    const { CurrencyRepository: CurrencyRepository2 } = await Promise.resolve().then(() => (init_CurrencyRepository(), CurrencyRepository_exports));
    const { JournalEngine: JournalEngine2 } = await Promise.resolve().then(() => (init_JournalEngine(), JournalEngine_exports));
    const today = options?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const baseCurrency = await CurrencyRepository2.getBaseCurrencyCode();
    const createdBy = options?.createdBy || "system";
    const allAccounts = await db2.select().from(accounts3);
    let forexGainAcc = allAccounts.find((a) => a.code === "4201" || a.id === "acc_forex_gain");
    if (!forexGainAcc) {
      forexGainAcc = allAccounts.find((a) => a.name.includes("\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641") || a.name.includes("Forex Gain"));
    }
    let forexLossAcc = allAccounts.find((a) => a.code === "5205" || a.id === "acc_forex_loss");
    if (!forexLossAcc) {
      forexLossAcc = allAccounts.find((a) => a.name.includes("\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641") || a.name.includes("Forex Loss"));
    }
    const gainAccId = forexGainAcc ? forexGainAcc.id : "acc_forex_gain";
    const lossAccId = forexLossAcc ? forexLossAcc.id : "acc_forex_loss";
    const revaluedItems = [];
    const journalLinesInput = [];
    let totalGain = 0;
    let totalLoss = 0;
    for (const acc of allAccounts) {
      const accCurrency = (acc.currency || baseCurrency).toUpperCase();
      if (accCurrency === baseCurrency.toUpperCase()) continue;
      if (options?.currencyCode && accCurrency !== options.currencyCode.toUpperCase()) {
        continue;
      }
      const foreignBalance = Number(acc.foreignBalance) || 0;
      const oldBaseBalance = Number(acc.balance) || 0;
      if (foreignBalance === 0 && oldBaseBalance === 0) continue;
      const rateUsed = options?.newRate && options.currencyCode?.toUpperCase() === accCurrency ? options.newRate : await this.getHistoricalRate(accCurrency, today);
      const newBaseBalance = Number((foreignBalance * rateUsed).toFixed(2));
      const diff = Number((newBaseBalance - oldBaseBalance).toFixed(2));
      if (Math.abs(diff) < 0.01) {
        revaluedItems.push({
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          currency: accCurrency,
          foreignBalance,
          oldBaseBalance,
          newBaseBalance,
          difference: 0,
          type: "none",
          rateUsed
        });
        continue;
      }
      const isAsset = acc.type === "asset";
      let type = "gain";
      if (isAsset) {
        if (diff > 0) {
          type = "gain";
          totalGain += diff;
          journalLinesInput.push({
            accountId: acc.id,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u062D\u0633\u0627\u0628 (${acc.name}) \u0628\u0633\u0639\u0631 \u0635\u0631\u0641 ${rateUsed}`
          });
          journalLinesInput.push({
            accountId: gainAccId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0623\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 (${acc.name})`
          });
        } else {
          type = "loss";
          totalLoss += Math.abs(diff);
          journalLinesInput.push({
            accountId: lossAccId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0623\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 (${acc.name})`
          });
          journalLinesInput.push({
            accountId: acc.id,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u062D\u0633\u0627\u0628 (${acc.name}) \u0628\u0633\u0639\u0631 \u0635\u0631\u0641 ${rateUsed}`
          });
        }
      } else {
        if (diff > 0) {
          type = "loss";
          totalLoss += diff;
          journalLinesInput.push({
            accountId: lossAccId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0623\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u062A\u0632\u0627\u0645 (${acc.name})`
          });
          journalLinesInput.push({
            accountId: acc.id,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0632\u0627\u0645 (${acc.name})`
          });
        } else {
          type = "gain";
          totalGain += Math.abs(diff);
          journalLinesInput.push({
            accountId: acc.id,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0632\u0627\u0645 (${acc.name})`
          });
          journalLinesInput.push({
            accountId: gainAccId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0623\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u062A\u0632\u0627\u0645 (${acc.name})`
          });
        }
      }
      revaluedItems.push({
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        currency: accCurrency,
        foreignBalance,
        oldBaseBalance,
        newBaseBalance,
        difference: diff,
        type,
        rateUsed
      });
    }
    let journalEntryId = null;
    if (journalLinesInput.length > 0) {
      const entryNum = `REV-${Date.now().toString().slice(-6)}`;
      const entry = await JournalEngine2.postJournalEntry(
        entryNum,
        `\u0642\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0623\u0635\u0644/\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0623\u062C\u0646\u0628\u064A\u0629 \u062A\u0627\u0631\u064A\u062E ${today}`,
        today,
        journalLinesInput,
        {
          status: "posted",
          createdBy
        }
      );
      journalEntryId = entry.id;
    }
    const netGainLoss = Number((totalGain - totalLoss).toFixed(2));
    return {
      date: today,
      baseCurrency,
      revaluedAccounts: revaluedItems,
      totalGain: Number(totalGain.toFixed(2)),
      totalLoss: Number(totalLoss.toFixed(2)),
      netGainLoss,
      journalEntryId
    };
  }
  /**
   * Calculate Realized FX Gain or Loss when an invoice issued in foreign currency is settled at a new exchange rate.
   */
  static calculateFxDifference(amountForeign, invoiceExchangeRate, paymentExchangeRate, transactionType = "sale") {
    const originalValueBase = amountForeign * invoiceExchangeRate;
    const settledValueBase = amountForeign * paymentExchangeRate;
    let diff = settledValueBase - originalValueBase;
    if (transactionType === "purchase") {
      diff = -diff;
    }
    const roundedDiff = Number(diff.toFixed(2));
    if (Math.abs(roundedDiff) < 0.01) {
      return { differenceBase: 0, type: "none", amount: 0 };
    }
    return {
      differenceBase: roundedDiff,
      type: roundedDiff > 0 ? "gain" : "loss",
      amount: Math.abs(roundedDiff)
    };
  }
  /**
   * Format currency display string cleanly.
   */
  static formatCurrencyDisplay(amount, currencyCode, symbol) {
    const decimals = currencyCode === "SYP" ? 0 : 2;
    const formattedNum = amount.toLocaleString("ar-SA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${formattedNum} ${symbol || currencyCode}`;
  }
};

// src/core/repositories/UserRepository.ts
init_database();
init_schema2();
var import_drizzle_orm5 = require("drizzle-orm");
var UserRepository = class {
  static async findAll() {
    return await db.select().from(users);
  }
  static async findById(id) {
    const result = await db.select().from(users).where((0, import_drizzle_orm5.eq)(users.id, id));
    return result[0] || null;
  }
  static async findByUid(uid) {
    const result = await db.select().from(users).where((0, import_drizzle_orm5.eq)(users.uid, uid));
    return result[0] || null;
  }
  static async findByEmail(email) {
    const result = await db.select().from(users).where((0, import_drizzle_orm5.eq)(users.email, email));
    return result[0] || null;
  }
  static async create(userData) {
    await db.insert(users).values(userData);
    return userData;
  }
  static async update(id, userData) {
    await db.update(users).set(userData).where((0, import_drizzle_orm5.eq)(users.id, id));
    return { id, ...userData };
  }
  static async delete(id) {
    await db.delete(users).where((0, import_drizzle_orm5.eq)(users.id, id));
    return { success: true };
  }
  static async getRolesWithPermissions() {
    const allRoles = await db.select().from(roles);
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (r) => {
        const rps = await db.select({
          id: permissions.id,
          code: permissions.code,
          name: permissions.name,
          module: permissions.module,
          description: permissions.description
        }).from(rolePermissions).innerJoin(permissions, (0, import_drizzle_orm5.eq)(rolePermissions.permissionId, permissions.id)).where((0, import_drizzle_orm5.eq)(rolePermissions.roleId, r.id));
        return {
          ...r,
          permissions: rps
        };
      })
    );
    return rolesWithPermissions;
  }
  static async saveRole(data) {
    const { id, name, code, description, permissionIds } = data;
    const roleId = id || "role_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(roles).where((0, import_drizzle_orm5.eq)(roles.id, roleId));
    const dbValue = {
      id: roleId,
      name,
      code,
      description,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existing.length > 0) {
      await db.update(roles).set(dbValue).where((0, import_drizzle_orm5.eq)(roles.id, roleId));
    } else {
      await db.insert(roles).values(dbValue);
    }
    if (Array.isArray(permissionIds)) {
      await db.delete(rolePermissions).where((0, import_drizzle_orm5.eq)(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        const rpsValues = permissionIds.map((pId, idx) => ({
          id: `rp_${roleId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          roleId,
          permissionId: pId
        }));
        await db.insert(rolePermissions).values(rpsValues);
      }
    }
    return { id: roleId, name, code, description, permissionIds };
  }
  static async deleteRole(id) {
    if (["role_manager", "role_accountant", "role_inventory", "role_cashier"].includes(id)) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0646\u0638\u0627\u0645\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0624\u0633\u0633\u0629");
    }
    await db.delete(roles).where((0, import_drizzle_orm5.eq)(roles.id, id));
    return { success: true };
  }
  static async getAllPermissions() {
    return await db.select().from(permissions);
  }
  static async getUsers(options) {
    const conditions = [];
    if (options?.role) {
      conditions.push((0, import_drizzle_orm5.eq)(users.role, options.role));
    }
    const whereClause = conditions.length > 0 ? (0, import_drizzle_orm5.and)(...conditions) : void 0;
    let total = 0;
    if (options?.page || options?.limit) {
      const countResult = await db.select({ count: import_drizzle_orm5.sql`count(*)` }).from(users).where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      name: users.name,
      role: users.role,
      roleId: users.roleId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      roleCode: roles.code
    }).from(users).leftJoin(roles, (0, import_drizzle_orm5.eq)(users.roleId, roles.id));
    if (whereClause) {
      query = query.where(whereClause);
    }
    if (options?.page && options?.limit) {
      const p = options.page || 1;
      const l = options.limit || 10;
      query = query.limit(l).offset((p - 1) * l);
    }
    const items = await query;
    return { items, pagination: options?.page || options?.limit ? { page: options.page || 1, limit: options.limit || 10, total } : void 0 };
  }
  static async saveUser(u) {
    const id = u.id || "user_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(users).where((0, import_drizzle_orm5.eq)(users.id, id));
    let finalRole = u.role || "cashier";
    if (u.roleId) {
      const [r] = await db.select().from(roles).where((0, import_drizzle_orm5.eq)(roles.id, u.roleId));
      if (r) {
        finalRole = r.code;
      }
    }
    const dbValue = {
      id,
      uid: u.uid || id,
      email: u.email,
      name: u.name,
      role: finalRole,
      roleId: u.roleId || null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existing.length > 0) {
      await db.update(users).set(dbValue).where((0, import_drizzle_orm5.eq)(users.id, id));
    } else {
      await db.insert(users).values(dbValue);
    }
    return dbValue;
  }
  static async deleteUser(id) {
    await db.delete(users).where((0, import_drizzle_orm5.eq)(users.id, id));
    return { success: true };
  }
};

// src/core/repositories/CustomerRepository.ts
init_database();
init_schema2();
var import_drizzle_orm6 = require("drizzle-orm");
var CustomerRepository = class {
  static async findAll(params) {
    let query = db.select().from(customers);
    const conditions = [];
    if (params?.search) {
      const searchTerm = `%${params.search}%`;
      conditions.push(
        (0, import_drizzle_orm6.or)(
          (0, import_drizzle_orm6.like)(customers.name, searchTerm),
          (0, import_drizzle_orm6.like)(customers.phone, searchTerm),
          (0, import_drizzle_orm6.like)(customers.taxNumber, searchTerm)
        )
      );
    }
    if (params?.type && params.type !== "all") {
      conditions.push((0, import_drizzle_orm6.eq)(customers.type, params.type));
    }
    if (params?.status && params.status !== "all") {
      conditions.push((0, import_drizzle_orm6.eq)(customers.status, params.status));
    }
    if (conditions.length > 0) {
      query = query.where((0, import_drizzle_orm6.and)(...conditions));
    }
    if (params?.page || params?.limit) {
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const offset = (page - 1) * limit;
      return await query.limit(limit).offset(offset);
    }
    return await query;
  }
  static async findById(id) {
    const result = await db.select().from(customers).where((0, import_drizzle_orm6.eq)(customers.id, id));
    return result[0] || null;
  }
  static async upsert(customerData) {
    const existing = await this.findById(customerData.id);
    if (existing) {
      await db.update(customers).set({
        ...customerData,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm6.eq)(customers.id, customerData.id));
    } else {
      await db.insert(customers).values(customerData);
    }
    return await this.findById(customerData.id);
  }
  static async updateBalance(id, newBalance) {
    await db.update(customers).set({ balance: newBalance.toString(), updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm6.eq)(customers.id, id));
    return await this.findById(id);
  }
  static async adjustBalance(id, deltaAmount) {
    const customer = await this.findById(id);
    if (!customer) throw new Error("\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const current = parseFloat(customer.balance || "0");
    const updated = current + deltaAmount;
    await this.updateBalance(id, updated);
    return updated;
  }
  static async getCustomerInvoices(customerId) {
    const invList = await db.select().from(invoices).where((0, import_drizzle_orm6.eq)(invoices.customerId, customerId));
    return invList;
  }
  static async getCustomerPayments(customerId) {
    const pmts = await db.select().from(payments).where(
      (0, import_drizzle_orm6.and)(
        (0, import_drizzle_orm6.eq)(payments.partyId, customerId),
        (0, import_drizzle_orm6.eq)(payments.type, "receipt")
      )
    );
    return pmts;
  }
  static async getCustomerLedger(customerId, startDate, endDate) {
    const customer = await this.findById(customerId);
    if (!customer) throw new Error("\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const invList = await this.getCustomerInvoices(customerId);
    const pmtList = await this.getCustomerPayments(customerId);
    const openingBalance = parseFloat(customer.openingBalance || "0");
    let runningBalance = openingBalance;
    const rawLines = [];
    if (openingBalance !== 0) {
      rawLines.push({
        id: `op-${customer.id}`,
        date: customer.createdAt ? new Date(customer.createdAt).toISOString().split("T")[0] : "2026-01-01",
        type: "opening_balance",
        typeLabel: "\u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D\u064A",
        reference: "OP-BAL",
        invoiceNumber: "-",
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        notes: "\u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0633\u0627\u0628\u0642 / \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u064A \u0644\u0644\u0639\u0645\u064A\u0644"
      });
    }
    for (const inv of invList) {
      const gTotal = parseFloat(inv.grandTotal || "0");
      const pMethod = inv.paymentMethod;
      const creditPart = inv.paymentDetails?.creditAmount || (pMethod === "credit" ? gTotal : 0);
      if (pMethod === "credit" || creditPart > 0 || inv.status === "unpaid" || inv.status === "partially_paid") {
        const debitVal = creditPart > 0 ? creditPart : gTotal;
        rawLines.push({
          id: `inv-${inv.id}`,
          date: inv.date ? inv.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: "sales_invoice",
          typeLabel: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0622\u062C\u0644\u0629",
          reference: inv.invoiceNumber,
          invoiceNumber: inv.invoiceNumber,
          debit: debitVal,
          credit: 0,
          notes: `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0631\u0642\u0645 ${inv.invoiceNumber}`
        });
      } else if (inv.status === "returned") {
        rawLines.push({
          id: `ret-${inv.id}`,
          date: inv.date ? inv.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: "return_invoice",
          typeLabel: "\u0645\u0631\u062A\u062C\u0639 \u0645\u0628\u064A\u0639\u0627\u062A",
          reference: `RET-${inv.invoiceNumber}`,
          invoiceNumber: inv.invoiceNumber,
          debit: 0,
          credit: gTotal,
          notes: `\u0625\u0634\u0639\u0627\u0631 \u062F\u0627\u0626\u0646 - \u0645\u0631\u062A\u062C\u0639 \u0641\u0627\u062A\u0648\u0631\u0629 ${inv.invoiceNumber}`
        });
      } else {
        rawLines.push({
          id: `inv-${inv.id}`,
          date: inv.date ? inv.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: "sales_invoice",
          typeLabel: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A",
          reference: inv.invoiceNumber,
          invoiceNumber: inv.invoiceNumber,
          debit: gTotal,
          credit: 0,
          notes: `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0631\u0642\u0645 ${inv.invoiceNumber}`
        });
      }
    }
    for (const pmt of pmtList) {
      const amt = parseFloat(pmt.amount || "0");
      if (amt > 0) {
        rawLines.push({
          id: `pmt-${pmt.id}`,
          date: pmt.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          type: "receipt_payment",
          typeLabel: "\u0633\u0646\u062F \u0642\u0628\u0636",
          reference: pmt.paymentNumber || pmt.voucherNumber || "PMT",
          invoiceNumber: pmt.reference || "-",
          debit: 0,
          credit: amt,
          notes: pmt.notes || `\u0633\u0646\u062F \u0642\u0628\u0636 \u0631\u0642\u0645 ${pmt.paymentNumber}`
        });
      }
    }
    rawLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const ledgerLines = rawLines.map((line) => {
      runningBalance = runningBalance + (line.debit || 0) - (line.credit || 0);
      return {
        ...line,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    });
    let filteredLines = ledgerLines;
    if (startDate) {
      filteredLines = filteredLines.filter((l) => l.date >= startDate);
    }
    if (endDate) {
      filteredLines = filteredLines.filter((l) => l.date <= endDate);
    }
    return {
      customer: {
        ...customer,
        balance: parseFloat(customer.balance || "0"),
        creditLimit: parseFloat(customer.creditLimit || "5000"),
        openingBalance: parseFloat(customer.openingBalance || "0")
      },
      currentBalance: parseFloat(customer.balance || "0"),
      totalDebit: filteredLines.reduce((acc, curr) => acc + curr.debit, 0),
      totalCredit: filteredLines.reduce((acc, curr) => acc + curr.credit, 0),
      ledgerLines: filteredLines,
      transactions: filteredLines
    };
  }
  static async getCustomerStatement(customerId, startDate, endDate) {
    return await this.getCustomerLedger(customerId, startDate, endDate);
  }
  static async getDebtAging() {
    const allCustomers = await db.select().from(customers);
    const now = (/* @__PURE__ */ new Date()).getTime();
    const result = [];
    for (const c of allCustomers) {
      const bal = parseFloat(c.balance || "0");
      const limit = parseFloat(c.creditLimit || "5000");
      if (bal <= 0) continue;
      const invs = await this.getCustomerInvoices(c.id);
      let curr0_30 = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let daysOver90 = 0;
      for (const inv of invs) {
        if (inv.status === "unpaid" || inv.status === "partially_paid" || inv.paymentMethod === "credit") {
          const invDate = new Date(inv.date || /* @__PURE__ */ new Date()).getTime();
          const diffDays = Math.floor((now - invDate) / (1e3 * 60 * 60 * 24));
          const amt = parseFloat(inv.grandTotal || "0");
          if (diffDays <= 30) curr0_30 += amt;
          else if (diffDays <= 60) days31_60 += amt;
          else if (diffDays <= 90) days61_90 += amt;
          else daysOver90 += amt;
        }
      }
      if (curr0_30 + days31_60 + days61_90 + daysOver90 === 0 && bal > 0) {
        curr0_30 = bal;
      }
      const status = bal > limit ? "exceeded" : bal > limit * 0.8 ? "warning" : "safe";
      result.push({
        customerId: c.id,
        customerName: c.name,
        phone: c.phone || "",
        creditLimit: limit,
        totalBalance: bal,
        current0To30: parseFloat(curr0_30.toFixed(2)),
        days31To60: parseFloat(days31_60.toFixed(2)),
        days61To90: parseFloat(days61_90.toFixed(2)),
        daysOver90: parseFloat(daysOver90.toFixed(2)),
        status
      });
    }
    return result;
  }
  static async delete(id) {
    await db.delete(customers).where((0, import_drizzle_orm6.eq)(customers.id, id));
    return { success: true };
  }
};

// src/core/repositories/SupplierRepository.ts
init_database();
init_schema2();
var import_drizzle_orm7 = require("drizzle-orm");
var SupplierRepository = class {
  static async findAll(search) {
    if (search) {
      const term = `%${search}%`;
      return await db.select().from(suppliers).where(
        (0, import_drizzle_orm7.or)(
          (0, import_drizzle_orm7.like)(suppliers.name, term),
          (0, import_drizzle_orm7.like)(suppliers.phone, term)
        )
      );
    }
    return await db.select().from(suppliers);
  }
  static async findById(id) {
    const result = await db.select().from(suppliers).where((0, import_drizzle_orm7.eq)(suppliers.id, id));
    return result[0] || null;
  }
  static async upsert(supplierData) {
    const existing = await this.findById(supplierData.id);
    if (existing) {
      await db.update(suppliers).set(supplierData).where((0, import_drizzle_orm7.eq)(suppliers.id, supplierData.id));
    } else {
      await db.insert(suppliers).values(supplierData);
    }
    return supplierData;
  }
  static async updateBalance(id, newBalance) {
    await db.update(suppliers).set({ balance: newBalance.toString() }).where((0, import_drizzle_orm7.eq)(suppliers.id, id));
    return await this.findById(id);
  }
  static async adjustBalance(id, deltaAmount) {
    const supplier = await this.findById(id);
    if (!supplier) throw new Error("\u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const current = parseFloat(supplier.balance || "0");
    const updated = current + deltaAmount;
    await this.updateBalance(id, updated);
    return updated;
  }
  static async getSupplierPurchases(supplierId) {
    return await db.select().from(purchases).where((0, import_drizzle_orm7.eq)(purchases.supplierId, supplierId)).orderBy((0, import_drizzle_orm7.desc)(purchases.createdAt));
  }
  static async getSupplierLedger(supplierId, startDate, endDate) {
    const supplier = await this.findById(supplierId);
    if (!supplier) throw new Error("\u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const purList = await this.getSupplierPurchases(supplierId);
    const openingBalance = parseFloat(supplier.openingBalance || supplier.balance || "0");
    let runningBalance = openingBalance;
    const rawLines = [];
    purList.forEach((pur) => {
      const gTotal = parseFloat(pur.grandTotal || "0");
      rawLines.push({
        id: `pur-${pur.id}`,
        date: pur.date ? pur.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        type: "purchase_invoice",
        typeLabel: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A",
        reference: pur.supplierInvoiceNumber || pur.purchaseNumber,
        credit: gTotal,
        // Purchase invoice increases payable to supplier (Credit)
        debit: 0,
        notes: `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0631\u0642\u0645 ${pur.purchaseNumber}`
      });
    });
    rawLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const transactions = rawLines.map((line) => {
      runningBalance += line.credit - line.debit;
      return {
        ...line,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    });
    return {
      supplier: {
        ...supplier,
        balance: parseFloat(supplier.balance || "0")
      },
      openingBalance,
      closingBalance: runningBalance,
      transactions,
      ledgerLines: transactions
    };
  }
  static async getSupplierStatement(supplierId, startDate, endDate) {
    return await this.getSupplierLedger(supplierId, startDate, endDate);
  }
  static async delete(id) {
    await db.delete(suppliers).where((0, import_drizzle_orm7.eq)(suppliers.id, id));
    return { success: true };
  }
};

// src/core/repositories/ProductRepository.ts
init_database();
init_schema2();
var import_drizzle_orm8 = require("drizzle-orm");
var ProductRepository = class {
  static async findAll(params) {
    let list = await db.select().from(products);
    if (params?.category) {
      list = list.filter((p) => p.category === params.category);
    }
    if (params?.search) {
      const term = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
    }
    return list;
  }
  static async findById(id) {
    const result = await db.select().from(products).where((0, import_drizzle_orm8.eq)(products.id, id));
    return result[0] || null;
  }
  static async findByBarcode(barcode) {
    const result = await db.select().from(products).where((0, import_drizzle_orm8.eq)(products.barcode, barcode));
    return result[0] || null;
  }
  static async getProductHistory(productId) {
    const moves = await db.select({
      id: stockMoves.id,
      productId: stockMoves.productId,
      quantity: stockMoves.quantity,
      unitCost: stockMoves.unitCost,
      type: stockMoves.type,
      referenceId: stockMoves.referenceId,
      notes: stockMoves.notes,
      createdAt: stockMoves.createdAt,
      fromWarehouseId: stockMoves.fromWarehouseId,
      toWarehouseId: stockMoves.toWarehouseId
    }).from(stockMoves).where((0, import_drizzle_orm8.eq)(stockMoves.productId, productId)).orderBy((0, import_drizzle_orm8.desc)(stockMoves.createdAt));
    let runningStock = 0;
    const history = moves.map((m) => {
      const qty = parseFloat(m.quantity || "0");
      const isIncrease = ["purchase", "adjustment_in", "initial", "return"].includes(m.type) || m.type === "adjustment" && qty > 0;
      const qtyIn = isIncrease ? Math.abs(qty) : 0;
      const qtyOut = !isIncrease ? Math.abs(qty) : 0;
      let typeLabel = "\u062D\u0631\u0643\u0629 \u0645\u062E\u0632\u0646\u064A\u0629";
      if (m.type === "sale") typeLabel = "\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A POS";
      else if (m.type === "purchase") typeLabel = "\u0641\u0627\u062A\u0648\u0631\u0629 \u062A\u0648\u0631\u064A\u062F \u0645\u0634\u062A\u0631\u064A\u0627\u062A";
      else if (m.type === "transfer") typeLabel = "\u062A\u062D\u0648\u064A\u0644 \u0628\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A";
      else if (m.type === "adjustment") typeLabel = "\u062A\u0633\u0648\u064A\u0629 \u0645\u062E\u0632\u0646\u064A\u0629 \u0623\u0633\u0628\u0648\u0639\u064A\u0629/\u0633\u0646\u0648\u064A\u0629";
      else if (m.type === "initial") typeLabel = "\u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D\u064A \u0644\u0644\u0645\u0646\u062A\u062C";
      else if (m.type === "return") typeLabel = "\u0645\u0631\u062A\u062C\u0639 \u0645\u0628\u064A\u0639\u0627\u062A/\u0645\u0634\u062A\u0631\u064A\u0627\u062A";
      return {
        id: m.id,
        date: m.createdAt ? new Date(m.createdAt).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        type: m.type,
        typeLabel,
        reference: m.referenceId || "N/A",
        quantityIn: qtyIn,
        quantityOut: qtyOut,
        balanceAfter: 0,
        // Calculated client side or in accumulator
        unitPrice: parseFloat(m.unitCost || "0"),
        notes: m.notes || ""
      };
    });
    return history;
  }
  static async upsert(productData) {
    const existing = await this.findById(productData.id);
    const dbValue = {
      ...productData,
      price: productData.price !== void 0 ? productData.price.toString() : "0",
      purchasePrice: productData.purchasePrice !== void 0 ? productData.purchasePrice.toString() : "0",
      stock: productData.stock !== void 0 ? productData.stock.toString() : "0",
      minStock: productData.minStock !== void 0 ? productData.minStock.toString() : "0",
      taxRate: productData.taxRate !== void 0 ? productData.taxRate.toString() : "15"
    };
    if (existing) {
      await db.update(products).set(dbValue).where((0, import_drizzle_orm8.eq)(products.id, productData.id));
    } else {
      await db.insert(products).values(dbValue);
    }
    return dbValue;
  }
  static async updateStock(id, newStock) {
    await db.update(products).set({ stock: newStock.toString() }).where((0, import_drizzle_orm8.eq)(products.id, id));
  }
  static async delete(id) {
    await db.delete(products).where((0, import_drizzle_orm8.eq)(products.id, id));
    return { success: true };
  }
  static async getCategories() {
    return await withAutoMigration(async () => {
      return await db.select().from(categories);
    });
  }
  static async upsertCategory(data) {
    return await withAutoMigration(async () => {
      const existing = await db.select().from(categories);
      const match = existing.find((c) => c.id === data.id || c.name === data.name);
      if (match) {
        await db.update(categories).set(data).where((0, import_drizzle_orm8.eq)(categories.id, match.id));
        return { ...match, ...data };
      } else {
        await db.insert(categories).values(data);
        return data;
      }
    });
  }
  static async deleteCategory(id) {
    return await withAutoMigration(async () => {
      await db.delete(categories).where((0, import_drizzle_orm8.eq)(categories.id, id));
      return { success: true };
    });
  }
  static async getUnits() {
    return await withAutoMigration(async () => {
      return await db.select().from(units);
    });
  }
  static async upsertUnit(data) {
    return await withAutoMigration(async () => {
      const existing = await db.select().from(units);
      const match = existing.find((u) => u.id === data.id || u.name === data.name);
      if (match) {
        await db.update(units).set(data).where((0, import_drizzle_orm8.eq)(units.id, match.id));
        return { ...match, ...data };
      } else {
        await db.insert(units).values(data);
        return data;
      }
    });
  }
  static async deleteUnit(id) {
    return await withAutoMigration(async () => {
      await db.delete(units).where((0, import_drizzle_orm8.eq)(units.id, id));
      return { success: true };
    });
  }
};

// src/core/repositories/InventoryRepository.ts
init_database();
init_schema2();
var import_drizzle_orm11 = require("drizzle-orm");

// src/core/repositories/AccountingRepository.ts
init_database();
init_schema2();
var import_drizzle_orm10 = require("drizzle-orm");
init_CurrencyRepository();

// src/core/services/AccountService.ts
init_database();
init_schema2();
var import_drizzle_orm9 = require("drizzle-orm");
init_CurrencyRepository();
var AccountService = class {
  // Normalize account type to lowercase standard ('asset', 'liability', 'equity', 'revenue', 'expense')
  static normalizeType(type) {
    const t = (type || "").toLowerCase().trim();
    if (["asset", "assets", "\u0623\u0635\u0648\u0644", "\u0623\u0635\u0644"].includes(t)) return "asset";
    if (["liability", "liabilities", "\u062E\u0635\u0648\u0645", "\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A"].includes(t)) return "liability";
    if (["equity", "\u062D\u0642\u0648\u0642 \u0645\u0644\u0643\u064A\u0629", "\u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629"].includes(t)) return "equity";
    if (["revenue", "revenues", "\u0625\u064A\u0631\u0627\u062F\u0627\u062A", "\u0645\u0628\u064A\u0639\u0627\u062A"].includes(t)) return "revenue";
    if (["expense", "expenses", "\u0645\u0635\u0631\u0648\u0641\u0627\u062A", "\u0645\u0635\u0627\u0631\u064A\u0641"].includes(t)) return "expense";
    return t;
  }
  // Calculate account hierarchy level based on parent chain
  static async getAccountLevel(parentId) {
    if (!parentId) return 1;
    const parent = await this.getAccountById(parentId);
    if (!parent) return 1;
    return await this.getAccountLevel(parent.parentId) + 1;
  }
  // Get all accounts flat list
  static async getAccounts(filter) {
    return await withAutoMigration(async () => {
      let all = await db.select().from(accounts).orderBy((0, import_drizzle_orm9.asc)(accounts.code));
      if (filter?.companyId) {
        all = all.filter((a) => a.companyId === filter.companyId || !a.companyId);
      }
      if (filter?.type && filter.type !== "all") {
        const targetType = this.normalizeType(filter.type);
        all = all.filter((a) => this.normalizeType(a.type) === targetType);
      }
      if (filter?.activeOnly) {
        all = all.filter((a) => a.isActive !== false);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        all = all.filter((a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
      }
      return all.map((a) => ({
        ...a,
        balance: parseFloat(a.balance || "0"),
        foreignBalance: parseFloat(a.foreignBalance || "0"),
        isActive: a.isActive !== false
      }));
    });
  }
  // Get hierarchical Chart of Accounts tree
  static async getAccountsTree(companyId) {
    const flatAccounts = await this.getAccounts({ companyId });
    const accountMap = /* @__PURE__ */ new Map();
    const rootNodes = [];
    flatAccounts.forEach((acc) => {
      accountMap.set(acc.id, {
        ...acc,
        level: 1,
        children: []
      });
    });
    flatAccounts.forEach((acc) => {
      const node = accountMap.get(acc.id);
      if (acc.parentId && accountMap.has(acc.parentId)) {
        const parent = accountMap.get(acc.parentId);
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });
    return rootNodes;
  }
  // Find single account by ID
  static async getAccountById(id) {
    const res = await db.select().from(accounts).where((0, import_drizzle_orm9.eq)(accounts.id, id));
    if (!res[0]) return null;
    const a = res[0];
    return {
      ...a,
      balance: parseFloat(a.balance || "0"),
      foreignBalance: parseFloat(a.foreignBalance || "0"),
      isActive: a.isActive !== false
    };
  }
  // Find single account by Code
  static async getAccountByCode(code) {
    const res = await db.select().from(accounts).where((0, import_drizzle_orm9.eq)(accounts.code, code.trim()));
    if (!res[0]) return null;
    const a = res[0];
    return {
      ...a,
      balance: parseFloat(a.balance || "0"),
      foreignBalance: parseFloat(a.foreignBalance || "0"),
      isActive: a.isActive !== false
    };
  }
  // Suggest next code for sub-account based on smart numbering scheme
  static async suggestChildCode(parentId) {
    const parent = await this.getAccountById(parentId);
    if (!parent) throw new Error("\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const children = await db.select().from(accounts).where((0, import_drizzle_orm9.eq)(accounts.parentId, parentId)).orderBy((0, import_drizzle_orm9.asc)(accounts.code));
    if (children.length === 0) {
      return `${parent.code}01`;
    }
    const lastChildCode = children[children.length - 1].code;
    const numPart = parseInt(lastChildCode, 10);
    if (!isNaN(numPart)) {
      return (numPart + 1).toString();
    }
    return `${parent.code}${String(children.length + 1).padStart(2, "0")}`;
  }
  // Create or Update Account with full validations & hierarchy rules
  static async upsertAccount(data) {
    if (!data.code || !data.code.trim()) {
      throw new Error("\u0631\u0645\u0632 \u0627\u0644\u062D\u0633\u0627\u0628 (code) \u0645\u0637\u0644\u0648\u0628");
    }
    if (!data.name || !data.name.trim()) {
      throw new Error("\u0627\u0633\u0645 \u0627\u0644\u062D\u0633\u0627\u0628 (name) \u0645\u0637\u0644\u0648\u0628");
    }
    const normalizedType = this.normalizeType(data.type);
    if (!["asset", "liability", "equity", "revenue", "expense"].includes(normalizedType)) {
      throw new Error("\u0646\u0648\u0639 \u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D. \u0627\u0644\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0645\u062A\u0627\u062D\u0629: asset, liability, equity, revenue, expense");
    }
    const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();
    const accountId = data.id || "acc_" + Math.random().toString(36).substring(2, 10);
    const existingCodeAcc = await this.getAccountByCode(data.code.trim());
    if (existingCodeAcc && existingCodeAcc.id !== accountId) {
      throw new Error(`\u0631\u0645\u0632 \u0627\u0644\u062D\u0633\u0627\u0628 "${data.code}" \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u0628\u062D\u0633\u0627\u0628 \u0622\u062E\u0631 (${existingCodeAcc.name})`);
    }
    if (data.parentId) {
      if (data.parentId === accountId) {
        throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062D\u0633\u0627\u0628 \u0643\u0646\u0641\u0633\u0647 \u0643\u0623\u0628");
      }
      const parent = await this.getAccountById(data.parentId);
      if (!parent) {
        throw new Error("\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
      }
      const parentType = this.normalizeType(parent.type);
      if (parentType !== normalizedType) {
        throw new Error(`\u0646\u0648\u0639 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0641\u0631\u0639\u064A (${normalizedType}) \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0646\u0648\u0639 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A (${parentType})`);
      }
      let currentParentId = parent.parentId || null;
      while (currentParentId) {
        if (currentParentId === accountId) {
          throw new Error("\u062A\u0645 \u0627\u0643\u062A\u0634\u0627\u0641 \u062D\u0644\u0642\u0629 \u0647\u0631\u0645\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 \u0628\u064A\u0646 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A (Cyclic Parent)");
        }
        const ancestor = await this.getAccountById(currentParentId);
        currentParentId = ancestor?.parentId || null;
      }
    }
    const dbValues = {
      id: accountId,
      code: data.code.trim(),
      name: data.name.trim(),
      type: normalizedType,
      balance: (data.balance || 0).toString(),
      currency: data.currency || baseCurrency,
      foreignBalance: (data.foreignBalance || 0).toString(),
      parentId: data.parentId || null,
      companyId: data.companyId || null,
      branchId: data.branchId || null,
      isActive: data.isActive !== void 0 ? data.isActive : true,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const existing = await this.getAccountById(accountId);
    if (existing) {
      await db.update(accounts).set(dbValues).where((0, import_drizzle_orm9.eq)(accounts.id, accountId));
    } else {
      dbValues.createdAt = /* @__PURE__ */ new Date();
      await db.insert(accounts).values(dbValues);
    }
    return await this.getAccountById(accountId);
  }
  // Toggle active/inactive
  static async toggleAccountActive(id, isActive) {
    const acc = await this.getAccountById(id);
    if (!acc) throw new Error("\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    await db.update(accounts).set({ isActive }).where((0, import_drizzle_orm9.eq)(accounts.id, id));
    return await this.getAccountById(id);
  }
  // Delete account safely
  static async deleteAccount(id) {
    const acc = await this.getAccountById(id);
    if (!acc) throw new Error("\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const children = await db.select().from(accounts).where((0, import_drizzle_orm9.eq)(accounts.parentId, id));
    if (children.length > 0) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 (${acc.name}) \u0644\u0623\u0646\u0647 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 ${children.length} \u062D\u0633\u0627\u0628\u0627\u062A \u0641\u0631\u0639\u064A\u0629.`);
    }
    const details = await db.select().from(journalDetails).where((0, import_drizzle_orm9.eq)(journalDetails.accountId, id));
    if (details.length > 0) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 (${acc.name}) \u0646\u0638\u0631\u0627\u064B \u0644\u0648\u062C\u0648\u062F \u0642\u064A\u0648\u062F \u0645\u062D\u0627\u0633\u0628\u064A\u0629 \u0645\u0633\u062C\u0644\u0629 \u0639\u0644\u064A\u0647.`);
    }
    const lines = await db.select().from(journalLines).where((0, import_drizzle_orm9.eq)(journalLines.accountId, id));
    if (lines.length > 0) {
      throw new Error(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 (${acc.name}) \u0646\u0638\u0631\u0627\u064B \u0644\u0648\u062C\u0648\u062F \u062D\u0631\u0643\u0629 \u0645\u0633\u062C\u0644\u0629 \u0639\u0644\u064A\u0647 \u0641\u064A \u062F\u0641\u062A\u0631 \u0627\u0644\u0623\u0633\u062A\u0627\u0630.`);
    }
    await db.delete(accounts).where((0, import_drizzle_orm9.eq)(accounts.id, id));
    return { success: true, message: `\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 (${acc.name}) \u0628\u0646\u062C\u0627\u062D` };
  }
  // Seed standard ERP Chart of Accounts with Multi-Currency (SAR, USD, SYP, TRY) and Multi-Company support
  static async seedDefaultChartOfAccounts(companyId) {
    return await withAutoMigration(async () => {
      const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();
      const defaultAccounts = [
        // 1. ASSETS (الأصول)
        { id: "acc_1", code: "1", name: "\u0627\u0644\u0623\u0635\u0648\u0644", type: "asset" },
        { id: "acc_11", code: "11", name: "\u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u0645\u062A\u062F\u0627\u0648\u0644\u0629", type: "asset", parentId: "acc_1" },
        // Cash Treasury Accounts
        { id: "acc_cash", code: "1101", name: "\u0627\u0644\u0635\u0646\u0627\u062F\u064A\u0642 \u0648\u0627\u0644\u062E\u0632\u0627\u0626\u0646 \u0627\u0644\u0646\u0642\u062F\u064A\u0629", type: "asset", parentId: "acc_11" },
        { id: "acc_110101", code: "110101", name: "\u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0631\u0626\u064A\u0633\u064A (\u0645\u062D\u0644\u064A - SAR)", type: "asset", parentId: "acc_cash", currency: "SAR" },
        { id: "acc_110102", code: "110102", name: "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u062F\u0648\u0644\u0627\u0631 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A (USD)", type: "asset", parentId: "acc_cash", currency: "USD" },
        { id: "acc_110103", code: "110103", name: "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0644\u064A\u0631\u0629 \u0627\u0644\u0633\u0648\u0631\u064A\u0629 (SYP)", type: "asset", parentId: "acc_cash", currency: "SYP" },
        { id: "acc_110104", code: "110104", name: "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0644\u064A\u0631\u0629 \u0627\u0644\u062A\u0631\u0643\u064A\u0629 (TRY)", type: "asset", parentId: "acc_cash", currency: "TRY" },
        // Bank Accounts
        { id: "acc_bank", code: "1102", name: "\u0627\u0644\u0628\u0646\u0648\u0643 \u0648\u0627\u0644\u0645\u0635\u0627\u0631\u0641", type: "asset", parentId: "acc_11" },
        { id: "acc_110201", code: "110201", name: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A (SAR)", type: "asset", parentId: "acc_bank", currency: "SAR" },
        { id: "acc_110202", code: "110202", name: "\u062D\u0633\u0627\u0628 \u0628\u0646\u0643 \u0627\u0644\u062A\u062C\u0627\u0631\u0629 \u0627\u0644\u062F\u0648\u0644\u064A (USD)", type: "asset", parentId: "acc_bank", currency: "USD" },
        { id: "acc_110203", code: "110203", name: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643 - \u0644\u064A\u0631\u0629 \u062A\u0631\u0643\u064A\u0629 (TRY)", type: "asset", parentId: "acc_bank", currency: "TRY" },
        // Receivables & Customers
        { id: "acc_receivable", code: "1103", name: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0645\u062F\u064A\u0646\u0648\u0646", type: "asset", parentId: "acc_11" },
        { id: "acc_110301", code: "110301", name: "\u0630\u0645\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u064A\u0646 (\u0645\u062D\u0644\u064A)", type: "asset", parentId: "acc_receivable", currency: "SAR" },
        { id: "acc_110302", code: "110302", name: "\u0630\u0645\u0645 \u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u062A\u0635\u062F\u064A\u0631 (USD)", type: "asset", parentId: "acc_receivable", currency: "USD" },
        { id: "acc_110303", code: "110303", name: "\u0630\u0645\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0625\u0642\u0644\u064A\u0645\u064A\u0629 (SYP/TRY)", type: "asset", parentId: "acc_receivable", currency: "TRY" },
        // Inventory Accounts
        { id: "acc_inventory", code: "1104", name: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0628\u0636\u0627\u0626\u0639\u064A", type: "asset", parentId: "acc_11" },
        { id: "acc_110401", code: "110401", name: "\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u0644\u0644\u0628\u064A\u0639", type: "asset", parentId: "acc_inventory", currency: "SAR" },
        { id: "acc_110402", code: "110402", name: "\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062E\u0627\u0645 \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A", type: "asset", parentId: "acc_inventory", currency: "SAR" },
        // Fixed Assets
        { id: "acc_12", code: "12", name: "\u0627\u0644\u0623\u0635\u0648\u0644 \u0627\u0644\u062B\u0627\u0628\u062A\u0629", type: "asset", parentId: "acc_1" },
        { id: "acc_1201", code: "1201", name: "\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0628\u0627\u0646\u064A", type: "asset", parentId: "acc_12", currency: "SAR" },
        { id: "acc_1202", code: "1202", name: "\u0627\u0644\u0622\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u062F\u0627\u062A \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629", type: "asset", parentId: "acc_12", currency: "SAR" },
        { id: "acc_1203", code: "1203", name: "\u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0642\u0644", type: "asset", parentId: "acc_12", currency: "SAR" },
        { id: "acc_1204", code: "1204", name: "\u0627\u0644\u0623\u062B\u0627\u062B \u0648\u0627\u0644\u062F\u064A\u0643\u0648\u0631\u0627\u062A \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632\u0627\u062A", type: "asset", parentId: "acc_12", currency: "SAR" },
        // 2. LIABILITIES (الخصوم والالتزامات)
        { id: "acc_2", code: "2", name: "\u0627\u0644\u062E\u0635\u0648\u0645 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A", type: "liability" },
        { id: "acc_21", code: "21", name: "\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0627\u0644\u0645\u062A\u062F\u0627\u0648\u0644\u0629", type: "liability", parentId: "acc_2" },
        // Payables & Suppliers
        { id: "acc_payable", code: "2101", name: "\u0627\u0644\u0645\u0648\u0631\u062F\u0648\u0646 \u0648\u0627\u0644\u062F\u0627\u0626\u0646\u0648\u0646", type: "liability", parentId: "acc_21" },
        { id: "acc_210101", code: "210101", name: "\u0630\u0645\u0645 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646 \u0627\u0644\u0645\u062D\u0644\u064A\u064A\u0646 (SAR)", type: "liability", parentId: "acc_payable", currency: "SAR" },
        { id: "acc_210102", code: "210102", name: "\u0630\u0645\u0645 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u064A\u0646 (USD)", type: "liability", parentId: "acc_payable", currency: "USD" },
        { id: "acc_210103", code: "210103", name: "\u0630\u0645\u0645 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646 \u0627\u0644\u0625\u0642\u0644\u064A\u0645\u064A\u064A\u0646 (TRY)", type: "liability", parentId: "acc_payable", currency: "TRY" },
        // Taxes & Accruals
        { id: "acc_tax", code: "2102", name: "\u0627\u0644\u0636\u0631\u0627\u0626\u0628 \u0648\u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0627\u062A", type: "liability", parentId: "acc_21" },
        { id: "acc_210201", code: "210201", name: "\u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0629 (VAT)", type: "liability", parentId: "acc_tax", currency: "SAR" },
        { id: "acc_210202", code: "210202", name: "\u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0631\u0648\u0627\u062A\u0628 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646", type: "liability", parentId: "acc_tax", currency: "SAR" },
        // 3. EQUITY (حقوق الملكية)
        { id: "acc_3", code: "3", name: "\u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629", type: "equity" },
        { id: "acc_equity", code: "31", name: "\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0648\u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0627\u062A", type: "equity", parentId: "acc_3" },
        { id: "acc_3101", code: "3101", name: "\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0627\u0644\u0645\u062F\u0641\u0648\u0639", type: "equity", parentId: "acc_equity", currency: "SAR" },
        { id: "acc_32", code: "32", name: "\u0627\u0644\u0623\u0631\u0628\u0627\u062D \u0648\u0627\u0644\u062E\u0633\u0627\u0626\u0631 \u0627\u0644\u0645\u062F\u0648\u0631\u0629", type: "equity", parentId: "acc_3", currency: "SAR" },
        { id: "acc_33", code: "33", name: "\u0645\u0633\u062D\u0648\u0628\u0627\u062A \u0627\u0644\u0634\u0631\u0643\u0627\u0621", type: "equity", parentId: "acc_3", currency: "SAR" },
        // 4. REVENUE (الإيرادات)
        { id: "acc_4", code: "4", name: "\u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A", type: "revenue" },
        { id: "acc_41", code: "41", name: "\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", type: "revenue", parentId: "acc_4" },
        { id: "acc_sales", code: "4101", name: "\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0628\u0636\u0627\u0626\u0639 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A", type: "revenue", parentId: "acc_41", currency: "SAR" },
        { id: "acc_4102", code: "4102", name: "\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 (USD)", type: "revenue", parentId: "acc_41", currency: "USD" },
        { id: "acc_42", code: "42", name: "\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0623\u062E\u0631\u0649 \u0648\u0641\u0631\u0648\u0642 \u0639\u0645\u0644\u0627\u062A", type: "revenue", parentId: "acc_4" },
        { id: "acc_forex_gain", code: "4201", name: "\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641 (Forex Gain)", type: "revenue", parentId: "acc_42", currency: "SAR" },
        // 5. EXPENSES (المصروفات)
        { id: "acc_5", code: "5", name: "\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", type: "expense" },
        { id: "acc_51", code: "51", name: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629 COGS", type: "expense", parentId: "acc_5" },
        { id: "acc_cogs", code: "5101", name: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", type: "expense", parentId: "acc_51", currency: "SAR" },
        { id: "acc_52", code: "52", name: "\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629", type: "expense", parentId: "acc_5" },
        { id: "acc_expense", code: "5201", name: "\u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0627\u0644\u0639\u0627\u0645\u0629", type: "expense", parentId: "acc_52", currency: "SAR" },
        { id: "acc_5202", code: "5202", name: "\u0631\u0648\u0627\u062A\u0628 \u0648\u0623\u062C\u0648\u0631 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646", type: "expense", parentId: "acc_52", currency: "SAR" },
        { id: "acc_5203", code: "5203", name: "\u0625\u064A\u062C\u0627\u0631 \u0627\u0644\u0645\u0642\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A", type: "expense", parentId: "acc_52", currency: "SAR" },
        { id: "acc_5204", code: "5204", name: "\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0627\u0644\u0645\u064A\u0627\u0647 \u0648\u0627\u0644\u0645\u0631\u0627\u0641\u0642", type: "expense", parentId: "acc_52", currency: "SAR" },
        { id: "acc_forex_loss", code: "5205", name: "\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641 (Forex Loss)", type: "expense", parentId: "acc_52", currency: "SAR" }
      ];
      let createdCount = 0;
      for (const acc of defaultAccounts) {
        const existing = await this.getAccountById(acc.id) || await this.getAccountByCode(acc.code);
        if (!existing) {
          await db.insert(accounts).values({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            balance: "0",
            currency: acc.currency || baseCurrency,
            foreignBalance: "0",
            parentId: acc.parentId || null,
            companyId: companyId || null
          });
          createdCount++;
        }
      }
      return { success: true, seededCount: createdCount };
    });
  }
};

// src/core/repositories/AccountingRepository.ts
init_JournalEngine();
var AccountingRepository = class {
  // 1. CHART OF ACCOUNTS & TREE
  static async getAccounts(filter) {
    return await AccountService.getAccounts(filter);
  }
  static async getAccountsTree(companyId) {
    return await AccountService.getAccountsTree(companyId);
  }
  static async findAccountById(id) {
    return await AccountService.getAccountById(id);
  }
  static async findAccountByCode(code) {
    return await AccountService.getAccountByCode(code);
  }
  static async upsertAccount(data) {
    return await AccountService.upsertAccount(data);
  }
  static async toggleAccountActive(id, isActive) {
    return await AccountService.toggleAccountActive(id, isActive);
  }
  static async deleteAccount(id) {
    return await AccountService.deleteAccount(id);
  }
  static async seedDefaultChartOfAccounts(companyId) {
    return await AccountService.seedDefaultChartOfAccounts(companyId);
  }
  // 2. DOUBLE-ENTRY MULTI-CURRENCY POSTING ENGINE
  static async postJournalEntry(entryNumber, description, date, lines, options) {
    return await JournalEngine.postJournalEntry(entryNumber, description, date, lines, options);
  }
  // 3. CURRENCY REVALUATION ENGINE (إعادة تقييم العملات وإثبات الأرباح/الخسائر غير المحققة)
  static async revaluateForeignAccounts(currencyCode, newExchangeRate, revaluationDate) {
    const baseCurrencyCode = await CurrencyRepository.getBaseCurrencyCode();
    if (!currencyCode || currencyCode.toUpperCase() === baseCurrencyCode.toUpperCase()) {
      throw new Error(`\u0644\u0627 \u062A\u062A\u0637\u0644\u0628 \u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (${baseCurrencyCode}) \u0639\u0645\u0644\u064A\u0629 \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645.`);
    }
    if (!newExchangeRate || newExchangeRate <= 0) {
      throw new Error("\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u062C\u062F\u064A\u062F \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631.");
    }
    const allAccounts = await db.select().from(accounts);
    const allDetails = await db.select().from(journalDetails).where((0, import_drizzle_orm10.eq)(journalDetails.currency, currencyCode));
    const revaluedAccountsMap = /* @__PURE__ */ new Map();
    for (const acc of allAccounts) {
      const accDetails = allDetails.filter((d) => d.accountId === acc.id);
      if (accDetails.length === 0 && acc.currency !== currencyCode) continue;
      const totalForeignDebit = accDetails.reduce((s, d) => s + parseFloat(d.foreignDebit || "0"), 0);
      const totalForeignCredit = accDetails.reduce((s, d) => s + parseFloat(d.foreignCredit || "0"), 0);
      const totalBaseDebit = accDetails.reduce((s, d) => s + parseFloat(d.debit || "0"), 0);
      const totalBaseCredit = accDetails.reduce((s, d) => s + parseFloat(d.credit || "0"), 0);
      const isDebitNormal = acc.type === "asset" || acc.type === "expense";
      const foreignBal = isDebitNormal ? totalForeignDebit - totalForeignCredit : totalForeignCredit - totalForeignDebit;
      const currentBaseBal = isDebitNormal ? totalBaseDebit - totalBaseCredit : totalBaseCredit - totalBaseDebit;
      if (Math.abs(foreignBal) < 1e-4) continue;
      const newBaseBal = foreignBal * newExchangeRate;
      const difference = newBaseBal - currentBaseBal;
      if (Math.abs(difference) >= 0.01) {
        revaluedAccountsMap.set(acc.id, {
          account: acc,
          currentBaseBal,
          foreignBal,
          newBaseBal,
          difference: Number(difference.toFixed(2))
        });
      }
    }
    if (revaluedAccountsMap.size === 0) {
      return {
        message: `\u0644\u0627 \u062A\u0648\u062C\u062F \u0641\u0631\u0648\u0642\u0627\u062A \u062A\u0642\u064A\u064A\u0645 \u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u0644\u0639\u0645\u0644\u0629 (${currencyCode}) \u0639\u0646\u062F \u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 (${newExchangeRate}).`,
        revaluedAccountsCount: 0,
        postedEntry: null
      };
    }
    let gainAcc = await this.findAccountByCode("4201");
    let lossAcc = await this.findAccountByCode("5202");
    if (!gainAcc) {
      gainAcc = await this.upsertAccount({
        code: "4201",
        name: "\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0627\u0644\u0639\u0645\u0644\u0629 (Gain on FX)",
        type: "revenue",
        balance: "0"
      });
    }
    if (!lossAcc) {
      lossAcc = await this.upsertAccount({
        code: "5202",
        name: "\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0627\u0644\u0639\u0645\u0644\u0629 (Loss on FX)",
        type: "expense",
        balance: "0"
      });
    }
    const journalLinesToPost = [];
    let totalGain = 0;
    let totalLoss = 0;
    for (const [accId, item] of revaluedAccountsMap.entries()) {
      const diff = item.difference;
      if (item.account.type === "asset" || item.account.type === "expense") {
        if (diff > 0) {
          journalLinesToPost.push({
            accountId: accId,
            debit: diff,
            credit: 0,
            currency: baseCurrencyCode,
            exchangeRate: 1,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0639\u0645\u0644\u0629 ${currencyCode} - \u0632\u064A\u0627\u062F\u0629 \u0642\u064A\u0645\u0629 \u0627\u0644\u0623\u0635\u0644`
          });
          totalGain += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrencyCode,
            exchangeRate: 1,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0639\u0645\u0644\u0629 ${currencyCode} - \u0627\u0646\u062E\u0641\u0627\u0636 \u0642\u064A\u0645\u0629 \u0627\u0644\u0623\u0635\u0644`
          });
          totalLoss += Math.abs(diff);
        }
      } else {
        if (diff > 0) {
          journalLinesToPost.push({
            accountId: accId,
            debit: 0,
            credit: diff,
            currency: baseCurrencyCode,
            exchangeRate: 1,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0639\u0645\u0644\u0629 ${currencyCode} - \u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645`
          });
          totalLoss += diff;
        } else {
          journalLinesToPost.push({
            accountId: accId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrencyCode,
            exchangeRate: 1,
            description: `\u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0639\u0645\u0644\u0629 ${currencyCode} - \u0627\u0646\u062E\u0641\u0627\u0636 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645`
          });
          totalGain += Math.abs(diff);
        }
      }
    }
    if (totalGain > 0) {
      journalLinesToPost.push({
        accountId: gainAcc.id,
        debit: 0,
        credit: Number(totalGain.toFixed(2)),
        currency: baseCurrencyCode,
        exchangeRate: 1,
        description: `\u0625\u062C\u0645\u0627\u0644\u064A \u0623\u0631\u0628\u0627\u062D \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0639\u0645\u0644\u0629 (${currencyCode})`
      });
    }
    if (totalLoss > 0) {
      journalLinesToPost.push({
        accountId: lossAcc.id,
        debit: Number(totalLoss.toFixed(2)),
        credit: 0,
        currency: baseCurrencyCode,
        exchangeRate: 1,
        description: `\u0625\u062C\u0645\u0627\u0644\u064A \u062E\u0633\u0627\u0626\u0631 \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0639\u0645\u0644\u0629 (${currencyCode})`
      });
    }
    const entryNum = "REV-" + currencyCode + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const entryDesc = `\u0642\u064A\u062F \u062A\u0633\u0648\u064A\u0629 \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0639\u0645\u0644\u0629 ${currencyCode} \u0628\u062A\u0627\u0631\u064A\u062E ${revaluationDate} \u0628\u0633\u0639\u0631 \u0635\u0631\u0641 ${newExchangeRate}`;
    const postedEntry = await this.postJournalEntry(
      entryNum,
      entryDesc,
      revaluationDate,
      journalLinesToPost,
      { currency: currencyCode, exchangeRate: newExchangeRate }
    );
    const currList = await db.select().from(currencies).where((0, import_drizzle_orm10.eq)(currencies.code, currencyCode));
    if (currList.length > 0) {
      await db.update(currencies).set({ exchangeRate: newExchangeRate.toString(), updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.eq)(currencies.code, currencyCode));
    }
    return {
      message: `\u062A\u0645\u062A \u0639\u0645\u0644\u064A\u0629 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0644\u0639\u0645\u0644\u0629 (${currencyCode}) \u0628\u0646\u062C\u0627\u062D \u0648\u0625\u0635\u062F\u0627\u0631 \u0642\u064A\u062F \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A.`,
      revaluedAccountsCount: revaluedAccountsMap.size,
      revaluedAccounts: Array.from(revaluedAccountsMap.values()),
      postedEntry
    };
  }
  // 4. GENERAL LEDGER
  static async getGeneralLedger(accountId, startDate, endDate, filterCurrency) {
    const account = await this.findAccountById(accountId);
    if (!account) {
      throw new Error("\u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    }
    let details = await db.select().from(journalDetails).where((0, import_drizzle_orm10.eq)(journalDetails.accountId, accountId));
    if (filterCurrency && filterCurrency !== "ALL") {
      details = details.filter((d) => d.currency === filterCurrency);
    }
    const entryIds = Array.from(new Set(details.map((d) => d.journalEntryId)));
    const allEntries = entryIds.length > 0 ? await db.select().from(journalEntries).where((0, import_drizzle_orm10.inArray)(journalEntries.id, entryIds)) : [];
    const entriesMap = new Map(allEntries.map((e) => [e.id, e]));
    const defaultBaseCode = await CurrencyRepository.getBaseCurrencyCode();
    const isDebitNormal = account.type === "asset" || account.type === "expense";
    const sortedDetails = details.filter((d) => entriesMap.has(d.journalEntryId)).map((d) => ({
      detail: d,
      entry: entriesMap.get(d.journalEntryId)
    })).sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.entry.entryNumber.localeCompare(b.entry.entryNumber));
    let openingBaseBalance = 0;
    let openingForeignBalance = 0;
    const activeLines = [];
    for (const { detail: d, entry: parentEntry } of sortedDetails) {
      const debit = parseFloat(d.debit || "0");
      const credit = parseFloat(d.credit || "0");
      const foreignDebit = parseFloat(d.foreignDebit || "0");
      const foreignCredit = parseFloat(d.foreignCredit || "0");
      const baseChange = isDebitNormal ? debit - credit : credit - debit;
      const foreignChange = isDebitNormal ? foreignDebit - foreignCredit : foreignCredit - foreignDebit;
      if (startDate && parentEntry.date < startDate) {
        openingBaseBalance += baseChange;
        openingForeignBalance += foreignChange;
      } else if (!endDate || parentEntry.date <= endDate) {
        activeLines.push({
          id: d.id,
          journalEntryId: parentEntry.id,
          entryNumber: parentEntry.entryNumber,
          description: parentEntry.description,
          date: parentEntry.date,
          currency: d.currency || parentEntry.currency || defaultBaseCode,
          exchangeRate: parseFloat(d.exchangeRate || parentEntry.exchangeRate || "1.0"),
          foreignDebit,
          foreignCredit,
          debit,
          credit,
          baseChange,
          foreignChange
        });
      }
    }
    let cumulativeBaseBalance = openingBaseBalance;
    let cumulativeForeignBalance = openingForeignBalance;
    const lines = activeLines.map((l) => {
      cumulativeBaseBalance += l.baseChange;
      cumulativeForeignBalance += l.foreignChange;
      return {
        ...l,
        runningBaseBalance: cumulativeBaseBalance,
        runningForeignBalance: cumulativeForeignBalance
      };
    });
    return {
      account: {
        ...account,
        balance: Number(account.balance) || 0,
        foreignBalance: Number(account.foreignBalance) || 0
      },
      openingBaseBalance,
      openingForeignBalance,
      lines,
      totalDebit: lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: lines.reduce((s, l) => s + l.credit, 0),
      totalForeignDebit: lines.reduce((s, l) => s + l.foreignDebit, 0),
      totalForeignCredit: lines.reduce((s, l) => s + l.foreignCredit, 0),
      endingBaseBalance: cumulativeBaseBalance,
      endingForeignBalance: cumulativeForeignBalance
    };
  }
  // 5. TRIAL BALANCE REPORT
  static async getTrialBalance(filterCurrency) {
    return await withAutoMigration(async () => {
      const baseCode = await CurrencyRepository.getBaseCurrencyCode();
      const allAccounts = await db.select().from(accounts);
      let allDetails = await db.select().from(journalDetails);
      if (filterCurrency && filterCurrency !== "ALL") {
        allDetails = allDetails.filter((d) => d.currency === filterCurrency);
      }
      const trialBalanceRows = allAccounts.map((acc) => {
        const accDetails = allDetails.filter((d) => d.accountId === acc.id);
        const totalDebit = accDetails.reduce((sum, d) => sum + parseFloat(d.debit || "0"), 0);
        const totalCredit = accDetails.reduce((sum, d) => sum + parseFloat(d.credit || "0"), 0);
        const totalForeignDebit = accDetails.reduce((sum, d) => sum + parseFloat(d.foreignDebit || "0"), 0);
        const totalForeignCredit = accDetails.reduce((sum, d) => sum + parseFloat(d.foreignCredit || "0"), 0);
        const balance = parseFloat(acc.balance || "0");
        const isDebitSide = acc.type === "asset" || acc.type === "expense";
        return {
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          currency: acc.currency || baseCode,
          parentId: acc.parentId,
          totalDebit,
          totalCredit,
          totalForeignDebit,
          totalForeignCredit,
          debitBalance: isDebitSide ? balance : 0,
          creditBalance: !isDebitSide ? balance : 0,
          netBalance: balance
        };
      });
      const totalDebitSum = trialBalanceRows.reduce((sum, r) => sum + r.debitBalance, 0);
      const totalCreditSum = trialBalanceRows.reduce((sum, r) => sum + r.creditBalance, 0);
      const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;
      return {
        rows: trialBalanceRows,
        totalDebit: totalDebitSum,
        totalCredit: totalCreditSum,
        isBalanced
      };
    });
  }
  // 6. JOURNAL ENTRIES QUERY
  static async getJournalEntries(search, date, currencyFilter, statusFilter) {
    return await withAutoMigration(async () => {
      const baseCode = await CurrencyRepository.getBaseCurrencyCode();
      let entries = await db.select().from(journalEntries).orderBy((0, import_drizzle_orm10.desc)(journalEntries.date), (0, import_drizzle_orm10.desc)(journalEntries.createdAt));
      if (search) {
        const term = search.toLowerCase();
        entries = entries.filter(
          (e) => e.description && e.description.toLowerCase().includes(term) || e.entryNumber.toLowerCase().includes(term) || e.reference && e.reference.toLowerCase().includes(term)
        );
      }
      if (date) {
        entries = entries.filter((e) => e.date === date);
      }
      if (currencyFilter && currencyFilter !== "ALL") {
        entries = entries.filter((e) => e.currency === currencyFilter);
      }
      if (statusFilter && statusFilter !== "ALL") {
        entries = entries.filter((e) => e.status === statusFilter);
      }
      const entryIds = entries.map((e) => e.id);
      const allLines = entryIds.length > 0 ? await db.select().from(journalLines).where((0, import_drizzle_orm10.inArray)(journalLines.journalEntryId, entryIds)) : [];
      const accountIds = Array.from(new Set(allLines.map((l) => l.accountId)));
      const accountsList = accountIds.length > 0 ? await db.select().from(accounts).where((0, import_drizzle_orm10.inArray)(accounts.id, accountIds)) : [];
      const accountsMap = new Map(accountsList.map((a) => [a.id, a]));
      return entries.map((entry) => {
        const entryLines = allLines.filter((l) => l.journalEntryId === entry.id).map((l) => {
          const acc = accountsMap.get(l.accountId);
          return {
            id: l.id,
            accountId: l.accountId,
            accountCode: acc?.code || "",
            accountName: acc?.name || "",
            accountType: acc?.type || "",
            currency: l.currency || entry.currency || baseCode,
            exchangeRate: parseFloat(l.exchangeRate || entry.exchangeRate || "1.0"),
            foreignDebit: parseFloat(l.foreignDebit || "0"),
            foreignCredit: parseFloat(l.foreignCredit || "0"),
            debit: parseFloat(l.debit || "0"),
            credit: parseFloat(l.credit || "0"),
            description: l.description || entry.description
          };
        });
        return {
          ...entry,
          foreignAmount: parseFloat(entry.foreignAmount || "0"),
          baseAmount: parseFloat(entry.baseAmount || "0"),
          exchangeRate: parseFloat(entry.exchangeRate || "1.0"),
          lines: entryLines,
          details: entryLines
          // backward compatibility
        };
      });
    });
  }
  // 7. POSTING RULES
  static async getPostingRules() {
    return await db.select().from(postingRules);
  }
  static async findPostingRuleByCode(ruleCode) {
    const res = await db.select().from(postingRules).where((0, import_drizzle_orm10.eq)(postingRules.ruleCode, ruleCode));
    return res[0] || null;
  }
  static async upsertPostingRule(ruleCode, accountId) {
    const existing = await db.select().from(postingRules).where((0, import_drizzle_orm10.eq)(postingRules.ruleCode, ruleCode));
    if (existing.length > 0) {
      await db.update(postingRules).set({ accountId }).where((0, import_drizzle_orm10.eq)(postingRules.ruleCode, ruleCode));
    } else {
      await db.insert(postingRules).values({
        id: "pr_" + Math.random().toString(36).substr(2, 9),
        ruleCode,
        description: ruleCode,
        accountId
      });
    }
    return { ruleCode, accountId };
  }
  // 8. EXPENSES
  static async getExpenses() {
    return await db.select().from(expenses);
  }
  static async createExpense(data) {
    await db.insert(expenses).values(data);
    return data;
  }
  static async deleteExpense(id) {
    await db.delete(expenses).where((0, import_drizzle_orm10.eq)(expenses.id, id));
    return { success: true };
  }
  // 9. OTHER ENTITIES
  static async getCurrencies() {
    return await db.select().from(currencies);
  }
  static async getTaxes() {
    return await db.select().from(taxes);
  }
  static async getPaymentMethods() {
    return await db.select().from(paymentMethods);
  }
  static async getCashboxes() {
    return await db.select().from(cashboxes);
  }
};

// src/core/repositories/InventoryRepository.ts
var InventoryRepository = class {
  // 1. WAREHOUSES MANAGEMENT
  static async getWarehouses() {
    try {
      let list = await db.select().from(warehouses);
      if (list.length === 0) {
        const existingCompanies = await db.select().from(companies);
        let compId = "company-1";
        if (existingCompanies.length === 0) {
          await db.insert(companies).values({
            id: "company-1",
            name: "\u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
            taxNumber: "300000000000003",
            email: "info@company.com",
            phone: "0110000000",
            address: "\u0627\u0644\u0631\u064A\u0627\u0636"
          });
        } else {
          compId = existingCompanies[0].id;
        }
        const defaultWh = {
          id: "wh_main",
          companyId: compId,
          name: "\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
          code: "WH-MAIN",
          location: "\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0631\u0626\u064A\u0633\u064A"
        };
        await db.insert(warehouses).values(defaultWh);
        list = [defaultWh];
      }
      return list;
    } catch (error) {
      console.error("Error in getWarehouses:", error);
      return [];
    }
  }
  static async findWarehouseById(id) {
    const res = await db.select().from(warehouses).where((0, import_drizzle_orm11.eq)(warehouses.id, id));
    return res[0] || null;
  }
  static async upsertWarehouse(data) {
    const all = await db.select().from(warehouses);
    const existing = all.find((w) => data.id && w.id === data.id || data.code && w.code === data.code);
    const whId = existing ? existing.id : data.id || "wh_" + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id: whId,
      companyId: data.companyId || "company-1",
      branchId: data.branchId || null,
      name: data.name,
      code: data.code,
      location: data.location || ""
    };
    if (existing) {
      await db.update(warehouses).set(dbValue).where((0, import_drizzle_orm11.eq)(warehouses.id, whId));
    } else {
      await db.insert(warehouses).values(dbValue);
    }
    return dbValue;
  }
  static async deleteWarehouse(id) {
    const movesFrom = await db.select().from(stockMoves).where((0, import_drizzle_orm11.eq)(stockMoves.fromWarehouseId, id));
    const movesTo = await db.select().from(stockMoves).where((0, import_drizzle_orm11.eq)(stockMoves.toWarehouseId, id));
    if (movesFrom.length > 0 || movesTo.length > 0) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0646\u0638\u0631\u0627\u064B \u0644\u0648\u062C\u0648\u062F \u062D\u0631\u0643\u0627\u062A \u0645\u062E\u0632\u0646\u064A\u0629 \u0645\u0631\u062A\u0628\u0637\u0629 \u0628\u0647.");
    }
    await db.delete(warehouses).where((0, import_drizzle_orm11.eq)(warehouses.id, id));
    return { success: true };
  }
  // 2. STOCK MOVES
  static async recordStockMove(input) {
    const moveId = "sm_" + Math.random().toString(36).substr(2, 9);
    const value = {
      id: moveId,
      companyId: input.companyId || "company-1",
      branchId: input.branchId || null,
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId || null,
      toWarehouseId: input.toWarehouseId || null,
      quantity: input.quantity.toString(),
      unitCost: (input.unitCost || 0).toString(),
      type: input.type,
      referenceId: input.referenceId || null,
      notes: input.notes || null
    };
    await db.insert(stockMoves).values(value);
    return value;
  }
  static async getStockMoves(productId, warehouseId, type) {
    let moves = await db.select().from(stockMoves).orderBy((0, import_drizzle_orm11.desc)(stockMoves.createdAt));
    if (productId) {
      moves = moves.filter((m) => m.productId === productId);
    }
    if (warehouseId) {
      moves = moves.filter((m) => m.fromWarehouseId === warehouseId || m.toWarehouseId === warehouseId);
    }
    if (type && type !== "all") {
      moves = moves.filter((m) => m.type === type);
    }
    return moves;
  }
  // 3. WEIGHTED AVERAGE COST CALCULATION ON PURCHASES
  static async updateWeightedAverageCostOnPurchase(productId, incomingQty, unitCost) {
    const [product] = await db.select().from(products).where((0, import_drizzle_orm11.eq)(products.id, productId));
    if (!product) return;
    const currentStock = parseFloat(product.stock || "0");
    const oldCost = parseFloat(product.purchasePrice || "0");
    let newAvgCost = oldCost;
    const newStock = currentStock + incomingQty;
    if (newStock > 0 && incomingQty > 0) {
      newAvgCost = (currentStock * oldCost + incomingQty * unitCost) / newStock;
      newAvgCost = Math.round(newAvgCost * 100) / 100;
    }
    await db.update(products).set({
      stock: newStock.toString(),
      purchasePrice: newAvgCost.toString()
    }).where((0, import_drizzle_orm11.eq)(products.id, productId));
    return { newStock, newAvgCost };
  }
  // 4. WAREHOUSE TRANSFERS
  static async transferStock(productId, fromWarehouseId, toWarehouseId, quantity, notes) {
    if (quantity <= 0) {
      throw new Error("\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u062D\u0648\u0644\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631.");
    }
    if (fromWarehouseId === toWarehouseId) {
      throw new Error("\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u0645\u062D\u0648\u0644 \u0645\u0646\u0647 \u0648\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u0645\u062D\u0648\u0644 \u0625\u0644\u064A\u0647 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646\u0627 \u0645\u062E\u062A\u0644\u0641\u064A\u0646.");
    }
    const [product] = await db.select().from(products).where((0, import_drizzle_orm11.eq)(products.id, productId));
    if (!product) {
      throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    }
    const fromWh = await this.findWarehouseById(fromWarehouseId);
    const toWh = await this.findWarehouseById(toWarehouseId);
    if (!fromWh || !toWh) {
      throw new Error("\u0623\u062D\u062F \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    }
    const move = await this.recordStockMove({
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      type: "transfer",
      notes: notes || `\u062A\u062D\u0648\u064A\u0644 \u0645\u062E\u0632\u0646\u064A \u0645\u0646 ${fromWh.name} \u0625\u0644\u0649 ${toWh.name}`
    });
    return move;
  }
  // 5. PHYSICAL STOCK ADJUSTMENT WITH AUTOMATIC ACCOUNTING ENTRY
  static async adjustPhysicalStock(productId, warehouseId, actualQuantity, notes) {
    if (actualQuantity < 0) {
      throw new Error("\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0641\u0639\u0644\u064A\u0629 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0628\u0627\u0644\u0633\u0627\u0644\u0628.");
    }
    const [product] = await db.select().from(products).where((0, import_drizzle_orm11.eq)(products.id, productId));
    if (!product) {
      throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    }
    const currentStock = parseFloat(product.stock || "0");
    const delta = actualQuantity - currentStock;
    if (delta === 0) {
      return { success: true, message: "\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u062D\u0627\u0644\u064A\u060C \u0644\u0645 \u064A\u0637\u0631\u0623 \u062A\u063A\u064A\u064A\u0631." };
    }
    const unitCost = parseFloat(product.purchasePrice || "0");
    const totalValueDiff = Math.abs(delta) * unitCost;
    await db.update(products).set({ stock: actualQuantity.toString() }).where((0, import_drizzle_orm11.eq)(products.id, productId));
    const wh = await this.findWarehouseById(warehouseId);
    await this.recordStockMove({
      productId,
      fromWarehouseId: delta < 0 ? warehouseId : null,
      toWarehouseId: delta > 0 ? warehouseId : null,
      quantity: Math.abs(delta),
      type: "adjustment",
      notes: notes || `\u062A\u0633\u0648\u064A\u0629 \u062C\u0631\u062F\u064A\u0629 \u0645\u062E\u0632\u0646\u064A\u0629 \u0644\u0644\u0645\u0646\u062A\u062C (${product.name}) - ${delta > 0 ? "\u0632\u064A\u0627\u062F\u0629" : "\u0639\u062C\u0632/\u062A\u0627\u0644\u0641"}`
    });
    let journalResult = null;
    if (totalValueDiff > 0) {
      const invAcc = "acc_inventory";
      const cogsAcc = "acc_cogs";
      const revAcc = "acc_sales";
      const entryDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const entryNum = "JE-ADJ-" + Math.floor(1e3 + Math.random() * 9e3);
      const lines = [];
      if (delta > 0) {
        lines.push({ accountId: invAcc, debit: totalValueDiff, credit: 0 });
        lines.push({ accountId: revAcc, debit: 0, credit: totalValueDiff });
      } else {
        lines.push({ accountId: cogsAcc, debit: totalValueDiff, credit: 0 });
        lines.push({ accountId: invAcc, debit: 0, credit: totalValueDiff });
      }
      journalResult = await AccountingRepository.postJournalEntry(
        entryNum,
        `\u062A\u0633\u0648\u064A\u0629 \u062C\u0631\u062F\u064A\u0629 \u0644\u0644\u0645\u062E\u0632\u0648\u0646 - ${product.name} (${delta > 0 ? "\u0641\u0627\u0626\u0636 \u0632\u064A\u0627\u062F\u0629" : "\u0639\u062C\u0632/\u062A\u0644\u0641"})`,
        entryDate,
        lines
      );
    }
    return {
      success: true,
      previousStock: currentStock,
      newStock: actualQuantity,
      delta,
      totalValueDiff,
      journalEntry: journalResult
    };
  }
  // 5.5 MANUAL STOCK MOVEMENTS (أذن إضافة / إذن صرف مخزني)
  static async recordManualStockMove(input) {
    if (input.quantity <= 0) {
      throw new Error("\u0627\u0644\u0643\u0645\u064A\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631.");
    }
    const [product] = await db.select().from(products).where((0, import_drizzle_orm11.eq)(products.id, input.productId));
    if (!product) {
      throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    }
    const currentStock = parseFloat(product.stock || "0");
    const oldCost = parseFloat(product.purchasePrice || "0");
    const inputCost = input.unitCost !== void 0 && input.unitCost !== null && input.unitCost >= 0 ? input.unitCost : oldCost;
    let newStock = currentStock;
    let newAvgCost = oldCost;
    if (input.type === "in") {
      newStock = currentStock + input.quantity;
      if (newStock > 0 && inputCost >= 0) {
        newAvgCost = (currentStock * oldCost + input.quantity * inputCost) / newStock;
        newAvgCost = Math.round(newAvgCost * 100) / 100;
      }
      await db.update(products).set({
        stock: newStock.toString(),
        purchasePrice: newAvgCost.toString()
      }).where((0, import_drizzle_orm11.eq)(products.id, input.productId));
    } else {
      if (currentStock < input.quantity) {
        throw new Error(`\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u062D\u0627\u0644\u064A (${currentStock}) \u0644\u0627 \u064A\u0643\u0641\u064A \u0644\u0635\u0631\u0641 \u0643\u0645\u064A\u0629 (${input.quantity}).`);
      }
      newStock = currentStock - input.quantity;
      await db.update(products).set({ stock: newStock.toString() }).where((0, import_drizzle_orm11.eq)(products.id, input.productId));
    }
    const move = await this.recordStockMove({
      productId: input.productId,
      fromWarehouseId: input.type === "out" ? input.warehouseId : null,
      toWarehouseId: input.type === "in" ? input.warehouseId : null,
      quantity: input.quantity,
      unitCost: inputCost,
      type: input.type === "in" ? "purchase" : "sale",
      referenceId: input.referenceId || `STK-${input.type.toUpperCase()}-${Math.floor(1e3 + Math.random() * 9e3)}`,
      notes: input.notes || (input.type === "in" ? "\u0625\u0630\u0646 \u0625\u062F\u062E\u0627\u0644 \u0645\u062E\u0632\u0646\u064A \u064A\u062F\u0648\u064A" : "\u0625\u0630\u0646 \u0635\u0631\u0641 \u0645\u062E\u0632\u0646\u064A \u064A\u062F\u0648\u064A")
    });
    const totalValue = input.quantity * inputCost;
    let journalResult = null;
    if (totalValue > 0) {
      const invAcc = "acc_inventory";
      const cogsAcc = "acc_cogs";
      const entryDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const entryNum = "JE-STK-" + Math.floor(1e3 + Math.random() * 9e3);
      const lines = [];
      if (input.type === "in") {
        lines.push({ accountId: invAcc, debit: totalValue, credit: 0 });
        lines.push({ accountId: "acc_cash", debit: 0, credit: totalValue });
      } else {
        lines.push({ accountId: cogsAcc, debit: totalValue, credit: 0 });
        lines.push({ accountId: invAcc, debit: 0, credit: totalValue });
      }
      journalResult = await AccountingRepository.postJournalEntry(
        entryNum,
        `\u0625\u0630\u0646 \u062D\u0631\u0643\u0629 \u0645\u062E\u0632\u0646\u064A\u0629 (${input.type === "in" ? "\u0625\u0636\u0627\u0641\u0629/\u062A\u0648\u0631\u064A\u062F" : "\u0635\u0631\u0641/\u0625\u062A\u0644\u0627\u0641"}) - ${product.name}`,
        entryDate,
        lines
      );
    }
    return {
      success: true,
      previousStock: currentStock,
      newStock,
      newAvgCost,
      move,
      journalEntry: journalResult
    };
  }
  // 6. STOCK LEDGER FOR PRODUCT
  static async getProductStockLedger(productId) {
    const [product] = await db.select().from(products).where((0, import_drizzle_orm11.eq)(products.id, productId));
    if (!product) {
      throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    }
    const moves = await db.select().from(stockMoves).where((0, import_drizzle_orm11.eq)(stockMoves.productId, productId));
    const sortedMoves = moves.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    const allWhs = await this.getWarehouses();
    const whMap = new Map(allWhs.map((w) => [w.id, w.name]));
    let runningStock = 0;
    const ledgerLines = sortedMoves.map((m) => {
      const qty = parseFloat(m.quantity || "0");
      let change = 0;
      if (m.type === "purchase" || m.type === "initial") {
        change = qty;
      } else if (m.type === "sale") {
        change = -qty;
      } else if (m.type === "adjustment") {
        change = m.toWarehouseId ? qty : -qty;
      } else if (m.type === "transfer") {
        change = 0;
      }
      runningStock += change;
      return {
        id: m.id,
        type: m.type,
        typeLabel: m.type === "purchase" ? "\u0645\u0634\u062A\u0631\u064A\u0627\u062A" : m.type === "sale" ? "\u0645\u0628\u064A\u0639\u0627\u062A" : m.type === "transfer" ? "\u062A\u062D\u0648\u064A\u0644 \u0628\u064A\u0646 \u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A" : m.type === "adjustment" ? "\u062A\u0633\u0648\u064A\u0629 \u062C\u0631\u062F\u064A\u0629" : "\u0631\u0635\u064A\u062F \u0623\u0648\u0644 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A",
        quantity: qty,
        change,
        runningStock,
        fromWarehouse: m.fromWarehouseId ? whMap.get(m.fromWarehouseId) || m.fromWarehouseId : "-",
        toWarehouse: m.toWarehouseId ? whMap.get(m.toWarehouseId) || m.toWarehouseId : "-",
        referenceId: m.referenceId || "-",
        notes: m.notes || "-",
        date: m.createdAt ? new Date(m.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    return {
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        stock: parseFloat(product.stock || "0"),
        purchasePrice: parseFloat(product.purchasePrice || "0"),
        price: parseFloat(product.price || "0"),
        unit: product.unit
      },
      ledgerLines,
      currentTotalStock: parseFloat(product.stock || "0")
    };
  }
  static calculateFifoValuationForProduct(productId, stock, avgCost, productMoves) {
    if (stock <= 0) {
      return { fifoUnitCost: avgCost, fifoTotalValue: 0 };
    }
    const inwardMoves = productMoves.filter(
      (m) => m.productId === productId && (m.type === "purchase" || m.type === "initial" || m.type === "adjustment" && m.toWarehouseId)
    ).sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
    let remainingQty = stock;
    let fifoTotalValue = 0;
    for (const move of inwardMoves) {
      if (remainingQty <= 0) break;
      const qty = parseFloat(move.quantity || "0");
      const unitCost = parseFloat(move.unitCost || "0") || avgCost;
      const takeQty = Math.min(remainingQty, qty);
      fifoTotalValue += takeQty * unitCost;
      remainingQty -= takeQty;
    }
    if (remainingQty > 0) {
      fifoTotalValue += remainingQty * avgCost;
    }
    fifoTotalValue = Math.round(fifoTotalValue * 100) / 100;
    const fifoUnitCost = Math.round(fifoTotalValue / stock * 100) / 100;
    return { fifoUnitCost, fifoTotalValue };
  }
  // 7. INVENTORY VALUATION REPORT (Average Cost & FIFO)
  static async getInventoryValuation(method = "average") {
    const allProducts = await db.select().from(products);
    const allMoves = await db.select().from(stockMoves);
    const valuationItems = allProducts.map((p) => {
      const stock = parseFloat(p.stock || "0");
      const avgCost = parseFloat(p.purchasePrice || "0");
      const sellingPrice = parseFloat(p.price || "0");
      const { fifoUnitCost, fifoTotalValue } = this.calculateFifoValuationForProduct(p.id, stock, avgCost, allMoves);
      const wacTotalValue = Math.round(stock * avgCost * 100) / 100;
      const selectedTotalCostValue = method === "fifo" ? fifoTotalValue : wacTotalValue;
      const totalSalesValue = Math.round(stock * sellingPrice * 100) / 100;
      const potentialProfit = Math.round((totalSalesValue - selectedTotalCostValue) * 100) / 100;
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        stock,
        avgCost,
        fifoCost: fifoUnitCost,
        sellingPrice,
        wacCostValue: wacTotalValue,
        fifoCostValue: fifoTotalValue,
        totalCostValue: selectedTotalCostValue,
        totalSalesValue,
        potentialProfit
      };
    });
    const totalCostSum = valuationItems.reduce((acc, item) => acc + item.totalCostValue, 0);
    const totalFifoCostSum = valuationItems.reduce((acc, item) => acc + item.fifoCostValue, 0);
    const totalWacCostSum = valuationItems.reduce((acc, item) => acc + item.wacCostValue, 0);
    const totalSalesSum = valuationItems.reduce((acc, item) => acc + item.totalSalesValue, 0);
    const totalPotentialProfitSum = totalSalesSum - totalCostSum;
    return {
      method,
      items: valuationItems,
      totalCostSum,
      totalWacCostSum,
      totalFifoCostSum,
      totalSalesSum,
      totalPotentialProfitSum,
      totalItemsCount: valuationItems.length
    };
  }
  // 8. LOW STOCK ALERTS
  static async getLowStockAlerts() {
    const allProducts = await db.select().from(products);
    const alertItems = allProducts.map((p) => {
      const stock = parseFloat(p.stock || "0");
      const minStock = parseFloat(p.minStock || "5");
      const isOut = stock <= 0;
      const isLow = stock <= minStock;
      if (!isLow && !isOut) return null;
      const suggestedReorder = Math.max(1, minStock * 2 - stock);
      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        stock,
        minStock,
        status: isOut ? "out_of_stock" : "low_stock",
        statusLabel: isOut ? "\u0646\u0641\u0630\u062A \u0627\u0644\u0643\u0645\u064A\u0629" : "\u0645\u062E\u0632\u0648\u0646 \u062D\u0631\u062C",
        suggestedReorder,
        purchasePrice: parseFloat(p.purchasePrice || "0")
      };
    }).filter(Boolean);
    return alertItems;
  }
};

// src/core/repositories/SalesRepository.ts
init_database();
init_schema2();
var import_drizzle_orm12 = require("drizzle-orm");
var SalesRepository = class {
  static async findAllInvoices(params) {
    const conditions = [];
    if (params?.customerId) conditions.push((0, import_drizzle_orm12.eq)(invoices.customerId, params.customerId));
    if (params?.status) conditions.push((0, import_drizzle_orm12.eq)(invoices.status, params.status));
    if (params?.date) conditions.push((0, import_drizzle_orm12.eq)(invoices.date, params.date));
    const whereClause = conditions.length > 0 ? (0, import_drizzle_orm12.and)(...conditions) : void 0;
    let total = 0;
    if (params?.page || params?.limit) {
      const countResult = await db.select({ count: import_drizzle_orm12.sql`count(*)` }).from(invoices).where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select().from(invoices).orderBy((0, import_drizzle_orm12.desc)(invoices.createdAt));
    if (whereClause) {
      query = query.where(whereClause);
    }
    if (params?.page && params?.limit) {
      const offset = (params.page - 1) * params.limit;
      query = query.limit(params.limit).offset(offset);
    }
    const invoiceList = await query;
    const invoiceIds = invoiceList.map((i) => i.id);
    const itemsList = invoiceIds.length > 0 ? await db.select().from(invoiceItems).where((0, import_drizzle_orm12.inArray)(invoiceItems.invoiceId, invoiceIds)) : [];
    const mapped = invoiceList.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      items: itemsList.filter((item) => item.invoiceId === inv.id).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || "0"),
        quantity: parseFloat(item.quantity || "0"),
        discount: parseFloat(item.discount || "0"),
        discountType: item.discountType,
        total: parseFloat(item.total || "0"),
        taxAmount: parseFloat(item.taxAmount || "0")
      })),
      totalWithoutTax: parseFloat(inv.totalWithoutTax || "0"),
      taxAmount: parseFloat(inv.taxAmount || "0"),
      discountAmount: parseFloat(inv.discountAmount || "0"),
      grandTotal: parseFloat(inv.grandTotal || "0"),
      paymentMethod: inv.paymentMethod,
      paymentDetails: {
        cashAmount: parseFloat(inv.cashAmount || "0"),
        cardAmount: parseFloat(inv.cardAmount || "0")
      },
      status: inv.status,
      customerId: inv.customerId || void 0,
      customerName: inv.customerName || void 0,
      taxNumber: inv.taxNumber || void 0,
      cashierName: inv.cashierName
    }));
    return { items: mapped, total };
  }
  static async findInvoiceById(id) {
    const invRes = await db.select().from(invoices).where((0, import_drizzle_orm12.eq)(invoices.id, id));
    if (invRes.length === 0) return null;
    const inv = invRes[0];
    const items = await db.select().from(invoiceItems).where((0, import_drizzle_orm12.eq)(invoiceItems.invoiceId, id));
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || "0"),
        quantity: parseFloat(item.quantity || "0"),
        discount: parseFloat(item.discount || "0"),
        discountType: item.discountType,
        total: parseFloat(item.total || "0"),
        taxAmount: parseFloat(item.taxAmount || "0")
      })),
      totalWithoutTax: parseFloat(inv.totalWithoutTax || "0"),
      taxAmount: parseFloat(inv.taxAmount || "0"),
      discountAmount: parseFloat(inv.discountAmount || "0"),
      grandTotal: parseFloat(inv.grandTotal || "0"),
      paymentMethod: inv.paymentMethod,
      cashAmount: parseFloat(inv.cashAmount || "0"),
      cardAmount: parseFloat(inv.cardAmount || "0"),
      status: inv.status,
      customerId: inv.customerId,
      customerName: inv.customerName,
      taxNumber: inv.taxNumber,
      cashierName: inv.cashierName
    };
  }
  static async createSaleInvoice(invData) {
    const invId = invData.id || "inv_" + Math.random().toString(36).substr(2, 9);
    const invoiceNumber = invData.invoiceNumber || `INV-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const subtotal = invData.subtotal || 0;
    const discountAmount = invData.discountAmount || 0;
    const totalWithoutTax = invData.totalWithoutTax !== void 0 && invData.totalWithoutTax !== null && invData.totalWithoutTax !== 0 ? invData.totalWithoutTax : Math.max(0, subtotal - discountAmount);
    await db.insert(invoices).values({
      id: invId,
      invoiceNumber,
      date: invData.date,
      totalWithoutTax: totalWithoutTax.toString(),
      taxAmount: (invData.taxAmount || 0).toString(),
      discountAmount: discountAmount.toString(),
      grandTotal: (invData.grandTotal || 0).toString(),
      paymentMethod: invData.paymentMethod || "cash",
      cashAmount: (invData.paymentDetails?.cashAmount || 0).toString(),
      cardAmount: (invData.paymentDetails?.cardAmount || 0).toString(),
      status: invData.status || "paid",
      customerId: invData.customerId || null,
      customerName: invData.customerName || null,
      taxNumber: invData.taxNumber || null,
      cashierName: invData.cashierName || "\u0623\u062D\u0645\u062F \u0627\u0644\u0643\u0627\u0634\u064A\u0631"
    });
    let totalCogs = 0;
    const itemIds = Array.from(new Set((invData.items || []).map((item) => item.productId)));
    const productsList = itemIds.length > 0 ? await db.select().from(products).where((0, import_drizzle_orm12.inArray)(products.id, itemIds)) : [];
    const productsMap = new Map(productsList.map((p) => [p.id, p]));
    const invoiceItemValues = [];
    for (const item of invData.items || []) {
      const itemId = "item_" + Math.random().toString(36).substr(2, 9);
      invoiceItemValues.push({
        id: itemId,
        invoiceId: invId,
        productId: item.productId,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        discountType: item.discountType || "fixed",
        total: (item.total || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString()
      });
      const product = productsMap.get(item.productId);
      if (product) {
        const purchasePrice = parseFloat(product.purchasePrice || "0");
        totalCogs += purchasePrice * item.quantity;
      }
    }
    if (invoiceItemValues.length > 0) {
      await db.insert(invoiceItems).values(invoiceItemValues);
    }
    const stockUpdatePromises = (invData.items || []).map(async (item) => {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || "0");
        if (currentStock !== 999) {
          const nextStock = Math.max(0, currentStock - item.quantity);
          await db.update(products).set({
            stock: nextStock.toString()
          }).where((0, import_drizzle_orm12.eq)(products.id, item.productId));
          await InventoryRepository.recordStockMove({
            productId: item.productId,
            fromWarehouseId: "wh_main",
            quantity: item.quantity,
            type: "sale",
            referenceId: invId,
            notes: `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0631\u0642\u0645 ${invData.invoiceNumber}`
          });
        }
      }
    });
    await Promise.all(stockUpdatePromises);
    const creditAmount = invData.paymentMethod === "credit" ? invData.grandTotal : invData.paymentMethod === "split" ? invData.paymentDetails?.creditAmount || 0 : 0;
    if (creditAmount > 0 && invData.customerId) {
      await CustomerRepository.adjustBalance(invData.customerId, creditAmount);
    }
    const getAccountByRule2 = async (ruleId, fallbackAccId) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };
    const cashAcc = await getAccountByRule2("sales_cash_debit", "acc_cash");
    const bankAcc = await getAccountByRule2("sales_bank_debit", "acc_bank");
    const recAcc = await getAccountByRule2("sales_credit_debit", "acc_receivable");
    const salesAcc = await getAccountByRule2("sales_revenue_credit", "acc_sales");
    const taxAcc = await getAccountByRule2("sales_tax_credit", "acc_tax");
    const cogsAcc = await getAccountByRule2("sales_cogs_debit", "acc_cogs");
    const invAcc = await getAccountByRule2("sales_inventory_credit", "acc_inventory");
    const accountingLines = [];
    if (invData.paymentMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === "card") {
      accountingLines.push({ accountId: bankAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === "credit") {
      accountingLines.push({ accountId: recAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === "split") {
      const cashAmt = invData.paymentDetails?.cashAmount || 0;
      const cardAmt = invData.paymentDetails?.cardAmount || 0;
      const credAmt = invData.paymentDetails?.creditAmount || 0;
      if (cashAmt > 0) accountingLines.push({ accountId: cashAcc, debit: cashAmt, credit: 0 });
      if (cardAmt > 0) accountingLines.push({ accountId: bankAcc, debit: cardAmt, credit: 0 });
      if (credAmt > 0) accountingLines.push({ accountId: recAcc, debit: credAmt, credit: 0 });
    }
    accountingLines.push({ accountId: salesAcc, debit: 0, credit: totalWithoutTax });
    if (invData.taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: 0, credit: invData.taxAmount });
    }
    if (totalCogs > 0) {
      accountingLines.push({ accountId: cogsAcc, debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: invAcc, debit: 0, credit: totalCogs });
    }
    await AccountingRepository.postJournalEntry(
      `JE-INV-${invoiceNumber}`,
      `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0631\u0642\u0645 ${invoiceNumber}`,
      invData.date,
      accountingLines,
      {
        currency: invData.currency,
        exchangeRate: invData.exchangeRate
      }
    );
    return { success: true, invoiceId: invId };
  }
  static async returnSaleInvoice(id) {
    const [inv] = await db.select().from(invoices).where((0, import_drizzle_orm12.eq)(invoices.id, id));
    if (!inv) {
      throw new Error("\u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    }
    if (inv.cashierName && inv.cashierName.includes("(\u0645\u0631\u062A\u062C\u0639\u0629)")) {
      throw new Error("\u062A\u0645 \u0625\u0631\u062C\u0627\u0639 \u0647\u0630\u0647 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0633\u0628\u0642\u0627\u064B");
    }
    const cashierName = inv.cashierName ? `${inv.cashierName} (\u0645\u0631\u062A\u062C\u0639\u0629)` : "\u0645\u0631\u062A\u062C\u0639\u0629";
    await db.update(invoices).set({ status: "unpaid", cashierName }).where((0, import_drizzle_orm12.eq)(invoices.id, id));
    const items = await db.select().from(invoiceItems).where((0, import_drizzle_orm12.eq)(invoiceItems.invoiceId, id));
    let totalCogs = 0;
    const itemIds = Array.from(new Set(items.map((item) => item.productId)));
    const productsList = itemIds.length > 0 ? await db.select().from(products).where((0, import_drizzle_orm12.inArray)(products.id, itemIds)) : [];
    const productsMap = new Map(productsList.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || "0");
        const qty = parseFloat(item.quantity || "0");
        const purchasePrice = parseFloat(product.purchasePrice || "0");
        totalCogs += purchasePrice * qty;
        if (currentStock !== 999) {
          await db.update(products).set({
            stock: (currentStock + qty).toString()
          }).where((0, import_drizzle_orm12.eq)(products.id, item.productId));
          await InventoryRepository.recordStockMove({
            productId: item.productId,
            toWarehouseId: "wh_main",
            quantity: qty,
            type: "sale",
            referenceId: id,
            notes: `\u0645\u0631\u062A\u062C\u0639 \u0645\u0628\u064A\u0639\u0627\u062A \u0644\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0631\u0642\u0645 ${inv.invoiceNumber}`
          });
        }
      }
    }
    const grandTotal = parseFloat(inv.grandTotal || "0");
    const totalWithoutTax = parseFloat(inv.totalWithoutTax || "0");
    const taxAmount = parseFloat(inv.taxAmount || "0");
    const returnedCreditAmt = inv.paymentMethod === "credit" ? grandTotal : inv.paymentMethod === "split" ? parseFloat(inv.creditAmount || "0") : 0;
    if (returnedCreditAmt > 0 && inv.customerId) {
      await CustomerRepository.adjustBalance(inv.customerId, -returnedCreditAmt);
    }
    const getAccountByRule2 = async (ruleId, fallbackAccId) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };
    const cashAcc = await getAccountByRule2("sales_cash_debit", "acc_cash");
    const bankAcc = await getAccountByRule2("sales_bank_debit", "acc_bank");
    const recAcc = await getAccountByRule2("sales_credit_debit", "acc_receivable");
    const salesAcc = await getAccountByRule2("sales_revenue_credit", "acc_sales");
    const taxAcc = await getAccountByRule2("sales_tax_credit", "acc_tax");
    const cogsAcc = await getAccountByRule2("sales_cogs_debit", "acc_cogs");
    const invAcc = await getAccountByRule2("sales_inventory_credit", "acc_inventory");
    const accountingLines = [];
    accountingLines.push({ accountId: salesAcc, debit: totalWithoutTax, credit: 0 });
    if (taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: taxAmount, credit: 0 });
    }
    if (inv.paymentMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === "card") {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === "credit") {
      accountingLines.push({ accountId: recAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === "split") {
      const cashAmt = parseFloat(inv.cashAmount || "0");
      const cardAmt = parseFloat(inv.cardAmount || "0");
      const credAmt = parseFloat(inv.creditAmount || "0");
      if (cashAmt > 0) accountingLines.push({ accountId: cashAcc, debit: 0, credit: cashAmt });
      if (cardAmt > 0) accountingLines.push({ accountId: bankAcc, debit: 0, credit: cardAmt });
      if (credAmt > 0) accountingLines.push({ accountId: recAcc, debit: 0, credit: credAmt });
    }
    if (totalCogs > 0) {
      accountingLines.push({ accountId: invAcc, debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: cogsAcc, debit: 0, credit: totalCogs });
    }
    const journalResult = await AccountingRepository.postJournalEntry(
      `JE-RET-${inv.invoiceNumber}`,
      `\u0645\u0631\u062A\u062C\u0639 \u0645\u0628\u064A\u0639\u0627\u062A \u0644\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0631\u0642\u0645 ${inv.invoiceNumber}`,
      (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      accountingLines
    );
    return { success: true, journalEntry: journalResult };
  }
  // ==================== 1. QUOTATIONS (عروض الأسعار) ====================
  static async findAllQuotations() {
    const list = await db.select().from(quotations).orderBy((0, import_drizzle_orm12.desc)(quotations.createdAt));
    const qIds = list.map((q) => q.id);
    const allItems = qIds.length > 0 ? await db.select().from(quotationItems).where((0, import_drizzle_orm12.inArray)(quotationItems.quotationId, qIds)) : [];
    return list.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      customerId: q.customerId || void 0,
      customerName: q.customerName || void 0,
      date: q.date,
      validUntil: q.validUntil || void 0,
      subtotal: parseFloat(q.subtotal || "0"),
      taxAmount: parseFloat(q.taxAmount || "0"),
      discountAmount: parseFloat(q.discountAmount || "0"),
      grandTotal: parseFloat(q.grandTotal || "0"),
      currency: q.currency || "SAR",
      exchangeRate: parseFloat(q.exchangeRate || "1.0"),
      status: q.status || "draft",
      notes: q.notes || void 0,
      items: allItems.filter((item) => item.quotationId === q.id).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || "0"),
        quantity: parseFloat(item.quantity || "0"),
        discount: parseFloat(item.discount || "0"),
        taxAmount: parseFloat(item.taxAmount || "0"),
        total: parseFloat(item.total || "0")
      }))
    }));
  }
  static async createQuotation(data) {
    const id = data.id || "quote_" + Math.random().toString(36).substr(2, 9);
    const quotationNumber = data.quotationNumber || "QT-" + Date.now().toString().slice(-6);
    await db.insert(quotations).values({
      id,
      quotationNumber,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      validUntil: data.validUntil || null,
      subtotal: (data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      discountAmount: (data.discountAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      currency: data.currency || "SAR",
      exchangeRate: (data.exchangeRate || 1).toString(),
      status: data.status || "draft",
      notes: data.notes || null
    });
    if (data.items && data.items.length > 0) {
      const itemValues = data.items.map((item) => ({
        id: "qitem_" + Math.random().toString(36).substr(2, 9),
        quotationId: id,
        productId: item.productId || null,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString(),
        total: (item.total || 0).toString()
      }));
      await db.insert(quotationItems).values(itemValues);
    }
    return { id, quotationNumber, success: true };
  }
  // ==================== 2. SALES ORDERS (أوامر المبيعات) ====================
  static async findAllSalesOrders() {
    const list = await db.select().from(salesOrders).orderBy((0, import_drizzle_orm12.desc)(salesOrders.createdAt));
    const oIds = list.map((o) => o.id);
    const allItems = oIds.length > 0 ? await db.select().from(salesOrderItems).where((0, import_drizzle_orm12.inArray)(salesOrderItems.orderId, oIds)) : [];
    return list.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      quotationId: o.quotationId || void 0,
      customerId: o.customerId || void 0,
      customerName: o.customerName || void 0,
      date: o.date,
      deliveryDate: o.deliveryDate || void 0,
      subtotal: parseFloat(o.subtotal || "0"),
      taxAmount: parseFloat(o.taxAmount || "0"),
      discountAmount: parseFloat(o.discountAmount || "0"),
      grandTotal: parseFloat(o.grandTotal || "0"),
      currency: o.currency || "SAR",
      exchangeRate: parseFloat(o.exchangeRate || "1.0"),
      status: o.status || "confirmed",
      notes: o.notes || void 0,
      items: allItems.filter((item) => item.orderId === o.id).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || "0"),
        quantity: parseFloat(item.quantity || "0"),
        discount: parseFloat(item.discount || "0"),
        taxAmount: parseFloat(item.taxAmount || "0"),
        total: parseFloat(item.total || "0")
      }))
    }));
  }
  static async createSalesOrder(data) {
    const id = data.id || "order_" + Math.random().toString(36).substr(2, 9);
    const orderNumber = data.orderNumber || "SO-" + Date.now().toString().slice(-6);
    await db.insert(salesOrders).values({
      id,
      orderNumber,
      quotationId: data.quotationId || null,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      deliveryDate: data.deliveryDate || null,
      subtotal: (data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      discountAmount: (data.discountAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      currency: data.currency || "SAR",
      exchangeRate: (data.exchangeRate || 1).toString(),
      status: data.status || "confirmed",
      notes: data.notes || null
    });
    if (data.items && data.items.length > 0) {
      const itemValues = data.items.map((item) => ({
        id: "soitem_" + Math.random().toString(36).substr(2, 9),
        orderId: id,
        productId: item.productId || null,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString(),
        total: (item.total || 0).toString()
      }));
      await db.insert(salesOrderItems).values(itemValues);
    }
    if (data.quotationId) {
      await db.update(quotations).set({ status: "converted" }).where((0, import_drizzle_orm12.eq)(quotations.id, data.quotationId));
    }
    return { id, orderNumber, success: true };
  }
  // ==================== 3. CONVERSION WORKFLOWS ====================
  static async convertQuotationToOrder(quotationId) {
    const [q] = await db.select().from(quotations).where((0, import_drizzle_orm12.eq)(quotations.id, quotationId));
    if (!q) throw new Error("\u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const items = await db.select().from(quotationItems).where((0, import_drizzle_orm12.eq)(quotationItems.quotationId, quotationId));
    return await this.createSalesOrder({
      quotationId: q.id,
      customerId: q.customerId,
      customerName: q.customerName,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      subtotal: parseFloat(q.subtotal || "0"),
      taxAmount: parseFloat(q.taxAmount || "0"),
      discountAmount: parseFloat(q.discountAmount || "0"),
      grandTotal: parseFloat(q.grandTotal || "0"),
      currency: q.currency,
      exchangeRate: parseFloat(q.exchangeRate || "1.0"),
      status: "confirmed",
      notes: `\u062A\u0645 \u062A\u062D\u0648\u064A\u0644\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0645\u0646 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0631\u0642\u0645 ${q.quotationNumber}`,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        price: parseFloat(i.price || "0"),
        quantity: parseFloat(i.quantity || "0"),
        discount: parseFloat(i.discount || "0"),
        taxAmount: parseFloat(i.taxAmount || "0"),
        total: parseFloat(i.total || "0")
      }))
    });
  }
  static async convertOrderToInvoice(orderId, paymentMethod = "credit") {
    const [o] = await db.select().from(salesOrders).where((0, import_drizzle_orm12.eq)(salesOrders.id, orderId));
    if (!o) throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const items = await db.select().from(salesOrderItems).where((0, import_drizzle_orm12.eq)(salesOrderItems.orderId, orderId));
    const invNumber = "INV-" + Date.now().toString().slice(-6);
    const res = await this.createSaleInvoice({
      invoiceNumber: invNumber,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      customerId: o.customerId,
      customerName: o.customerName,
      totalWithoutTax: parseFloat(o.subtotal || "0"),
      taxAmount: parseFloat(o.taxAmount || "0"),
      discountAmount: parseFloat(o.discountAmount || "0"),
      grandTotal: parseFloat(o.grandTotal || "0"),
      paymentMethod,
      currency: o.currency,
      exchangeRate: parseFloat(o.exchangeRate || "1.0"),
      status: paymentMethod === "credit" ? "unpaid" : "paid",
      cashierName: "\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0622\u0644\u064A",
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        price: parseFloat(i.price || "0"),
        quantity: parseFloat(i.quantity || "0"),
        discount: parseFloat(i.discount || "0"),
        total: parseFloat(i.total || "0"),
        taxAmount: parseFloat(i.taxAmount || "0")
      }))
    });
    await db.update(salesOrders).set({ status: "converted" }).where((0, import_drizzle_orm12.eq)(salesOrders.id, orderId));
    return res;
  }
  // ==================== 4. CUSTOMER PAYMENTS (تحصيل سندات المبيعات) ====================
  static async recordCustomerPayment(paymentData) {
    if (!paymentData.customerId || paymentData.amount <= 0) {
      throw new Error("\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0635\u062D\u064A\u062D \u0644\u062A\u062D\u0635\u064A\u0644 \u0627\u0644\u062F\u0641\u0639\u0629");
    }
    const payId = "pay_" + Math.random().toString(36).substr(2, 9);
    const paymentNumber = "PAY-" + Date.now().toString().slice(-6);
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    await db.insert(payments).values({
      id: payId,
      companyId: paymentData.companyId || "company-1",
      paymentNumber,
      date,
      type: "receipt",
      // Incoming receipt voucher
      partyId: paymentData.customerId,
      partyType: "customer",
      amount: paymentData.amount.toString(),
      method: paymentData.method || "cash",
      reference: paymentData.reference || null,
      notes: paymentData.notes || `\u062A\u062D\u0635\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u0645\u0646 \u0627\u0644\u0639\u0645\u064A\u0644 ${paymentData.customerName || paymentData.customerId}`
    });
    await CustomerRepository.adjustBalance(paymentData.customerId, -paymentData.amount);
    const getAccountByRule2 = async (ruleId, fallbackAccId) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };
    const cashAcc = await getAccountByRule2("sales_cash_debit", "acc_cash");
    const bankAcc = await getAccountByRule2("sales_bank_debit", "acc_bank");
    const recAcc = await getAccountByRule2("sales_credit_debit", "acc_receivable");
    const debitAcc = paymentData.method === "bank" ? bankAcc : cashAcc;
    const journalLines2 = [
      { accountId: debitAcc, debit: paymentData.amount, credit: 0 },
      { accountId: recAcc, debit: 0, credit: paymentData.amount }
    ];
    const journalResult = await AccountingRepository.postJournalEntry(
      `JE-${paymentNumber}`,
      `\u0633\u0646\u062F \u0642\u0628\u0636 \u062A\u062D\u0635\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0628\u064A\u0639\u0627\u062A - ${paymentData.customerName || paymentData.customerId}`,
      date,
      journalLines2,
      {
        currency: paymentData.currency || "SAR",
        exchangeRate: paymentData.exchangeRate || 1
      }
    );
    return {
      success: true,
      paymentId: payId,
      paymentNumber,
      journalEntry: journalResult
    };
  }
};

// src/core/repositories/PurchaseRepository.ts
init_database();
init_schema2();
var import_drizzle_orm13 = require("drizzle-orm");
var PurchaseRepository = class {
  static async findAllPurchaseRequests() {
    return await withAutoMigration(async () => {
      let reqList = [];
      try {
        reqList = await db.select().from(purchaseRequests).orderBy((0, import_drizzle_orm13.desc)(purchaseRequests.createdAt));
      } catch (error) {
        if (error?.message?.includes("does not exist") || error?.code === "42P01") {
          throw error;
        }
        console.warn("Purchase requests table query failed:", error);
        return [];
      }
      if (reqList.length === 0) return [];
      const reqIds = reqList.map((r) => r.id);
      const itemsList = await db.select().from(purchaseRequestItems).where((0, import_drizzle_orm13.inArray)(purchaseRequestItems.requestId, reqIds)).catch(() => []);
      const supplierList = await db.select().from(suppliers).catch(() => []);
      const suppliersMap = new Map((supplierList || []).map((s) => [s.id, s]));
      return reqList.map((req) => {
        const rItems = itemsList.filter((item) => item.requestId === req.id).map((i) => ({
          ...i,
          estimatedPrice: parseFloat(i.estimatedPrice || "0"),
          quantity: parseFloat(i.quantity || "0"),
          total: parseFloat(i.total || "0")
        }));
        const supp = req.supplierId ? suppliersMap.get(req.supplierId) : null;
        return {
          ...req,
          subtotal: parseFloat(req.subtotal || "0"),
          taxAmount: parseFloat(req.taxAmount || "0"),
          grandTotal: parseFloat(req.grandTotal || "0"),
          exchangeRate: parseFloat(req.exchangeRate || "1.0"),
          supplierName: supp ? supp.name : "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          items: rItems
        };
      });
    });
  }
  static async createPurchaseRequest(data) {
    return await withAutoMigration(async () => {
      const reqId = data.id || `pr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const reqNum = data.requestNumber || `PR-${Math.floor(1e5 + Math.random() * 9e5)}`;
      const reqVal = {
        id: reqId,
        requestNumber: reqNum,
        requesterName: data.requesterName || "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A",
        department: data.department || "\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0648\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A",
        date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        requiredDate: data.requiredDate || data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        subtotal: (data.subtotal || 0).toString(),
        taxAmount: (data.taxAmount || 0).toString(),
        grandTotal: (data.grandTotal || 0).toString(),
        currency: data.currency || "SAR",
        exchangeRate: (data.exchangeRate || 1).toString(),
        status: data.status || "pending",
        // 'draft' | 'pending' | 'approved' | 'converted' | 'rejected'
        notes: data.notes || "",
        supplierId: data.supplierId || null
      };
      const rItemsVal = (data.items || []).map((item) => ({
        id: `pri_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        requestId: reqId,
        productId: item.productId || null,
        productName: item.productName || "\u0635\u0646\u0641 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
        estimatedPrice: (item.estimatedPrice || item.purchasePrice || 0).toString(),
        quantity: (item.quantity || 1).toString(),
        total: ((item.quantity || 1) * (item.estimatedPrice || item.purchasePrice || 0)).toString()
      }));
      try {
        await db.insert(purchaseRequests).values(reqVal);
        if (rItemsVal.length > 0) {
          await db.insert(purchaseRequestItems).values(rItemsVal);
        }
      } catch (err) {
        await db.insert(purchases).values({
          id: reqId,
          companyId: reqVal.companyId || "company-1",
          purchaseNumber: reqNum,
          supplierInvoiceNumber: reqNum,
          date: reqVal.date,
          subtotal: reqVal.subtotal,
          taxAmount: reqVal.taxAmount,
          grandTotal: reqVal.grandTotal,
          status: "draft",
          paymentMethod: "credit",
          supplierId: reqVal.supplierId || null,
          notes: reqVal.notes || "\u0637\u0644\u0628 \u0634\u0631\u0627\u0621"
        });
        if (rItemsVal.length > 0) {
          const fallbackItems = rItemsVal.map((i) => ({
            id: i.id,
            purchaseId: reqId,
            productId: i.productId,
            productName: i.productName,
            purchasePrice: i.estimatedPrice,
            quantity: i.quantity,
            total: i.total,
            taxAmount: "0"
          }));
          await db.insert(purchaseItems).values(fallbackItems);
        }
      }
      return { success: true, requestId: reqId, requestNumber: reqNum };
    });
  }
  static async convertRequestToOrder(requestId) {
    let req = null;
    let items = [];
    try {
      const [r] = await db.select().from(purchaseRequests).where((0, import_drizzle_orm13.eq)(purchaseRequests.id, requestId));
      if (r) {
        req = r;
        items = await db.select().from(purchaseRequestItems).where((0, import_drizzle_orm13.eq)(purchaseRequestItems.requestId, requestId));
      }
    } catch (_) {
    }
    if (!req) {
      const [p] = await db.select().from(purchases).where((0, import_drizzle_orm13.eq)(purchases.id, requestId));
      if (!p) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0634\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
      req = {
        ...p,
        requestNumber: p.purchaseNumber,
        currency: "SAR",
        exchangeRate: 1
      };
      const pItems = await db.select().from(purchaseItems).where((0, import_drizzle_orm13.eq)(purchaseItems.purchaseId, requestId));
      items = pItems.map((i) => ({ ...i, estimatedPrice: i.purchasePrice }));
    }
    const poNumber = `PO-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const purchaseData = {
      supplierId: req.supplierId,
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      invoiceNumber: poNumber,
      purchaseNumber: poNumber,
      currency: req.currency || "SAR",
      exchangeRate: req.exchangeRate || 1,
      status: "ordered",
      paymentMethod: "credit",
      subtotal: parseFloat(req.subtotal || "0"),
      taxAmount: parseFloat(req.taxAmount || "0"),
      grandTotal: parseFloat(req.grandTotal || "0"),
      notes: `\u0645\u062D\u0648\u0644 \u0645\u0646 \u0637\u0644\u0628 \u0634\u0631\u0627\u0621 \u0631\u0642\u0645 ${req.requestNumber}`,
      items: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        purchasePrice: parseFloat(i.estimatedPrice || i.purchasePrice || "0"),
        quantity: parseFloat(i.quantity || "0"),
        total: parseFloat(i.total || "0"),
        taxAmount: 0
      }))
    };
    const orderRes = await this.createPurchaseOrder(purchaseData);
    try {
      await db.update(purchaseRequests).set({
        status: "converted",
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm13.eq)(purchaseRequests.id, requestId));
    } catch (_) {
      await db.update(purchases).set({ status: "completed" }).where((0, import_drizzle_orm13.eq)(purchases.id, requestId));
    }
    return { success: true, orderId: orderRes.purchaseId, purchaseNumber: poNumber };
  }
  static async findAllPurchases() {
    const purchaseList = await db.select().from(purchases).orderBy((0, import_drizzle_orm13.desc)(purchases.createdAt));
    if (purchaseList.length === 0) return [];
    const purchaseIds = purchaseList.map((p) => p.id);
    const itemsList = await db.select().from(purchaseItems).where((0, import_drizzle_orm13.inArray)(purchaseItems.purchaseId, purchaseIds));
    const supplierList = await db.select().from(suppliers);
    const productList = await db.select().from(products);
    const suppliersMap = new Map(supplierList.map((s) => [s.id, s]));
    const productsMap = new Map(productList.map((p) => [p.id, p]));
    return purchaseList.map((pur) => {
      const pItems = itemsList.filter((item) => item.purchaseId === pur.id).map((i) => ({
        ...i,
        productName: productsMap.get(i.productId)?.name || i.productId,
        purchasePrice: parseFloat(i.purchasePrice || "0"),
        quantity: parseFloat(i.quantity || "0"),
        total: parseFloat(i.total || "0"),
        taxAmount: parseFloat(i.taxAmount || "0")
      }));
      const supp = pur.supplierId ? suppliersMap.get(pur.supplierId) : null;
      return {
        ...pur,
        subtotal: parseFloat(pur.subtotal || "0"),
        taxAmount: parseFloat(pur.taxAmount || "0"),
        grandTotal: parseFloat(pur.grandTotal || "0"),
        supplierName: supp ? supp.name : "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
        supplierPhone: supp ? supp.phone : "",
        items: pItems
      };
    });
  }
  static async findById(id) {
    const [pur] = await db.select().from(purchases).where((0, import_drizzle_orm13.eq)(purchases.id, id));
    if (!pur) return null;
    const items = await db.select().from(purchaseItems).where((0, import_drizzle_orm13.eq)(purchaseItems.purchaseId, id));
    return { ...pur, items };
  }
  static async createPurchaseOrder(data) {
    const purId = data.id || `pur_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const compId = data.companyId || "company-1";
    const invoiceNumber = data.invoiceNumber || data.purchaseNumber;
    const purchaseVal = {
      id: purId,
      companyId: compId,
      purchaseNumber: invoiceNumber,
      supplierInvoiceNumber: data.supplierInvoiceNumber || invoiceNumber,
      date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      subtotal: (data.totalWithoutTax || data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      status: data.status || "completed",
      // 'draft' | 'ordered' | 'received' | 'completed'
      paymentMethod: data.paymentMethod || "cash",
      currency: data.currency || "SAR",
      exchangeRate: (data.exchangeRate || 1).toString(),
      warehouseId: data.warehouseId || "wh_main",
      supplierId: data.supplierId || null,
      notes: data.notes || ""
    };
    const pItemsVal = (data.items || []).map((item) => ({
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      purchaseId: purId,
      productId: item.productId,
      purchasePrice: (item.purchasePrice || 0).toString(),
      quantity: (item.quantity || 0).toString(),
      total: ((item.quantity || 0) * (item.purchasePrice || 0)).toString(),
      taxAmount: (item.taxAmount || 0).toString()
    }));
    await db.insert(purchases).values(purchaseVal);
    if (pItemsVal.length > 0) {
      await db.insert(purchaseItems).values(pItemsVal);
    }
    if (purchaseVal.status === "completed" || purchaseVal.status === "received") {
      for (const item of data.items || []) {
        await InventoryRepository.updateWeightedAverageCostOnPurchase(
          item.productId,
          parseFloat(item.quantity || "0"),
          parseFloat(item.purchasePrice || "0")
        );
        await InventoryRepository.recordStockMove({
          productId: item.productId,
          toWarehouseId: purchaseVal.warehouseId,
          quantity: parseFloat(item.quantity || "0"),
          type: "purchase",
          referenceId: invoiceNumber,
          notes: `\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0631\u0642\u0645 ${invoiceNumber}`
        });
      }
    }
    if (purchaseVal.status === "completed") {
      if (purchaseVal.paymentMethod === "credit" && purchaseVal.supplierId) {
        await SupplierRepository.adjustBalance(purchaseVal.supplierId, parseFloat(purchaseVal.grandTotal));
      }
      await this.postPurchaseJournalEntry({
        invoiceNumber,
        date: purchaseVal.date,
        paymentMethod: purchaseVal.paymentMethod,
        subtotal: parseFloat(purchaseVal.subtotal),
        taxAmount: parseFloat(purchaseVal.taxAmount),
        grandTotal: parseFloat(purchaseVal.grandTotal),
        currency: purchaseVal.currency,
        exchangeRate: parseFloat(purchaseVal.exchangeRate)
      });
    }
    return { success: true, purchaseId: purId };
  }
  static async receiveGoods(id, options) {
    const pur = await this.findById(id);
    if (!pur) throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const warehouseId = options.warehouseId || pur.warehouseId || "wh_main";
    const notes = options.notes || "";
    for (const item of pur.items) {
      const qty = parseFloat(item.quantity || "0");
      const price = parseFloat(item.purchasePrice || "0");
      await InventoryRepository.updateWeightedAverageCostOnPurchase(item.productId, qty, price);
      await InventoryRepository.recordStockMove({
        productId: item.productId,
        toWarehouseId: warehouseId,
        quantity: qty,
        type: "purchase",
        referenceId: pur.purchaseNumber,
        notes: `\u0625\u0630\u0646 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u062E\u0632\u0646\u064A \u0644\u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 ${pur.purchaseNumber} ${notes}`
      });
    }
    await db.update(purchases).set({
      status: "completed",
      warehouseId,
      notes: notes ? `${pur.notes || ""} | ${notes}` : pur.notes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm13.eq)(purchases.id, id));
    return { success: true, message: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0628\u0646\u062C\u0627\u062D" };
  }
  static async issueSupplierInvoice(id, options) {
    const pur = await this.findById(id);
    if (!pur) throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const supplierInvoiceNumber = options.supplierInvoiceNumber || pur.purchaseNumber;
    const paymentMethod = options.paymentMethod || pur.paymentMethod || "credit";
    const date = options.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const subtotal = parseFloat(pur.subtotal || "0");
    const taxAmount = parseFloat(pur.taxAmount || "0");
    const grandTotal = parseFloat(pur.grandTotal || "0");
    if (paymentMethod === "credit" && pur.supplierId) {
      await SupplierRepository.adjustBalance(pur.supplierId, grandTotal);
    }
    await this.postPurchaseJournalEntry({
      invoiceNumber: supplierInvoiceNumber,
      date,
      paymentMethod,
      subtotal,
      taxAmount,
      grandTotal,
      currency: pur.currency || "SAR",
      exchangeRate: parseFloat(pur.exchangeRate || "1.0")
    });
    await db.update(purchases).set({
      status: "completed",
      supplierInvoiceNumber,
      paymentMethod,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm13.eq)(purchases.id, id));
    return { success: true, message: "\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u0648\u0631\u062F \u0648\u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u0628\u0646\u062C\u0627\u062D" };
  }
  static async returnPurchaseInvoice(id, options) {
    const pur = await this.findById(id);
    if (!pur) throw new Error("\u0623\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    if (pur.status === "returned") {
      throw new Error("\u062A\u0645 \u0625\u0631\u062C\u0627\u0639 \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0647\u0630\u0647 \u0645\u0633\u0628\u0642\u0627\u064B");
    }
    const subtotal = parseFloat(pur.subtotal || "0");
    const taxAmount = parseFloat(pur.taxAmount || "0");
    const grandTotal = parseFloat(pur.grandTotal || "0");
    const invoiceNumber = pur.supplierInvoiceNumber || pur.purchaseNumber;
    await db.update(purchases).set({
      notes: pur.notes ? `${pur.notes} (\u0645\u0631\u062A\u062C\u0639)` : "\u0645\u0631\u062A\u062C\u0639",
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm13.eq)(purchases.id, id));
    const items = await db.select().from(purchaseItems).where((0, import_drizzle_orm13.eq)(purchaseItems.purchaseId, id));
    for (const item of items) {
      const qty = parseFloat(item.quantity || "0");
      await InventoryRepository.recordStockMove({
        productId: item.productId,
        fromWarehouseId: pur.warehouseId || "wh_main",
        quantity: qty,
        type: "adjustment",
        referenceId: invoiceNumber,
        notes: `\u0645\u0631\u062A\u062C\u0639 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0644\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0631\u0642\u0645 ${invoiceNumber}`
      });
      const [product] = await db.select().from(products).where((0, import_drizzle_orm13.eq)(products.id, item.productId));
      if (product) {
        const curStock = parseFloat(product.stock || "0");
        const newStock = Math.max(0, curStock - qty);
        await db.update(products).set({ stock: newStock.toString() }).where((0, import_drizzle_orm13.eq)(products.id, item.productId));
      }
    }
    if (pur.paymentMethod === "credit" && pur.supplierId) {
      await SupplierRepository.adjustBalance(pur.supplierId, -grandTotal);
    }
    const getAccountByRule2 = async (ruleId, fallbackAccId) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };
    const cashAcc = await getAccountByRule2("purchase_cash_credit", "acc_cash");
    const bankAcc = await getAccountByRule2("purchase_bank_credit", "acc_bank");
    const payAcc = await getAccountByRule2("purchase_credit_credit", "acc_payable");
    const invAcc = await getAccountByRule2("purchase_inventory_debit", "acc_inventory");
    const taxAcc = await getAccountByRule2("purchase_tax_debit", "acc_tax");
    const accountingLines = [];
    if (pur.paymentMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: grandTotal, credit: 0 });
    } else if (pur.paymentMethod === "card") {
      accountingLines.push({ accountId: bankAcc, debit: grandTotal, credit: 0 });
    } else {
      accountingLines.push({ accountId: payAcc, debit: grandTotal, credit: 0 });
    }
    accountingLines.push({ accountId: invAcc, debit: 0, credit: subtotal });
    if (taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: 0, credit: taxAmount });
    }
    const journalResult = await AccountingRepository.postJournalEntry(
      `JE-PRET-${invoiceNumber}`,
      `\u0645\u0631\u062A\u062C\u0639 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0644\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0631\u0642\u0645 ${invoiceNumber}`,
      (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      accountingLines,
      {
        currency: pur.currency || "SAR",
        exchangeRate: parseFloat(pur.exchangeRate || "1.0")
      }
    );
    return { success: true, journalEntry: journalResult };
  }
  static async postPurchaseJournalEntry(data) {
    const getAccountByRule2 = async (ruleId, fallbackAccId) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };
    const cashAcc = await getAccountByRule2("purchase_cash_credit", "acc_cash");
    const bankAcc = await getAccountByRule2("purchase_bank_credit", "acc_bank");
    const payAcc = await getAccountByRule2("purchase_credit_credit", "acc_payable");
    const invAcc = await getAccountByRule2("purchase_inventory_debit", "acc_inventory");
    const taxAcc = await getAccountByRule2("purchase_tax_debit", "acc_tax");
    const accountingLines = [];
    accountingLines.push({ accountId: invAcc, debit: data.subtotal, credit: 0 });
    if (data.taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: data.taxAmount, credit: 0 });
    }
    if (data.paymentMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: data.grandTotal });
    } else if (data.paymentMethod === "card") {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: data.grandTotal });
    } else if (data.paymentMethod === "credit") {
      accountingLines.push({ accountId: payAcc, debit: 0, credit: data.grandTotal });
    }
    await AccountingRepository.postJournalEntry(
      `JE-PUR-${data.invoiceNumber}`,
      `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0631\u0642\u0645 ${data.invoiceNumber}`,
      data.date,
      accountingLines,
      {
        currency: data.currency,
        exchangeRate: data.exchangeRate
      }
    );
  }
};

// src/core/repositories/AccountRepository.ts
init_database();
init_schema2();
var import_drizzle_orm14 = require("drizzle-orm");
var AccountRepository = class {
  static async getAccounts(filter) {
    return await AccountService.getAccounts(filter);
  }
  static async getAccountsTree(companyId) {
    return await AccountService.getAccountsTree(companyId);
  }
  static async findAccountById(id) {
    return await AccountService.getAccountById(id);
  }
  static async findAccountByCode(code) {
    return await AccountService.getAccountByCode(code);
  }
  static async suggestChildCode(parentId) {
    return await AccountService.suggestChildCode(parentId);
  }
  static async upsertAccount(data) {
    return await AccountService.upsertAccount(data);
  }
  static async toggleAccountActive(id, isActive) {
    return await AccountService.toggleAccountActive(id, isActive);
  }
  static async deleteAccount(id) {
    return await AccountService.deleteAccount(id);
  }
  static async seedDefaultChartOfAccounts(companyId) {
    return await AccountService.seedDefaultChartOfAccounts(companyId);
  }
  static async updateBalance(id, baseBalance, foreignBalance) {
    const setValues = { balance: baseBalance.toString() };
    if (foreignBalance !== void 0) {
      setValues.foreignBalance = foreignBalance.toString();
    }
    await db.update(accounts).set(setValues).where((0, import_drizzle_orm14.eq)(accounts.id, id));
    return await this.findAccountById(id);
  }
};

// src/core/repositories/index.ts
init_CurrencyRepository();

// src/core/repositories/InvoiceRepository.ts
init_database();
init_schema2();
var import_drizzle_orm15 = require("drizzle-orm");

// src/core/repositories/TreasuryRepository.ts
init_database();
init_schema2();
var import_drizzle_orm16 = require("drizzle-orm");
var TreasuryRepository = class {
  // ─── 1. CASHBOXES ───
  static async getCashboxes() {
    return await withAutoMigration(async () => {
      try {
        const list = await db.select().from(cashboxes);
        if (list.length === 0) {
          const defaultBox = {
            id: "cashbox_main",
            name: "\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 (\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0646\u0642\u062F\u064A\u0629)",
            status: "open",
            currentBalance: "5000.00",
            lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          await db.insert(cashboxes).values(defaultBox);
          return [{ ...defaultBox, currentBalance: 5e3 }];
        }
        return list.map((b) => ({
          ...b,
          currentBalance: parseFloat(b.currentBalance || "0")
        }));
      } catch (e) {
        console.error("Error fetching cashboxes:", e);
        throw e;
      }
    });
  }
  static async upsertCashbox(data) {
    const id = data.id || "cashbox_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, id));
    const dbValue = {
      id,
      name: data.name,
      status: data.status || "open",
      currentBalance: (data.currentBalance || 0).toString(),
      lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (existing.length > 0) {
      await db.update(cashboxes).set(dbValue).where((0, import_drizzle_orm16.eq)(cashboxes.id, id));
    } else {
      await db.insert(cashboxes).values(dbValue);
    }
    return { ...dbValue, currentBalance: data.currentBalance || 0 };
  }
  static async deleteCashbox(id) {
    await db.delete(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, id));
    return { success: true };
  }
  // ─── 2. BANK ACCOUNTS ───
  static async getBankAccounts() {
    return await withAutoMigration(async () => {
      try {
        const list = await db.select().from(bankAccounts);
        if (list.length === 0) {
          const defaultBank = {
            id: "bank_main",
            bankName: "\u0645\u0635\u0631\u0641 \u0627\u0644\u0631\u0627\u062C\u062D\u064A",
            accountName: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0627\u0631\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
            accountNumber: "SA98800001234567890001",
            iban: "SA98800001234567890001",
            swift: "RJHIFA22",
            branch: "\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A - \u0627\u0644\u0631\u064A\u0627\u0636",
            currency: "SAR",
            currentBalance: "25000.00",
            accountId: "acc_bank",
            status: "active"
          };
          await db.insert(bankAccounts).values(defaultBank);
          return [{ ...defaultBank, currentBalance: 25e3 }];
        }
        return list.map((b) => ({
          ...b,
          currentBalance: parseFloat(b.currentBalance || "0")
        }));
      } catch (e) {
        console.error("Error fetching bank accounts:", e);
        throw e;
      }
    });
  }
  static async upsertBankAccount(data) {
    const id = data.id || "bank_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, id));
    const dbValue = {
      id,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      iban: data.iban || null,
      swift: data.swift || null,
      branch: data.branch || null,
      currency: data.currency || "SAR",
      currentBalance: (data.currentBalance || 0).toString(),
      accountId: data.accountId || "acc_bank",
      status: data.status || "active",
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existing.length > 0) {
      await db.update(bankAccounts).set(dbValue).where((0, import_drizzle_orm16.eq)(bankAccounts.id, id));
    } else {
      await db.insert(bankAccounts).values(dbValue);
    }
    return { ...dbValue, currentBalance: data.currentBalance || 0 };
  }
  static async deleteBankAccount(id) {
    await db.delete(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, id));
    return { success: true };
  }
  // ─── 3. TRANSACTIONS LIST ───
  static async getTransactions(type) {
    return await withAutoMigration(async () => {
      try {
        let query = db.select().from(treasuryTransactions).orderBy((0, import_drizzle_orm16.desc)(treasuryTransactions.createdAt));
        const list = await query;
        let filtered = list;
        if (type) {
          filtered = list.filter((t) => t.transactionType === type);
        }
        return filtered.map((t) => ({
          ...t,
          amount: parseFloat(t.amount || "0"),
          exchangeRate: parseFloat(t.exchangeRate || "1"),
          transferFee: parseFloat(t.transferFee || "0"),
          reconciled: t.reconciled === "true"
        }));
      } catch (e) {
        console.error("Error fetching treasury transactions:", e);
        throw e;
      }
    });
  }
  // ─── 4. CREATE DEPOSIT (إيداع) ───
  static async createDeposit(input) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("\u0645\u0628\u0644\u063A \u0627\u0644\u0625\u064A\u062F\u0627\u0639 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
    }
    const txId = "dep_" + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const rate = input.exchangeRate || 1;
    const baseAmount = input.amount * rate;
    let destAccId = "acc_cash";
    if (input.destinationType === "cashbox") {
      const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.destinationId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || "0") + input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.destinationId));
      }
      destAccId = "acc_cash";
    } else if (input.destinationType === "bank_account") {
      const [bank] = await db.select().from(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.destinationId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || "0") + input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.destinationId));
        destAccId = bank.accountId || "acc_bank";
      }
    }
    let sourceAccId = input.sourceAccountId || "acc_revenue";
    if (input.sourceType === "customer") {
      sourceAccId = "acc_ar";
    } else if (input.sourceType === "capital") {
      sourceAccId = "acc_capital";
    }
    const entryNumber = "JV-DEP-" + Math.floor(1e4 + Math.random() * 9e4);
    const descText = `\u0625\u064A\u062F\u0627\u0639 \u0645\u0642\u0628\u0648\u0644: ${input.description || "\u0625\u064A\u062F\u0627\u0639 \u0646\u0642\u062F\u064A\u0629/\u0628\u0646\u0643"}`;
    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      [
        { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || "SAR", exchangeRate: rate },
        { accountId: sourceAccId, debit: 0, credit: baseAmount, currency: input.currency || "SAR", exchangeRate: rate }
      ]
    );
    const dbTx = {
      id: txId,
      transactionType: "deposit",
      sourceType: input.sourceType,
      sourceId: sourceAccId,
      destinationType: input.destinationType,
      destinationId: input.destinationId,
      amount: input.amount.toString(),
      currency: input.currency || "SAR",
      exchangeRate: rate.toString(),
      transferFee: "0",
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: "false"
    };
    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }
  // ─── 5. CREATE WITHDRAWAL (سحب / مصروف) ───
  static async createWithdrawal(input) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("\u0645\u0628\u0644\u063A \u0627\u0644\u0633\u062D\u0628 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
    }
    const txId = "wth_" + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const rate = input.exchangeRate || 1;
    const baseAmount = input.amount * rate;
    let sourceAccId = "acc_cash";
    if (input.sourceType === "cashbox") {
      const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.sourceId));
      if (box) {
        const curBal = parseFloat(box.currentBalance || "0");
        const newBal = curBal - input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.sourceId));
      }
      sourceAccId = "acc_cash";
    } else if (input.sourceType === "bank_account") {
      const [bank] = await db.select().from(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.sourceId));
      if (bank) {
        const curBal = parseFloat(bank.currentBalance || "0");
        const newBal = curBal - input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.sourceId));
        sourceAccId = bank.accountId || "acc_bank";
      }
    }
    let destAccId = input.destinationAccountId || "acc_expense";
    if (input.destinationType === "supplier") {
      destAccId = "acc_ap";
    } else if (input.destinationType === "owner_draw") {
      destAccId = "acc_drawings";
    }
    const entryNumber = "JV-WTH-" + Math.floor(1e4 + Math.random() * 9e4);
    const descText = `\u0633\u062D\u0628/\u0635\u0631\u0641: ${input.description || "\u0645\u0635\u0631\u0648\u0641/\u0633\u062D\u0628 \u0646\u0642\u062F\u064A\u0629"}`;
    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      [
        { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || "SAR", exchangeRate: rate },
        { accountId: sourceAccId, debit: 0, credit: baseAmount, currency: input.currency || "SAR", exchangeRate: rate }
      ]
    );
    const dbTx = {
      id: txId,
      transactionType: "withdrawal",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      destinationType: input.destinationType,
      destinationId: destAccId,
      amount: input.amount.toString(),
      currency: input.currency || "SAR",
      exchangeRate: rate.toString(),
      transferFee: "0",
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: "false"
    };
    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }
  // ─── 6. CREATE TRANSFER (تحويل بين الخزائن والبنوك) ───
  static async createTransfer(input) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("\u0645\u0628\u0644\u063A \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
    }
    const txId = "trf_" + Math.random().toString(36).substr(2, 9);
    const dateStr = input.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const rate = input.exchangeRate || 1;
    const baseAmount = input.amount * rate;
    const fee = input.transferFee || 0;
    const baseFee = fee * rate;
    let sourceAccId = "acc_cash";
    if (input.sourceType === "cashbox") {
      const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.sourceId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || "0") - (input.amount + fee);
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.sourceId));
      }
      sourceAccId = "acc_cash";
    } else if (input.sourceType === "bank_account") {
      const [bank] = await db.select().from(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.sourceId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || "0") - (input.amount + fee);
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.sourceId));
        sourceAccId = bank.accountId || "acc_bank";
      }
    }
    let destAccId = "acc_bank";
    if (input.destinationType === "cashbox") {
      const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.destinationId));
      if (box) {
        const newBal = parseFloat(box.currentBalance || "0") + input.amount;
        await db.update(cashboxes).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(cashboxes.id, input.destinationId));
      }
      destAccId = "acc_cash";
    } else if (input.destinationType === "bank_account") {
      const [bank] = await db.select().from(bankAccounts).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.destinationId));
      if (bank) {
        const newBal = parseFloat(bank.currentBalance || "0") + input.amount;
        await db.update(bankAccounts).set({ currentBalance: newBal.toString() }).where((0, import_drizzle_orm16.eq)(bankAccounts.id, input.destinationId));
        destAccId = bank.accountId || "acc_bank";
      }
    }
    const entryNumber = "JV-TRF-" + Math.floor(1e4 + Math.random() * 9e4);
    const descText = `\u062A\u062D\u0648\u064A\u0644 \u0645\u0627\u0644\u064A: ${input.description || "\u062A\u062D\u0648\u064A\u0644 \u0628\u064A\u0646 \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u062E\u0632\u064A\u0646\u0629/\u0627\u0644\u0628\u0646\u0643"}`;
    const journalLines2 = [
      { accountId: destAccId, debit: baseAmount, credit: 0, currency: input.currency || "SAR", exchangeRate: rate }
    ];
    if (baseFee > 0) {
      journalLines2.push({ accountId: "acc_expense", debit: baseFee, credit: 0, currency: input.currency || "SAR", exchangeRate: rate, description: "\u0639\u0645\u0648\u0644\u0629 \u062A\u062D\u0648\u064A\u0644 \u0628\u0646\u0643\u064A" });
    }
    journalLines2.push({ accountId: sourceAccId, debit: 0, credit: baseAmount + baseFee, currency: input.currency || "SAR", exchangeRate: rate });
    const journalRes = await AccountingRepository.postJournalEntry(entryNumber, descText, dateStr, journalLines2);
    const dbTx = {
      id: txId,
      transactionType: "transfer",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      destinationType: input.destinationType,
      destinationId: input.destinationId,
      amount: input.amount.toString(),
      currency: input.currency || "SAR",
      exchangeRate: rate.toString(),
      transferFee: fee.toString(),
      date: dateStr,
      referenceNumber: input.referenceNumber || entryNumber,
      description: input.description,
      journalEntryId: journalRes?.id || null,
      reconciled: "false"
    };
    await db.insert(treasuryTransactions).values(dbTx);
    return { ...dbTx, amount: input.amount, journalEntry: journalRes };
  }
  // ─── 7. BANK RECONCILIATION ───
  static async getBankReconciliations(bankAccountId) {
    try {
      const list = await db.select().from(bankReconciliations).where((0, import_drizzle_orm16.eq)(bankReconciliations.bankAccountId, bankAccountId)).orderBy((0, import_drizzle_orm16.desc)(bankReconciliations.createdAt));
      return list.map((r) => ({
        ...r,
        statementEndingBalance: parseFloat(r.statementEndingBalance || "0"),
        ledgerEndingBalance: parseFloat(r.ledgerEndingBalance || "0"),
        difference: parseFloat(r.difference || "0"),
        matchedCount: parseInt(r.matchedCount || "0")
      }));
    } catch (e) {
      console.error("Error fetching reconciliations:", e);
      return [];
    }
  }
  static async getUnreconciledTransactions(bankAccountId) {
    try {
      const list = await db.select().from(treasuryTransactions).where((0, import_drizzle_orm16.and)(
        (0, import_drizzle_orm16.eq)(treasuryTransactions.reconciled, "false")
      )).orderBy((0, import_drizzle_orm16.desc)(treasuryTransactions.date));
      const filtered = list.filter((t) => t.sourceId === bankAccountId || t.destinationId === bankAccountId);
      return filtered.map((t) => ({
        ...t,
        amount: parseFloat(t.amount || "0")
      }));
    } catch (e) {
      console.error("Error fetching unreconciled transactions:", e);
      return [];
    }
  }
  static async executeBankReconciliation(input) {
    const recId = "rec_" + Math.random().toString(36).substr(2, 9);
    const diff = Math.abs(input.statementEndingBalance - input.ledgerEndingBalance);
    const recRecord = {
      id: recId,
      bankAccountId: input.bankAccountId,
      statementDate: input.statementDate,
      statementEndingBalance: input.statementEndingBalance.toString(),
      ledgerEndingBalance: input.ledgerEndingBalance.toString(),
      difference: diff.toString(),
      matchedCount: input.matchedTransactionIds.length.toString(),
      status: diff < 0.01 ? "completed" : "completed_with_diff",
      notes: input.notes || "\u062A\u0633\u0648\u064A\u0629 \u0628\u0646\u0643\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629"
    };
    await db.insert(bankReconciliations).values(recRecord);
    for (const txId of input.matchedTransactionIds) {
      await db.update(treasuryTransactions).set({ reconciled: "true", reconciliationId: recId }).where((0, import_drizzle_orm16.eq)(treasuryTransactions.id, txId));
    }
    return recRecord;
  }
};

// src/core/repositories/ExpenseRepository.ts
init_database();
init_schema2();
var import_drizzle_orm17 = require("drizzle-orm");
var ExpenseRepository = class {
  // ─── 1. EXPENSE CATEGORIES ───
  static async getCategories() {
    return await withAutoMigration(async () => {
      try {
        const list = await db.select().from(expenseCategories);
        if (list.length === 0) {
          const defaultCats = [
            { id: "cat_admin", name: "\u0645\u0635\u0627\u0631\u064A\u0641 \u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0645\u0643\u062A\u0628\u064A\u0629", code: "EXP-101", accountId: "acc_expense", budget: "10000.00", description: "\u0623\u062F\u0648\u0627\u062A \u0645\u0643\u062A\u0628\u064A\u0629\u060C \u0645\u0637\u0628\u0648\u0639\u0627\u062A\u060C \u0648\u0644\u0648\u0627\u0632\u0645 \u0625\u062F\u0627\u0631\u064A\u0629" },
            { id: "cat_oper", name: "\u0645\u0635\u0627\u0631\u064A\u0641 \u062A\u0634\u063A\u064A\u0644\u064A\u0629", code: "EXP-102", accountId: "acc_expense", budget: "25000.00", description: "\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u064A\u0648\u0645\u064A \u0648\u0627\u0644\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A" },
            { id: "cat_mktg", name: "\u062A\u0633\u0648\u064A\u0642 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062A", code: "EXP-103", accountId: "acc_expense", budget: "15000.00", description: "\u062D\u0645\u0644\u0627\u062A \u0625\u0639\u0644\u0627\u0646\u064A\u0629\u060C \u062A\u0633\u0648\u064A\u0642 \u0631\u0642\u0645\u064A\u060C \u0648\u0645\u0637\u0628\u0648\u0639\u0627\u062A \u062A\u0631\u0642\u064A\u0629" },
            { id: "cat_maint", name: "\u0635\u064A\u0627\u0646\u0629 \u0648\u0625\u0635\u0644\u0627\u062D\u0627\u062A", code: "EXP-104", accountId: "acc_expense", budget: "8000.00", description: "\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0622\u0644\u0627\u062A\u060C \u0627\u0644\u0645\u0639\u062F\u0627\u062A\u060C \u0648\u0627\u0644\u0623\u0635\u0648\u0644" },
            { id: "cat_util", name: "\u0645\u0646\u0627\u0641\u0639 \u0648\u0645\u0631\u0627\u0641\u0642 (\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0645\u0627\u0621 \u0648\u062B\u0631\u0627\u0621)", code: "EXP-105", accountId: "acc_expense", budget: "12000.00", description: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621\u060C \u0627\u0644\u0645\u064A\u0627\u0647\u060C \u0648\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A" },
            { id: "cat_rent", name: "\u0625\u064A\u062C\u0627\u0631\u0627\u062A \u0648\u0634\u063A\u0648\u0631", code: "EXP-106", accountId: "acc_expense", budget: "50000.00", description: "\u0625\u064A\u062C\u0627\u0631 \u0627\u0644\u0645\u0642\u0631\u0627\u062A \u0648\u0627\u0644\u0641\u0631\u0648\u0639" }
          ];
          for (const cat of defaultCats) {
            await db.insert(expenseCategories).values(cat);
          }
          return defaultCats.map((c) => ({ ...c, budget: parseFloat(c.budget) }));
        }
        return list.map((c) => ({
          ...c,
          budget: parseFloat(c.budget || "0")
        }));
      } catch (e) {
        console.error("Error fetching expense categories:", e);
        return [];
      }
    });
  }
  static async upsertCategory(data) {
    const id = data.id || "cat_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(expenseCategories).where((0, import_drizzle_orm17.eq)(expenseCategories.id, id));
    const dbVal = {
      id,
      name: data.name,
      code: data.code || "EXP-" + Math.floor(100 + Math.random() * 900),
      description: data.description || null,
      accountId: data.accountId || "acc_expense",
      budget: (data.budget || 0).toString()
    };
    if (existing.length > 0) {
      await db.update(expenseCategories).set(dbVal).where((0, import_drizzle_orm17.eq)(expenseCategories.id, id));
    } else {
      await db.insert(expenseCategories).values(dbVal);
    }
    return { ...dbVal, budget: data.budget || 0 };
  }
  static async deleteCategory(id) {
    await db.delete(expenseCategories).where((0, import_drizzle_orm17.eq)(expenseCategories.id, id));
    return { success: true };
  }
  // ─── 2. EXPENSE REQUESTS & APPROVAL WORKFLOW ───
  static async getRequests(statusFilter) {
    return await withAutoMigration(async () => {
      try {
        const list = await db.select().from(expenseRequests).orderBy((0, import_drizzle_orm17.desc)(expenseRequests.createdAt));
        const categories2 = await this.getCategories();
        const catMap = new Map(categories2.map((c) => [c.id, c]));
        let filtered = list;
        if (statusFilter && statusFilter !== "all") {
          filtered = list.filter((r) => r.status === statusFilter);
        }
        return filtered.map((r) => ({
          ...r,
          amount: parseFloat(r.amount || "0"),
          taxAmount: parseFloat(r.taxAmount || "0"),
          totalAmount: parseFloat(r.totalAmount || "0"),
          categoryName: r.categoryId ? catMap.get(r.categoryId)?.name || "\u0639\u0627\u0645" : "\u0639\u0627\u0645"
        }));
      } catch (e) {
        console.error("Error fetching expense requests:", e);
        return [];
      }
    });
  }
  static async createRequest(input) {
    if (!input.amount || input.amount <= 0) {
      throw new Error("\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631");
    }
    const reqId = "expreq_" + Math.random().toString(36).substr(2, 9);
    const reqNum = "EXP-REQ-" + Math.floor(1e4 + Math.random() * 9e4);
    const tax = input.taxAmount || 0;
    const total = input.amount + tax;
    const dateStr = input.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const dbVal = {
      id: reqId,
      requestNumber: reqNum,
      categoryId: input.categoryId || "cat_admin",
      accountId: input.accountId || "acc_expense",
      title: input.title,
      description: input.description || null,
      amount: input.amount.toString(),
      taxAmount: tax.toString(),
      totalAmount: total.toString(),
      currency: input.currency || "SAR",
      beneficiary: input.beneficiary || null,
      paymentMethod: input.paymentMethod || "cash",
      paymentAccountId: input.paymentAccountId || null,
      requestedBy: input.requestedBy || "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A",
      status: "pending",
      receiptRef: input.receiptRef || null,
      date: dateStr,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db.insert(expenseRequests).values(dbVal);
    return { ...dbVal, amount: input.amount, taxAmount: tax, totalAmount: total };
  }
  static async approveRequest(id, approvedBy) {
    const [req] = await db.select().from(expenseRequests).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    if (!req) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    await db.update(expenseRequests).set({
      status: "approved",
      approvedBy,
      approvalDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    return { success: true };
  }
  static async rejectRequest(id, rejectionReason) {
    const [req] = await db.select().from(expenseRequests).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    if (!req) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    await db.update(expenseRequests).set({
      status: "rejected",
      rejectionReason,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    return { success: true };
  }
  // ─── 3. PAY EXPENSE & POST JOURNAL ENTRY ───
  static async payExpense(id, payment) {
    const [req] = await db.select().from(expenseRequests).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    if (!req) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const amount = parseFloat(req.amount || "0");
    const tax = parseFloat(req.taxAmount || "0");
    const total = parseFloat(req.totalAmount || "0");
    const method = payment.paymentMethod || req.paymentMethod || "cash";
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let creditAccId = "acc_cash";
    if (method === "cash") {
      if (payment.paymentAccountId) {
        const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm17.eq)(cashboxes.id, payment.paymentAccountId));
        if (box) {
          const curBal = parseFloat(box.currentBalance || "0");
          await db.update(cashboxes).set({ currentBalance: (curBal - total).toString() }).where((0, import_drizzle_orm17.eq)(cashboxes.id, payment.paymentAccountId));
        }
      }
      creditAccId = "acc_cash";
    } else if (method === "bank") {
      if (payment.paymentAccountId) {
        const [bank] = await db.select().from(bankAccounts).where((0, import_drizzle_orm17.eq)(bankAccounts.id, payment.paymentAccountId));
        if (bank) {
          const curBal = parseFloat(bank.currentBalance || "0");
          await db.update(bankAccounts).set({ currentBalance: (curBal - total).toString() }).where((0, import_drizzle_orm17.eq)(bankAccounts.id, payment.paymentAccountId));
          creditAccId = bank.accountId || "acc_bank";
        } else {
          creditAccId = "acc_bank";
        }
      } else {
        creditAccId = "acc_bank";
      }
    } else if (method === "payable") {
      creditAccId = "acc_ap";
    }
    const expenseAccId = req.accountId || "acc_expense";
    const entryNumber = "JV-EXP-" + Math.floor(1e4 + Math.random() * 9e4);
    const descText = `\u0633\u062F\u0627\u062F \u0645\u0635\u0631\u0648\u0641: ${req.title} (${req.beneficiary || "\u0639\u0627\u0645"})`;
    const journalLines2 = [
      { accountId: expenseAccId, debit: amount, credit: 0, currency: req.currency || "SAR", exchangeRate: 1, description: req.title }
    ];
    if (tax > 0) {
      journalLines2.push({ accountId: "acc_vat_input", debit: tax, credit: 0, currency: req.currency || "SAR", exchangeRate: 1, description: "\u0636\u0631\u064A\u0628\u0629 \u0645\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0645\u0635\u0631\u0648\u0641" });
    }
    journalLines2.push({ accountId: creditAccId, debit: 0, credit: total, currency: req.currency || "SAR", exchangeRate: 1 });
    const journalRes = await AccountingRepository.postJournalEntry(
      entryNumber,
      descText,
      dateStr,
      journalLines2
    );
    const expId = "exp_" + Math.random().toString(36).substr(2, 9);
    await db.insert(expenses).values({
      id: expId,
      description: req.title + (req.beneficiary ? ` - ${req.beneficiary}` : ""),
      amount: total.toString(),
      accountId: expenseAccId,
      date: dateStr
    });
    await db.update(expenseRequests).set({
      status: "paid",
      journalEntryId: journalRes?.id || null,
      paymentMethod: method,
      paymentAccountId: payment.paymentAccountId || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm17.eq)(expenseRequests.id, id));
    return { success: true, journalEntry: journalRes };
  }
  // ─── 4. EXPENSE REPORTS & ANALYTICS ───
  static async getExpenseReports() {
    return await withAutoMigration(async () => {
      try {
        const requests = await db.select().from(expenseRequests);
        const categories2 = await this.getCategories();
        const catMap = new Map(categories2.map((c) => [c.id, c.name]));
        let totalExpenses = 0;
        let totalPending = 0;
        let totalApproved = 0;
        let totalPaid = 0;
        const categoryTotals = {};
        categories2.forEach((c) => {
          categoryTotals[c.id] = { name: c.name, amount: 0, count: 0 };
        });
        for (const req of requests) {
          const amt = parseFloat(req.totalAmount || "0");
          if (req.status === "paid") {
            totalPaid += amt;
            totalExpenses += amt;
          } else if (req.status === "approved") {
            totalApproved += amt;
          } else if (req.status === "pending") {
            totalPending += amt;
          }
          const catId = req.categoryId || "cat_admin";
          if (!categoryTotals[catId]) {
            categoryTotals[catId] = { name: catMap.get(catId) || "\u0639\u0627\u0645", amount: 0, count: 0 };
          }
          categoryTotals[catId].amount += amt;
          categoryTotals[catId].count += 1;
        }
        return {
          totalExpenses,
          totalPending,
          totalApproved,
          totalPaid,
          count: requests.length,
          categoryBreakdown: Object.values(categoryTotals)
        };
      } catch (e) {
        console.error("Error fetching expense reports:", e);
        return { totalExpenses: 0, totalPending: 0, totalApproved: 0, totalPaid: 0, count: 0, categoryBreakdown: [] };
      }
    });
  }
};

// src/core/repositories/ReportsRepository.ts
init_database();
init_CurrencyRepository();
init_schema2();
var import_drizzle_orm18 = require("drizzle-orm");
var ReportsRepository = class {
  // 1. SALES REPORT
  static async getSalesReport(filter) {
    let whereClause = (0, import_drizzle_orm18.gte)(invoices.date, filter.startDate ? filter.startDate : "2020-01-01");
    if (filter.endDate) {
      whereClause = (0, import_drizzle_orm18.and)(whereClause, (0, import_drizzle_orm18.lte)(invoices.date, filter.endDate));
    }
    const allInvoices = await db.select().from(invoices).where(whereClause);
    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    const paymentMethods2 = { cash: 0, card: 0, credit: 0 };
    allInvoices.forEach((inv) => {
      const grandTotal = Number(inv.grandTotal) || 0;
      const tax = Number(inv.taxAmount) || 0;
      const sub = Number(inv.totalWithoutTax) || 0;
      const disc = Number(inv.discountAmount) || 0;
      totalSales += grandTotal;
      totalTax += tax;
      netSales += sub;
      totalDiscount += disc;
      if (inv.status === "paid") paidInvoices++;
      else pendingInvoices++;
      const pm = inv.paymentMethod || "cash";
      paymentMethods2[pm] = (paymentMethods2[pm] || 0) + grandTotal;
    });
    const items = await db.select({
      productName: invoiceItems.productName,
      productId: invoiceItems.productId,
      qty: import_drizzle_orm18.sql`sum(${invoiceItems.quantity})`,
      totalRevenue: import_drizzle_orm18.sql`sum(${invoiceItems.total})`
    }).from(invoiceItems).groupBy(invoiceItems.productId, invoiceItems.productName).orderBy(import_drizzle_orm18.sql`sum(${invoiceItems.total}) DESC`).limit(10);
    return {
      summary: {
        totalInvoices: allInvoices.length,
        totalSales,
        totalTax,
        totalDiscount,
        netSales,
        paidInvoices,
        pendingInvoices
      },
      paymentMethods: paymentMethods2,
      topProducts: items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        qtySold: Number(i.qty) || 0,
        revenue: Number(i.totalRevenue) || 0
      })),
      invoicesList: allInvoices.slice(0, 50)
    };
  }
  // 2. PURCHASE REPORT
  static async getPurchaseReport(filter) {
    let whereClause = (0, import_drizzle_orm18.gte)(purchases.date, filter.startDate ? filter.startDate : "2020-01-01");
    if (filter.endDate) {
      whereClause = (0, import_drizzle_orm18.and)(whereClause, (0, import_drizzle_orm18.lte)(purchases.date, filter.endDate));
    }
    const pos = await db.select().from(purchases).where(whereClause);
    let totalPurchases = 0;
    let totalTax = 0;
    let pendingOrders = 0;
    let receivedOrders = 0;
    pos.forEach((po) => {
      const amt = Number(po.grandTotal) || 0;
      const tax = Number(po.taxAmount) || 0;
      totalPurchases += amt;
      totalTax += tax;
      if (po.status === "received" || po.status === "completed") receivedOrders++;
      else pendingOrders++;
    });
    const topPurchased = await db.select({
      productId: purchaseItems.productId,
      qty: import_drizzle_orm18.sql`sum(${purchaseItems.quantity})`,
      totalCost: import_drizzle_orm18.sql`sum(${purchaseItems.total})`
    }).from(purchaseItems).groupBy(purchaseItems.productId).orderBy(import_drizzle_orm18.sql`sum(${purchaseItems.total}) DESC`).limit(10);
    return {
      summary: {
        totalPOCount: pos.length,
        totalPurchases,
        totalTax,
        pendingOrders,
        receivedOrders
      },
      topProducts: topPurchased.map((p) => ({
        productId: p.productId,
        qtyPurchased: Number(p.qty) || 0,
        totalCost: Number(p.totalCost) || 0
      })),
      ordersList: pos.slice(0, 50)
    };
  }
  // 3. INVENTORY REPORT
  static async getInventoryReport() {
    const allProducts = await db.select().from(products);
    let totalItemsCount = allProducts.length;
    let totalStockQty = 0;
    let totalValuationCost = 0;
    let totalValuationSale = 0;
    let lowStockCount = 0;
    const categoryMap = {};
    const lowStockList = [];
    allProducts.forEach((p) => {
      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchasePrice) || 0;
      const price = Number(p.price) || 0;
      const minStock = Number(p.minStock) || 5;
      totalStockQty += stock;
      totalValuationCost += stock * cost;
      totalValuationSale += stock * price;
      if (stock <= minStock) {
        lowStockCount++;
        lowStockList.push({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          stock,
          minStock,
          category: p.category
        });
      }
      const cat = p.category || "\u063A\u064A\u0631 \u0645\u0635\u0646\u0641";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, stock: 0, costVal: 0, saleVal: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].stock += stock;
      categoryMap[cat].costVal += stock * cost;
      categoryMap[cat].saleVal += stock * price;
    });
    const potentialProfit = totalValuationSale - totalValuationCost;
    return {
      summary: {
        totalItemsCount,
        totalStockQty,
        totalValuationCost,
        totalValuationSale,
        potentialProfit,
        lowStockCount
      },
      categoryBreakdown: Object.entries(categoryMap).map(([category, val]) => ({
        category,
        ...val
      })),
      lowStockList
    };
  }
  // 4. CUSTOMER REPORT
  static async getCustomerReport() {
    const allCustomers = await db.select().from(customers);
    const allInvoices = await db.select().from(invoices);
    const customerMap = {};
    allInvoices.forEach((inv) => {
      const custId = inv.customerId || "walk_in";
      if (!customerMap[custId]) {
        customerMap[custId] = { totalPurchases: 0, invoiceCount: 0, paidAmount: 0, balance: 0 };
      }
      const total = Number(inv.grandTotal) || 0;
      customerMap[custId].totalPurchases += total;
      customerMap[custId].invoiceCount += 1;
      if (inv.status === "paid") {
        customerMap[custId].paidAmount += total;
      } else {
        customerMap[custId].balance += total;
      }
    });
    const reportList = allCustomers.map((c) => {
      const stats = customerMap[c.id] || { totalPurchases: 0, invoiceCount: 0, paidAmount: 0, balance: 0 };
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || "-",
        address: c.address || "-",
        totalPurchases: stats.totalPurchases,
        invoiceCount: stats.invoiceCount,
        paidAmount: stats.paidAmount,
        remainingDebt: stats.balance || Number(c.balance) || 0
      };
    });
    const totalDebts = reportList.reduce((acc, c) => acc + c.remainingDebt, 0);
    return {
      summary: {
        totalCustomers: allCustomers.length,
        totalDebts
      },
      customers: reportList.sort((a, b) => b.totalPurchases - a.totalPurchases)
    };
  }
  // 5. SUPPLIER REPORT
  static async getSupplierReport() {
    const allSuppliers = await db.select().from(suppliers);
    const allPOs = await db.select().from(purchases);
    const supplierMap = {};
    allPOs.forEach((po) => {
      const suppId = po.supplierId || "general";
      if (!supplierMap[suppId]) {
        supplierMap[suppId] = { totalOrders: 0, totalPurchases: 0, paidAmount: 0, balance: 0 };
      }
      const total = Number(po.grandTotal) || 0;
      supplierMap[suppId].totalPurchases += total;
      supplierMap[suppId].totalOrders += 1;
      if (po.status === "completed" || po.status === "received") {
        supplierMap[suppId].paidAmount += total;
      } else {
        supplierMap[suppId].balance += total;
      }
    });
    const reportList = allSuppliers.map((s) => {
      const stats = supplierMap[s.id] || { totalOrders: 0, totalPurchases: 0, paidAmount: 0, balance: 0 };
      return {
        id: s.id,
        name: s.name,
        phone: s.phone || "-",
        email: s.email || "-",
        totalPurchases: stats.totalPurchases,
        totalOrders: stats.totalOrders,
        paidAmount: stats.paidAmount,
        remainingPayables: stats.balance || Number(s.balance) || 0
      };
    });
    const totalPayables = reportList.reduce((acc, s) => acc + s.remainingPayables, 0);
    return {
      summary: {
        totalSuppliers: allSuppliers.length,
        totalPayables
      },
      suppliers: reportList.sort((a, b) => b.totalPurchases - a.totalPurchases)
    };
  }
  // 6. PROFIT REPORT (أرباح وخسائر)
  static async getProfitReport(filter) {
    let whereClauseInvoices = (0, import_drizzle_orm18.gte)(invoices.date, filter.startDate ? filter.startDate : "2020-01-01");
    if (filter.endDate) {
      whereClauseInvoices = (0, import_drizzle_orm18.and)(whereClauseInvoices, (0, import_drizzle_orm18.lte)(invoices.date, filter.endDate));
    }
    const allInvoices = await db.select().from(invoices).where(whereClauseInvoices);
    const allExpenses = await db.select().from(expenseRequests).where((0, import_drizzle_orm18.eq)(expenseRequests.status, "paid"));
    let totalRevenue = 0;
    let totalCOGS = 0;
    allInvoices.forEach((inv) => {
      totalRevenue += Number(inv.totalWithoutTax) || Number(inv.grandTotal) || 0;
    });
    const invIds = allInvoices.map((i) => i.id);
    if (invIds.length > 0) {
      const items = await db.select().from(invoiceItems).where((0, import_drizzle_orm18.inArray)(invoiceItems.invoiceId, invIds));
      items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const costEstimate = price * 0.7;
        totalCOGS += qty * costEstimate;
      });
    }
    const grossProfit = totalRevenue - totalCOGS;
    let totalOperatingExpenses = 0;
    allExpenses.forEach((e) => {
      totalOperatingExpenses += Number(e.amount) || 0;
    });
    const netProfit = grossProfit - totalOperatingExpenses;
    const profitMarginPercentage = totalRevenue > 0 ? netProfit / totalRevenue * 100 : 0;
    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalOperatingExpenses,
      netProfit,
      profitMarginPercentage
    };
  }
  // 7. FINANCIAL STATEMENTS (القوائم المالية المحاسبية الشاملة)
  static async getFinancialStatements(filter) {
    const allAccounts = await db.select().from(accounts).orderBy((0, import_drizzle_orm18.asc)(accounts.code));
    const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();
    const targetCurrency = filter?.targetCurrency || filter?.currency || baseCurrency;
    const targetRate = await CurrencyRepository.getHistoricalRate(targetCurrency, filter?.endDate);
    let entries = await db.select().from(journalEntries);
    if (filter?.startDate) {
      entries = entries.filter((e) => e.date >= filter.startDate);
    }
    if (filter?.endDate) {
      entries = entries.filter((e) => e.date <= filter.endDate);
    }
    if (filter?.currency && filter.currency !== "ALL" && filter.currency !== "SAR" && filter.currency !== baseCurrency) {
      entries = entries.filter((e) => e.currency === filter.currency);
    }
    const validEntryIds = new Set(entries.map((e) => e.id));
    const allLines = await db.select().from(journalLines);
    const lines = allLines.filter((l) => validEntryIds.has(l.journalEntryId));
    const accountStats = {};
    lines.forEach((line) => {
      const accId = line.accountId;
      if (!accountStats[accId]) {
        accountStats[accId] = { debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 };
      }
      accountStats[accId].debit += Number(line.debit) || 0;
      accountStats[accId].credit += Number(line.credit) || 0;
      accountStats[accId].foreignDebit += Number(line.foreignDebit) || 0;
      accountStats[accId].foreignCredit += Number(line.foreignCredit) || 0;
    });
    let totalTrialDebit = 0;
    let totalTrialCredit = 0;
    const trialBalanceAccounts = allAccounts.map((acc) => {
      const stats = accountStats[acc.id] || { debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 };
      const baseBalance = Number(acc.balance) || 0;
      const isDebitSide = acc.type === "asset" || acc.type === "expense";
      const netBal = isDebitSide ? stats.debit - stats.credit : stats.credit - stats.debit;
      totalTrialDebit += stats.debit;
      totalTrialCredit += stats.credit;
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currency: acc.currency || "SAR",
        currentBalance: baseBalance,
        periodDebit: stats.debit,
        periodCredit: stats.credit,
        netBalance: netBal
      };
    });
    const isTrialBalanced = Math.abs(totalTrialDebit - totalTrialCredit) < 0.01;
    const revenues = trialBalanceAccounts.filter((a) => a.type === "revenue" || a.code.startsWith("4"));
    const cogsAccounts = trialBalanceAccounts.filter((a) => a.code.startsWith("51") || a.code === "acc_cogs");
    const operatingExpenses = trialBalanceAccounts.filter((a) => (a.type === "expense" || a.code.startsWith("5") || a.code.startsWith("6")) && !a.code.startsWith("51") && a.code !== "acc_cogs");
    const totalRevenues = revenues.reduce((sum, a) => sum + (a.periodCredit - a.periodDebit), 0);
    const totalCOGS = cogsAccounts.reduce((sum, a) => sum + (a.periodDebit - a.periodCredit), 0);
    const grossProfit = totalRevenues - totalCOGS;
    const totalExpenses = operatingExpenses.reduce((sum, a) => sum + (a.periodDebit - a.periodCredit), 0);
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenues > 0 ? netProfit / totalRevenues * 100 : 0;
    const assets = trialBalanceAccounts.filter((a) => a.type === "asset" || a.code.startsWith("1"));
    const liabilities = trialBalanceAccounts.filter((a) => a.type === "liability" || a.code.startsWith("2"));
    const equityAccounts = trialBalanceAccounts.filter((a) => a.type === "equity" || a.code.startsWith("3"));
    const totalAssets = assets.reduce((sum, a) => sum + (a.currentBalance || a.netBalance), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.currentBalance || a.netBalance), 0);
    const totalEquityWithoutProfit = equityAccounts.reduce((sum, a) => sum + (a.currentBalance || a.netBalance), 0);
    const totalEquity = totalEquityWithoutProfit + netProfit;
    const equationDiff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    const isEquationBalanced = equationDiff < 0.01;
    let operatingInflows = 0;
    let operatingOutflows = 0;
    let investingInflows = 0;
    let investingOutflows = 0;
    let financingInflows = 0;
    let financingOutflows = 0;
    lines.forEach((l) => {
      const acc = allAccounts.find((a) => a.id === l.accountId);
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      if (acc?.code.startsWith("1101") || acc?.code.startsWith("1102") || acc?.id === "acc_cash" || acc?.id === "acc_bank") {
        if (debit > 0) {
          operatingInflows += debit;
        }
        if (credit > 0) {
          operatingOutflows += credit;
        }
      }
    });
    const netOperatingCash = operatingInflows - operatingOutflows;
    const netInvestingCash = investingInflows - investingOutflows;
    const netFinancingCash = financingInflows - financingOutflows;
    const netCashFlow = netOperatingCash + netInvestingCash + netFinancingCash;
    const cashAndBankAccounts = allAccounts.filter((a) => a.code.startsWith("1101") || a.code.startsWith("1102") || a.id === "acc_cash" || a.id === "acc_bank");
    const endingCashBalance = cashAndBankAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const beginningCashBalance = endingCashBalance - netCashFlow;
    return {
      filter: {
        startDate: filter?.startDate || null,
        endDate: filter?.endDate || null,
        currency: filter?.currency || "ALL",
        baseCurrency,
        targetCurrency,
        exchangeRateUsed: targetRate
      },
      trialBalance: {
        accounts: trialBalanceAccounts,
        totalDebit: totalTrialDebit,
        totalCredit: totalTrialCredit,
        isBalanced: isTrialBalanced
      },
      incomeStatement: {
        revenues,
        cogsAccounts,
        operatingExpenses,
        totalRevenues,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin
      },
      balanceSheet: {
        assets,
        liabilities,
        equity: equityAccounts,
        totalAssets,
        totalLiabilities,
        totalEquityWithoutProfit,
        netProfit,
        totalEquity,
        equation: {
          assets: totalAssets,
          liabilitiesPlusEquity: totalLiabilities + totalEquity,
          difference: equationDiff,
          isBalanced: isEquationBalanced
        }
      },
      cashFlowStatement: {
        operating: {
          inflows: operatingInflows,
          outflows: operatingOutflows,
          net: netOperatingCash
        },
        investing: {
          inflows: investingInflows,
          outflows: investingOutflows,
          net: netInvestingCash
        },
        financing: {
          inflows: financingInflows,
          outflows: financingOutflows,
          net: netFinancingCash
        },
        netCashFlow,
        beginningCashBalance,
        endingCashBalance
      }
    };
  }
  static async getTrialBalanceReport(filter) {
    const res = await this.getFinancialStatements(filter);
    return res.trialBalance;
  }
  static async getIncomeStatementReport(filter) {
    const res = await this.getFinancialStatements(filter);
    return res.incomeStatement;
  }
  static async getBalanceSheetReport(filter) {
    const res = await this.getFinancialStatements(filter);
    return {
      totalAssets: res.balanceSheet.totalAssets,
      totalLiabilitiesAndEquity: res.balanceSheet.totalLiabilities + res.balanceSheet.totalEquity,
      details: res.balanceSheet
    };
  }
};

// src/core/repositories/WorkflowRepository.ts
var defaultRules = [
  { id: "rule-pr-1000", name: "\u0645\u0648\u0627\u0641\u0642\u0629 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621 > 1000 \u0631\u064A\u0627\u0644", entityType: "purchase_request", minAmount: 1e3, approverRole: "manager" },
  { id: "rule-exp-500", name: "\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A > 500 \u0631\u064A\u0627\u0644", entityType: "expense_request", minAmount: 500, approverRole: "finance_manager" },
  { id: "rule-disc-20", name: "\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A > 20%", entityType: "discount", minAmount: 20, approverRole: "store_manager" }
];
var approvalQueue = [];
var WorkflowRepository = class {
  static getRules() {
    return defaultRules;
  }
  static addRule(rule) {
    const newRule = { ...rule, id: `rule_${Date.now()}` };
    defaultRules.push(newRule);
    return newRule;
  }
  static async submitForApproval(data) {
    const applicableRule = defaultRules.find((r) => r.entityType === data.entityType && data.amount >= r.minAmount);
    if (!applicableRule) {
      return { required: false, autoApproved: true };
    }
    const appReq = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ruleId: applicableRule.id,
      entityType: data.entityType,
      entityId: data.entityId,
      requesterName: data.requesterName,
      amount: data.amount,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    approvalQueue.push(appReq);
    return { required: true, approvalRequest: appReq, autoApproved: false };
  }
  static async approveRequest(id, approverName, notes) {
    const req = approvalQueue.find((r) => r.id === id);
    if (!req) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    req.status = "approved";
    req.approverNotes = `${approverName}: ${notes || "\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629"}`;
    return req;
  }
  static async rejectRequest(id, approverName, notes) {
    const req = approvalQueue.find((r) => r.id === id);
    if (!req) throw new Error("\u0637\u0644\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    req.status = "rejected";
    req.approverNotes = `${approverName}: ${notes || "\u062A\u0645 \u0627\u0644\u0631\u0641\u0636"}`;
    return req;
  }
  static getPendingApprovals() {
    return approvalQueue.filter((r) => r.status === "pending");
  }
  static getAllApprovals() {
    return approvalQueue;
  }
};

// src/core/repositories/AuditRepository.ts
init_database();
init_schema2();
var import_drizzle_orm19 = require("drizzle-orm");
var AuditRepository = class {
  static async log(data) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const compId = data.companyId || "company-1";
    const userName = data.userName || "\u0627\u0644\u0646\u0638\u0627\u0645 (System)";
    const nowStr = (/* @__PURE__ */ new Date()).toISOString();
    const newLog = {
      id,
      companyId: compId,
      userId: data.userId,
      userName,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      details: data.details,
      ipAddress: data.ipAddress || "127.0.0.1",
      createdAt: nowStr
    };
    try {
      await db.insert(auditLogs).values({
        id,
        companyId: compId,
        userId: data.userId,
        userName,
        action: data.action,
        module: data.entity,
        recordId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress || "127.0.0.1",
        createdAt: /* @__PURE__ */ new Date()
      });
    } catch (_) {
    }
    return newLog;
  }
  static async getLogs(filter) {
    const limitVal = filter?.limit || 50;
    try {
      const logs = await db.select().from(auditLogs).orderBy((0, import_drizzle_orm19.desc)(auditLogs.createdAt)).limit(limitVal);
      return logs;
    } catch (_) {
      return [];
    }
  }
};

// src/core/repositories/NotificationRepository.ts
init_database();
init_schema2();
var notificationStore = [];
var NotificationRepository = class {
  static async generateStockAlerts() {
    try {
      const allProducts = await db.select().from(products);
      const lowStockProds = allProducts.filter((p) => {
        const stock = Number(p.stock) || 0;
        const minStock = Number(p.minStock) || 5;
        return stock <= minStock;
      });
      const alerts = lowStockProds.map((p) => ({
        id: `notif_stock_${p.id}`,
        type: "low_stock",
        title: "\u062A\u0646\u0628\u064A\u0647 \u0645\u062E\u0632\u0648\u0646 \u0645\u0646\u062E\u0641\u0636",
        message: `\u0627\u0644\u0645\u0646\u062A\u062C "${p.name}" \u0648\u0635\u0644 \u0625\u0644\u0649 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0645\u062E\u0632\u0648\u0646 (${p.stock} \u0642\u0637\u0639\u0629 \u0645\u062A\u0628\u0642\u064A\u0629).`,
        severity: "warning",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        read: false,
        link: "/inventory"
      }));
      this.addNotifications(alerts);
      return alerts;
    } catch (_) {
      return [];
    }
  }
  static async generateCreditLimitAlerts() {
    try {
      const allCusts = await db.select().from(customers);
      const overLimit = allCusts.filter((c) => {
        const bal = Number(c.balance) || 0;
        const limit = Number(c.creditLimit) || 0;
        return limit > 0 && bal >= limit;
      });
      const alerts = overLimit.map((c) => ({
        id: `notif_credit_${c.id}`,
        type: "credit_limit",
        title: "\u062A\u062C\u0627\u0648\u0632 \u062D\u062F \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646",
        message: `\u0627\u0644\u0639\u0645\u064A\u0644 "${c.name}" \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646\u064A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 (\u0627\u0644\u0631\u0635\u064A\u062F: ${c.balance} \u0631\u064A\u0627\u0644 / \u0627\u0644\u062D\u062F: ${c.creditLimit} \u0631\u064A\u0627\u0644).`,
        severity: "error",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        read: false,
        link: "/customers"
      }));
      this.addNotifications(alerts);
      return alerts;
    } catch (_) {
      return [];
    }
  }
  static addNotifications(notifs) {
    notifs.forEach((n) => {
      if (!notificationStore.some((existing) => existing.id === n.id)) {
        notificationStore.unshift(n);
      }
    });
  }
  static getNotifications() {
    return notificationStore;
  }
  static markAsRead(id) {
    const n = notificationStore.find((x) => x.id === id);
    if (n) n.read = true;
  }
  static markAllAsRead() {
    notificationStore.forEach((x) => x.read = true);
  }
};

// src/core/repositories/BackupRepository.ts
init_database();
init_schema2();
var BackupRepository = class {
  static async exportFullBackup() {
    const [
      prods,
      cats,
      custs,
      supps,
      whs,
      invs,
      invItems,
      purs,
      purItems,
      accs
    ] = await Promise.all([
      db.select().from(products).catch(() => []),
      db.select().from(categories).catch(() => []),
      db.select().from(customers).catch(() => []),
      db.select().from(suppliers).catch(() => []),
      db.select().from(warehouses).catch(() => []),
      db.select().from(invoices).catch(() => []),
      db.select().from(invoiceItems).catch(() => []),
      db.select().from(purchases).catch(() => []),
      db.select().from(purchaseItems).catch(() => []),
      db.select().from(accounts).catch(() => [])
    ]);
    return {
      version: "1.0.0",
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      data: {
        products: prods,
        categories: cats,
        customers: custs,
        suppliers: supps,
        warehouses: whs,
        invoices: invs,
        invoiceItems: invItems,
        purchases: purs,
        purchaseItems: purItems,
        accounts: accs
      }
    };
  }
  static async restoreFullBackup(backupData) {
    if (!backupData || !backupData.data) {
      throw new Error("\u0635\u064A\u063A\u0629 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    }
    const { products: prods = [], customers: custs = [], suppliers: supps = [] } = backupData.data;
    let restoredProducts = 0;
    let restoredCustomers = 0;
    let restoredSuppliers = 0;
    for (const p of prods) {
      try {
        await db.insert(products).values(p).onConflictDoNothing();
        restoredProducts++;
      } catch (_) {
      }
    }
    for (const c of custs) {
      try {
        await db.insert(customers).values(c).onConflictDoNothing();
        restoredCustomers++;
      } catch (_) {
      }
    }
    for (const s of supps) {
      try {
        await db.insert(suppliers).values(s).onConflictDoNothing();
        restoredSuppliers++;
      } catch (_) {
      }
    }
    return {
      success: true,
      restoredCounts: {
        products: restoredProducts,
        customers: restoredCustomers,
        suppliers: restoredSuppliers
      }
    };
  }
};

// server.ts
init_JournalEngine();

// src/core/server/routes/v1/index.ts
var import_express15 = require("express");

// src/core/server/routes/v1/products.routes.ts
var import_express = require("express");

// src/core/domain/errors.ts
var DomainError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DomainError";
  }
};
var ValidationError = class extends DomainError {
  constructor(errors) {
    const errorList = Array.isArray(errors) ? errors : [errors];
    super(errorList.join("; "));
    this.name = "ValidationError";
    this.errors = errorList;
  }
};
var BusinessRuleError = class extends DomainError {
  constructor(message, ruleName, code) {
    super(message);
    this.name = "BusinessRuleError";
    this.ruleName = ruleName;
    this.code = code;
  }
};
var NotFoundError = class extends DomainError {
  constructor(message = "\u0627\u0644\u0645\u0648\u0631\u062F \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F") {
    super(message);
    this.name = "NotFoundError";
  }
};
var UnauthorizedError = class extends DomainError {
  constructor(message = "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 - \u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B") {
    super(message);
    this.name = "UnauthorizedError";
  }
};
var ForbiddenError = class extends DomainError {
  constructor(message = "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629 \u0644\u0625\u062C\u0631\u0627\u0621 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629") {
    super(message);
    this.name = "ForbiddenError";
  }
};

// src/core/services/ProductService.ts
var ProductService = class {
  static async getAllProducts(filter) {
    return await ProductRepository.findAll(filter);
  }
  static async getProductById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`\u0627\u0644\u0645\u0646\u062A\u062C \u0630\u0648 \u0627\u0644\u0645\u0639\u0631\u0641 '${id}' \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F`);
    }
    return product;
  }
  static async getProductByBarcode(barcode) {
    const product = await ProductRepository.findByBarcode(barcode);
    if (!product) {
      throw new NotFoundError(`\u0627\u0644\u0645\u0646\u062A\u062C \u0630\u0648 \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F '${barcode}' \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F`);
    }
    return product;
  }
  static async saveProduct(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
    }
    if (!data.barcode || data.barcode.trim().length < 1) {
      throw new ValidationError("\u0628\u0627\u0631\u0643\u0648\u062F \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628");
    }
    const saved = await ProductRepository.upsert(data);
    return saved;
  }
  static async deleteProduct(id) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F`);
    }
    return await ProductRepository.delete(id);
  }
  static async getProductHistory(id) {
    await this.getProductById(id);
    return await ProductRepository.getProductHistory(id);
  }
};

// src/core/server/middleware/rbac.ts
function authorize(requiredPermissionsOrRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 - \u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B",
        statusCode: 401
      });
    }
    if (req.user.role === "manager") {
      return next();
    }
    const hasPermission = requiredPermissionsOrRoles.some((reqStr) => {
      if (reqStr === req.user?.role) return true;
      if (req.user?.permissions && req.user.permissions.includes(reqStr)) return true;
      return false;
    });
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629! \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u062A\u062A\u0637\u0644\u0628 \u0625\u062D\u062F\u0649 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629: ${requiredPermissionsOrRoles.join(", ")}`,
        statusCode: 403
      });
    }
    next();
  };
}

// src/core/server/middleware/validator.ts
function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];
    const checkLocation = (rules = [], locationData, locationName) => {
      for (const rule of rules) {
        const val = locationData ? locationData[rule.field] : void 0;
        if (rule.required && (val === void 0 || val === null || val === "")) {
          errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u0641\u064A ${locationName} \u0645\u0637\u0644\u0648\u0628`);
          continue;
        }
        if (val !== void 0 && val !== null && val !== "") {
          if (rule.type === "string" && typeof val !== "string") {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0646\u0635\u0627\u064B`);
          } else if (rule.type === "number" && (typeof val !== "number" && isNaN(Number(val)))) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B`);
          } else if (rule.type === "boolean" && typeof val !== "boolean" && val !== "true" && val !== "false") {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0642\u064A\u0645\u0629 \u0645\u0646\u0637\u0642\u064A\u0629 (true/false)`);
          } else if (rule.type === "array" && !Array.isArray(val)) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0635\u0641\u0648\u0641\u0629`);
          } else if (rule.type === "email" && (typeof val !== "string" || !val.includes("@"))) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u0631\u064A\u062F\u0627\u064B \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u064B \u0635\u0627\u0644\u062D\u0627\u064B`);
          }
          if (rule.minLength && typeof val === "string" && val.length < rule.minLength) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u0644\u0627 \u064A\u0642\u0644 \u0639\u0646 ${rule.minLength} \u0623\u062D\u0631\u0641`);
          }
          if (rule.min !== void 0 && Number(val) < rule.min) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u0644\u0627 \u064A\u0642\u0644 \u0639\u0646 ${rule.min}`);
          }
          if (rule.nonNegative && Number(val) < 0) {
            errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u064A\u062C\u0628 \u0623\u0646 \u0644\u0627 \u064A\u0643\u0648\u0646 \u0633\u0627\u0644\u0628\u0627\u064B`);
          }
          if (rule.custom) {
            const customResult = rule.custom(val);
            if (customResult === false) {
              errors.push(`\u0627\u0644\u062D\u0642\u0644 '${rule.field}' \u063A\u064A\u0631 \u0635\u0627\u0644\u062D`);
            } else if (typeof customResult === "string") {
              errors.push(customResult);
            }
          }
        }
      }
    };
    if (schema.body) checkLocation(schema.body, req.body, "\u0646\u0635 \u0627\u0644\u0637\u0644\u0628");
    if (schema.query) checkLocation(schema.query, req.query, "\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A");
    if (schema.params) checkLocation(schema.params, req.params, "\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0631");
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u064F\u062F\u062E\u0644\u0629",
        details: errors,
        statusCode: 400
      });
    }
    next();
  };
}

// src/core/server/routes/v1/products.routes.ts
var router = (0, import_express.Router)();
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, category, search, companyId, branchId } = req.query;
    const result = await ProductService.getAllProducts({
      category,
      search,
      page: page ? parseInt(page) : void 0,
      limit: limit ? parseInt(limit) : void 0,
      companyId,
      branchId
    });
    const data = Array.isArray(result) ? result : result.items;
    const pagination = Array.isArray(result) ? void 0 : result.pagination;
    res.json({ success: true, data, pagination });
  } catch (err) {
    next(err);
  }
});
router.get("/barcode/:barcode", async (req, res, next) => {
  try {
    const product = await ProductService.getProductByBarcode(req.params.barcode);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});
router.get("/:id/history", async (req, res, next) => {
  try {
    const history = await ProductService.getProductHistory(req.params.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});
router.post(
  "/",
  authorize(["manager", "inventory"]),
  validateRequest({
    body: [
      { field: "name", required: true, type: "string", minLength: 2 },
      { field: "barcode", required: true, type: "string" },
      { field: "category", required: true, type: "string" },
      { field: "unit", required: true, type: "string" }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await ProductService.saveProduct(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);
router.delete("/:id", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const result = await ProductService.deleteProduct(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var products_routes_default = router;

// src/core/server/routes/v1/customers.routes.ts
var import_express2 = require("express");

// src/core/services/CustomerService.ts
var CustomerService = class {
  static async getCustomers(search) {
    return await CustomerRepository.findAll({ search });
  }
  static async getCustomerById(id) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) throw new NotFoundError("\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    return customer;
  }
  static async saveCustomer(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
    }
    return await CustomerRepository.upsert(data);
  }
  static async deleteCustomer(id) {
    await this.getCustomerById(id);
    return await CustomerRepository.delete(id);
  }
  static async getCustomerLedger(id, startDate, endDate) {
    await this.getCustomerById(id);
    return await CustomerRepository.getCustomerLedger(id, startDate, endDate);
  }
  static async getDebtAging() {
    return await CustomerRepository.getDebtAging();
  }
};

// src/core/server/routes/v1/customers.routes.ts
var router2 = (0, import_express2.Router)();
router2.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const customers3 = await CustomerService.getCustomers(search);
    res.json({ success: true, data: customers3 });
  } catch (err) {
    next(err);
  }
});
router2.get("/reports/aging", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const report = await CustomerService.getDebtAging();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router2.get("/:id", async (req, res, next) => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});
router2.get("/:id/ledger", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ledger = await CustomerService.getCustomerLedger(req.params.id, startDate, endDate);
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});
router2.post(
  "/",
  authorize(["manager", "cashier", "accountant"]),
  validateRequest({
    body: [
      { field: "name", required: true, type: "string", minLength: 2 }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await CustomerService.saveCustomer(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);
router2.delete("/:id", authorize(["manager"]), async (req, res, next) => {
  try {
    const result = await CustomerService.deleteCustomer(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var customers_routes_default = router2;

// src/core/server/routes/v1/suppliers.routes.ts
var import_express3 = require("express");

// src/core/services/SupplierService.ts
var SupplierService = class {
  static async getSuppliers(search) {
    return await SupplierRepository.findAll(search);
  }
  static async getSupplierById(id) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) throw new NotFoundError("\u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    return supplier;
  }
  static async saveSupplier(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError("\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0631\u062F \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
    }
    return await SupplierRepository.upsert(data);
  }
  static async deleteSupplier(id) {
    await this.getSupplierById(id);
    return await SupplierRepository.delete(id);
  }
  static async getSupplierPurchases(id) {
    await this.getSupplierById(id);
    return await SupplierRepository.getSupplierPurchases(id);
  }
};

// src/core/server/routes/v1/suppliers.routes.ts
var router3 = (0, import_express3.Router)();
router3.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const suppliers3 = await SupplierService.getSuppliers(search);
    res.json({ success: true, data: suppliers3 });
  } catch (err) {
    next(err);
  }
});
router3.get("/:id", async (req, res, next) => {
  try {
    const supplier = await SupplierService.getSupplierById(req.params.id);
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});
router3.get("/:id/purchases", async (req, res, next) => {
  try {
    const purchases3 = await SupplierService.getSupplierPurchases(req.params.id);
    res.json({ success: true, data: purchases3 });
  } catch (err) {
    next(err);
  }
});
router3.post(
  "/",
  authorize(["manager", "inventory", "accountant"]),
  validateRequest({
    body: [
      { field: "name", required: true, type: "string", minLength: 2 }
    ]
  }),
  async (req, res, next) => {
    try {
      const saved = await SupplierService.saveSupplier(req.body);
      res.json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
);
router3.delete("/:id", authorize(["manager"]), async (req, res, next) => {
  try {
    const result = await SupplierService.deleteSupplier(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var suppliers_routes_default = router3;

// src/core/server/routes/v1/sales.routes.ts
var import_express4 = require("express");

// src/core/services/SalesService.ts
var SalesService = class {
  static async getInvoices(filter) {
    return await SalesRepository.findAllInvoices(filter);
  }
  static async getInvoiceById(id) {
    const inv = await SalesRepository.findInvoiceById(id);
    if (!inv) throw new NotFoundError("\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629");
    return inv;
  }
  static async createSaleInvoice(data) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError("\u064A\u062C\u0628 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064A \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A");
    }
    return await SalesRepository.createSaleInvoice(data);
  }
  static async returnSaleInvoice(id) {
    return await SalesRepository.returnSaleInvoice(id);
  }
  static async getQuotations() {
    return await SalesRepository.findAllQuotations();
  }
  static async createQuotation(data) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError("\u064A\u062C\u0628 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064A \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631");
    }
    return await SalesRepository.createQuotation(data);
  }
  static async convertQuotationToOrder(id) {
    return await SalesRepository.convertQuotationToOrder(id);
  }
  static async getSalesOrders() {
    return await SalesRepository.findAllSalesOrders();
  }
  static async createSalesOrder(data) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError("\u064A\u062C\u0628 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064A \u0623\u0645\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A");
    }
    return await SalesRepository.createSalesOrder(data);
  }
  static async convertOrderToInvoice(id, paymentMethod = "credit") {
    return await SalesRepository.convertOrderToInvoice(id, paymentMethod);
  }
  static async recordCustomerPayment(data) {
    if (!data.customerId || !data.amount || parseFloat(data.amount) <= 0) {
      throw new ValidationError("\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062D\u0635\u064A\u0644 \u062F\u0641\u0639\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    }
    return await SalesRepository.recordCustomerPayment(data);
  }
};

// src/core/server/routes/v1/sales.routes.ts
var router4 = (0, import_express4.Router)();
router4.get("/invoices", async (req, res, next) => {
  try {
    const { page, limit, customerId, status, date, companyId, branchId } = req.query;
    const result = await SalesService.getInvoices({
      page: page ? parseInt(page) : void 0,
      limit: limit ? parseInt(limit) : void 0,
      customerId,
      status,
      date,
      companyId,
      branchId
    });
    res.json({ success: true, data: result.items, pagination: { page: page || 1, limit: limit || 10, total: result.total } });
  } catch (err) {
    next(err);
  }
});
router4.get("/invoices/:id", async (req, res, next) => {
  try {
    const invoice = await SalesService.getInvoiceById(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});
router4.post(
  "/invoices",
  authorize(["manager", "cashier"]),
  validateRequest({
    body: [
      { field: "invoiceNumber", required: true, type: "string" },
      { field: "date", required: true, type: "string" },
      { field: "items", required: true, type: "array" }
    ]
  }),
  async (req, res, next) => {
    try {
      const created = await SalesService.createSaleInvoice(req.body);
      res.json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);
router4.post("/invoices/:id/return", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const returned = await SalesService.returnSaleInvoice(req.params.id);
    res.json({ success: true, data: returned });
  } catch (err) {
    next(err);
  }
});
router4.get("/quotations", async (req, res, next) => {
  try {
    const quotes = await SalesService.getQuotations();
    res.json({ success: true, data: quotes });
  } catch (err) {
    next(err);
  }
});
router4.post("/quotations", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const created = await SalesService.createQuotation(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});
router4.post("/quotations/:id/convert-order", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const result = await SalesService.convertQuotationToOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router4.get("/orders", async (req, res, next) => {
  try {
    const orders = await SalesService.getSalesOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
});
router4.post("/orders", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const created = await SalesService.createSalesOrder(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});
router4.post("/orders/:id/convert-invoice", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;
    const result = await SalesService.convertOrderToInvoice(req.params.id, paymentMethod || "credit");
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router4.post("/payments", authorize(["manager", "cashier", "accountant"]), async (req, res, next) => {
  try {
    const result = await SalesService.recordCustomerPayment(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var sales_routes_default = router4;

// src/core/server/routes/v1/purchases.routes.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.get("/requests", async (req, res, next) => {
  try {
    const requests = await PurchaseRepository.findAllPurchaseRequests();
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});
router5.post("/requests", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.createPurchaseRequest(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router5.post("/requests/:id/convert-order", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.convertRequestToOrder(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router5.get("/", async (req, res, next) => {
  try {
    const list = await PurchaseRepository.findAllPurchases();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router5.post("/", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.createPurchaseOrder(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router5.post("/:id/receive", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.receiveGoods(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router5.post("/:id/invoice", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.issueSupplierInvoice(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router5.post("/:id/return", authorize(["manager", "accountant", "inventory"]), async (req, res, next) => {
  try {
    const result = await PurchaseRepository.returnPurchaseInvoice(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var purchases_routes_default = router5;

// src/core/server/routes/v1/inventory.routes.ts
var import_express6 = require("express");
var router6 = (0, import_express6.Router)();
router6.get("/warehouses", async (req, res, next) => {
  try {
    const list = await InventoryRepository.getWarehouses();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router6.post("/warehouses", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const result = await InventoryRepository.upsertWarehouse(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router6.delete("/warehouses/:id", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const result = await InventoryRepository.deleteWarehouse(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router6.get("/stock-moves", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const { productId, warehouseId, type } = req.query;
    const moves = await InventoryRepository.getStockMoves(
      productId,
      warehouseId,
      type
    );
    res.json({ success: true, data: moves });
  } catch (err) {
    next(err);
  }
});
router6.post("/stock-moves/manual", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const result = await InventoryRepository.recordManualStockMove(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router6.post("/stock-moves/transfer", authorize(["manager", "inventory"]), async (req, res, next) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    const result = await InventoryRepository.transferStock(productId, fromWarehouseId, toWarehouseId, parseFloat(quantity), notes);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router6.post("/stock-moves/adjustment", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const { productId, warehouseId, actualQuantity, notes } = req.body;
    const result = await InventoryRepository.adjustPhysicalStock(productId, warehouseId, parseFloat(actualQuantity), notes);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router6.get("/ledger/:productId", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const ledger = await InventoryRepository.getProductStockLedger(req.params.productId);
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});
router6.get("/valuation", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const method = req.query.method === "fifo" ? "fifo" : "average";
    const valuation = await InventoryRepository.getInventoryValuation(method);
    res.json({ success: true, data: valuation });
  } catch (err) {
    next(err);
  }
});
router6.get("/low-stock", authorize(["manager", "inventory", "accountant"]), async (req, res, next) => {
  try {
    const alerts = await InventoryRepository.getLowStockAlerts();
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});
var inventory_routes_default = router6;

// src/core/server/routes/v1/accounts.routes.ts
var import_express7 = require("express");
var router7 = (0, import_express7.Router)();
router7.get("/", authorize(["manager", "accountant", "cashier"]), async (req, res, next) => {
  try {
    const { companyId, type, activeOnly, search } = req.query;
    const list = await AccountService.getAccounts({
      companyId,
      type,
      activeOnly: activeOnly === "true",
      search
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router7.get("/tree", authorize(["manager", "accountant", "cashier"]), async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const tree = await AccountService.getAccountsTree(companyId);
    res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
});
router7.get("/suggest-code", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const suggestedCode = await AccountRepository.suggestChildCode(parentId);
    res.json({ success: true, data: { suggestedCode } });
  } catch (err) {
    next(err);
  }
});
router7.get("/:id", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const account = await AccountRepository.findAccountById(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
});
router7.post("/", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const saved = await AccountRepository.upsertAccount(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
router7.post("/:id/toggle-active", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await AccountRepository.toggleAccountActive(req.params.id, isActive !== false);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
router7.post("/seed", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { companyId } = req.body;
    const result = await AccountRepository.seedDefaultChartOfAccounts(companyId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router7.delete("/:id", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await AccountRepository.deleteAccount(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var accounts_routes_default = router7;

// src/core/server/routes/v1/accounting.routes.ts
var import_express8 = require("express");
init_JournalEngine();
var router8 = (0, import_express8.Router)();
router8.get("/ledger", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { accountId, startDate, endDate, currency } = req.query;
    const ledger = await AccountingRepository.getGeneralLedger(
      accountId,
      startDate,
      endDate,
      currency
    );
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});
router8.get("/trial-balance", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { currency } = req.query;
    const tb = await AccountingRepository.getTrialBalance(currency);
    res.json({ success: true, data: tb });
  } catch (err) {
    next(err);
  }
});
router8.get("/journal-entries", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { search, date, currency, status } = req.query;
    const entries = await AccountingRepository.getJournalEntries(
      search,
      date,
      currency,
      status
    );
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
});
router8.post("/journal-entries", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { description, date, reference, lines, currency, baseCurrency, exchangeRate, status } = req.body;
    const entryNum = "JE-MAN-" + Math.floor(1e3 + Math.random() * 9e3);
    const createdBy = req.user?.name || "\u0627\u0644\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0645\u0627\u0644\u064A";
    const result = await JournalEngine.postJournalEntry(
      entryNum,
      description,
      date,
      lines,
      {
        reference,
        currency,
        baseCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : void 0,
        status: status || "posted",
        createdBy
      }
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router8.post("/journal-entries/:id/post", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await JournalEngine.postDraftEntry(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router8.post("/journal-entries/:id/reverse", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const createdBy = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u062A\u062F\u0642\u064A\u0642";
    const result = await JournalEngine.reverseJournalEntry(req.params.id, reason, createdBy);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router8.get("/audit-health", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const health = await JournalEngine.verifyAccountingIntegrity();
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
});
router8.get("/posting-rules", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const rules = await AccountingRepository.getPostingRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});
router8.post("/posting-rules", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { ruleCode, accountId } = req.body;
    const saved = await AccountingRepository.upsertPostingRule(ruleCode, accountId);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
var accounting_routes_default = router8;

// src/core/server/routes/v1/treasury.routes.ts
var import_express9 = require("express");
var router9 = (0, import_express9.Router)();
router9.get("/cashboxes", async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getCashboxes();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router9.post("/cashboxes", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const item = await TreasuryRepository.upsertCashbox(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});
router9.delete("/cashboxes/:id", authorize(["manager"]), async (req, res, next) => {
  try {
    await TreasuryRepository.deleteCashbox(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});
router9.get("/bank-accounts", async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getBankAccounts();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router9.post("/bank-accounts", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const item = await TreasuryRepository.upsertBankAccount(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});
router9.delete("/bank-accounts/:id", authorize(["manager"]), async (req, res, next) => {
  try {
    await TreasuryRepository.deleteBankAccount(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});
router9.get("/transactions", async (req, res, next) => {
  try {
    const type = req.query.type;
    const list = await TreasuryRepository.getTransactions(type);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router9.post("/deposits", authorize(["manager", "accountant", "cashier"]), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createDeposit(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router9.post("/withdrawals", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createWithdrawal(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router9.post("/transfers", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.createTransfer(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router9.get("/reconciliations/:bankAccountId", async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getBankReconciliations(req.params.bankAccountId);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router9.get("/unreconciled/:bankAccountId", async (req, res, next) => {
  try {
    const list = await TreasuryRepository.getUnreconciledTransactions(req.params.bankAccountId);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router9.post("/reconcile", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await TreasuryRepository.executeBankReconciliation(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
var treasury_routes_default = router9;

// src/core/server/routes/v1/expenses.routes.ts
var import_express10 = require("express");
var router10 = (0, import_express10.Router)();
router10.get("/categories", async (req, res, next) => {
  try {
    const list = await ExpenseRepository.getCategories();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router10.post("/categories", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const cat = await ExpenseRepository.upsertCategory(req.body);
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
});
router10.delete("/categories/:id", authorize(["manager"]), async (req, res, next) => {
  try {
    await ExpenseRepository.deleteCategory(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});
router10.get("/requests", async (req, res, next) => {
  try {
    const statusFilter = req.query.status;
    const list = await ExpenseRepository.getRequests(statusFilter);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router10.post("/requests", async (req, res, next) => {
  try {
    const item = await ExpenseRepository.createRequest(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});
router10.post("/requests/:id/approve", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const approvedBy = req.body.approvedBy || req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const result = await ExpenseRepository.approveRequest(req.params.id, approvedBy);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router10.post("/requests/:id/reject", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const reason = req.body.reason || "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629";
    const result = await ExpenseRepository.rejectRequest(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router10.post("/requests/:id/pay", authorize(["manager", "accountant", "cashier"]), async (req, res, next) => {
  try {
    const result = await ExpenseRepository.payExpense(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router10.get("/reports", async (req, res, next) => {
  try {
    const reports = await ExpenseRepository.getExpenseReports();
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});
var expenses_routes_default = router10;

// src/core/server/routes/v1/currencies.routes.ts
var import_express11 = require("express");
init_CurrencyRepository();
var router11 = (0, import_express11.Router)();
router11.get("/", async (req, res, next) => {
  try {
    let list = await CurrencyRepository.getCurrencies();
    if (list.length === 0) {
      for (const curr of DEFAULT_CURRENCIES) {
        await CurrencyRepository.upsertCurrency(curr);
      }
      list = await CurrencyRepository.getCurrencies();
    }
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router11.post("/seed", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await CurrencyRepository.findCurrencyByCode(curr.code);
      if (!existing) {
        await CurrencyRepository.upsertCurrency(curr);
      }
    }
    const list = await CurrencyRepository.getCurrencies();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});
router11.post("/", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const saved = await CurrencyRepository.upsertCurrency(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
router11.post("/:id/rate", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { exchangeRate } = req.body;
    const userName = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const updated = await CurrencyRepository.updateRate(req.params.id, Number(exchangeRate), userName);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
router11.get("/history", async (req, res, next) => {
  try {
    const { currencyId } = req.query;
    const history = await CurrencyRepository.getExchangeRateHistory(currencyId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});
router11.post("/convert", async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;
    const allCurrencies = await CurrencyRepository.getCurrencies();
    const mappedList = allCurrencies.map((c) => ({
      ...c,
      exchangeRate: parseFloat(c.exchangeRate || "1")
    }));
    const result = CurrencyService.convertAmount(Number(amount), from, to, mappedList);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router11.delete("/:id", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const result = await CurrencyRepository.deleteCurrency(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router11.get("/historical-rate", async (req, res, next) => {
  try {
    const code = req.query.code || "USD";
    const date = req.query.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const rate = await CurrencyService.getHistoricalRate(code, date);
    res.json({ success: true, data: { currencyCode: code, date, rate } });
  } catch (err) {
    next(err);
  }
});
router11.post("/revalue", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { date, currencyCode, newRate } = req.body;
    const userName = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const result = await CurrencyService.revalueForeignBalances({
      date,
      currencyCode,
      newRate: newRate ? Number(newRate) : void 0,
      createdBy: userName
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router11.post("/convert-invoice", async (req, res, next) => {
  try {
    const { invoice, targetCurrency, rate } = req.body;
    const result = CurrencyService.convertInvoice(invoice, targetCurrency, rate ? Number(rate) : void 0);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
router11.post("/set-base", authorize(["manager", "accountant"]), async (req, res, next) => {
  try {
    const { currencyId, currencyCode } = req.body;
    const target = currencyId || currencyCode;
    const userName = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const updatedList = await CurrencyRepository.setBaseCurrency(target, userName);
    res.json({ success: true, data: updatedList });
  } catch (err) {
    next(err);
  }
});
var currencies_routes_default = router11;

// src/core/server/routes/v1/users.routes.ts
var import_express12 = require("express");
var router12 = (0, import_express12.Router)();
router12.get("/roles", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    const roles3 = await UserRepository.getRolesWithPermissions();
    res.json({ success: true, data: roles3 });
  } catch (err) {
    next(err);
  }
});
router12.post("/roles", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    const saved = await UserRepository.saveRole(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
router12.delete("/roles/:id", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    await UserRepository.deleteRole(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});
router12.get("/permissions", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    const permissions2 = await UserRepository.getAllPermissions();
    res.json({ success: true, data: permissions2 });
  } catch (err) {
    next(err);
  }
});
router12.get("/users", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const result = await UserRepository.getUsers({
      page: page ? parseInt(page) : void 0,
      limit: limit ? parseInt(limit) : void 0,
      role
    });
    res.json({ success: true, data: result.items || result, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});
router12.post("/users", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    const saved = await UserRepository.saveUser(req.body);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
router12.delete("/users/:id", authorize(["manager", "manage_users"]), async (req, res, next) => {
  try {
    if (req.params.id === "001" || req.params.id === req.user?.id) {
      return res.status(400).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0623\u0648 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u0646\u0634\u0637 \u062D\u0627\u0644\u064A\u0627\u064B.", statusCode: 400 });
    }
    await UserRepository.deleteUser(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (err) {
    next(err);
  }
});
var users_routes_default = router12;

// src/core/server/routes/v1/reports.routes.ts
var import_express13 = require("express");
var router13 = (0, import_express13.Router)();
router13.get("/sales", async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getSalesReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/purchases", async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getPurchaseReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/inventory", async (req, res, next) => {
  try {
    const report = await ReportsRepository.getInventoryReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/customers", async (req, res, next) => {
  try {
    const report = await ReportsRepository.getCustomerReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/suppliers", async (req, res, next) => {
  try {
    const report = await ReportsRepository.getSupplierReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/profit", async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getProfitReport(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
router13.get("/financial-statements", async (req, res, next) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      currency: req.query.currency
    };
    const report = await ReportsRepository.getFinancialStatements(filter);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});
var reports_routes_default = router13;

// src/core/server/routes/v1/system.routes.ts
var import_express14 = require("express");
var router14 = (0, import_express14.Router)();
router14.get("/workflows/rules", (req, res) => {
  const rules = WorkflowRepository.getRules();
  res.json({ success: true, data: rules });
});
router14.post("/workflows/rules", (req, res) => {
  const newRule = WorkflowRepository.addRule(req.body);
  res.json({ success: true, data: newRule });
});
router14.get("/workflows/approvals", (req, res) => {
  const approvals = WorkflowRepository.getAllApprovals();
  res.json({ success: true, data: approvals });
});
router14.post("/workflows/approvals/:id/approve", async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.approveRequest(req.params.id, approverName || "\u0627\u0644\u0645\u062F\u064A\u0631", notes);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
router14.post("/workflows/approvals/:id/reject", async (req, res) => {
  try {
    const { approverName, notes } = req.body;
    const result = await WorkflowRepository.rejectRequest(req.params.id, approverName || "\u0627\u0644\u0645\u062F\u064A\u0631", notes);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
router14.get("/audit-logs", async (req, res) => {
  const logs = await AuditRepository.getLogs();
  res.json({ success: true, data: logs });
});
router14.post("/audit-logs", async (req, res) => {
  const newLog = await AuditRepository.log(req.body);
  res.json({ success: true, data: newLog });
});
router14.get("/notifications", async (req, res) => {
  await NotificationRepository.generateStockAlerts();
  await NotificationRepository.generateCreditLimitAlerts();
  const notifs = NotificationRepository.getNotifications();
  res.json({ success: true, data: notifs });
});
router14.post("/notifications/read-all", (req, res) => {
  NotificationRepository.markAllAsRead();
  res.json({ success: true });
});
router14.get("/backup/export", async (req, res) => {
  try {
    const backup = await BackupRepository.exportFullBackup();
    res.json({ success: true, data: backup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router14.post("/backup/restore", async (req, res) => {
  try {
    const result = await BackupRepository.restoreFullBackup(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
var system_routes_default = router14;

// src/core/server/routes/v1/index.ts
var router15 = (0, import_express15.Router)();
router15.use("/products", products_routes_default);
router15.use("/customers", customers_routes_default);
router15.use("/suppliers", suppliers_routes_default);
router15.use("/sales", sales_routes_default);
router15.use("/purchases", purchases_routes_default);
router15.use("/inventory", inventory_routes_default);
router15.use("/accounts", accounts_routes_default);
router15.use("/accounting", accounting_routes_default);
router15.use("/treasury", treasury_routes_default);
router15.use("/expenses", expenses_routes_default);
router15.use("/currencies", currencies_routes_default);
router15.use("/", users_routes_default);
router15.use("/reports", reports_routes_default);
router15.use("/system", system_routes_default);
var v1_default = router15;

// src/core/server/routes/authRoutes.ts
var import_express16 = require("express");
init_database();
init_schema2();
var import_drizzle_orm21 = require("drizzle-orm");

// src/core/auth/TokenService.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "enterprise-erp-jwt-secret-key-2026";
var REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-erp-refresh-secret-key-2026";
var TokenService = class {
  /**
   * Generate short-lived Access Token (1 hour)
   */
  static generateAccessToken(user) {
    return import_jsonwebtoken.default.sign(
      {
        id: user.id,
        uid: user.uid || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        companyId: user.companyId,
        branchId: user.branchId,
        permissions: user.permissions || [],
        type: "access"
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
  }
  /**
   * Generate long-lived Refresh Token (90 days)
   */
  static generateRefreshToken(userId, sessionId) {
    return import_jsonwebtoken.default.sign(
      {
        id: userId,
        sessionId,
        type: "refresh"
      },
      REFRESH_SECRET,
      { expiresIn: "90d" }
    );
  }
  /**
   * Verify Access Token
   */
  static verifyAccessToken(token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      if (decoded.type && decoded.type !== "access") return null;
      return decoded;
    } catch (err) {
      return null;
    }
  }
  /**
   * Verify Refresh Token
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, REFRESH_SECRET);
      if (decoded.type && decoded.type !== "refresh") return null;
      return { id: decoded.id, sessionId: decoded.sessionId };
    } catch (err) {
      return null;
    }
  }
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password) {
    const salt = await import_bcryptjs.default.genSalt(10);
    return import_bcryptjs.default.hash(password, salt);
  }
  /**
   * Verify password against bcrypt hash
   */
  static async comparePassword(password, hash) {
    if (!hash) return false;
    return import_bcryptjs.default.compare(password, hash);
  }
  /**
   * Generate random secure hex token for password reset / email verification
   */
  static generateRandomToken(bytes = 32) {
    return import_crypto.default.randomBytes(bytes).toString("hex");
  }
};

// src/core/server/middleware/auth.ts
init_database();
init_schema2();
var import_drizzle_orm20 = require("drizzle-orm");
var ROLE_DEFAULT_PERMISSIONS = {
  manager: [
    "view_dashboard",
    "dashboard.view",
    "pos_access",
    "sales.view",
    "sales.create",
    "sales.delete",
    "view_invoices",
    "manage_inventory",
    "inventory.view",
    "inventory.manage",
    "view_purchases",
    "purchases.view",
    "purchases.manage",
    "view_accounting",
    "accounting.view",
    "accounting.manage",
    "view_reports",
    "reports.view",
    "view_settings",
    "settings.manage",
    "manage_users",
    "users.manage",
    "manage_roles",
    "treasury_access"
  ],
  accountant: [
    "view_dashboard",
    "dashboard.view",
    "pos_access",
    "sales.view",
    "view_invoices",
    "view_purchases",
    "purchases.view",
    "view_accounting",
    "accounting.view",
    "accounting.manage",
    "view_reports",
    "reports.view",
    "treasury_access"
  ],
  inventory: [
    "view_dashboard",
    "dashboard.view",
    "manage_inventory",
    "inventory.view",
    "inventory.manage",
    "view_purchases",
    "purchases.view",
    "purchases.manage"
  ],
  cashier: [
    "pos_access",
    "sales.view",
    "sales.create",
    "view_invoices"
  ]
};

// src/core/server/routes/authRoutes.ts
var authRouter = (0, import_express16.Router)();
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password, code, pin, identifier } = req.body;
    let userRecord = null;
    const targetIdentifier = email || identifier;
    if (targetIdentifier) {
      const [u] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.email, targetIdentifier));
      if (!u) {
        const [u2] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.id, targetIdentifier));
        userRecord = u2;
      } else {
        userRecord = u;
      }
    } else if (code) {
      const [u] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.id, code));
      userRecord = u;
    }
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 - \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"
      });
    }
    if (password && userRecord.passwordHash) {
      const isPasswordValid = await TokenService.comparePassword(password, userRecord.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062A\u064A \u0623\u062F\u062E\u0644\u062A\u0647\u0627 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629"
        });
      }
    } else if (pin) {
      let expectedPin = userRecord.pin;
      if (!expectedPin) {
        if (userRecord.id === "001") expectedPin = "1111";
        else if (userRecord.id === "002") expectedPin = "2222";
        else if (userRecord.id === "003") expectedPin = "3333";
        else if (userRecord.id === "004") expectedPin = "4444";
        else expectedPin = "1234";
      }
      if (pin !== expectedPin) {
        return res.status(401).json({
          success: false,
          error: "\u0631\u0645\u0632 PIN \u0627\u0644\u0630\u064A \u0623\u062F\u062E\u0644\u062A\u0647 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D"
        });
      }
    }
    let userPermissions = [];
    if (userRecord.roleId) {
      try {
        const perms = await db.select({ code: permissions.code }).from(rolePermissions).innerJoin(permissions, (0, import_drizzle_orm21.eq)(rolePermissions.permissionId, permissions.id)).where((0, import_drizzle_orm21.eq)(rolePermissions.roleId, userRecord.roleId));
        userPermissions = perms.map((p) => p.code);
      } catch (err) {
      }
    }
    const userRole = userRecord.role || "cashier";
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
    const finalPermissions = Array.from(/* @__PURE__ */ new Set([...userPermissions, ...defaultPerms]));
    const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const accessToken = TokenService.generateAccessToken({
      id: userRecord.id,
      uid: userRecord.uid || userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRole,
      roleId: userRecord.roleId,
      companyId: userRecord.companyId,
      branchId: userRecord.branchId,
      permissions: finalPermissions,
      sessionId
    });
    const refreshToken = TokenService.generateRefreshToken(userRecord.id, sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    try {
      await db.insert(userSessions).values({
        id: sessionId,
        userId: userRecord.id,
        refreshToken,
        ipAddress: req.ip || req.socket.remoteAddress || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "App",
        isRevoked: false,
        expiresAt,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    } catch (sessionDbErr) {
      console.warn("Session DB log failed:", sessionDbErr);
    }
    return res.json({
      success: true,
      token: accessToken,
      refreshToken,
      sessionId,
      user: {
        id: userRecord.id,
        uid: userRecord.uid || userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRole,
        roleId: userRecord.roleId,
        code: userRecord.id,
        companyId: userRecord.companyId,
        branchId: userRecord.branchId,
        permissions: finalPermissions,
        isVerified: userRecord.isEmailVerified ?? true
      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      success: false,
      error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
      details: error.message
    });
  }
});
authRouter.post("/register", async (req, res) => {
  try {
    const { email, name, password, role, pin } = req.body;
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628\u0629"
      });
    }
    const [existing] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.email, email));
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644"
      });
    }
    const userId = "usr_" + Date.now();
    const passwordHash = password ? await TokenService.hashPassword(password) : null;
    const verificationToken = TokenService.generateRandomToken(24);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await db.insert(users).values({
      id: userId,
      uid: userId,
      email,
      name,
      role: role || "cashier",
      passwordHash,
      pin: pin || "1234",
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return res.status(201).json({
      success: true,
      message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0646\u062C\u0627\u062D. \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0631\u0645\u0632 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A.",
      user: {
        id: userId,
        email,
        name,
        role: role || "cashier",
        isEmailVerified: false
      },
      verificationToken
    });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062C\u062F\u064A\u062F",
      details: error.message
    });
  }
});
authRouter.post("/refresh", async (req, res) => {
  try {
    const refreshTokenInput = req.body.refreshToken || req.headers["x-refresh-token"];
    if (!refreshTokenInput) {
      return res.status(400).json({
        success: false,
        error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u062F\u064A\u062B (Refresh Token) \u0645\u0637\u0644\u0648\u0628"
      });
    }
    const payload = TokenService.verifyRefreshToken(refreshTokenInput);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647"
      });
    }
    const [session] = await db.select().from(userSessions).where((0, import_drizzle_orm21.and)((0, import_drizzle_orm21.eq)(userSessions.id, payload.sessionId), (0, import_drizzle_orm21.eq)(userSessions.isRevoked, false)));
    if (!session || new Date(session.expiresAt) < /* @__PURE__ */ new Date()) {
      return res.status(401).json({
        success: false,
        error: "\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u0645\u0644\u063A\u0627\u0629 \u0623\u0648 \u0645\u0646\u062A\u0647\u064A\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629"
      });
    }
    const [userRecord] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.id, payload.id));
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"
      });
    }
    const userRole = userRecord.role || "cashier";
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
    const newAccessToken = TokenService.generateAccessToken({
      id: userRecord.id,
      uid: userRecord.uid || userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRole,
      roleId: userRecord.roleId,
      companyId: userRecord.companyId,
      branchId: userRecord.branchId,
      permissions: defaultPerms,
      sessionId: session.id
    });
    const newRefreshToken = TokenService.generateRefreshToken(userRecord.id, session.id);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await db.update(userSessions).set({
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm21.eq)(userSessions.id, session.id));
    return res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u062A\u062C\u062F\u064A\u062F \u0627\u0644\u062C\u0644\u0633\u0629",
      details: error.message
    });
  }
});
authRouter.post("/logout", async (req, res) => {
  try {
    const refreshTokenInput = req.body.refreshToken || req.headers["x-refresh-token"];
    const authHeader = req.headers.authorization;
    if (refreshTokenInput) {
      const payload = TokenService.verifyRefreshToken(refreshTokenInput);
      if (payload) {
        await db.update(userSessions).set({ isRevoked: true, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm21.eq)(userSessions.id, payload.sessionId));
      }
    }
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0648\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0628\u0646\u062C\u0627\u062D"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
      details: error.message
    });
  }
});
authRouter.get("/me", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 - \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B"
    });
  }
  return res.json({
    success: true,
    user: req.user
  });
});
authRouter.get("/sessions", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647" });
    }
    const sessionsList = await db.select({
      id: userSessions.id,
      ipAddress: userSessions.ipAddress,
      userAgent: userSessions.userAgent,
      isRevoked: userSessions.isRevoked,
      expiresAt: userSessions.expiresAt,
      createdAt: userSessions.createdAt
    }).from(userSessions).where((0, import_drizzle_orm21.and)((0, import_drizzle_orm21.eq)(userSessions.userId, req.user.id), (0, import_drizzle_orm21.eq)(userSessions.isRevoked, false)));
    return res.json({
      success: true,
      sessions: sessionsList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A",
      details: error.message
    });
  }
});
authRouter.delete("/sessions/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647" });
    }
    const sessionId = req.params.id;
    await db.update(userSessions).set({ isRevoked: true, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm21.and)((0, import_drizzle_orm21.eq)(userSessions.id, sessionId), (0, import_drizzle_orm21.eq)(userSessions.userId, req.user.id)));
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0628\u0646\u062C\u0627\u062D"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629",
      details: error.message
    });
  }
});
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0637\u0644\u0648\u0628" });
    }
    const [u] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.email, email));
    if (!u) {
      return res.json({
        success: true,
        message: "\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644\u0627\u064B \u0644\u062F\u064A\u0646\u0627\u060C \u0641\u0642\u062F \u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631."
      });
    }
    const resetToken = TokenService.generateRandomToken(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1e3);
    await db.update(users).set({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm21.eq)(users.id, u.id));
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0631\u0645\u0632 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D.",
      resetToken
      // Returned for UI testing / simulator
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      details: error.message
    });
  }
});
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "\u0627\u0644\u0631\u0645\u0632 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0645\u0637\u0644\u0648\u0628\u0627\u0646"
      });
    }
    const [u] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.resetPasswordToken, token));
    if (!u || !u.resetPasswordExpires || new Date(u.resetPasswordExpires) < /* @__PURE__ */ new Date()) {
      return res.status(400).json({
        success: false,
        error: "\u0631\u0645\u0632 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647"
      });
    }
    const passwordHash = await TokenService.hashPassword(newPassword);
    await db.update(users).set({
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm21.eq)(users.id, u.id));
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      details: error.message
    });
  }
});
authRouter.post("/send-verification-email", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647" });
    }
    const verificationToken = TokenService.generateRandomToken(24);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await db.update(users).set({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm21.eq)(users.id, req.user.id));
    return res.json({
      success: true,
      message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A.",
      verificationToken
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u0637\u0644\u0628 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
      details: error.message
    });
  }
});
authRouter.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0645\u0637\u0644\u0648\u0628" });
    }
    const [u] = await db.select().from(users).where((0, import_drizzle_orm21.eq)(users.emailVerificationToken, token));
    if (!u || !u.emailVerificationExpires || new Date(u.emailVerificationExpires) < /* @__PURE__ */ new Date()) {
      return res.status(400).json({
        success: false,
        error: "\u0631\u0645\u0632 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u062A\u0647"
      });
    }
    await db.update(users).set({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm21.eq)(users.id, u.id));
    return res.json({
      success: true,
      message: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0646\u062C\u0627\u062D!"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "\u0641\u0634\u0644 \u0641\u064A \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
      details: error.message
    });
  }
});

// src/core/server/middleware/rateLimiter.ts
var clientStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of clientStore.entries()) {
    if (now > record.resetTime) {
      clientStore.delete(ip);
    }
  }
}, 60 * 1e3);
function createRateLimiter(options) {
  const { windowMs, max, message = "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0637\u0644\u0628\u0627\u062A. \u0627\u0644\u0631\u062C\u0627\u0621 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0644\u0627\u062D\u0642\u0627\u064B." } = options;
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown-client";
    const now = Date.now();
    let record = clientStore.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      clientStore.set(ip, record);
    } else {
      record.count += 1;
    }
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1e3);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: message,
        statusCode: 429,
        retryAfter: resetSeconds
      });
    }
    next();
  };
}
var defaultRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 1e3
  // 1000 requests per 15 minutes per IP
});
var strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1e3,
  max: 100
  // 100 requests per 15 minutes for auth / sensitive operations
});

// src/core/server/middleware/logger.ts
var Logger = class {
  static info(message, meta) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[INFO] [${timestamp2}] ${message}`, meta ? JSON.stringify(meta) : "");
  }
  static warn(message, meta) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    console.warn(`[WARN] [${timestamp2}] ${message}`, meta ? JSON.stringify(meta) : "");
  }
  static error(message, error) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    console.error(`[ERROR] [${timestamp2}] ${message}`, error ? error.stack || error : "");
  }
  static debug(message, meta) {
    if (process.env.NODE_ENV !== "production") {
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[DEBUG] [${timestamp2}] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  }
};

// src/core/server/middleware/errorHandler.ts
function errorHandler(err, req, res, next) {
  Logger.error(`Error handling route ${req.method} ${req.originalUrl}: ${err.message || err}`, err);
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
      details: err.errors,
      statusCode: 400
    });
  }
  if (err instanceof BusinessRuleError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: 400
    });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: err.message,
      statusCode: 404
    });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: err.message,
      statusCode: 401
    });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: err.message,
      statusCode: 403
    });
  }
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      error: "\u0627\u0644\u0641\u0631\u0627\u062F\u0629 \u0645\u0643\u0631\u0631\u0629: \u064A\u0648\u062C\u062F \u0633\u062C\u0644\u0627 \u0645\u062A\u0637\u0627\u0628\u0642\u0627 \u0645\u0633\u062C\u0644\u0627\u064B \u0628\u0627\u0644\u0641\u0639\u0644 \u0628\u0627\u0644\u0631\u0645\u0632 \u0623\u0648 \u0627\u0644\u0631\u0642\u0645 \u0646\u0641\u0633\u0647",
      details: err.detail,
      statusCode: 409
    });
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u062F\u0627\u062E\u0644\u064A";
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...process.env.NODE_ENV !== "production" && { stack: err.stack },
    statusCode
  });
}

// server.ts
var import_drizzle_orm22 = require("drizzle-orm");
var app = (0, import_express17.default)();
var PORT = 3e3;
app.use(import_express17.default.json());
function sendResponse(res, data, status = 200, pagination) {
  res.status(status).json({
    success: true,
    data,
    ...pagination && { pagination }
  });
}
function sendError(res, message, details, status = 500) {
  res.status(status).json({
    success: false,
    error: message,
    ...details && { details }
  });
}
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userRecord = null;
    let decodedPayload = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      decodedPayload = TokenService.verifyAccessToken(token);
      if (decodedPayload) {
        const [u] = await db.select().from(users).where((0, import_drizzle_orm22.eq)(users.id, decodedPayload.id));
        if (u) {
          userRecord = u;
        } else {
          userRecord = {
            id: decodedPayload.id,
            uid: decodedPayload.uid || decodedPayload.id,
            email: decodedPayload.email,
            name: decodedPayload.name || "User",
            role: decodedPayload.role || "cashier",
            roleId: decodedPayload.roleId
          };
        }
      } else {
        const [u] = await db.select().from(users).where((0, import_drizzle_orm22.eq)(users.id, token));
        if (u) {
          userRecord = u;
        }
      }
    }
    if (!userRecord) {
      const [master] = await db.select().from(users).where((0, import_drizzle_orm22.eq)(users.id, "001"));
      userRecord = master || { id: "001", uid: "001", email: "manager@system.com", name: "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 (\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645)", role: "manager", roleId: "role_manager" };
    }
    if (userRecord) {
      let userPermissions = [];
      try {
        if (userRecord.roleId) {
          const perms = await db.select({ code: permissions.code }).from(rolePermissions).innerJoin(permissions, (0, import_drizzle_orm22.eq)(rolePermissions.permissionId, permissions.id)).where((0, import_drizzle_orm22.eq)(rolePermissions.roleId, userRecord.roleId));
          userPermissions = perms.map((p) => p.code);
        }
      } catch (dbErr) {
        console.error("Error fetching db permissions:", dbErr);
      }
      const userRole = userRecord.role || "cashier";
      const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
      userRecord.permissions = Array.from(/* @__PURE__ */ new Set([...userPermissions, ...defaultPerms]));
    }
    req.user = userRecord;
    next();
  } catch (error) {
    sendError(res, "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 - \u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064A\u0629", error, 401);
  }
}
function authorize2(requirements) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 - \u0627\u0644\u0631\u062C\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B"
      });
    }
    if (req.user.role === "manager" || req.user.role === "admin") {
      return next();
    }
    const userPerms = req.user.permissions || [];
    const hasMatch = requirements.some((reqStr) => {
      if (reqStr === req.user.role) return true;
      if (userPerms.includes(reqStr)) return true;
      if (reqStr === "view_accounting" && userPerms.includes("accounting.view")) return true;
      if (reqStr === "manage_inventory" && userPerms.includes("inventory.manage")) return true;
      if (reqStr === "view_purchases" && userPerms.includes("purchases.view")) return true;
      if (reqStr === "view_invoices" && userPerms.includes("sales.view")) return true;
      if (reqStr === "pos_access" && userPerms.includes("sales.view")) return true;
      if (reqStr === "view_reports" && userPerms.includes("reports.view")) return true;
      return false;
    });
    if (!hasMatch) {
      return res.status(403).json({
        success: false,
        error: `\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629! \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u062A\u062A\u0637\u0644\u0628 \u0623\u062D\u062F \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0623\u0648 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u062A\u0627\u0644\u064A\u0629: ${requirements.join(" \u0623\u0648 ")}`
      });
    }
    next();
  };
}
function requestLogger(req, res, next) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const userStr = req.user ? `${req.user.name} (${req.user.role})` : "Guest";
  console.log(`[${timestamp2}] ${req.method} ${req.url} - User: ${userStr}`);
  next();
}
app.use("/api", defaultRateLimiter);
app.use("/api/auth", authRouter);
app.use("/api", authenticate);
app.use("/api", requestLogger);
app.use("/api/v1", v1_default);
async function postJournalEntry(entryNumber, description, date, lines, options) {
  return await AccountingRepository.postJournalEntry(entryNumber, description, date, lines, options);
}
async function getAccountByRule(ruleCode, defaultAccountId) {
  try {
    const [rule] = await db.select().from(postingRules).where((0, import_drizzle_orm22.eq)(postingRules.ruleCode, ruleCode));
    return rule ? rule.accountId : defaultAccountId;
  } catch (error) {
    console.error(`Error resolving account for rule ${ruleCode}:`, error);
    return defaultAccountId;
  }
}
function validateProduct(p) {
  const errors = [];
  if (!p.name || typeof p.name !== "string" || p.name.trim().length < 2) {
    errors.push("\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
  }
  if (!p.barcode || typeof p.barcode !== "string" || p.barcode.trim().length < 2) {
    errors.push("\u0631\u0645\u0632 \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062F \u0645\u0637\u0644\u0648\u0628");
  }
  if (p.price === void 0 || parseFloat(p.price) < 0) {
    errors.push("\u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u0627\u0644\u0635\u0641\u0631");
  }
  if (p.purchasePrice === void 0 || parseFloat(p.purchasePrice) < 0) {
    errors.push("\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A \u0627\u0644\u0635\u0641\u0631");
  }
  if (!p.category) {
    errors.push("\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628");
  }
  if (!p.unit) {
    errors.push("\u0648\u062D\u062F\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0637\u0644\u0648\u0628\u0629");
  }
  return errors;
}
function validateCustomer(c) {
  const errors = [];
  if (!c.name || typeof c.name !== "string" || c.name.trim().length < 2) {
    errors.push("\u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
  }
  return errors;
}
function validateSupplier(s) {
  const errors = [];
  if (!s.name || typeof s.name !== "string" || s.name.trim().length < 2) {
    errors.push("\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0631\u062F \u0645\u0637\u0644\u0648\u0628 \u0648\u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u062D\u0631\u0641\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
  }
  return errors;
}
function validateInvoice(inv) {
  const errors = [];
  if (!inv.invoiceNumber) errors.push("\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0637\u0644\u0648\u0628");
  if (!inv.date) errors.push("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0637\u0644\u0648\u0628");
  if (!inv.items || !Array.isArray(inv.items) || inv.items.length === 0) {
    errors.push("\u064A\u062C\u0628 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C \u0648\u0627\u062D\u062F \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0641\u064A \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629");
  }
  return errors;
}
function validateUser(u) {
  const errors = [];
  if (!u.email || !u.email.includes("@")) errors.push("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
  if (!u.name || u.name.trim().length < 2) errors.push("\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628");
  const validRoles = ["manager", "accountant", "cashier", "inventory"];
  if (!u.role || !validRoles.includes(u.role)) {
    errors.push("\u062F\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u060C \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0623\u062D\u062F \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629");
  }
  return errors;
}
app.get("/api/products", async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const conditions = [];
    if (category) {
      conditions.push((0, import_drizzle_orm22.eq)(products.category, category));
    }
    if (search) {
      conditions.push(
        (0, import_drizzle_orm22.or)(
          (0, import_drizzle_orm22.like)(products.name, `%${search}%`),
          (0, import_drizzle_orm22.like)(products.barcode, `%${search}%`)
        )
      );
    }
    const whereClause = conditions.length > 0 ? (0, import_drizzle_orm22.and)(...conditions) : void 0;
    let total = 0;
    if (page || limit) {
      const countResult = await db.select({ count: import_drizzle_orm22.sql`count(*)` }).from(products).where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select().from(products);
    if (whereClause) {
      query = query.where(whereClause);
    }
    if (page && limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      query = query.limit(l).offset((p - 1) * l);
    }
    const allProducts = await query;
    const mapped = allProducts.map((p) => ({
      ...p,
      price: parseFloat(p.price || "0"),
      purchasePrice: parseFloat(p.purchasePrice || "0"),
      stock: parseFloat(p.stock || "0"),
      minStock: parseFloat(p.minStock || "0"),
      taxRate: parseFloat(p.taxRate || "15")
    }));
    if (page || limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A", error);
  }
});
app.post("/api/products", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const p = req.body;
    const errors = validateProduct(p);
    if (errors.length > 0) {
      return sendError(res, "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", errors, 400);
    }
    const id = p.id || "prod_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(products).where((0, import_drizzle_orm22.eq)(products.id, id));
    const dbValue = {
      id,
      name: p.name,
      barcode: p.barcode,
      price: (p.price || 0).toString(),
      purchasePrice: (p.purchasePrice || 0).toString(),
      stock: (p.stock || 0).toString(),
      minStock: (p.minStock || 0).toString(),
      category: p.category,
      unit: p.unit,
      taxRate: (p.taxRate ?? 15).toString(),
      image: p.image || "",
      description: p.description || ""
    };
    if (existing.length > 0) {
      await db.update(products).set(dbValue).where((0, import_drizzle_orm22.eq)(products.id, id));
    } else {
      await db.insert(products).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0645\u0646\u062A\u062C", error);
  }
});
app.delete("/api/products/:id", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    await db.delete(products).where((0, import_drizzle_orm22.eq)(products.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C", error);
  }
});
app.get("/api/products/:id/history", async (req, res) => {
  try {
    const history = await ProductRepository.getProductHistory(req.params.id);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0633\u062C\u0644 \u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u0646\u062A\u062C", error);
  }
});
app.get("/api/categories", async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    sendResponse(res, allCategories);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A", error);
  }
});
app.post("/api/categories", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const cat = req.body;
    if (!cat.name || cat.name.trim() === "") {
      return sendError(res, "\u0627\u0633\u0645 \u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0645\u0637\u0644\u0648\u0628", null, 400);
    }
    const dbValue = {
      id: cat.id || "cat_" + Math.random().toString(36).substr(2, 9),
      name: cat.name,
      icon: cat.icon || "\u{1F4E6}"
    };
    const existing = await db.select().from(categories).where((0, import_drizzle_orm22.eq)(categories.id, dbValue.id));
    if (existing.length > 0) {
      await db.update(categories).set(dbValue).where((0, import_drizzle_orm22.eq)(categories.id, dbValue.id));
    } else {
      await db.insert(categories).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062A\u0635\u0646\u064A\u0641", error);
  }
});
app.delete("/api/categories/:id", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    await db.delete(categories).where((0, import_drizzle_orm22.eq)(categories.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062A\u0635\u0646\u064A\u0641", error);
  }
});
app.get("/api/units", async (req, res) => {
  try {
    const allUnits = await db.select().from(units);
    sendResponse(res, allUnits);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0648\u062D\u062F\u0627\u062A", error);
  }
});
app.post("/api/units", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const unitData = req.body;
    if (!unitData.name || unitData.name.trim() === "") {
      return sendError(res, "\u0627\u0633\u0645 \u0627\u0644\u0648\u062D\u062F\u0629 \u0645\u0637\u0644\u0648\u0628", null, 400);
    }
    const dbValue = {
      id: unitData.id || "unit_" + Math.random().toString(36).substr(2, 9),
      name: unitData.name
    };
    const existing = await db.select().from(units).where((0, import_drizzle_orm22.eq)(units.id, dbValue.id));
    if (existing.length > 0) {
      await db.update(units).set(dbValue).where((0, import_drizzle_orm22.eq)(units.id, dbValue.id));
    } else {
      await db.insert(units).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0648\u062D\u062F\u0629", error);
  }
});
app.delete("/api/units/:id", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    await db.delete(units).where((0, import_drizzle_orm22.eq)(units.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0648\u062D\u062F\u0629", error);
  }
});
app.get("/api/warehouses", async (req, res) => {
  try {
    const list = await InventoryRepository.getWarehouses();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A", error);
  }
});
app.post("/api/warehouses", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code) {
      return sendError(res, "\u0627\u0633\u0645 \u0648\u0643\u0648\u062F \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0645\u0637\u0644\u0648\u0628\u0627\u0646", null, 400);
    }
    const result = await InventoryRepository.upsertWarehouse(data);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639", error);
  }
});
app.delete("/api/warehouses/:id", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const result = await InventoryRepository.deleteWarehouse(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639", error);
  }
});
app.get("/api/stock-moves", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const { productId, warehouseId, type } = req.query;
    const moves = await InventoryRepository.getStockMoves(
      productId,
      warehouseId,
      type
    );
    sendResponse(res, moves);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646", error);
  }
});
app.post("/api/stock-moves/manual", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const { productId, warehouseId, type, quantity, unitCost, referenceId, notes } = req.body;
    if (!productId || !warehouseId || !type || !quantity) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629", null, 400);
    }
    const result = await InventoryRepository.recordManualStockMove({
      productId,
      warehouseId,
      type,
      quantity: parseFloat(quantity),
      unitCost: unitCost !== void 0 && unitCost !== null && unitCost !== "" ? parseFloat(unitCost) : void 0,
      referenceId,
      notes
    });
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0625\u0630\u0646 \u0627\u0644\u062D\u0631\u0643\u0629 \u0627\u0644\u0645\u062E\u0632\u0646\u064A\u0629 \u0627\u0644\u064A\u062F\u0648\u064A\u0629", error);
  }
});
app.post("/api/stock-moves/transfer", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return sendError(res, "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u062A\u062D\u0648\u064A\u0644 \u0645\u0637\u0644\u0648\u0628\u0629", null, 400);
    }
    const result = await InventoryRepository.transferStock(
      productId,
      fromWarehouseId,
      toWarehouseId,
      parseFloat(quantity),
      notes
    );
    sendResponse(res, { success: true, transfer: result });
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", error);
  }
});
app.post("/api/stock-moves/adjustment", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const { productId, warehouseId, actualQuantity, notes } = req.body;
    if (!productId || !warehouseId || actualQuantity === void 0 || actualQuantity === null) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629", null, 400);
    }
    const result = await InventoryRepository.adjustPhysicalStock(
      productId,
      warehouseId,
      parseFloat(actualQuantity),
      notes
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u062C\u0631\u062F\u064A\u0629", error);
  }
});
app.get("/api/inventory/ledger/:productId", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const ledger = await InventoryRepository.getProductStockLedger(req.params.productId);
    sendResponse(res, ledger);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0633\u062A\u0627\u062F \u0627\u0644\u0645\u0646\u062A\u062C", error);
  }
});
app.get("/api/inventory/valuation", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const method = req.query.method === "fifo" ? "fifo" : "average";
    const valuation = await InventoryRepository.getInventoryValuation(method);
    sendResponse(res, valuation);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0633\u0627\u0628 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", error);
  }
});
app.get("/api/inventory/low-stock", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const alerts = await InventoryRepository.getLowStockAlerts();
    sendResponse(res, alerts);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u062D\u0631\u062C", error);
  }
});
app.get("/api/currencies", async (req, res) => {
  try {
    let list = await CurrencyRepository.getCurrencies();
    if (list.length === 0) {
      for (const curr of DEFAULT_CURRENCIES) {
        await CurrencyRepository.upsertCurrency(curr);
      }
      list = await CurrencyRepository.getCurrencies();
    }
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0639\u0645\u0644\u0627\u062A", error);
  }
});
app.post("/api/currencies/seed", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    for (const curr of DEFAULT_CURRENCIES) {
      const existing = await CurrencyRepository.findCurrencyByCode(curr.code);
      if (!existing) {
        await CurrencyRepository.upsertCurrency(curr);
      }
    }
    const updatedList = await CurrencyRepository.getCurrencies();
    sendResponse(res, updatedList);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0628\u0630\u0631 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0627\u062A", error);
  }
});
app.post("/api/currencies", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const data = req.body;
    if (!data.code || !data.name || !data.symbol) {
      return sendError(res, "\u0643\u0648\u062F \u0648\u0627\u0633\u0645 \u0648\u0631\u0645\u0632 \u0627\u0644\u0639\u0645\u0644\u0629 \u0645\u0637\u0644\u0648\u0628\u0629", null, 400);
    }
    const saved = await CurrencyRepository.upsertCurrency(data);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0639\u0645\u0644\u0629", error);
  }
});
app.post("/api/currencies/:id/rate", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { exchangeRate } = req.body;
    if (!exchangeRate || isNaN(Number(exchangeRate))) {
      return sendError(res, "\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u062C\u062F\u064A\u062F \u0645\u0637\u0644\u0648\u0628 \u0628\u0631\u0642\u0645 \u0635\u062D\u064A\u062D", null, 400);
    }
    const userName = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const updated = await CurrencyRepository.updateRate(id, Number(exchangeRate), userName);
    sendResponse(res, updated);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641", error);
  }
});
app.get("/api/currencies/history", async (req, res) => {
  try {
    const { currencyId } = req.query;
    const history = await CurrencyRepository.getExchangeRateHistory(currencyId);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0633\u062C\u0644 \u062A\u063A\u064A\u064A\u0631 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641", error);
  }
});
app.post("/api/currencies/convert", async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    if (amount === void 0 || !from || !to) {
      return sendError(res, "\u0627\u0644\u0645\u0628\u0644\u063A \u0648\u0639\u0645\u0644\u0629 \u0627\u0644\u0645\u0635\u062F\u0631 \u0648\u0639\u0645\u0644\u0629 \u0627\u0644\u0647\u062F\u0641 \u0645\u0637\u0644\u0648\u0628\u0629", null, 400);
    }
    const allCurrencies = await CurrencyRepository.getCurrencies();
    const mappedList = allCurrencies.map((c) => ({
      ...c,
      exchangeRate: parseFloat(c.exchangeRate || "1")
    }));
    const result = CurrencyService.convertAmount(
      Number(amount),
      from,
      to,
      mappedList
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0633\u0627\u0628 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0639\u0645\u0644\u0629", error);
  }
});
app.delete("/api/currencies/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const result = await CurrencyRepository.deleteCurrency(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0639\u0645\u0644\u0629", error);
  }
});
app.post("/api/currencies/set-base", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { currencyId, currencyCode } = req.body;
    const target = currencyId || currencyCode;
    if (!target) {
      return sendError(res, "\u0645\u0639\u0631\u0641 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u0639\u0645\u0644\u0629 \u0645\u0637\u0644\u0648\u0628", null, 400);
    }
    const userName = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const updatedList = await CurrencyRepository.setBaseCurrency(target, userName);
    try {
      const baseCode = await CurrencyRepository.getBaseCurrencyCode();
      const baseObj = await CurrencyRepository.findCurrencyByCode(baseCode);
      if (baseObj) {
        await db.update(settings).set({ currency: baseObj.symbol || baseCode }).where((0, import_drizzle_orm22.eq)(settings.id, "default_settings"));
      }
    } catch (e) {
    }
    sendResponse(res, updatedList);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0634\u0631\u0643\u0629", error, 400);
  }
});
app.get("/api/taxes", async (req, res) => {
  try {
    const list = await db.select().from(taxes);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0636\u0631\u0627\u0626\u0628", error);
  }
});
app.post("/api/taxes", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code || data.rate === void 0) {
      return sendError(res, "\u0627\u0633\u0645 \u0648\u0643\u0648\u062F \u0648\u0646\u0633\u0628\u0629 \u0627\u0644\u0636\u0631\u064A\u0628\u0629 \u0645\u0637\u0644\u0648\u0628\u0629", null, 400);
    }
    const id = data.id || "tax_" + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: data.name,
      code: data.code,
      rate: data.rate.toString(),
      isInclusive: data.isInclusive ? "true" : "false",
      companyId: data.companyId || null
    };
    const existing = await db.select().from(taxes).where((0, import_drizzle_orm22.eq)(taxes.id, id));
    if (existing.length > 0) {
      await db.update(taxes).set(dbValue).where((0, import_drizzle_orm22.eq)(taxes.id, id));
    } else {
      await db.insert(taxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0636\u0631\u064A\u0628\u0629", error);
  }
});
app.delete("/api/taxes/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    await db.delete(taxes).where((0, import_drizzle_orm22.eq)(taxes.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0636\u0631\u064A\u0628\u0629", error);
  }
});
app.get("/api/payment-methods", async (req, res) => {
  try {
    const list = await db.select().from(paymentMethods);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0637\u0631\u0642 \u0627\u0644\u062F\u0641\u0639", error);
  }
});
app.post("/api/payment-methods", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.code) {
      return sendError(res, "\u0627\u0633\u0645 \u0648\u0643\u0648\u062F \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639 \u0645\u0637\u0644\u0648\u0628\u0629", null, 400);
    }
    const id = data.id || "pm_" + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      code: data.code,
      name: data.name,
      accountId: data.accountId || null,
      companyId: data.companyId || null
    };
    const existing = await db.select().from(paymentMethods).where((0, import_drizzle_orm22.eq)(paymentMethods.id, id));
    if (existing.length > 0) {
      await db.update(paymentMethods).set(dbValue).where((0, import_drizzle_orm22.eq)(paymentMethods.id, id));
    } else {
      await db.insert(paymentMethods).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639", error);
  }
});
app.delete("/api/payment-methods/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    await db.delete(paymentMethods).where((0, import_drizzle_orm22.eq)(paymentMethods.id, req.params.id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062F\u0641\u0639", error);
  }
});
app.get("/api/customers", async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const pageNum = page ? parseInt(page) : void 0;
    const limitNum = limit ? parseInt(limit) : void 0;
    const conditions = [];
    if (search) {
      conditions.push(
        (0, import_drizzle_orm22.or)(
          (0, import_drizzle_orm22.like)(customers.name, `%${search}%`),
          (0, import_drizzle_orm22.like)(customers.phone, `%${search}%`)
        )
      );
    }
    let total = 0;
    if (pageNum || limitNum) {
      const countQuery = db.select({ count: import_drizzle_orm22.sql`count(*)` }).from(customers);
      const countResult = conditions.length > 0 ? await countQuery.where((0, import_drizzle_orm22.and)(...conditions)) : await countQuery;
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select().from(customers);
    if (conditions.length > 0) {
      query = query.where((0, import_drizzle_orm22.and)(...conditions));
    }
    if (pageNum && limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      query = query.limit(l).offset((p - 1) * l);
    }
    const allCustomers = await query;
    const mapped = allCustomers.map((c) => ({
      ...c,
      balance: parseFloat(c.balance || "0"),
      creditLimit: parseFloat(c.creditLimit || "5000"),
      openingBalance: parseFloat(c.openingBalance || "0")
    }));
    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = limitNum || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", error);
  }
});
app.get("/api/customers/reports/aging", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const agingReport = await CustomerRepository.getDebtAging();
    sendResponse(res, agingReport);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0642\u0631\u064A\u0631 \u0623\u0639\u0645\u0627\u0631 \u0627\u0644\u062F\u064A\u0648\u0646", error);
  }
});
app.get("/api/customers/:id/ledger", async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const ledger = await CustomerRepository.getCustomerLedger(id, startDate, endDate);
    sendResponse(res, ledger);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0643\u0634\u0641 \u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644", error);
  }
});
app.post("/api/customers", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const c = req.body;
    const errors = validateCustomer(c);
    if (errors.length > 0) {
      return sendError(res, "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", errors, 400);
    }
    const id = c.id || "cust_" + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      balance: (c.balance ?? 0).toString(),
      creditLimit: (c.creditLimit ?? 5e3).toString(),
      taxNumber: c.taxNumber || "",
      crNumber: c.crNumber || "",
      address: c.address || "",
      type: c.type || "retail",
      status: c.status || "active",
      notes: c.notes || "",
      openingBalance: (c.openingBalance ?? 0).toString()
    };
    const saved = await CustomerRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0639\u0645\u064A\u0644", error);
  }
});
app.delete("/api/customers/:id", authorize2(["manager"]), async (req, res) => {
  try {
    const result = await CustomerRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0639\u0645\u064A\u0644", error);
  }
});
app.get("/api/suppliers", async (req, res) => {
  try {
    const allSuppliers = await SupplierRepository.findAll(req.query.search);
    const mapped = allSuppliers.map((s) => ({
      ...s,
      balance: parseFloat(s.balance || "0")
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646", error);
  }
});
app.post("/api/suppliers", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const s = req.body;
    const errors = validateSupplier(s);
    if (errors.length > 0) {
      return sendError(res, "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", errors, 400);
    }
    const id = s.id || "supp_" + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: s.name,
      phone: s.phone || "",
      email: s.email || "",
      balance: (s.balance || 0).toString()
    };
    const saved = await SupplierRepository.upsert(dbValue);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0645\u0648\u0631\u062F", error);
  }
});
app.delete("/api/suppliers/:id", authorize2(["manager"]), async (req, res) => {
  try {
    const result = await SupplierRepository.delete(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0648\u0631\u062F", error);
  }
});
app.get("/api/suppliers/:id/ledger", async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) {
      return sendError(res, "\u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", null, 404);
    }
    const supplierPurchases = await SupplierRepository.getSupplierPurchases(id);
    const allEntries = await AccountingRepository.getJournalEntries();
    const supplierEntries = allEntries.filter(
      (e) => e.description?.includes(supplier.name) || e.entryNumber?.includes(`PAY-`) || supplierPurchases.some((p) => p.purchaseNumber && e.entryNumber?.includes(String(p.purchaseNumber)))
    );
    let runningBalance = 0;
    const ledgerLines = [];
    for (const pur of supplierPurchases) {
      const gTotal = parseFloat(pur.grandTotal || "0");
      if (pur.paymentMethod === "credit") {
        runningBalance += gTotal;
        ledgerLines.push({
          id: `pur-${pur.id}`,
          date: pur.date,
          type: "purchase_invoice",
          typeLabel: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0622\u062C\u0644\u0629",
          reference: pur.purchaseNumber,
          invoiceNumber: pur.supplierInvoiceNumber || pur.purchaseNumber,
          debit: 0,
          credit: gTotal,
          runningBalance,
          notes: pur.notes || `\u0641\u0627\u062A\u0648\u0631\u0629 \u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0631\u0642\u0645 ${pur.purchaseNumber}`
        });
      }
    }
    for (const entry of supplierEntries) {
      if (entry.entryNumber.startsWith("JE-PAY-") && entry.description.includes(supplier.name)) {
        const debitDetail = entry.details.find((d) => Number(d.debit || 0) > 0);
        const amount = debitDetail ? Number(debitDetail.debit || 0) : 0;
        if (amount > 0) {
          runningBalance -= amount;
          ledgerLines.push({
            id: `pay-${entry.id}`,
            date: entry.date,
            type: "supplier_payment",
            typeLabel: "\u0633\u0646\u062F \u0635\u0631\u0641 \u0645\u0648\u0631\u062F",
            reference: entry.entryNumber.replace("JE-", ""),
            invoiceNumber: "-",
            debit: amount,
            credit: 0,
            runningBalance,
            notes: entry.description
          });
        }
      }
    }
    ledgerLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sendResponse(res, {
      supplier: {
        ...supplier,
        balance: parseFloat(supplier.balance || "0")
      },
      currentBalance: parseFloat(supplier.balance || "0"),
      ledgerLines
    });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0643\u0634\u0641 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0648\u0631\u062F", error);
  }
});
app.get("/api/invoices", async (req, res) => {
  try {
    const { page, limit, customerId, status, date } = req.query;
    const p = page ? parseInt(page) : void 0;
    const l = limit ? parseInt(limit) : void 0;
    const result = await SalesRepository.findAllInvoices({
      page: p,
      limit: l,
      customerId,
      status,
      date
    });
    if (p || l) {
      sendResponse(res, result.items, 200, { page: p || 1, limit: l || 10, total: result.total });
    } else {
      sendResponse(res, result.items);
    }
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631", error);
  }
});
app.post("/api/invoices", authorize2(["manager", "cashier"]), async (req, res) => {
  try {
    const inv = req.body;
    const errors = validateInvoice(inv);
    if (errors.length > 0) {
      return sendError(res, "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", errors, 400);
    }
    const result = await SalesRepository.createSaleInvoice(inv);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629", error);
  }
});
app.post("/api/invoices/:id/return", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SalesRepository.returnSaleInvoice(id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0631\u062A\u062C\u0639 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629", error);
  }
});
app.get("/api/quotations", async (req, res) => {
  try {
    const quotes = await SalesRepository.findAllQuotations();
    sendResponse(res, quotes);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0639\u0631\u0648\u0636 \u0627\u0644\u0623\u0633\u0639\u0627\u0631", error);
  }
});
app.post("/api/quotations", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const result = await SalesRepository.createQuotation(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631", error);
  }
});
app.post("/api/quotations/:id/convert-order", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const result = await SalesRepository.convertQuotationToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u062D\u0648\u064A\u0644 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0625\u0644\u0649 \u0623\u0645\u0631 \u0645\u0628\u064A\u0639\u0627\u062A", error);
  }
});
app.get("/api/sales-orders", async (req, res) => {
  try {
    const orders = await SalesRepository.findAllSalesOrders();
    sendResponse(res, orders);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", error);
  }
});
app.post("/api/sales-orders", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const result = await SalesRepository.createSalesOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0623\u0645\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", error);
  }
});
app.post("/api/sales-orders/:id/convert-invoice", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const result = await SalesRepository.convertOrderToInvoice(req.params.id, paymentMethod || "credit");
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u062D\u0648\u064A\u0644 \u0623\u0645\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0625\u0644\u0649 \u0641\u0627\u062A\u0648\u0631\u0629", error);
  }
});
app.post("/api/customer-payments", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const result = await SalesRepository.recordCustomerPayment(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u062A\u062D\u0635\u064A\u0644 \u062F\u0641\u0639\u0629 \u0627\u0644\u0639\u0645\u064A\u0644", error);
  }
});
app.get("/api/expenses", authorize2(["manager", "accountant", "inventory"]), async (req, res) => {
  try {
    const { date, page, limit } = req.query;
    const conditions = [];
    if (date) {
      conditions.push((0, import_drizzle_orm22.eq)(expenses.date, date));
    }
    const whereClause = conditions.length > 0 ? (0, import_drizzle_orm22.and)(...conditions) : void 0;
    let total = 0;
    if (page || limit) {
      const countResult = await db.select({ count: import_drizzle_orm22.sql`count(*)` }).from(expenses).where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select().from(expenses).orderBy((0, import_drizzle_orm22.desc)(expenses.createdAt));
    if (whereClause) {
      query = query.where(whereClause);
    }
    if (page && limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      query = query.limit(l).offset((p - 1) * l);
    }
    const allExpenses = await query;
    const mapped = allExpenses.map((e) => ({
      ...e,
      amount: parseFloat(e.amount)
    }));
    if (page || limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      sendResponse(res, mapped, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, mapped);
    }
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641", error);
  }
});
app.post("/api/expenses", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const exp = req.body;
    if (!exp.description || !exp.amount || parseFloat(exp.amount) <= 0) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", null, 400);
    }
    const id = "exp_" + Math.random().toString(36).substr(2, 9);
    const expDeb = await getAccountByRule("expense_debit", "acc_expense");
    const expCred = await getAccountByRule("expense_credit", "acc_cash");
    await db.insert(expenses).values({
      id,
      description: exp.description,
      amount: exp.amount.toString(),
      accountId: expDeb,
      date: exp.date
    });
    await postJournalEntry(
      `JE-EXP-${id}`,
      `\u0645\u0635\u0631\u0648\u0641: ${exp.description}`,
      exp.date,
      [
        { accountId: expDeb, debit: parseFloat(exp.amount), credit: 0 },
        { accountId: expCred, debit: 0, credit: parseFloat(exp.amount) }
      ]
    );
    sendResponse(res, { success: true, id });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.delete("/api/expenses/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(expenses).where((0, import_drizzle_orm22.eq)(expenses.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.get(["/api/accounts", "/api/accounting/accounts"], authorize2(["manager", "accountant", "cashier"]), async (req, res) => {
  try {
    const { companyId, type, activeOnly, search } = req.query;
    const accountsList = await AccountRepository.getAccounts({
      companyId,
      type,
      activeOnly: activeOnly === "true",
      search
    });
    sendResponse(res, accountsList);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062F\u0644\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A", error);
  }
});
app.get("/api/accounts/tree", authorize2(["manager", "accountant", "cashier"]), async (req, res) => {
  try {
    const { companyId } = req.query;
    const tree = await AccountRepository.getAccountsTree(companyId);
    sendResponse(res, tree);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0634\u062C\u0631\u0629 \u0627\u0644\u0647\u0631\u0645\u064A\u0629 \u0644\u0644\u062D\u0633\u0627\u0628\u0627\u062A", error);
  }
});
app.get("/api/accounts/suggest-code", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { parentId } = req.query;
    if (!parentId) {
      return sendError(res, "\u0645\u0639\u0631\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0631\u0626\u064A\u0633\u064A parentId \u0645\u0637\u0644\u0648\u0628", null, 400);
    }
    const suggestedCode = await AccountRepository.suggestChildCode(parentId);
    sendResponse(res, { suggestedCode });
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0631\u0645\u0632 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0641\u0631\u0639\u064A", error, 400);
  }
});
app.get("/api/accounts/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const account = await AccountRepository.findAccountById(id);
    if (!account) {
      return sendError(res, "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", null, 404);
    }
    sendResponse(res, account);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628", error);
  }
});
app.post(["/api/accounts", "/api/accounting/accounts"], authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { code, name, type } = req.body;
    if (!code || !name || !type) {
      return sendError(res, "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u062D\u0633\u0627\u0628 \u0645\u0637\u0644\u0648\u0628\u0629 (\u0627\u0644\u0631\u0645\u0632\u060C \u0627\u0644\u0627\u0633\u0645\u060C \u0627\u0644\u0646\u0648\u0639)", null, 400);
    }
    const saved = await AccountRepository.upsertAccount(req.body);
    sendResponse(res, saved);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062D\u0633\u0627\u0628", error, 400);
  }
});
app.post("/api/accounts/:id/toggle-active", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await AccountRepository.toggleAccountActive(id, isActive !== false);
    sendResponse(res, updated);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0633\u0627\u0628", error, 400);
  }
});
app.post("/api/accounts/seed", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { companyId } = req.body;
    const result = await AccountRepository.seedDefaultChartOfAccounts(companyId);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0632\u0631\u0639 \u062F\u0644\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0642\u064A\u0627\u0633\u064A", error);
  }
});
app.delete(["/api/accounts/:id", "/api/accounting/accounts/:id"], authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AccountRepository.deleteAccount(id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628", error, 400);
  }
});
app.get("/api/accounting/ledger", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { accountId, startDate, endDate, currency } = req.query;
    if (!accountId) {
      return sendError(res, "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 accountId", null, 400);
    }
    const result = await AccountingRepository.getGeneralLedger(
      accountId,
      startDate,
      endDate,
      currency
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062F\u0641\u062A\u0631 \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0644\u0644\u062D\u0633\u0627\u0628", error);
  }
});
app.get("/api/accounting/trial-balance", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { currency } = req.query;
    const trialBalanceData = await AccountingRepository.getTrialBalance(currency);
    sendResponse(res, trialBalanceData);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0645\u064A\u0632\u0627\u0646 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629", error);
  }
});
app.get("/api/accounting/journal-entries", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { search, date, currency, status } = req.query;
    const entries = await AccountingRepository.getJournalEntries(
      search,
      date,
      currency,
      status
    );
    sendResponse(res, entries);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0642\u064A\u0648\u062F \u0627\u0644\u064A\u0648\u0645\u064A\u0629", error);
  }
});
app.get("/api/accounting/journal-entries/:id", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const [entry] = await db.select().from(journalEntries).where((0, import_drizzle_orm22.eq)(journalEntries.id, id));
    if (!entry) return sendError(res, "\u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", null, 404);
    const lines = await db.select().from(journalLines).where((0, import_drizzle_orm22.eq)(journalLines.journalEntryId, id));
    const accountIds = Array.from(new Set(lines.map((l) => l.accountId)));
    const accs = accountIds.length > 0 ? await db.select().from(accounts).where((0, import_drizzle_orm22.inArray)(accounts.id, accountIds)) : [];
    const accMap = new Map(accs.map((a) => [a.id, a]));
    const mappedLines = lines.map((l) => {
      const acc = accMap.get(l.accountId);
      return {
        id: l.id,
        accountId: l.accountId,
        accountCode: acc?.code || "",
        accountName: acc?.name || "",
        accountType: acc?.type || "",
        currency: l.currency || entry.currency || "SAR",
        exchangeRate: parseFloat(l.exchangeRate || "1.0"),
        foreignDebit: parseFloat(l.foreignDebit || "0"),
        foreignCredit: parseFloat(l.foreignCredit || "0"),
        debit: parseFloat(l.debit || "0"),
        credit: parseFloat(l.credit || "0"),
        description: l.description || entry.description
      };
    });
    sendResponse(res, {
      ...entry,
      foreignAmount: parseFloat(entry.foreignAmount || "0"),
      baseAmount: parseFloat(entry.baseAmount || "0"),
      exchangeRate: parseFloat(entry.exchangeRate || "1.0"),
      lines: mappedLines
    });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error);
  }
});
app.post("/api/accounting/journal-entries", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { description, date, reference, lines, currency, baseCurrency, exchangeRate, status } = req.body;
    if (!description || !date || !lines || !Array.isArray(lines) || lines.length === 0) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0642\u064A\u062F \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629", null, 400);
    }
    const entryNum = "JE-MAN-" + Math.floor(1e3 + Math.random() * 9e3);
    const createdBy = req.user?.name || "\u0627\u0644\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0645\u0627\u0644\u064A";
    const result = await JournalEngine.postJournalEntry(
      entryNum,
      description,
      date,
      lines,
      {
        reference,
        currency,
        baseCurrency,
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : void 0,
        status: status || "posted",
        createdBy
      }
    );
    sendResponse(res, { success: true, ...result });
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u0627\u0644\u064A\u062F\u0648\u064A", error, 400);
  }
});
app.post("/api/accounting/journal-entries/:id/post", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await JournalEngine.postDraftEntry(id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0631\u062D\u064A\u0644 \u0642\u064A\u062F \u0627\u0644\u0645\u0633\u0648\u062F\u0629", error, 400);
  }
});
app.post("/api/accounting/journal-entries/:id/reverse", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return sendError(res, "\u064A\u062C\u0628 \u0643\u062A\u0627\u0628\u0629 \u0633\u0628\u0628 \u0639\u0643\u0633 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A \u0644\u0623\u063A\u0631\u0627\u0636 \u0627\u0644\u062A\u062F\u0642\u064A\u0642", null, 400);
    }
    const createdBy = req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A";
    const result = await JournalEngine.reverseJournalEntry(id, reason, createdBy);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0639\u0643\u0633 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error, 400);
  }
});
app.get("/api/accounting/audit-health", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const health = await JournalEngine.verifyAccountingIntegrity();
    sendResponse(res, health);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0641\u062D\u0635 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error);
  }
});
app.post("/api/currencies/revaluate", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { currencyCode, newExchangeRate, revaluationDate } = req.body;
    if (!currencyCode || !newExchangeRate) {
      return sendError(res, "\u0631\u0645\u0632 \u0627\u0644\u0639\u0645\u0644\u0629 \u0648\u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u062C\u062F\u064A\u062F \u0645\u0637\u0644\u0648\u0628\u0627\u0646", null, 400);
    }
    const dateToUse = revaluationDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const result = await AccountingRepository.revaluateForeignAccounts(
      currencyCode,
      parseFloat(newExchangeRate),
      dateToUse
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0639\u0645\u0644\u064A\u0629 \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0639\u0645\u0644\u0629", error, 400);
  }
});
app.get("/api/accounting/posting-rules", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const rules = await AccountingRepository.getPostingRules();
    sendResponse(res, rules);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error);
  }
});
app.post("/api/accounting/posting-rules", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { ruleCode, accountId } = req.body;
    if (!ruleCode || !accountId) {
      return sendError(res, "\u0631\u0645\u0632 \u0627\u0644\u0642\u0627\u0639\u062F\u0629 \u0648\u0645\u0639\u0631\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0637\u0644\u0648\u0628\u0627\u0646", null, 400);
    }
    const saved = await AccountingRepository.upsertPostingRule(ruleCode, accountId);
    sendResponse(res, { success: true, ...saved });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u062A\u0631\u062D\u064A\u0644", error);
  }
});
app.get("/api/settings", async (req, res) => {
  try {
    const existing = await db.select().from(settings);
    if (existing.length === 0) {
      const defaultSettings = {
        id: "global_settings",
        name: "\u0645\u0637\u0639\u0645 \u0648\u0645\u0642\u0647\u0649 \u0627\u0644\u0633\u062D\u0627\u0628",
        logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop",
        address: "\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0637\u0631\u064A\u0642 \u0627\u0644\u0645\u0644\u0643 \u0641\u0647\u062F",
        phone: "0501234567",
        taxNumber: "310234567800003",
        taxRate: "15",
        currency: "\u0631.\u0633",
        thermalPrinterWidth: "80mm"
      };
      await db.insert(settings).values(defaultSettings);
      return sendResponse(res, {
        ...defaultSettings,
        taxRate: parseFloat(defaultSettings.taxRate)
      });
    }
    const current = existing[0];
    sendResponse(res, {
      ...current,
      taxRate: parseFloat(current.taxRate || "15")
    });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631", error);
  }
});
app.post("/api/settings", authorize2(["manager"]), async (req, res) => {
  try {
    const s = req.body;
    const dbValue = {
      id: "global_settings",
      name: s.name,
      logo: s.logo || "",
      address: s.address || "",
      phone: s.phone || "",
      taxNumber: s.taxNumber || "",
      taxRate: (s.taxRate ?? 15).toString(),
      currency: s.currency || "\u0631.\u0633",
      thermalPrinterWidth: s.thermalPrinterWidth || "80mm"
    };
    const existing = await db.select().from(settings).where((0, import_drizzle_orm22.eq)(settings.id, "global_settings"));
    if (existing.length > 0) {
      await db.update(settings).set(dbValue).where((0, import_drizzle_orm22.eq)(settings.id, "global_settings"));
    } else {
      await db.insert(settings).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", error);
  }
});
app.get("/api/roles", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const allRoles = await db.select().from(roles);
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (r) => {
        const rps = await db.select({
          id: permissions.id,
          code: permissions.code,
          name: permissions.name,
          module: permissions.module,
          description: permissions.description
        }).from(rolePermissions).innerJoin(permissions, (0, import_drizzle_orm22.eq)(rolePermissions.permissionId, permissions.id)).where((0, import_drizzle_orm22.eq)(rolePermissions.roleId, r.id));
        return {
          ...r,
          permissions: rps
        };
      })
    );
    sendResponse(res, rolesWithPermissions);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", error);
  }
});
app.post("/api/roles", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const { id, name, code, description, permissionIds } = req.body;
    if (!name || !code) {
      return sendError(res, "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0631\u0645\u0632 \u0645\u0637\u0644\u0648\u0628\u0627\u0646 \u0644\u062A\u0633\u062C\u064A\u0644 \u062F\u0648\u0631 \u062C\u062F\u064A\u062F", null, 400);
    }
    const roleId = id || "role_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(roles).where((0, import_drizzle_orm22.eq)(roles.id, roleId));
    const dbValue = {
      id: roleId,
      name,
      code,
      description,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existing.length > 0) {
      await db.update(roles).set(dbValue).where((0, import_drizzle_orm22.eq)(roles.id, roleId));
    } else {
      await db.insert(roles).values(dbValue);
    }
    if (Array.isArray(permissionIds)) {
      await db.delete(rolePermissions).where((0, import_drizzle_orm22.eq)(rolePermissions.roleId, roleId));
      if (permissionIds.length > 0) {
        const rpsValues = permissionIds.map((pId, idx) => ({
          id: `rp_${roleId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          roleId,
          permissionId: pId
        }));
        await db.insert(rolePermissions).values(rpsValues);
      }
    }
    sendResponse(res, { id: roleId, name, code, description, permissionIds });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062F\u0648\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", error);
  }
});
app.delete("/api/roles/:id", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const { id } = req.params;
    if (["role_manager", "role_accountant", "role_inventory", "role_cashier"].includes(id)) {
      return sendError(res, "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0646\u0638\u0627\u0645\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0624\u0633\u0633\u0629", null, 400);
    }
    await db.delete(roles).where((0, import_drizzle_orm22.eq)(roles.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062F\u0648\u0631", error);
  }
});
app.get("/api/permissions", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const allPermissions = await db.select().from(permissions);
    sendResponse(res, allPermissions);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", error);
  }
});
app.get("/api/users", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const { page, limit, role } = req.query;
    const conditions = [];
    if (role) {
      conditions.push((0, import_drizzle_orm22.eq)(users.role, role));
    }
    const whereClause = conditions.length > 0 ? (0, import_drizzle_orm22.and)(...conditions) : void 0;
    let total = 0;
    if (page || limit) {
      const countResult = await db.select({ count: import_drizzle_orm22.sql`count(*)` }).from(users).where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }
    let query = db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      name: users.name,
      role: users.role,
      roleId: users.roleId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      roleCode: roles.code
    }).from(users).leftJoin(roles, (0, import_drizzle_orm22.eq)(users.roleId, roles.id));
    if (whereClause) {
      query = query.where(whereClause);
    }
    if (page && limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      query = query.limit(l).offset((p - 1) * l);
    }
    const allUsers = await query;
    if (page || limit) {
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 10;
      sendResponse(res, allUsers, 200, { page: p, limit: l, total });
    } else {
      sendResponse(res, allUsers);
    }
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646", error);
  }
});
app.post("/api/users", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const u = req.body;
    const errors = validateUser(u);
    if (errors.length > 0) {
      return sendError(res, "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", errors, 400);
    }
    const id = u.id || "user_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(users).where((0, import_drizzle_orm22.eq)(users.id, id));
    let finalRole = u.role || "cashier";
    if (u.roleId) {
      const [r] = await db.select().from(roles).where((0, import_drizzle_orm22.eq)(roles.id, u.roleId));
      if (r) {
        finalRole = r.code;
      }
    }
    const dbValue = {
      id,
      uid: u.uid || id,
      email: u.email,
      name: u.name,
      role: finalRole,
      roleId: u.roleId || null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (existing.length > 0) {
      await db.update(users).set(dbValue).where((0, import_drizzle_orm22.eq)(users.id, id));
    } else {
      await db.insert(users).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", error);
  }
});
app.delete("/api/users/:id", authorize2(["manager", "manage_users"]), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "001" || id === req.user.id) {
      return sendError(res, "\u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0623\u0648 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u0646\u0634\u0637 \u062D\u0627\u0644\u064A\u0627\u064B.", null, 400);
    }
    await db.delete(users).where((0, import_drizzle_orm22.eq)(users.id, id));
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", error);
  }
});
app.get("/api/cashboxes", async (req, res) => {
  try {
    const boxes = await db.select().from(cashboxes);
    const mapped = boxes.map((b) => ({
      ...b,
      currentBalance: parseFloat(b.currentBalance || "0")
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u0646\u0642\u062F\u064A\u0629", error);
  }
});
app.post("/api/cashboxes", authorize2(["manager"]), async (req, res) => {
  try {
    const box = req.body;
    if (!box.name || box.name.trim() === "") {
      return sendError(res, "\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u0645\u0637\u0644\u0648\u0628", null, 400);
    }
    const id = box.id || "cashbox_" + Math.random().toString(36).substr(2, 9);
    const existing = await db.select().from(cashboxes).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    const dbValue = {
      id,
      name: box.name,
      status: box.status || "closed",
      currentBalance: (box.currentBalance || 0).toString(),
      lastOpenedAt: box.lastOpenedAt || null,
      lastClosedAt: box.lastClosedAt || null
    };
    if (existing.length > 0) {
      await db.update(cashboxes).set(dbValue).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    } else {
      await db.insert(cashboxes).values(dbValue);
    }
    sendResponse(res, dbValue);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0646\u0642\u062F\u064A\u0629", error);
  }
});
app.post("/api/cashboxes/open", authorize2(["manager", "cashier"]), async (req, res) => {
  try {
    const { id, startBalance } = req.body;
    if (!id) return sendError(res, "\u0645\u0639\u0631\u0641 \u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u0645\u0637\u0644\u0648\u0628", null, 400);
    const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    if (!box) return sendError(res, "\u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", null, 404);
    const updated = {
      status: "open",
      currentBalance: (startBalance || 0).toString(),
      lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.update(cashboxes).set(updated).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0641\u062A\u062D \u0627\u0644\u0635\u0646\u062F\u0648\u0642", error);
  }
});
app.post("/api/cashboxes/close", authorize2(["manager", "cashier"]), async (req, res) => {
  try {
    const { id, endBalance } = req.body;
    if (!id) return sendError(res, "\u0645\u0639\u0631\u0641 \u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u0645\u0637\u0644\u0648\u0628", null, 400);
    const [box] = await db.select().from(cashboxes).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    if (!box) return sendError(res, "\u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", null, 404);
    const updated = {
      status: "closed",
      currentBalance: (endBalance || 0).toString(),
      lastClosedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.update(cashboxes).set(updated).where((0, import_drizzle_orm22.eq)(cashboxes.id, id));
    sendResponse(res, { success: true, box: { ...box, ...updated } });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0635\u0646\u062F\u0648\u0642", error);
  }
});
app.get("/api/treasury/cashboxes", async (req, res) => {
  try {
    const list = await TreasuryRepository.getCashboxes();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u062E\u0632\u064A\u0646\u0629", error);
  }
});
app.post("/api/treasury/cashboxes", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertCashbox(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u062E\u0632\u064A\u0646\u0629", error);
  }
});
app.delete("/api/treasury/cashboxes/:id", authorize2(["manager"]), async (req, res) => {
  try {
    await TreasuryRepository.deleteCashbox(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062E\u0632\u064A\u0646\u0629", error);
  }
});
app.get("/api/treasury/bank-accounts", async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankAccounts();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629", error);
  }
});
app.post("/api/treasury/bank-accounts", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const item = await TreasuryRepository.upsertBankAccount(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A", error);
  }
});
app.delete("/api/treasury/bank-accounts/:id", authorize2(["manager"]), async (req, res) => {
  try {
    await TreasuryRepository.deleteBankAccount(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A", error);
  }
});
app.get("/api/treasury/transactions", async (req, res) => {
  try {
    const type = req.query.type;
    const list = await TreasuryRepository.getTransactions(type);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0648\u0627\u0644\u0628\u0646\u0648\u0643", error);
  }
});
app.post("/api/treasury/deposits", authorize2(["manager", "accountant", "cashier"]), async (req, res) => {
  try {
    const result = await TreasuryRepository.createDeposit(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0625\u064A\u062F\u0627\u0639", error);
  }
});
app.post("/api/treasury/withdrawals", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const result = await TreasuryRepository.createWithdrawal(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0633\u062D\u0628/\u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.post("/api/treasury/transfers", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const result = await TreasuryRepository.createTransfer(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u0627\u0644\u064A", error);
  }
});
app.get("/api/treasury/reconciliations/:bankAccountId", async (req, res) => {
  try {
    const list = await TreasuryRepository.getBankReconciliations(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0644\u062A\u0633\u0648\u064A\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629", error);
  }
});
app.get("/api/treasury/unreconciled/:bankAccountId", async (req, res) => {
  try {
    const list = await TreasuryRepository.getUnreconciledTransactions(req.params.bankAccountId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0645\u0633\u0648\u0627\u0629", error);
  }
});
app.post("/api/treasury/reconcile", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const result = await TreasuryRepository.executeBankReconciliation(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0628\u0646\u0643\u064A\u0629", error);
  }
});
app.get("/api/expenses/categories", async (req, res) => {
  try {
    const list = await ExpenseRepository.getCategories();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0635\u0646\u064A\u0641\u0627\u062A \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", error);
  }
});
app.post("/api/expenses/categories", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const cat = await ExpenseRepository.upsertCategory(req.body);
    sendResponse(res, cat);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0641\u0638 \u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", error);
  }
});
app.delete("/api/expenses/categories/:id", authorize2(["manager"]), async (req, res) => {
  try {
    await ExpenseRepository.deleteCategory(req.params.id);
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062D\u0630\u0641 \u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", error);
  }
});
app.get("/api/expenses/requests", async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const list = await ExpenseRepository.getRequests(statusFilter);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", error);
  }
});
app.post("/api/expenses/requests", async (req, res) => {
  try {
    const item = await ExpenseRepository.createRequest(req.body);
    sendResponse(res, item);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.post("/api/expenses/requests/:id/approve", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const approvedBy = req.body.approvedBy || req.user?.name || "\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645";
    const result = await ExpenseRepository.approveRequest(req.params.id, approvedBy);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.post("/api/expenses/requests/:id/reject", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const reason = req.body.reason || "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628 \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629";
    const result = await ExpenseRepository.rejectRequest(req.params.id, reason);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0631\u0641\u0636 \u0637\u0644\u0628 \u0627\u0644\u0645\u0635\u0631\u0648\u0641", error);
  }
});
app.post("/api/expenses/requests/:id/pay", authorize2(["manager", "accountant", "cashier"]), async (req, res) => {
  try {
    const result = await ExpenseRepository.payExpense(req.params.id, req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0633\u062F\u0627\u062F \u0627\u0644\u0645\u0635\u0631\u0648\u0641 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error);
  }
});
app.get("/api/expenses/reports", async (req, res) => {
  try {
    const reports = await ExpenseRepository.getExpenseReports();
    sendResponse(res, reports);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A", error);
  }
});
app.get("/api/reports/sales", async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getSalesReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", error);
  }
});
app.get("/api/reports/purchases", async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getPurchaseReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A", error);
  }
});
app.get("/api/reports/inventory", async (req, res) => {
  try {
    const report = await ReportsRepository.getInventoryReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", error);
  }
});
app.get("/api/reports/customers", async (req, res) => {
  try {
    const report = await ReportsRepository.getCustomerReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", error);
  }
});
app.get("/api/reports/suppliers", async (req, res) => {
  try {
    const report = await ReportsRepository.getSupplierReport();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646", error);
  }
});
app.get("/api/reports/profit", async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const report = await ReportsRepository.getProfitReport(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0623\u0631\u0628\u0627\u062D \u0648\u0627\u0644\u062E\u0633\u0627\u0626\u0631", error);
  }
});
app.get("/api/reports/financial-statements", async (req, res) => {
  try {
    const filter = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      currency: req.query.currency
    };
    const report = await ReportsRepository.getFinancialStatements(filter);
    sendResponse(res, report);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629", error);
  }
});
app.get("/api/purchase-requests", async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchaseRequests();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621", error);
  }
});
app.post("/api/purchase-requests", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const result = await PurchaseRepository.createPurchaseRequest(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0627\u0644\u0634\u0631\u0627\u0621", error);
  }
});
app.post("/api/purchase-requests/:id/convert-order", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const result = await PurchaseRepository.convertRequestToOrder(req.params.id);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u062D\u0648\u064A\u0644 \u0637\u0644\u0628 \u0627\u0644\u0634\u0631\u0627\u0621 \u0625\u0644\u0649 \u0623\u0645\u0631 \u0634\u0631\u0627\u0621", error);
  }
});
app.get("/api/purchases", async (req, res) => {
  try {
    const list = await PurchaseRepository.findAllPurchases();
    sendResponse(res, list);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0623\u0648\u0627\u0645\u0631 \u0627\u0644\u0634\u0631\u0627\u0621", error);
  }
});
app.post("/api/purchases", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const { items, invoiceNumber, purchaseNumber } = req.body;
    if (!invoiceNumber && !purchaseNumber || !items || items.length === 0) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629", null, 400);
    }
    const result = await PurchaseRepository.createPurchaseOrder(req.body);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0641\u0627\u062A\u0648\u0631\u0629 \u0623\u0648 \u0623\u0645\u0631 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A", error);
  }
});
app.post("/api/purchases/:id/receive", authorize2(["manager", "inventory"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.receiveGoods(id, req.body || {});
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0628\u0636\u0627\u0626\u0639", error);
  }
});
app.post("/api/purchases/:id/invoice", authorize2(["manager", "accountant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.issueSupplierInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u0625\u0635\u062F\u0627\u0631 \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0645\u0648\u0631\u062F", error);
  }
});
app.post("/api/purchases/:id/return", authorize2(["manager", "accountant", "inventory"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PurchaseRepository.returnPurchaseInvoice(id, req.body || {});
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message || "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0645\u0631\u062A\u062C\u0639 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u062A\u0631\u062D\u064A\u0644 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A", error);
  }
});
app.get("/api/payments/customer", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = db.select().from(payments).where((0, import_drizzle_orm22.eq)(payments.type, "receipt"));
    if (customerId) {
      query = db.select().from(payments).where(
        (0, import_drizzle_orm22.and)(
          (0, import_drizzle_orm22.eq)(payments.type, "receipt"),
          (0, import_drizzle_orm22.eq)(payments.partyId, customerId)
        )
      );
    }
    const list = await query;
    const mapped = list.map((p) => ({
      id: p.id,
      receiptNumber: p.paymentNumber,
      customerId: p.partyId,
      amount: parseFloat(p.amount || "0"),
      paymentMethod: p.method,
      date: p.date,
      reference: p.reference || "",
      notes: p.notes || "",
      createdAt: p.createdAt
    }));
    sendResponse(res, mapped);
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062C\u0644\u0628 \u0633\u0646\u062F\u0627\u062A \u0627\u0644\u0642\u0628\u0636", error);
  }
});
app.post("/api/payments/customer", authorize2(["manager", "cashier", "accountant"]), async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, date, receiptNumber, reference, notes, invoiceId } = req.body;
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0633\u0646\u062F \u0627\u0644\u0642\u0628\u0636 \u063A\u064A\u0631 \u0643\u0627\u0645\u0644\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", null, 400);
    }
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) throw new Error("\u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    const num = receiptNumber || `RCPT-${Date.now().toString().slice(-6)}`;
    const pmtDate = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const pmtMethod = paymentMethod || "cash";
    await CustomerRepository.adjustBalance(customerId, -amount);
    await db.insert(payments).values({
      id: "pay_" + Math.random().toString(36).substr(2, 9),
      companyId: customer.companyId || "company_default",
      branchId: customer.branchId || "branch_default",
      paymentNumber: num,
      date: pmtDate,
      type: "receipt",
      partyId: customerId,
      partyType: "customer",
      amount: amount.toString(),
      method: pmtMethod,
      reference: reference || invoiceId || "",
      notes: notes || `\u0633\u0646\u062F \u0642\u0628\u0636 \u0645\u0646 \u0627\u0644\u0639\u0645\u064A\u0644: ${customer.name}`
    });
    const cashAcc = await getAccountByRule("payment_customer_debit_cash", "acc_cash");
    const bankAcc = await getAccountByRule("payment_customer_debit_bank", "acc_bank");
    const custCreditAcc = await getAccountByRule("payment_customer_credit", "acc_receivable");
    const accountingLines = [];
    if (pmtMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: amount, credit: 0 });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: amount, credit: 0 });
    }
    accountingLines.push({ accountId: custCreditAcc, debit: 0, credit: amount });
    await postJournalEntry(
      `JE-RCPT-${num}`,
      `\u0633\u0646\u062F \u0642\u0628\u0636 \u0639\u0645\u064A\u0644: ${customer.name} - ${num}`,
      pmtDate,
      accountingLines
    );
    sendResponse(res, { success: true, receiptNumber: num, customerName: customer.name });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0633\u0646\u062F \u0627\u0644\u0642\u0628\u0636", error);
  }
});
app.post("/api/payments/supplier", authorize2(["manager", "inventory", "accountant"]), async (req, res) => {
  try {
    const { supplierId, amount, paymentMethod, date, paymentNumber, currency, exchangeRate } = req.body;
    if (!supplierId || !amount || parseFloat(amount) <= 0) {
      return sendError(res, "\u0628\u064A\u0627\u0646\u0627\u062A \u0633\u0646\u062F \u0627\u0644\u0635\u0631\u0641 \u063A\u064A\u0631 \u0643\u0627\u0645\u0644\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629", null, 400);
    }
    const supplier = await SupplierRepository.findById(supplierId);
    if (!supplier) throw new Error("\u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    await SupplierRepository.adjustBalance(supplierId, -amount);
    const payDebAcc = await getAccountByRule("payment_supplier_debit", "acc_payable");
    const cashAcc = await getAccountByRule("payment_supplier_credit_cash", "acc_cash");
    const bankAcc = await getAccountByRule("payment_supplier_credit_bank", "acc_bank");
    const accountingLines = [];
    accountingLines.push({ accountId: payDebAcc, debit: amount, credit: 0 });
    if (paymentMethod === "cash") {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: amount });
    } else {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: amount });
    }
    await postJournalEntry(
      `JE-PAY-${paymentNumber}`,
      `\u0633\u0646\u062F \u0635\u0631\u0641 \u0645\u0648\u0631\u062F: ${supplier.name}`,
      date,
      accountingLines,
      {
        currency: currency || "SAR",
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1
      }
    );
    sendResponse(res, { success: true });
  } catch (error) {
    sendError(res, "\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0633\u0646\u062F \u0627\u0644\u0635\u0631\u0641", error);
  }
});
async function seedDefaultData() {
  try {
    await ensureDatabaseTables();
    const existingCompanies = await db.select().from(companies);
    if (existingCompanies.length === 0) {
      console.log("Seeding default Company...");
      await db.insert(companies).values({
        id: "company-1",
        name: "\u0627\u0644\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
        taxNumber: "300000000000003",
        email: "info@company.com",
        phone: "0110000000",
        address: "\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"
      });
    }
    const existingBranches = await db.select().from(branches);
    if (existingBranches.length === 0) {
      console.log("Seeding default Branch...");
      await db.insert(branches).values({
        id: "branch-1",
        companyId: "company-1",
        name: "\u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
        code: "BR-MAIN",
        address: "\u0627\u0644\u0631\u064A\u0627\u0636"
      });
    }
    const existingAccounts = await db.select().from(accounts);
    if (existingAccounts.length === 0) {
      console.log("Seeding default Chart of Accounts...");
      const defaultAccounts = [
        { id: "acc_cash", code: "1101", name: "\u0627\u0644\u0646\u0642\u062F\u064A\u0629 \u0628\u0627\u0644\u0635\u0646\u062F\u0648\u0642 (Cash)", type: "asset", balance: "0" },
        { id: "acc_bank", code: "1102", name: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643\u064A (Bank)", type: "asset", balance: "0" },
        { id: "acc_receivable", code: "1103", name: "\u0627\u0644\u0630\u0645\u0645 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0644\u0644\u0639\u0645\u0644\u0627\u0621 (Receivables)", type: "asset", balance: "0" },
        { id: "acc_inventory", code: "1201", name: "\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0628\u0636\u0627\u0626\u0639 (Inventory)", type: "asset", balance: "0" },
        { id: "acc_payable", code: "2101", name: "\u0627\u0644\u0630\u0645\u0645 \u0627\u0644\u062F\u0627\u0626\u0646\u0629 \u0644\u0644\u0645\u0648\u0631\u062F\u064A\u0646 (Payables)", type: "liability", balance: "0" },
        { id: "acc_tax", code: "2201", name: "\u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0629 (VAT)", type: "liability", balance: "0" },
        { id: "acc_equity", code: "3101", name: "\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 (Capital)", type: "equity", balance: "0" },
        { id: "acc_sales", code: "4101", name: "\u0625\u064A\u0631\u0627\u062F \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A (Sales Revenue)", type: "revenue", balance: "0" },
        { id: "acc_forex_gain", code: "4201", name: "\u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u0627\u0644\u0639\u0645\u0644\u0629 (Gain on FX)", type: "revenue", balance: "0" },
        { id: "acc_cogs", code: "5101", name: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629 (COGS)", type: "expense", balance: "0" },
        { id: "acc_expense", code: "5201", name: "\u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0639\u0645\u0648\u0645\u064A\u0629 \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 (Expenses)", type: "expense", balance: "0" },
        { id: "acc_forex_loss", code: "5202", name: "\u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u0627\u0644\u0639\u0645\u0644\u0629 (Loss on FX)", type: "expense", balance: "0" }
      ];
      await db.insert(accounts).values(defaultAccounts);
      console.log("Chart of Accounts seeded successfully.");
    }
    const existingSuppliers = await db.select().from(suppliers);
    if (existingSuppliers.length === 0) {
      console.log("Seeding default Suppliers...");
      const defaultSuppliers = [
        { id: "supp-1", name: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0645\u0631\u0627\u0639\u064A \u0627\u0644\u0648\u0637\u0646\u064A\u0629", phone: "0114944444", email: "info@almarai.com", balance: "0" },
        { id: "supp-2", name: "\u0634\u0631\u0643\u0629 \u0644\u0648\u0632\u064A\u0646 \u0644\u0644\u0645\u062E\u0628\u0648\u0632\u0627\u062A", phone: "0112345678", email: "sales@lusine.com", balance: "0" },
        { id: "supp-3", name: "\u0645\u0648\u0632\u0639 \u062D\u0644\u0648\u064A\u0627\u062A \u0627\u0644\u062E\u0644\u064A\u062C", phone: "0501112223", email: "dist@gulfsweets.com", balance: "0" }
      ];
      await db.insert(suppliers).values(defaultSuppliers);
    }
    const existingUnits = await db.select().from(units);
    if (existingUnits.length === 0) {
      console.log("Seeding default Units...");
      const defaultUnits = [
        { id: "1", name: "\u062D\u0628\u0629" },
        { id: "2", name: "\u0643\u064A\u0644\u0648" },
        { id: "3", name: "\u0643\u0631\u062A\u0648\u0646" },
        { id: "4", name: "\u0644\u062A\u0631" },
        { id: "5", name: "\u0634\u062F\u0629" },
        { id: "6", name: "\u062C\u0631\u0627\u0645" }
      ];
      await db.insert(units).values(defaultUnits);
    }
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log("Seeding default Categories...");
      const defaultCategories = [
        { id: "cat-1", name: "\u0627\u0644\u0645\u0639\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u0623\u063A\u0630\u064A\u0629", icon: "\u{1F96B}" },
        { id: "cat-2", name: "\u0627\u0644\u0645\u062E\u0628\u0648\u0632\u0627\u062A \u0648\u0627\u0644\u062D\u0644\u0648\u064A\u0627\u062A", icon: "\u{1F35E}" },
        { id: "cat-3", name: "\u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u0644\u0639\u0635\u0627\u0626\u0631", icon: "\u{1F964}" },
        { id: "cat-4", name: "\u0627\u0644\u0623\u0644\u0628\u0627\u0646 \u0648\u0627\u0644\u0623\u062C\u0628\u0627\u0646", icon: "\u{1F9C0}" },
        { id: "cat-5", name: "\u0627\u0644\u062E\u0636\u0631\u0648\u0627\u062A \u0648\u0627\u0644\u0641\u0648\u0627\u0643\u0647", icon: "\u{1F34E}" }
      ];
      await db.insert(categories).values(defaultCategories);
    }
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      console.log("Seeding default ERP Roles...");
      const defaultRoles = [
        { id: "role_manager", name: "\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645", code: "manager", description: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0643\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u0643\u0627\u0641\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646" },
        { id: "role_accountant", name: "\u0627\u0644\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0645\u0627\u0644\u064A", code: "accountant", description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0642\u064A\u0648\u062F \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629" },
        { id: "role_inventory", name: "\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639", code: "inventory", description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A\u060C \u0627\u0644\u0643\u0645\u064A\u0627\u062A\u060C \u0627\u0644\u062A\u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0646\u064A\u0629 \u0648\u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A" },
        { id: "role_cashier", name: "\u0645\u0648\u0638\u0641 \u0627\u0644\u0643\u0627\u0634\u064A\u0631", code: "cashier", description: "\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u0625\u0635\u062F\u0627\u0631 \u0641\u0648\u0627\u062A\u064A\u0631 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064A\u0639 \u0627\u0644\u0633\u0631\u064A\u0639\u0629" }
      ];
      await db.insert(roles).values(defaultRoles);
    }
    const existingPermissions = await db.select().from(permissions);
    if (existingPermissions.length === 0) {
      console.log("Seeding default ERP Permissions...");
      const defaultPermissions = [
        { id: "p_view_dashboard", name: "\u0639\u0631\u0636 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645", code: "view_dashboard", module: "dashboard", description: "\u0639\u0631\u0636 \u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u0645\u0624\u0633\u0633\u0629" },
        { id: "p_pos_access", name: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064A\u0639", code: "pos_access", module: "sales", description: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0643\u0627\u0634\u064A\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064A\u0639" },
        { id: "p_manage_inventory", name: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0632\u0646", code: "manage_inventory", module: "inventory", description: "\u0625\u0636\u0627\u0641\u0629 \u0648\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0631\u0643\u0627\u062A" },
        { id: "p_view_invoices", name: "\u0639\u0631\u0636 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u0636\u0631\u0627\u0626\u0628", code: "view_invoices", module: "sales", description: "\u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629" },
        { id: "p_view_reports", name: "\u0639\u0631\u0636 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u0644\u0623\u0631\u0628\u0627\u062D", code: "view_reports", module: "dashboard", description: "\u0639\u0631\u0636 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A\u0629 \u0648\u062D\u0633\u0627\u0628 \u0627\u0644\u0623\u0631\u0628\u0627\u0626\u0631 \u0648\u0627\u0644\u062E\u0633\u0627\u0626\u0631" },
        { id: "p_view_purchases", name: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062F\u0641\u0648\u0639\u0627\u062A", code: "view_purchases", module: "purchases", description: "\u0625\u062F\u0627\u0631\u0629 \u0641\u0648\u0627\u062A\u064A\u0631 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646" },
        { id: "p_view_accounting", name: "\u0627\u0644\u0642\u064A\u0648\u062F \u0648\u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629", code: "view_accounting", module: "accounting", description: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062F\u0641\u0627\u062A\u0631 \u0627\u0644\u0645\u062D\u0627\u0633\u0628\u064A\u0629 \u0648\u0634\u062C\u0631\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0642\u064A\u0648\u062F \u0627\u0644\u064A\u0648\u0645\u064A\u0629" },
        { id: "p_view_settings", name: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u0629", code: "view_settings", module: "settings", description: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0636\u0631\u064A\u0628\u0629 \u0648\u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u064A\u0629" },
        { id: "p_manage_users", name: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A", code: "manage_users", module: "users", description: "\u0625\u062F\u0627\u0631\u0629 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0623\u062F\u0648\u0627\u0631\u0647\u0645 \u0648\u0635\u0644\u0627\u062D\u064A\u0627\u062A\u0647\u0645" }
      ];
      await db.insert(permissions).values(defaultPermissions);
    }
    const existingRolePerms = await db.select().from(rolePermissions);
    if (existingRolePerms.length === 0) {
      console.log("Seeding default Role Permissions...");
      const defaultRolePerms = [
        // Manager gets everything
        { id: "rp1", roleId: "role_manager", permissionId: "p_view_dashboard" },
        { id: "rp2", roleId: "role_manager", permissionId: "p_pos_access" },
        { id: "rp3", roleId: "role_manager", permissionId: "p_manage_inventory" },
        { id: "rp4", roleId: "role_manager", permissionId: "p_view_invoices" },
        { id: "rp5", roleId: "role_manager", permissionId: "p_view_reports" },
        { id: "rp6", roleId: "role_manager", permissionId: "p_view_purchases" },
        { id: "rp7", roleId: "role_manager", permissionId: "p_view_accounting" },
        { id: "rp8", roleId: "role_manager", permissionId: "p_view_settings" },
        { id: "rp9", roleId: "role_manager", permissionId: "p_manage_users" },
        // Accountant
        { id: "rp10", roleId: "role_accountant", permissionId: "p_view_dashboard" },
        { id: "rp11", roleId: "role_accountant", permissionId: "p_pos_access" },
        { id: "rp12", roleId: "role_accountant", permissionId: "p_view_invoices" },
        { id: "rp13", roleId: "role_accountant", permissionId: "p_view_reports" },
        { id: "rp14", roleId: "role_accountant", permissionId: "p_view_purchases" },
        { id: "rp15", roleId: "role_accountant", permissionId: "p_view_accounting" },
        // Inventory
        { id: "rp16", roleId: "role_inventory", permissionId: "p_view_dashboard" },
        { id: "rp17", roleId: "role_inventory", permissionId: "p_manage_inventory" },
        { id: "rp18", roleId: "role_inventory", permissionId: "p_view_purchases" },
        // Cashier
        { id: "rp19", roleId: "role_cashier", permissionId: "p_pos_access" },
        { id: "rp20", roleId: "role_cashier", permissionId: "p_view_invoices" }
      ];
      await db.insert(rolePermissions).values(defaultRolePerms);
    }
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Seeding default ERP Users with Role IDs...");
      const defaultUsers = [
        { id: "001", uid: "001", email: "manager@system.com", name: "\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646 (\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645)", role: "manager", roleId: "role_manager" },
        { id: "002", uid: "002", email: "accountant@system.com", name: "\u064A\u0627\u0633\u0631 (\u0627\u0644\u0645\u062D\u0627\u0633\u0628 \u0627\u0644\u0645\u0627\u0644\u064A)", role: "accountant", roleId: "role_accountant" },
        { id: "003", uid: "003", email: "inventory@system.com", name: "\u0623\u0646\u0633 (\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639)", role: "inventory", roleId: "role_inventory" },
        { id: "004", uid: "004", email: "cashier@system.com", name: "\u0623\u062D\u0645\u062F (\u0645\u0648\u0638\u0641 \u0627\u0644\u0643\u0627\u0634\u064A\u0631)", role: "cashier", roleId: "role_cashier" }
      ];
      await db.insert(users).values(defaultUsers);
      console.log("ERP Users seeded successfully.");
    } else {
      for (const u of existingUsers) {
        if (!u.roleId) {
          let roleId = "role_cashier";
          if (u.role === "manager") roleId = "role_manager";
          else if (u.role === "accountant") roleId = "role_accountant";
          else if (u.role === "inventory") roleId = "role_inventory";
          await db.update(users).set({ roleId }).where((0, import_drizzle_orm22.eq)(users.id, u.id));
        }
      }
    }
    const existingBoxes = await db.select().from(cashboxes);
    if (existingBoxes.length === 0) {
      console.log("Seeding default Cashboxes...");
      const defaultBoxes = [
        { id: "box_main", name: "\u0627\u0644\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0631\u0626\u064A\u0633\u064A (\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u064A\u0648\u0645\u064A\u0629)", status: "closed", currentBalance: "0" },
        { id: "box_spare", name: "\u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A", status: "closed", currentBalance: "0" }
      ];
      await db.insert(cashboxes).values(defaultBoxes);
    }
    const existingRules = await db.select().from(postingRules);
    if (existingRules.length === 0) {
      console.log("Seeding default Posting Rules...");
      const defaultRules2 = [
        { id: "pr_s_cash", ruleCode: "sales_cash_debit", accountId: "acc_cash", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0646\u0642\u062F\u064A\u0629 (\u0627\u0644\u0635\u0646\u062F\u0648\u0642)" },
        { id: "pr_s_bank", ruleCode: "sales_bank_debit", accountId: "acc_bank", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629 (\u0627\u0644\u0634\u0628\u0643\u0629)" },
        { id: "pr_s_credit", ruleCode: "sales_credit_debit", accountId: "acc_receivable", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0622\u062C\u0644\u0629 (\u0627\u0644\u0639\u0645\u0644\u0627\u0621)" },
        { id: "pr_s_rev", ruleCode: "sales_revenue_credit", accountId: "acc_sales", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A" },
        { id: "pr_s_tax", ruleCode: "sales_tax_credit", accountId: "acc_tax", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0636\u0631\u064A\u0628\u0629 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u062D\u062A\u0633\u0628\u0629" },
        { id: "pr_s_cogs", ruleCode: "sales_cogs_debit", accountId: "acc_cogs", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u0645\u0628\u0627\u0639\u0629" },
        { id: "pr_s_inv", ruleCode: "sales_inventory_credit", accountId: "acc_inventory", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 (\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A)" },
        { id: "pr_p_cash", ruleCode: "purchase_cash_credit", accountId: "acc_cash", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u0646\u0642\u062F\u064A\u0629 (\u0627\u0644\u0635\u0646\u062F\u0648\u0642)" },
        { id: "pr_p_bank", ruleCode: "purchase_bank_credit", accountId: "acc_bank", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u0628\u0646\u0643\u064A\u0629 (\u0627\u0644\u0634\u0628\u0643\u0629)" },
        { id: "pr_p_credit", ruleCode: "purchase_credit_credit", accountId: "acc_payable", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0627\u0644\u0622\u062C\u0644\u0629 (\u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646)" },
        { id: "pr_p_inv", ruleCode: "purchase_inventory_debit", accountId: "acc_inventory", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 (\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A)" },
        { id: "pr_p_tax", ruleCode: "purchase_tax_debit", accountId: "acc_tax", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0636\u0631\u064A\u0628\u0629 \u0645\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A" },
        { id: "pr_e_deb", ruleCode: "expense_debit", accountId: "acc_expense", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629" },
        { id: "pr_e_cred", ruleCode: "expense_credit", accountId: "acc_cash", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0633\u062F\u0627\u062F \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 (\u0627\u0644\u0635\u0646\u062F\u0648\u0642)" },
        { id: "pr_pm_c_deb_cash", ruleCode: "payment_customer_debit_cash", accountId: "acc_cash", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0633\u0646\u062F\u0627\u062A \u0627\u0644\u0642\u0628\u0636 \u0646\u0642\u062F\u064B\u0627 (\u0627\u0644\u0635\u0646\u062F\u0648\u0642)" },
        { id: "pr_pm_c_deb_bank", ruleCode: "payment_customer_debit_bank", accountId: "acc_bank", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u0633\u0646\u062F\u0627\u062A \u0627\u0644\u0642\u0628\u0636 \u0628\u0646\u0643\u064B\u0627 (\u0627\u0644\u0634\u0628\u0643\u0629)" },
        { id: "pr_pm_c_cred", ruleCode: "payment_customer_credit", accountId: "acc_receivable", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u062A\u0633\u0648\u064A\u0629 \u0639\u0645\u064A\u0644 (\u0633\u0646\u062F \u0642\u0628\u0636)" },
        { id: "pr_pm_s_deb", ruleCode: "payment_supplier_debit", accountId: "acc_payable", description: "\u062D\u0633\u0627\u0628 \u0645\u062F\u064A\u0646 \u062A\u0633\u0648\u064A\u0629 \u0645\u0648\u0631\u062F (\u0633\u0646\u062F \u0635\u0631\u0641)" },
        { id: "pr_pm_s_cred_cash", ruleCode: "payment_supplier_credit_cash", accountId: "acc_cash", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0633\u0646\u062F\u0627\u062A \u0627\u0644\u0635\u0631\u0641 \u0646\u0642\u062F\u064B\u0627 (\u0627\u0644\u0635\u0646\u062F\u0648\u0642)" },
        { id: "pr_pm_s_cred_bank", ruleCode: "payment_supplier_credit_bank", accountId: "acc_bank", description: "\u062D\u0633\u0627\u0628 \u062F\u0627\u0626\u0646 \u0633\u0646\u062F\u0627\u062A \u0627\u0644\u0635\u0631\u0641 \u0628\u0646\u0643\u064B\u0627 (\u0627\u0644\u0634\u0628\u0643\u0629)" },
        { id: "pr_forex_gain", ruleCode: "forex_gain_credit", accountId: "acc_forex_gain", description: "\u062D\u0633\u0627\u0628 \u0623\u0631\u0628\u0627\u062D \u0641\u0631\u0648\u0642 \u062A\u0633\u0639\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u062A" },
        { id: "pr_forex_loss", ruleCode: "forex_loss_debit", accountId: "acc_forex_loss", description: "\u062D\u0633\u0627\u0628 \u062E\u0633\u0627\u0626\u0631 \u0641\u0631\u0648\u0642 \u062A\u0633\u0639\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u062A" }
      ];
      await db.insert(postingRules).values(defaultRules2);
      console.log("Posting Rules seeded successfully.");
    }
    const existingCurrencies = await db.select().from(currencies);
    if (existingCurrencies.length === 0) {
      console.log("Seeding default Currencies (SAR, USD, SYP, TRY)...");
      for (const curr of DEFAULT_CURRENCIES) {
        await db.insert(currencies).values({
          id: curr.id,
          code: curr.code,
          name: curr.name,
          symbol: curr.symbol,
          exchangeRate: curr.exchangeRate.toString(),
          isDefault: curr.isDefault ? "true" : "false"
        });
      }
      console.log("Default Currencies seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding database default data:", error);
  }
}
app.use(errorHandler);
async function startServer() {
  try {
    await ensureDatabaseTables();
    await seedDefaultData();
  } catch (err) {
    console.error("Error during database table check / seedDefaultData initialization:", err);
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express17.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
