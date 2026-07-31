*** Begin Patch
*** Update File: src/core/database/initSchema.ts
@@
-  // 24. Payments
-  await execSql(sql`
-    CREATE TABLE IF NOT EXISTS payments (
-      id TEXT PRIMARY KEY,
-      payment_number TEXT NOT NULL UNIQUE,
-      type TEXT NOT NULL,
-      customer_id TEXT,
-      supplier_id TEXT,
-      party_id TEXT,
-      party_type TEXT,
-      amount NUMERIC NOT NULL,
-      currency TEXT DEFAULT 'SAR',
-      exchange_rate NUMERIC DEFAULT '1.0',
-      foreign_amount NUMERIC DEFAULT '0',
-      payment_method TEXT DEFAULT 'cash',
-      method TEXT DEFAULT 'cash',
-      reference TEXT,
-      account_id TEXT,
-      date TEXT NOT NULL,
-      notes TEXT,
-      company_id TEXT,
-      branch_id TEXT,
-      created_at TIMESTAMP DEFAULT NOW(),
-      updated_at TIMESTAMP DEFAULT NOW()
-    );
-  `, 'payments');
-
-  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS party_id TEXT;`, 'payments_col_party_id');
-  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS party_type TEXT;`, 'payments_col_party_type');
-  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash';`, 'payments_col_method');
-  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;`, 'payments_col_reference');
+  // 24. Payments (aligned with application code expectations)
+  await execSql(sql`
+    CREATE TABLE IF NOT EXISTS payments (
+      id TEXT PRIMARY KEY,
+      company_id TEXT,
+      branch_id TEXT,
+      payment_number TEXT NOT NULL UNIQUE,
+      date TEXT NOT NULL,
+      type TEXT NOT NULL,
+      party_id TEXT,
+      party_type TEXT,
+      amount NUMERIC NOT NULL,
+      method TEXT NOT NULL,
+      reference TEXT,
+      notes TEXT,
+      created_at TIMESTAMP DEFAULT NOW(),
+      updated_at TIMESTAMP DEFAULT NOW()
+    );
+  `, 'payments');
+
+  // Ensure compatible columns exist for older DBs
+  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS party_id TEXT;`, 'payments_col_party_id');
+  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS party_type TEXT;`, 'payments_col_party_type');
+  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash';`, 'payments_col_method');
+  await execSql(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;`, 'payments_col_reference');
*** End Patch