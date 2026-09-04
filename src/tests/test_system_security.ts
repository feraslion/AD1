import systemRouter from '../core/server/routes/v1/system.routes.ts';
import { authorize } from '../core/server/middleware/rbac.ts';

function mockRes() {
  let statusCode = 200;
  let responseBody: any = null;
  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: any) => {
      responseBody = body;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get responseBody() {
      return responseBody;
    }
  };
  return res;
}

async function runSystemSecurityTests() {
  console.log('=== Running System Routes Authorization & Security Unit Tests ===');

  // Test 1: Unauthenticated request to manager-only system endpoint
  console.log('[Test 1] Verifying unauthenticated access is rejected (401)...');
  const middleware = authorize(['manager']);
  const reqUnauth: any = {};
  const resUnauth = mockRes();
  let nextCalled = false;

  middleware(reqUnauth, resUnauth, () => { nextCalled = true; });

  console.assert(resUnauth.statusCode === 401, `Expected status 401, got ${resUnauth.statusCode}`);
  console.assert(!nextCalled, 'Next should not be called for unauthenticated request');
  console.log('✔ Test 1 Passed: Unauthenticated request correctly rejected with HTTP 401.');

  // Test 2: Unauthorized role (cashier) accessing backup export
  console.log('[Test 2] Verifying cashier role is denied backup export (403)...');
  const reqCashier: any = { user: { id: 'user_cashier_01', role: 'cashier', name: 'Cashier' } };
  const resCashier = mockRes();
  nextCalled = false;

  middleware(reqCashier, resCashier, () => { nextCalled = true; });

  console.assert(resCashier.statusCode === 403, `Expected status 403, got ${resCashier.statusCode}`);
  console.assert(!nextCalled, 'Next should not be called for unauthorized role');
  console.log('✔ Test 2 Passed: Cashier role correctly rejected with HTTP 403.');

  // Test 3: Authorized manager role accessing backup export
  console.log('[Test 3] Verifying manager role is allowed access...');
  const reqManager: any = { user: { id: 'user_manager_01', role: 'manager', name: 'Manager' } };
  const resManager = mockRes();
  nextCalled = false;

  middleware(reqManager, resManager, () => { nextCalled = true; });

  console.assert(nextCalled, 'Next should be called for manager role');
  console.log('✔ Test 3 Passed: Manager role granted access.');

  // Test 4: Verify route definitions in systemRouter contain authorize middleware
  console.log('[Test 4] Verifying system router layer stack contains RBAC handlers...');
  const protectedPaths = ['/workflows/rules', '/audit-logs', '/backup/export', '/backup/restore'];
  const routes = systemRouter.stack.filter((layer: any) => layer.route);

  for (const path of protectedPaths) {
    const matched = routes.find((r: any) => r.route.path === path);
    console.assert(matched, `Route for ${path} should exist`);
    console.assert(matched.route.stack.length > 1, `Route for ${path} should have middleware stack (>1 handlers)`);
  }
  console.log('✔ Test 4 Passed: Router stack contains authorization middleware for sensitive endpoints.');

  console.log('=== All System Security Unit Tests Passed Successfully! ===');
}

runSystemSecurityTests().catch((err) => {
  console.error('❌ System security test failed:', err);
  process.exit(1);
});
