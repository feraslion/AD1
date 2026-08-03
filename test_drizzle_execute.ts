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
