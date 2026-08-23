import { authRouter } from '../core/server/routes/authRoutes.ts';

/**
 * AUTH ERROR SANITIZATION & SENSITIVE DATA LEAKAGE TEST SUITE
 */
export async function runAuthErrorSanitizationTest() {
  console.log('=== Starting Auth Error Sanitization Verification ===\n');

  // Helper to trigger router handlers with mock req/res
  const routeHandlers: Record<string, Function> = {};
  authRouter.stack.forEach((layer: any) => {
    if (layer.route) {
      const path = layer.route.path;
      const method = Object.keys(layer.route.methods)[0];
      routeHandlers[`${method.toUpperCase()} ${path}`] = layer.route.stack[0].handle;
    }
  });

  // Test POST /login with invalid internal DB behavior simulation
  console.log('[Test 1] Testing POST /login error sanitization...');
  const mockReqLogin: any = {
    body: { email: 'nonexistent@test.com', password: 'password123' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {}
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

  const loginHandler = routeHandlers['POST /login'];
  if (!loginHandler) {
    throw new Error('Handler for POST /login not found!');
  }

  await loginHandler(mockReqLogin, mockRes);

  if ('details' in responseData) {
    throw new Error(`CRITICAL SECURITY FAILURE: Response contains raw error details! Response: ${JSON.stringify(responseData)}`);
  }
  console.log('✓ PASS: POST /login error response does not contain sensitive details property');

  // Test POST /register with invalid input (no body to trigger catch or standard error)
  console.log('\n[Test 2] Testing POST /register error sanitization...');
  const mockReqRegister: any = {
    body: null, // will cause destructuring error in try block -> falls into catch block
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: {}
  };
  statusCode = 0;
  responseData = null;

  const registerHandler = routeHandlers['POST /register'];
  if (!registerHandler) {
    throw new Error('Handler for POST /register not found!');
  }

  await registerHandler(mockReqRegister, mockRes);

  if (statusCode !== 500) {
    throw new Error(`Expected HTTP 500 status code on unexpected exception, got ${statusCode}`);
  }
  if ('details' in responseData) {
    throw new Error(`CRITICAL SECURITY FAILURE: POST /register catch block leaked raw details! Response: ${JSON.stringify(responseData)}`);
  }
  if (responseData.success !== false || !responseData.error) {
    throw new Error(`Invalid error response structure: ${JSON.stringify(responseData)}`);
  }
  console.log('✓ PASS: POST /register exception catch block cleanly sanitized without exposing error details');

  console.log('\n======================================================');
  console.log('🎉 ALL AUTH ERROR SANITIZATION TESTS PASSED!');
  console.log('======================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthErrorSanitizationTest().catch((err) => {
    console.error('❌ AUTH ERROR SANITIZATION TEST FAILED:', err);
    process.exit(1);
  });
}
