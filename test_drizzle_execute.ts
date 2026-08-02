/**
 * DIAGNOSTIC TEST FILE — test_drizzle_execute.ts
 *
 * PURPOSE:
 * This file is kept in the root of the repository for diagnostic/troubleshooting
 * purposes only. It is designed to verify raw database connection and raw SQL/DDL
 * statement execution using the Drizzle ORM instance (`db`) outside of the main
 * application loop.
 *
 * USAGE:
 * Run this diagnostic script via Bun or Node:
 *   SQL_HOST=localhost SQL_DB_NAME=ad1 SQL_ADMIN_USER=postgres SQL_ADMIN_PASSWORD=secret bun test_drizzle_execute.ts
 */

import { db } from './src/core/database/index.ts';
import { sql } from 'drizzle-orm';

async function testDrizzle() {
  try {
    console.log("Testing db.execute...");
    const res = await db.execute(sql`SELECT 1 as test`);
    console.log("SELECT 1 succeeded:", res);

    console.log("Testing DDL create table...");
    await db.execute(sql`CREATE TABLE IF NOT EXISTS _ddl_test (id INT)`);
    console.log("CREATE TABLE succeeded!");
    process.exit(0);
  } catch (err: any) {
    console.error("Drizzle Execute Error:", err);
    process.exit(1);
  }
}

testDrizzle();
