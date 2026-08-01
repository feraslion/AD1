import { authenticate as authMiddleware1 } from '../core/server/middleware/auth.ts';
import { authenticate as authMiddleware2 } from '../../server.ts';
import { db } from '../core/database/index.ts';
import { users } from '../core/database/schema.ts';
import { eq } from 'drizzle-orm';
import pkg from 'pg';

// Mock the PG Pool prototype query to avoid connecting to a real database
(pkg.Pool.prototype as any).query = async function (sqlText: any, values: any) {
  const sql = typeof sqlText === 'string' ? sqlText : (sqlText?.text || '');

  if (sql.includes('"users"')) {
    return {
      rows: [
        [
          '001',
          '001',
          'manager@system.com',
          'عبدالرحمن (المدير العام)',
          'manager',
          null,
          null,
          'role_manager',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      ],
      rowCount: 1,
      command: 'SELECT',
      fields: [
        { name: 'id' },
        { name: 'uid' },
        { name: 'email' },
        { name: 'name' },
        { name: 'role' },
        { name: 'company_id' },
        { name: 'branch_id' },
        { name: 'role_id' },
        { name: 'created_at' },
        { name: 'updated_at' }
      ]
    };
  }

  if (sql.includes('"role_permissions"')) {
    return {
      rows: [
        ['view_dashboard']
      ],
      rowCount: 1,
      command: 'SELECT',
      fields: [
        { name: 'code' }
      ]
    };
  }

  return {
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    fields: []
  };
};

async function runAuthSecurityTests() {
  console.log('=== Starting Auth Security Verification Tests ===\n');

  try {
    const res = await db.select().from(users).where(eq(users.id, '001'));
    console.log('Direct query result:', res);
  } catch (e) {
    console.error('Direct query failed with error:', e);
  }

  let passed = true;

  const originalEnv = process.env.NODE_ENV;

  try {
    // ──────── TEST CASE 1: Development/Test Fallback ────────
    console.log('[Test 1] Testing unauthenticated requests in Development/Test...');
    process.env.NODE_ENV = 'development';

    // Mock Express Request, Response, Next for authMiddleware1
    let nextCalled1 = false;
    const req1: any = { headers: {} };
    const res1: any = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.body = data;
        return this;
      }
    };
    const next1 = () => { nextCalled1 = true; };

    await authMiddleware1(req1, res1, next1);

    if (nextCalled1 && req1.user && req1.user.id === '001') {
      console.log('✓ Middleware 1 successfully falls back to user 001 in development.');
    } else {
      console.log('❌ Middleware 1 failed fallback in development.');
      passed = false;
    }

    // Mock Express Request, Response, Next for authMiddleware2
    let nextCalled2 = false;
    const req2: any = { headers: {} };
    const res2: any = {
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.body = data;
        return this;
      }
    };
    const next2 = () => { nextCalled2 = true; };

    await authMiddleware2(req2, res2, next2);

    if (nextCalled2 && req2.user && req2.user.id === '001') {
      console.log('✓ Middleware 2 successfully falls back to user 001 in development.');
    } else {
      console.log('❌ Middleware 2 failed fallback in development.');
      passed = false;
    }


    // ──────── TEST CASE 2: Production Protection ────────
    console.log('\n[Test 2] Testing unauthenticated requests in Production (NODE_ENV=production)...');
    process.env.NODE_ENV = 'production';

    // Test Middleware 1
    let nextCalledProd1 = false;
    const reqProd1: any = { headers: {} };
    let resProd1Status: number | null = null;
    let resProd1Body: any = null;
    const resProd1: any = {
      status: function (code: number) {
        resProd1Status = code;
        return this;
      },
      json: function (data: any) {
        resProd1Body = data;
        return this;
      }
    };
    const nextProd1 = () => { nextCalledProd1 = true; };

    await authMiddleware1(reqProd1, resProd1, nextProd1);

    if (!nextCalledProd1 && resProd1Status === 401) {
      console.log('✓ Middleware 1 correctly rejects unauthenticated requests with 401 in production.');
    } else {
      console.log(`❌ Middleware 1 failed in production! nextCalled=${nextCalledProd1}, status=${resProd1Status}`);
      passed = false;
    }

    // Test Middleware 2
    let nextCalledProd2 = false;
    const reqProd2: any = { headers: {} };
    let resProd2Status: number | null = null;
    let resProd2Body: any = null;
    const resProd2: any = {
      status: function (code: number) {
        resProd2Status = code;
        return this;
      },
      json: function (data: any) {
        resProd2Body = data;
        return this;
      }
    };
    const nextProd2 = () => { nextCalledProd2 = true; };

    await authMiddleware2(reqProd2, resProd2, nextProd2);

    if (!nextCalledProd2 && resProd2Status === 401) {
      console.log('✓ Middleware 2 correctly rejects unauthenticated requests with 401 in production.');
    } else {
      console.log(`❌ Middleware 2 failed in production! nextCalled=${nextCalledProd2}, status=${resProd2Status}`);
      passed = false;
    }

  } finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  }

  console.log('\n======================================================');
  if (passed) {
    console.log('🎉 ALL AUTH SECURITY TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } else {
    console.log('❌ SOME AUTH SECURITY TESTS FAILED!');
    console.log('======================================================\n');
    process.exit(1);
  }
}

runAuthSecurityTests();
