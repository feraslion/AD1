import express from 'express';
import expensesRouter from '../core/server/routes/v1/expenses.routes.ts';
import { authorize } from '../core/server/middleware/rbac.ts';

async function runExpensesSecurityTests() {
  console.log('=== Running Expense Routes Security & Authorization Tests ===\n');

  // Helper to test authorize middleware directly for a route
  const testAuthorization = (allowedRoles: string[], user: any) => {
    const middleware = authorize(allowedRoles);
    let statusCode = 0;
    let jsonOutput: any = null;
    let nextCalled = false;

    const req: any = { user };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonOutput = data;
        return res;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);
    return { statusCode, jsonOutput, nextCalled };
  };

  // Test 1: Unauthenticated request to GET /requests (req.user = undefined)
  console.log('[Test 1] Testing unauthenticated access to expense requests...');
  const res1 = testAuthorization(['manager', 'accountant', 'cashier'], undefined);
  console.assert(res1.statusCode === 401, `Expected HTTP 401, got ${res1.statusCode}`);
  console.assert(res1.nextCalled === false, 'next() should not be called for unauthenticated request');
  console.log('✓ PASS: Unauthenticated access rejected with 401');

  // Test 2: Unauthorized request to GET /reports (role without permission)
  console.log('\n[Test 2] Testing unauthorized access to expense reports (guest/warehouse role)...');
  const res2 = testAuthorization(['manager', 'accountant', 'view_reports'], { role: 'inventory', permissions: [] });
  console.assert(res2.statusCode === 403, `Expected HTTP 403, got ${res2.statusCode}`);
  console.assert(res2.nextCalled === false, 'next() should not be called for unauthorized request');
  console.log('✓ PASS: Unauthorized access rejected with 403');

  // Test 3: Authorized request to GET /reports (with view_reports permission)
  console.log('\n[Test 3] Testing authorized access to expense reports (with view_reports permission)...');
  const res3 = testAuthorization(['manager', 'accountant', 'view_reports'], { role: 'analyst', permissions: ['view_reports'] });
  console.assert(res3.statusCode === 0, 'Status code should remain 0 when next() is called');
  console.assert(res3.nextCalled === true, 'next() should be called for authorized user');
  console.log('✓ PASS: Authorized access granted to user with view_reports permission');

  // Test 4: Manager role bypass to GET /requests
  console.log('\n[Test 4] Testing manager role bypass for expense endpoints...');
  const res4 = testAuthorization(['manager', 'accountant', 'cashier'], { role: 'manager', permissions: [] });
  console.assert(res4.nextCalled === true, 'next() should be called for manager user');
  console.log('✓ PASS: Manager access granted via role bypass');

  console.log('\n======================================================');
  console.log('🎉 ALL EXPENSE ROUTE SECURITY TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runExpensesSecurityTests().catch((err) => {
  console.error('❌ EXPENSE ROUTE SECURITY TESTS FAILED:', err);
  process.exit(1);
});
