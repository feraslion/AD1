import { authorize } from '../core/server/middleware/rbac.ts';

declare const process: any;

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`ASSERTION FAILED: ${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

export async function runPurchasesSecurityTests() {
  console.log('=== Starting Purchases API Security & Authorization Verification ===\n');

  const purchaseRoles = ['manager', 'inventory', 'accountant'];
  const middleware = authorize(purchaseRoles);

  // 1. Verify Authorized Roles Access
  for (const role of purchaseRoles) {
    console.log(`[Test] Verifying access for authorized role: '${role}'...`);
    let nextCalled = false;
    let statusCode = 0;
    let responseData: any = null;

    const mockReq: any = {
      user: { id: 'usr_test', name: 'Test User', role }
    };
    const mockRes: any = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      }
    };
    const mockNext = () => { nextCalled = true; };

    middleware(mockReq, mockRes, mockNext);

    assertEqual(nextCalled, true, `Role '${role}' should be authorized to access purchases`);
    assertEqual(statusCode, 0, `Role '${role}' should not receive an error status code`);
    console.log(`✓ PASS: Role '${role}' successfully authorized`);
  }

  // 2. Verify Unauthorized Role Rejection (e.g. cashier)
  console.log('\n[Test] Verifying access denial for unauthorized role: \'cashier\'...');
  {
    let nextCalled = false;
    let statusCode = 0;
    let responseData: any = null;

    const mockReq: any = {
      user: { id: 'usr_cashier', name: 'Cashier User', role: 'cashier', permissions: ['sales.view'] }
    };
    const mockRes: any = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      }
    };
    const mockNext = () => { nextCalled = true; };

    middleware(mockReq, mockRes, mockNext);

    assertEqual(nextCalled, false, "Unauthorized role 'cashier' should not call next()");
    assertEqual(statusCode, 403, "Unauthorized role 'cashier' should be rejected with 403 Forbidden");
    assertEqual(responseData?.success, false, "Response body should indicate success: false");
    console.log('✓ PASS: Unauthorized role \'cashier\' correctly rejected with HTTP 403');
  }

  // 3. Verify Unauthenticated Context Rejection (no user)
  console.log('\n[Test] Verifying access denial for missing user context...');
  {
    let nextCalled = false;
    let statusCode = 0;
    let responseData: any = null;

    const mockReq: any = {};
    const mockRes: any = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      }
    };
    const mockNext = () => { nextCalled = true; };

    middleware(mockReq, mockRes, mockNext);

    assertEqual(nextCalled, false, 'Unauthenticated context should not call next()');
    assertEqual(statusCode, 401, 'Unauthenticated context should be rejected with 401 Unauthorized');
    console.log('✓ PASS: Unauthenticated request correctly rejected with HTTP 401');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL PURCHASES SECURITY AUTHORIZATION TESTS PASSED!');
  console.log('======================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPurchasesSecurityTests().catch((err) => {
    console.error('❌ PURCHASES SECURITY TEST FAILED:', err);
    process.exit(1);
  });
}
