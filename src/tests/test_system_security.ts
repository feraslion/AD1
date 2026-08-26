import { authorize } from '../core/server/middleware/rbac.ts';

function createMockRes() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: any) => {
    res.body = body;
    return res;
  };
  return res;
}

console.log('=== Running System Authorization Security Unit Tests ===');

// Test 1: Unauthenticated request (req.user is undefined)
{
  const req: any = {};
  const res = createMockRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = authorize(['manager']);
  middleware(req, res, next);

  if (res.statusCode === 401 && res.body.success === false && !nextCalled) {
    console.log('✔ Test 1 Passed: Unauthenticated request rejected with 401');
  } else {
    console.error('❌ Test 1 Failed: Expected 401 for unauthenticated request', res);
    process.exit(1);
  }
}

// Test 2: Unauthorized request (role is cashier, required manager)
{
  const req: any = { user: { role: 'cashier', permissions: ['sales.view'] } };
  const res = createMockRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = authorize(['manager']);
  middleware(req, res, next);

  if (res.statusCode === 403 && res.body.success === false && !nextCalled) {
    console.log('✔ Test 2 Passed: Unauthorized user role rejected with 403');
  } else {
    console.error('❌ Test 2 Failed: Expected 403 for unauthorized role', res);
    process.exit(1);
  }
}

// Test 3: Authorized request (role is manager)
{
  const req: any = { user: { role: 'manager' } };
  const res = createMockRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = authorize(['manager']);
  middleware(req, res, next);

  if (nextCalled && !res.statusCode) {
    console.log('✔ Test 3 Passed: Authorized manager role allowed');
  } else {
    console.error('❌ Test 3 Failed: Expected manager role to be allowed');
    process.exit(1);
  }
}

// Test 4: Authorized request (role is cashier matching allowed requirement)
{
  const req: any = { user: { role: 'cashier' } };
  const res = createMockRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = authorize(['manager', 'cashier', 'accountant', 'inventory']);
  middleware(req, res, next);

  if (nextCalled && !res.statusCode) {
    console.log('✔ Test 4 Passed: Cashier role allowed on notifications endpoint requirements');
  } else {
    console.error('❌ Test 4 Failed: Expected cashier role to be allowed for notifications');
    process.exit(1);
  }
}

console.log('=== All System Authorization Unit Tests Passed Successfully! ===');
