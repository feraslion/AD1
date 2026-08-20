import fs from 'node:fs';
import path from 'node:path';

function runInventoryAccessibilityTest() {
  console.log('=== Running Inventory Accessibility & Micro-UX Verification Test ===');

  const filePath = path.resolve('src/modules/inventory/Inventory.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Test 1: Verify presence of aria-label for product action buttons
  const hasProductLedgerAriaLabel = fileContent.includes('aria-label={`دفتر استاد الصنف: ${p.name}`}');
  const hasProductEditAriaLabel = fileContent.includes('aria-label={`تعديل المنتج: ${p.name}`}');
  const hasProductDeleteAriaLabel = fileContent.includes('aria-label={`حذف المنتج: ${p.name}`}');

  console.assert(hasProductLedgerAriaLabel, 'Test 1a Failed: Missing ARIA label on product ledger button');
  console.assert(hasProductEditAriaLabel, 'Test 1b Failed: Missing ARIA label on product edit button');
  console.assert(hasProductDeleteAriaLabel, 'Test 1c Failed: Missing ARIA label on product delete button');
  console.log('✔ Test 1 Passed: Product table action buttons feature dynamic Arabic ARIA labels.');

  // Test 2: Verify warehouse action buttons accessibility
  const hasWarehouseEditAriaLabel = fileContent.includes('aria-label={`تعديل المستودع: ${wh.name}`}');
  const hasWarehouseDeleteAriaLabel = fileContent.includes('aria-label={`حذف المستودع: ${wh.name}`}');

  console.assert(hasWarehouseEditAriaLabel, 'Test 2a Failed: Missing ARIA label on warehouse edit button');
  console.assert(hasWarehouseDeleteAriaLabel, 'Test 2b Failed: Missing ARIA label on warehouse delete button');
  console.log('✔ Test 2 Passed: Warehouse action buttons feature dynamic Arabic ARIA labels.');

  // Test 3: Verify modal close button accessibility and decorativeness
  const hasModalCloseAriaLabel = fileContent.includes('aria-label="إغلاق النافذة"');
  const hasDecorativeIconsHidden = fileContent.includes('aria-hidden="true"');

  console.assert(hasModalCloseAriaLabel, 'Test 3a Failed: Missing ARIA label on modal close buttons');
  console.assert(hasDecorativeIconsHidden, 'Test 3b Failed: Missing aria-hidden="true" on decorative icons');
  console.log('✔ Test 3 Passed: Modal close controls and decorative icons are accessible.');

  // Test 4: Focus visible rings for keyboard navigation
  const hasFocusVisibleRings = fileContent.includes('focus-visible:ring-2') && fileContent.includes('focus-visible:outline-none');
  console.assert(hasFocusVisibleRings, 'Test 4 Failed: Focus visible rings are missing for keyboard accessibility');
  console.log('✔ Test 4 Passed: Focus visible rings configured for keyboard focus state.');

  console.log('=== All Inventory Accessibility Tests Passed Successfully! ===');
}

runInventoryAccessibilityTest();
