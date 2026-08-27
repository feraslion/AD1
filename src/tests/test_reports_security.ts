import { authorize } from '../core/server/middleware/rbac.ts';

export async function runReportsSecurityTests() {
  console.log('=== Starting Reports API Security & RBAC Verification ===\n');

  const reportAuth = authorize(['manager', 'accountant', 'view_reports']);

  // Helper mock factory
  const createMocks = (userObj: any) => {
    let statusCode = 200;
    let responseData: any = null;
    let nextCalled = false;

    const req: any = { user: userObj };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      }
    };
    const next = () => { nextCalled = true; };

    return { req, res, next, getStatusCode: () => statusCode, getResponseData: () => responseData, isNextCalled: () => nextCalled };
  };

  // 1. Unauthenticated Request
  console.log('[Test 1] Verifying unauthenticated user rejection...');
  const test1 = createMocks(undefined);
  reportAuth(test1.req, test1.res, test1.next);
  if (test1.getStatusCode() !== 401 || test1.isNextCalled()) {
    throw new Error(`SECURITY FAILURE: Unauthenticated user was not rejected with 401! Got ${test1.getStatusCode()}`);
  }
  console.log('✓ PASS: Unauthenticated request rejected with HTTP 401');

  // 2. Unprivileged User (Cashier without report perms)
  console.log('[Test 2] Verifying unprivileged role rejection (Cashier)...');
  const test2 = createMocks({ id: 'u_cashier', role: 'cashier', permissions: ['sales.view'] });
  reportAuth(test2.req, test2.res, test2.next);
  if (test2.getStatusCode() !== 403 || test2.isNextCalled()) {
    throw new Error(`SECURITY FAILURE: Cashier was allowed access without report permissions! Got ${test2.getStatusCode()}`);
  }
  console.log('✓ PASS: Cashier without report perms rejected with HTTP 403');

  // 3. Manager Access
  console.log('[Test 3] Verifying Manager full access...');
  const test3 = createMocks({ id: 'u_mgr', role: 'manager', permissions: [] });
  reportAuth(test3.req, test3.res, test3.next);
  if (!test3.isNextCalled() || test3.getStatusCode() !== 200) {
    throw new Error(`SECURITY FAILURE: Manager was blocked from accessing reports! Status: ${test3.getStatusCode()}`);
  }
  console.log('✓ PASS: Manager granted access');

  // 4. Accountant Access
  console.log('[Test 4] Verifying Accountant access...');
  const test4 = createMocks({ id: 'u_acct', role: 'accountant', permissions: ['view_reports'] });
  reportAuth(test4.req, test4.res, test4.next);
  if (!test4.isNextCalled() || test4.getStatusCode() !== 200) {
    throw new Error(`SECURITY FAILURE: Accountant was blocked from accessing reports! Status: ${test4.getStatusCode()}`);
  }
  console.log('✓ PASS: Accountant granted access');

  // 5. Custom Permission User
  console.log('[Test 5] Verifying user with explicit `view_reports` permission...');
  const test5 = createMocks({ id: 'u_custom', role: 'custom_role', permissions: ['view_reports'] });
  reportAuth(test5.req, test5.res, test5.next);
  if (!test5.isNextCalled() || test5.getStatusCode() !== 200) {
    throw new Error(`SECURITY FAILURE: User with view_reports permission was blocked! Status: ${test5.getStatusCode()}`);
  }
  console.log('✓ PASS: Custom user with view_reports permission granted access');

  console.log('\n======================================================');
  console.log('🎉 ALL REPORTS RBAC SECURITY TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReportsSecurityTests().catch((err) => {
    console.error('❌ REPORTS SECURITY TEST FAILED:', err);
    process.exit(1);
  });
}
