import { db, createPool } from './index.ts';
import { sql } from 'drizzle-orm';

async function execSql(query: ReturnType<typeof sql>, name: string) {
  try {
    await db.execute(query);
  } catch (err: any) {
    try {
      await db.execute(sql`ROLLBACK`);
    } catch (_) {}
  }
}

export async function withAutoMigration<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[AutoMigration] Query failed due to missing schema or relation, executing self-healing migration...', err);
    try {
      await db.execute(sql`ROLLBACK`);
    } catch (_) {}
    await ensureDatabaseTables(true);
    try {
      await db.execute(sql`ROLLBACK`);
    } catch (_) {}
    return await fn();
  }
}

let isSchemaEnsured = false;
let ddlSupported: boolean | null = null;

export async function ensureDatabaseTables(force = false) {
  if (force) {
    isSchemaEnsured = false;
    ddlSupported = null;
  }
  if (isSchemaEnsured) {
    return;
  }
  console.log('Ensuring all database tables and schema migrations exist...');

  const testPool = createPool();
  try {
    const client = await testPool.connect();
    try {
      await client.query("CREATE TABLE IF NOT EXISTS _ddl_test (id INT)");
      await client.query("DROP TABLE IF EXISTS _ddl_test");
      ddlSupported = true;
    } finally {
      client.release(true); // destroy client so no aborted state lingers
    }
  } catch (err: any) {
    console.log('[Schema Migration] DDL test check failed, proceeding to attempt table DDLs directly:', err?.message || err);
  } finally {
    await testPool.end().catch(() => {});
  }

  // 1. Companies
  await execSql(sql`
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
  `, 'companies');

  // 2. Branches
  await execSql(sql`
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
  `, 'branches');

  // 3. Roles
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, 'roles');

  // 4. Permissions
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      module TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, 'permissions');

  // 5. Role Permissions
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL
    );
  `, 'role_permissions');

  // 6. Users
  await execSql(sql`
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
  `, 'users');

  // 6.1 User Sessions
  await execSql(sql`
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
  `, 'user_sessions');

  // 7. Categories
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, 'categories');

  // 8. Units
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `, 'units');

  // 9. Customers
  await execSql(sql`
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
  `, 'customers');

  // 10. Suppliers
  await execSql(sql`
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
  `, 'suppliers');

  // 11. Products
  await execSql(sql`
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
  `, 'products');

  // 12. Warehouses
  await execSql(sql`
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
  `, 'warehouses');

  // 13. Stock Moves
  await execSql(sql`
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
  `, 'stock_moves');

  // 14. Invoices
  await execSql(sql`
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
  `, 'invoices');

  await execSql(sql`
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
  `, 'invoices_status_check_update');

  // 15. Invoice Items
  await execSql(sql`
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
  `, 'invoice_items');

  // 16. Sales
  await execSql(sql`
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
  `, 'sales');

  // 17. Sales Items
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS sales_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL
    );
  `, 'sales_items');

  // 18. Purchases
  await execSql(sql`
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
  `, 'purchases');

  await execSql(sql`
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
  `, 'purchases_status_check_update');

  // 19. Purchase Items
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      purchase_price NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      tax_amount NUMERIC NOT NULL
    );
  `, 'purchase_items');

  // 20. Accounts
  await execSql(sql`
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
  `, 'accounts');

  // Ensure columns on accounts
  await execSql(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS foreign_balance NUMERIC DEFAULT '0';`, 'accounts_col_foreign_balance');
  await execSql(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';`, 'accounts_col_currency');
  await execSql(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_id TEXT;`, 'accounts_col_parent_id');
  await execSql(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`, 'accounts_col_is_active');

  // 21. Journal Entries
  await execSql(sql`
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
  `, 'journal_entries');

  // 22. Journal Details
  await execSql(sql`
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
  `, 'journal_details');

  // 23. Journal Lines
  await execSql(sql`
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
  `, 'journal_lines');

  // 24. Payments
  await execSql(sql`
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
  `, 'payments');

  // 25. Expenses
  await execSql(sql`
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
  `, 'expenses');

  // 26. Settings
  await execSql(sql`
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
  `, 'settings');

  // 27. Cashboxes
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS cashboxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'closed',
      current_balance NUMERIC DEFAULT '0',
      last_opened_at TEXT,
      last_closed_at TEXT
    );
  `, 'cashboxes');

  // 28. Posting Rules
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS posting_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT NOT NULL UNIQUE,
      account_id TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `, 'posting_rules');

  // 29. Currencies
  await execSql(sql`
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
  `, 'currencies');

  // 30. Exchange Rates History
  await execSql(sql`
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
  `, 'exchange_rates_history');

  // 31. Taxes
  await execSql(sql`
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
  `, 'taxes');

  // 32. Payment Methods
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      account_id TEXT,
      company_id TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `, 'payment_methods');

  // 33. Exchange Rates
  await execSql(sql`
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
  `, 'exchange_rates');

  // 34. Sales Invoices
  await execSql(sql`
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
  `, 'sales_invoices');

  // 35. Purchase Invoices
  await execSql(sql`
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
  `, 'purchase_invoices');

  // 36. Audit Logs
  await execSql(sql`
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
  `, 'audit_logs');

  // 37. Quotations
  await execSql(sql`
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
  `, 'quotations');

  // 38. Quotation Items
  await execSql(sql`
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
  `, 'quotation_items');

  // 39. Sales Orders
  await execSql(sql`
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
  `, 'sales_orders');

  // 40. Sales Order Items
  await execSql(sql`
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
  `, 'sales_order_items');

  // 41. Purchase Requests
  await execSql(sql`
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
  `, 'purchase_requests');

  // 42. Purchase Request Items
  await execSql(sql`
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
  `, 'purchase_request_items');

  // 43. Bank Accounts
  await execSql(sql`
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
  `, 'bank_accounts');

  // 44. Treasury Transactions
  await execSql(sql`
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
  `, 'treasury_transactions');

  // 45. Bank Reconciliations
  await execSql(sql`
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
  `, 'bank_reconciliations');

  // 46. Expense Categories
  await execSql(sql`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      account_id TEXT,
      budget NUMERIC DEFAULT '0',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `, 'expense_categories');

  // 47. Expense Requests
  await execSql(sql`
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
  `, 'expense_requests');

  // Enterprise ERP Normalization & Migration Phase: Audit Fields, Soft Deletes, Multi-Tenant & Multi-Currency Support
  console.log('Running self-healing Enterprise ERP database schema migration...');
  const erpTables = [
    'companies', 'branches', 'roles', 'permissions', 'role_permissions', 'users',
    'categories', 'units', 'customers', 'suppliers', 'products', 'warehouses',
    'stock_moves', 'invoices', 'invoice_items', 'sales', 'sales_items', 'purchases',
    'purchase_items', 'accounts', 'journal_entries', 'journal_details', 'journal_lines',
    'payments', 'expenses', 'settings', 'cashboxes', 'posting_rules', 'currencies',
    'exchange_rates_history', 'taxes', 'payment_methods', 'exchange_rates',
    'sales_invoices', 'purchase_invoices', 'audit_logs', 'quotations', 'quotation_items',
    'sales_orders', 'sales_order_items', 'purchase_requests', 'purchase_request_items',
    'bank_accounts', 'treasury_transactions', 'bank_reconciliations',
    'expense_categories', 'expense_requests'
  ];

  for (const tbl of erpTables) {
    const isSpecial = ['companies', 'roles', 'permissions', 'units', 'settings'].includes(tbl);
    
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

    if (tbl === 'users') {
      alterSql += `, ADD COLUMN IF NOT EXISTS role_id TEXT`;
    }

    await execSql(sql.raw(alterSql), `${tbl}_columns`);

    if (!isSpecial) {
      await execSql(sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_company_id ON ${tbl}(company_id);`), `${tbl}_idx_company_id`);
      await execSql(sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_branch_id ON ${tbl}(branch_id);`), `${tbl}_idx_branch_id`);
    }

    await execSql(sql.raw(`CREATE INDEX IF NOT EXISTS idx_${tbl}_is_deleted ON ${tbl}(is_deleted);`), `${tbl}_idx_is_deleted`);
  }

  // Multi-currency column additions for transactions
  const multiCurrencyTables = [
    'invoices', 'sales', 'sales_invoices', 'purchases', 'purchase_invoices',
    'quotations', 'sales_orders', 'purchase_requests', 'payments', 'expenses',
    'journal_entries', 'journal_details', 'journal_lines', 'customers', 'suppliers',
    'bank_accounts', 'treasury_transactions', 'expense_requests'
  ];
  for (const tbl of multiCurrencyTables) {
    await execSql(sql.raw(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';`), `${tbl}_currency`);
    await execSql(sql.raw(`ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT '1.0';`), `${tbl}_exchange_rate`);
  }

  isSchemaEnsured = true;
  console.log('Database tables ensured successfully.');
}
