import fs from 'fs';
import path from 'path';

function runInvoicesA11yTests() {
  console.log('=== Starting Invoices Component Accessibility (a11y) Verification ===');

  const invoicesFilePath = path.join(process.cwd(), 'src/modules/sales/Invoices.tsx');
  if (!fs.existsSync(invoicesFilePath)) {
    console.error('❌ Invoices.tsx file not found at expected path:', invoicesFilePath);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(invoicesFilePath, 'utf-8');

  // Test 1: Tablist container semantics
  if (!fileContent.includes('role="tablist"') || !fileContent.includes('aria-label="أقسام دورة المبيعات"')) {
    console.error('❌ Test 1 Failed: Missing tablist container role or aria-label in Invoices.tsx');
    process.exit(1);
  }
  console.log('✔ Test 1 Passed: Tablist container has role="tablist" and descriptive localized aria-label.');

  // Test 2: Subtab buttons have role="tab" and aria-selected
  if (!fileContent.includes('role="tab"') || !fileContent.includes('aria-selected={activeSubTab === \'invoices\'}')) {
    console.error('❌ Test 2 Failed: Subtab buttons lack role="tab" or dynamic aria-selected state.');
    process.exit(1);
  }
  console.log('✔ Test 2 Passed: Subtab buttons feature role="tab" and dynamic aria-selected state.');

  // Test 3: Invoice item button list selection state
  if (!fileContent.includes('aria-selected={isSelected}')) {
    console.error('❌ Test 3 Failed: Invoice list items missing aria-selected attribute.');
    process.exit(1);
  }
  console.log('✔ Test 3 Passed: Invoice list items correctly bind aria-selected state.');

  // Test 4: Focus visible indicators
  if (!fileContent.includes('focus-visible:ring-2')) {
    console.error('❌ Test 4 Failed: Interactive elements missing focus-visible:ring-2 indicators.');
    process.exit(1);
  }
  console.log('✔ Test 4 Passed: Interactive controls include focus-visible focus ring styles.');

  // Test 5: Decorative icon hiding
  if (!fileContent.includes('aria-hidden="true"')) {
    console.error('❌ Test 5 Failed: Decorative icons missing aria-hidden="true".');
    process.exit(1);
  }
  console.log('✔ Test 5 Passed: Decorative Lucide icons are correctly hidden with aria-hidden="true".');

  console.log('=== All Invoices Accessibility Tests Passed Successfully! ===');
}

runInvoicesA11yTests();
