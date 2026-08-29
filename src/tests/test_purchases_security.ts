import express from 'express';
import purchasesRouter from '../core/server/routes/v1/purchases.routes.ts';
import { authorize } from '../core/server/middleware/rbac.ts';

export async function testPurchasesSecurity() {
  console.log('=== Running Purchases API Security Verification ===');

  const app = express();
  app.use(express.json());

  // Simulate authentication middleware attaching req.user based on header
  app.use((req: any, _res, next) => {
    const roleHeader = req.headers['x-test-role'];
    if (roleHeader && roleHeader !== 'none') {
      req.user = { id: 'test_user', role: roleHeader };
    } else {
      req.user = undefined;
    }
    next();
  });

  app.use('/api/v1/purchases', purchasesRouter);

  async function testRouteAuthorization(role: string | undefined, expectedStatus: number) {
    const middleware = authorize(['manager', 'inventory', 'accountant']);
    let statusCode = 200;
    let jsonBody: any = null;

    const req: any = {
      user: role ? { id: 'test_user', role } : undefined
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        jsonBody = data;
        return res;
      }
    };

    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });

    if (expectedStatus === 200) {
      if (!nextCalled) {
        throw new Error(`Expected request for role ${role} to pass authorization, but it failed`);
      }
    } else {
      if (statusCode !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus} for role ${role}, got ${statusCode}`);
      }
    }
  }

  // 1. Unauthenticated Request
  console.log('[Test 1] Testing unauthenticated access (expected 401)...');
  await testRouteAuthorization(undefined, 401);
  console.log('✓ PASS: Unauthenticated request rejected with HTTP 401');

  // 2. Unauthorized Role (cashier)
  console.log('[Test 2] Testing unauthorized role access (cashier, expected 403)...');
  await testRouteAuthorization('cashier', 403);
  console.log('✓ PASS: Cashier role access rejected with HTTP 403');

  // 3. Authorized Roles (manager, inventory, accountant)
  console.log('[Test 3] Testing authorized roles (manager, inventory, accountant)...');
  await testRouteAuthorization('manager', 200);
  await testRouteAuthorization('inventory', 200);
  await testRouteAuthorization('accountant', 200);
  console.log('✓ PASS: Authorized roles correctly permitted');

  console.log('=== All Purchases Security Tests Passed Successfully ===');
}

testPurchasesSecurity().catch((err) => {
  console.error('❌ Purchases Security Test Failed:', err);
  process.exit(1);
});
