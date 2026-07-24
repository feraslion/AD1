import { db } from './index.ts';
import { sql } from 'drizzle-orm';

export async function ensureDatabaseTables() {
  try {
    console.log('Ensuring all database tables and schema migrations exist...');

    // 1. Companies
    await db.execute(sql`
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
    `);

    // 2. Branches
    await db.execute(sql`
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
    `);

    // 3. Roles
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Permissions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        module TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Role Permissions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id TEXT PRIMARY KEY,
        role_id TEXT NOT NULL,
        permission_id TEXT NOT NULL
      );
    `);

    // 6. Users
    await db.execute(sql`
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
    `);

    // 7. Categories
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        company_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Units
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);

    // 9. Customers
    await db.execute(sql`
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
    `);

    // 10. Suppliers
    await db.execute(sql`
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
    `);

    // 11. Products
    await db.execute(sql`
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
    `);

    // 12. Warehouses
    await db.execute(sql`
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
    `);

    // 13. Stock Moves
    await db.execute(sql`
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
    `);

    // 14. Invoices
    await db.execute(sql`
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
    `);

    // 15. Invoice Items
    await db.execute(sql`
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
    `);

    // 16. Sales
    await db.execute(sql`
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
    `);

    // 17. Sales Items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        tax_amount NUMERIC NOT NULL
      );
    `);

    // 18. Purchases
    await db.execute(sql`
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
    `);

    // 19. Purchase Items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY,
        purchase_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        purchase_price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        tax_amount NUMERIC NOT NULL
      );
    `);

    // 20. Accounts
    await db.execute(sql`
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
    `);

    // Ensure columns on accounts
    await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS foreign_balance NUMERIC DEFAULT '0';`);
    await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';`);
    await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_id TEXT;`);
    await db.execute(sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);

    // 21. Journal Entries
    await db.execute(sql`
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
    `);

    // 22. Journal Details
    await db.execute(sql`
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
    `);

    // 23. Journal Lines
    await db.execute(sql`
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
    `);

    // 24. Payments
    await db.execute(sql`
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
    `);

    // 25. Expenses
    await db.execute(sql`
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
    `);

    // 26. Settings
    await db.execute(sql`
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
    `);

    // 27. Cashboxes
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cashboxes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'closed',
        current_balance NUMERIC DEFAULT '0',
        last_opened_at TEXT,
        last_closed_at TEXT
      );
    `);

    // 28. Posting Rules
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posting_rules (
        id TEXT PRIMARY KEY,
        rule_code TEXT NOT NULL UNIQUE,
        account_id TEXT NOT NULL,
        description TEXT NOT NULL
      );
    `);

    // 29. Currencies
    await db.execute(sql`
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
    `);

    // 30. Exchange Rates History
    await db.execute(sql`
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
    `);

    // 31. Taxes
    await db.execute(sql`
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
    `);

    // 32. Payment Methods
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        account_id TEXT,
        company_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 33. Exchange Rates
    await db.execute(sql`
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
    `);

    // 34. Sales Invoices
    await db.execute(sql`
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
    `);

    // 35. Purchase Invoices
    await db.execute(sql`
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
    `);

    // 36. Audit Logs
    await db.execute(sql`
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
    `);

    // 37. Quotations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quotation_number TEXT NOT NULL UNIQUE,
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 38. Quotation Items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        discount NUMERIC DEFAULT '0',
        tax_amount NUMERIC DEFAULT '0',
        total NUMERIC NOT NULL
      );
    `);

    // 39. Sales Orders
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 40. Sales Order Items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        discount NUMERIC DEFAULT '0',
        tax_amount NUMERIC DEFAULT '0',
        total NUMERIC NOT NULL
      );
    `);

    // 41. Purchase Requests
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_requests (
        id TEXT PRIMARY KEY,
        request_number TEXT NOT NULL UNIQUE,
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 42. Purchase Request Items
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS purchase_request_items (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        estimated_price NUMERIC NOT NULL,
        quantity NUMERIC NOT NULL,
        total NUMERIC NOT NULL
      );
    `);

    // 43. Bank Accounts
    await db.execute(sql`
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
    `);

    // 44. Treasury Transactions
    await db.execute(sql`
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
    `);

    // 45. Bank Reconciliations
    await db.execute(sql`
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
    `);

    // 46. Expense Categories
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        account_id TEXT,
        budget NUMERIC DEFAULT '0',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 47. Expense Requests
    await db.execute(sql`
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
    `);

    console.log('Database tables ensured successfully.');
  } catch (error) {
    console.error('Error in ensureDatabaseTables:', error);
  }
}
