// Function under test logic extracted from search.routes.ts for authorization condition testing
function checkSearchPermissions(user?: { role?: string; permissions?: string[] }) {
  const userPerms = user?.permissions || [];
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return {
    canViewProducts: isManager || userPerms.some(p => ['inventory.view', 'manage_inventory', 'pos_access', 'sales.view'].includes(p)),
    canViewCustomers: isManager || userPerms.some(p => ['sales.view', 'pos_access', 'view_invoices', 'customers.view'].includes(p)),
    canViewInvoices: isManager || userPerms.some(p => ['sales.view', 'view_invoices', 'accounting.view'].includes(p)),
    canViewSuppliers: isManager || userPerms.some(p => ['purchases.view', 'view_purchases', 'suppliers.view'].includes(p)),
    canViewAccounting: isManager || userPerms.some(p => ['accounting.view', 'view_accounting'].includes(p))
  };
}

function runTests() {
  console.log('=== Running Global Search Security Verification ===');

  // Test 1: Unauthenticated / missing user context
  const unauth = checkSearchPermissions(undefined);
  if (unauth.canViewProducts || unauth.canViewCustomers || unauth.canViewInvoices || unauth.canViewSuppliers || unauth.canViewAccounting) {
    throw new Error('FAILED: Unauthenticated user context granted permissions!');
  }
  console.log('✅ Test 1 Passed: Unauthenticated user context correctly denied search access');

  // Test 2: Manager role
  const mgr = checkSearchPermissions({ role: 'manager' });
  if (!mgr.canViewProducts || !mgr.canViewCustomers || !mgr.canViewInvoices || !mgr.canViewSuppliers || !mgr.canViewAccounting) {
    throw new Error('FAILED: Manager role denied access!');
  }
  console.log('✅ Test 2 Passed: Manager role granted full search access');

  // Test 3: Admin role
  const admin = checkSearchPermissions({ role: 'admin' });
  if (!admin.canViewProducts || !admin.canViewCustomers || !admin.canViewInvoices || !admin.canViewSuppliers || !admin.canViewAccounting) {
    throw new Error('FAILED: Admin role denied access!');
  }
  console.log('✅ Test 3 Passed: Admin role granted full search access');

  // Test 4: Restricted Cashier role
  const cashier = checkSearchPermissions({
    role: 'cashier',
    permissions: ['pos_access', 'sales.view']
  });
  if (!cashier.canViewProducts || !cashier.canViewCustomers || !cashier.canViewInvoices || cashier.canViewSuppliers || cashier.canViewAccounting) {
    throw new Error('FAILED: Cashier permissions incorrectly evaluated!');
  }
  console.log('✅ Test 4 Passed: Cashier role restricted to authorized domains');

  console.log('🎉 All Global Search Security Tests Passed Successfully!');
}

runTests();
