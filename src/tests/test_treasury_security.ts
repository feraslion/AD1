import { authorize } from '../core/server/middleware/rbac.ts';

/**
 * TREASURY ROUTE SECURITY AUTHORIZATION UNIT TEST SUITE
 */
export async function runTreasurySecurityTests() {
  console.log('=== Starting Treasury Security Authorization Unit Tests ===\n');

  // Test 1: Missing user in request (Unauthenticated context)
  console.log('[Test 1] Verifying unauthenticated context is rejected with 401...');
  const middleware = authorize(['manager', 'accountant', 'cashier']);
  const reqUnauth: any = {};
  let statusCode = 0;
  let jsonResponse: any = null;
  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonResponse = data;
      return res;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  middleware(reqUnauth, res, next);

  if (statusCode !== 401 || nextCalled) {
    throw new Error(`SECURITY FAILURE: Unauthenticated request was NOT rejected with 401! Code: ${statusCode}`);
  }
  console.log('✓ PASS: Unauthenticated request correctly rejected with HTTP 401');

  // Test 2: User with unauthorized role
  console.log('\n[Test 2] Verifying unauthorized role is rejected with 403...');
  statusCode = 0;
  jsonResponse = null;
  nextCalled = false;
  const reqUnauthorizedRole: any = { user: { id: 'usr_1', role: 'guest' } };

  middleware(reqUnauthorizedRole, res, next);

  if (statusCode !== 403 || nextCalled) {
    throw new Error(`SECURITY FAILURE: Unauthorized role request was NOT rejected with 403! Code: ${statusCode}`);
  }
  console.log('✓ PASS: Unauthorized role request correctly rejected with HTTP 403');

  // Test 3: User with authorized role ('accountant')
  console.log('\n[Test 3] Verifying authorized role is allowed...');
  statusCode = 0;
  jsonResponse = null;
  nextCalled = false;
  const reqAuthorizedRole: any = { user: { id: 'usr_2', role: 'accountant' } };

  middleware(reqAuthorizedRole, res, next);

  if (!nextCalled || statusCode !== 0) {
    throw new Error(`SECURITY FAILURE: Authorized role request was denied! Code: ${statusCode}`);
  }
  console.log('✓ PASS: Authorized role request correctly passed to next handler');

  console.log('\n======================================================');
  console.log('🎉 ALL TREASURY SECURITY AUTHORIZATION TESTS PASSED!');
  console.log('======================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTreasurySecurityTests().catch((err) => {
    console.error('❌ TREASURY SECURITY TEST FAILED:', err);
    process.exit(1);
  });
}
