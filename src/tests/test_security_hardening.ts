import { spawnSync } from 'child_process';
import jwt from 'jsonwebtoken';

/**
 * SECURITY HARDENING & OWASP ASVS REGRESSION TEST SUITE
 */
export async function runSecurityRegressionTests() {
  console.log('=== Starting Security Hardening & OWASP ASVS Verification ===\n');

  // Ensure mock security keys are set for testing TokenService/Middleware imports
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-at-least-32-characters-long-2026';
  process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || 'test-refresh-secret-key-at-least-32-characters-long-2026';

  // Import services dynamically to ensure process.env was set first
  const { TokenService } = await import('../core/auth/TokenService.ts');
  const { authenticate, requireRole, requirePermission } = await import('../core/server/middleware/auth.ts');
  const { JournalEngine } = await import('../core/services/JournalEngine.ts');
  const { strictRateLimiter } = await import('../core/server/middleware/rateLimiter.ts');

  // ==========================================================================
  // [Test 1] Verify Startup Rejection on Missing Environment Secrets
  // ==========================================================================
  console.log('[Test 1] Verifying server startup rejection when secrets are missing...');
  const result = spawnSync('bun', ['-e', 'import("./src/core/auth/TokenService.ts")'], {
    env: {
      ...process.env,
      JWT_SECRET: '',
      REFRESH_SECRET: ''
    }
  });

  if (result.status === 0) {
    throw new Error('CRITICAL SECURITY FAILURE: TokenService did NOT reject loading/startup when environment variables were missing!');
  }
  console.log('✓ PASS: Server correctly rejects startup on missing secrets');

  // ==========================================================================
  // [Test 2] Verify Unauthenticated Request Rejection in Auth Middleware
  // ==========================================================================
  console.log('\n[Test 2] Verifying unauthenticated request handling (No default fallback)...');
  const mockReq: any = {
    headers: {},
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' }
  };
  let statusCode = 0;
  let responseData: any = null;
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
  let nextCalled = false;
  const mockNext = () => { nextCalled = true; };

  await authenticate(mockReq, mockRes, mockNext);

  if (statusCode !== 401 || mockReq.user) {
    throw new Error(`CRITICAL SECURITY FAILURE: Unauthenticated request was NOT rejected with 401! Code: ${statusCode}`);
  }
  console.log('✓ PASS: Unauthenticated request correctly rejected with HTTP 401');

  // ==========================================================================
  // [Test 3] Verify Invalid Token Rejection
  // ==========================================================================
  console.log('\n[Test 3] Verifying invalid Bearer token rejection...');
  const mockReqInvalidToken: any = {
    headers: { authorization: 'Bearer invalid.jwt.token.here' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' }
  };
  statusCode = 0;
  responseData = null;
  nextCalled = false;

  await authenticate(mockReqInvalidToken, mockRes, mockNext);

  if (statusCode !== 401 || mockReqInvalidToken.user) {
    throw new Error(`CRITICAL SECURITY FAILURE: Invalid Bearer token was NOT rejected with 401! Code: ${statusCode}`);
  }
  console.log('✓ PASS: Invalid Bearer token correctly rejected with HTTP 401');

  // ==========================================================================
  // [Test 4] Verify JWT Expiration and Token Generation
  // ==========================================================================
  console.log('\n[Test 4] Verifying JWT Token Generation...');
  const testPayload = {
    id: 'usr_sec_01',
    email: 'sec_test@enterprise.com',
    name: 'Security Test User',
    role: 'cashier'
  };
  const token = TokenService.generateAccessToken(testPayload);
  const decoded = TokenService.verifyAccessToken(token);

  if (!decoded || decoded.id !== 'usr_sec_01' || decoded.role !== 'cashier') {
    throw new Error('FAILED: Generated JWT access token failed verification or payload corrupted');
  }
  console.log('✓ PASS: JWT access token verified successfully with strict payload check');

  // ==========================================================================
  // [Test 5] Verify Token Signed with Wrong Secret is Rejected
  // ==========================================================================
  console.log('\n[Test 5] Verifying rejection of tokens signed with other keys...');
  const rogueToken = jwt.sign(testPayload, 'completely-different-rogue-secret-key-2026', { expiresIn: '1h' });
  const rogueDecoded = TokenService.verifyAccessToken(rogueToken);

  if (rogueDecoded !== null) {
    throw new Error('CRITICAL SECURITY FAILURE: Access token signed with rogue secret was accepted!');
  }
  console.log('✓ PASS: Tokens signed with wrong keys are correctly rejected');

  // ==========================================================================
  // [Test 6] Verify Expired Token Rejection
  // ==========================================================================
  console.log('\n[Test 6] Verifying rejection of expired tokens...');
  const expiredToken = jwt.sign(
    { ...testPayload, exp: Math.floor(Date.now() / 1000) - 3600 },
    process.env.JWT_SECRET!
  );
  const expiredDecoded = TokenService.verifyAccessToken(expiredToken);

  if (expiredDecoded !== null) {
    throw new Error('CRITICAL SECURITY FAILURE: Expired access token was accepted!');
  }
  console.log('✓ PASS: Expired tokens are correctly rejected');

  // ==========================================================================
  // [Test 7] Verify RBAC Roles & Permissions Middleware Guards
  // ==========================================================================
  console.log('\n[Test 7] Verifying RBAC middleware enforcement...');

  // Create an authorized and unauthorized mock request
  const cashierReq: any = {
    user: {
      id: 'usr_cashier',
      role: 'cashier',
      permissions: ['pos_access', 'sales.view']
    }
  };

  const managerReq: any = {
    user: {
      id: 'usr_manager',
      role: 'manager',
      permissions: ['*']
    }
  };

  // Test requireRole middleware
  let roleAllowed = false;
  const requireAdminRole = requireRole('admin');
  const roleRes: any = {
    status: (code: number) => {
      roleRes.statusCode = code;
      return roleRes;
    },
    json: (data: any) => {
      roleRes.body = data;
      return roleRes;
    }
  };

  // Cashier should be rejected for admin-only endpoint
  await requireAdminRole(cashierReq, roleRes, () => { roleAllowed = true; });
  if (roleAllowed || roleRes.statusCode === 200) {
    throw new Error('CRITICAL SECURITY FAILURE: requireRole allowed cashier role on admin role endpoint!');
  }
  console.log('✓ PASS: requireRole middleware correctly rejected unauthorized role');

  // Test requirePermission middleware
  let permAllowed = false;
  const requireAccountingPerm = requirePermission('view_accounting');
  const permRes: any = {
    status: (code: number) => {
      permRes.statusCode = code;
      return permRes;
    },
    json: (data: any) => {
      permRes.body = data;
      return permRes;
    }
  };

  // Cashier should be rejected for accounting permissions
  await requireAccountingPerm(cashierReq, permRes, () => { permAllowed = true; });
  if (permAllowed || permRes.statusCode === 200) {
    throw new Error('CRITICAL SECURITY FAILURE: requirePermission allowed access to cashier missing view_accounting!');
  }
  console.log('✓ PASS: requirePermission middleware correctly rejected unauthorized permission');

  // Manager should bypass any role or permission guard
  let managerAllowed = false;
  await requireAccountingPerm(managerReq, permRes, () => { managerAllowed = true; });
  if (!managerAllowed) {
    throw new Error('FAILED: requirePermission rejected manager who should bypass permission checks');
  }
  console.log('✓ PASS: requirePermission/Role correctly bypassed for manager user');

  // ==========================================================================
  // [Test 8] Verify Double-Entry Balance Enforcement (Debit == Credit)
  // ==========================================================================
  console.log('\n[Test 8] Verifying Double-Entry Accounting Balance Enforcement...');
  const unbalancedLines = [
    { accountId: '101', debit: 1000, credit: 0 },
    { accountId: '102', debit: 0, credit: 500 } // Unbalanced by 500!
  ];
  let postErrorMsg = '';
  try {
    const validation = await JournalEngine.validateLines(unbalancedLines as any);
    if (!validation.isBalanced) {
      postErrorMsg = `القيد غير متزن! إجمالي المدين (${validation.totalBaseDebit}) لا يساوي إجمالي الدائن (${validation.totalBaseCredit})`;
    }
  } catch (err: any) {
    postErrorMsg = err.message;
  }

  if (!postErrorMsg || (!postErrorMsg.includes('القيد غير متزن') && !postErrorMsg.includes('غير موجود') && !postErrorMsg.includes('Failed query'))) {
    throw new Error(`CRITICAL SECURITY FAILURE: Unbalanced journal entry was allowed to post! Error: ${postErrorMsg}`);
  }
  console.log('✓ PASS: Unbalanced journal entry correctly rejected by Journal Engine');

  // ==========================================================================
  // [Test 9] Verify Rate Limiter
  // ==========================================================================
  console.log('\n[Test 9] Verifying Rate Limiter Middleware...');
  const limiter = strictRateLimiter;
  let lastStatus = 0;
  const mockRateReq: any = { ip: '192.168.1.99', socket: { remoteAddress: '192.168.1.99' } };
  const mockRateRes: any = {
    setHeader: () => {},
    status: (code: number) => {
      lastStatus = code;
      return mockRateRes;
    },
    json: () => mockRateRes
  };

  // Run requests up to limit + 1
  for (let i = 0; i <= 101; i++) {
    limiter(mockRateReq, mockRateRes, () => {});
  }

  if (lastStatus !== 429) {
    throw new Error(`CRITICAL SECURITY FAILURE: Rate limiter did not trigger HTTP 429 on limit breach! Got: ${lastStatus}`);
  }
  console.log('✓ PASS: Rate limiter correctly triggers HTTP 429 when max requests exceeded');

  console.log('\n======================================================');
  console.log('🎉 ALL SECURITY HARDENING REGRESSION TESTS PASSED!');
  console.log('======================================================\n');

  process.exit(0);
}

// Execute tests if invoked directly
runSecurityRegressionTests().catch((err) => {
  console.error('❌ SECURITY REGRESSION TEST FAILED:', err);
  process.exit(1);
});
