import fs from 'fs';
import path from 'path';

console.log('=== Running Products Component Accessibility (a11y) Verification Test ===');

const productsFilePath = path.join(process.cwd(), 'src/modules/products/Products.tsx');
if (!fs.existsSync(productsFilePath)) {
  console.error(`❌ ERROR: File not found at path: ${productsFilePath}`);
  process.exit(1);
}

const content = fs.readFileSync(productsFilePath, 'utf-8');

// Test 1: Verify presence of aria-label attributes for icon/action buttons
console.log('[Test 1] Verifying presence of localized aria-label attributes...');
const requiredAriaLabels = [
  'تحديث البيانات',
  'مسح حقل البحث',
  'تغيير اتجاه الترتيب',
  'سجل حركة المنتج',
  'طباعة باركود',
  'تعديل'
];

for (const label of requiredAriaLabels) {
  if (!content.includes(label)) {
    console.error(`❌ FAIL: Missing expected aria-label containing "${label}" in Products.tsx`);
    process.exit(1);
  }
}
console.log('✔ Test 1 Passed: Localized aria-label attributes present.');

// Test 2: Verify decorative icons have aria-hidden="true"
console.log('[Test 2] Verifying decorative icons have aria-hidden="true"...');
if (!content.includes('aria-hidden="true"')) {
  console.error('❌ FAIL: Expected aria-hidden="true" on decorative icons in Products.tsx');
  process.exit(1);
}
console.log('✔ Test 2 Passed: Decorative icons correctly set aria-hidden="true".');

// Test 3: Verify focus visible rings for keyboard navigation
console.log('[Test 3] Verifying focus-visible indicators for keyboard accessibility...');
if (!content.includes('focus-visible:ring-2')) {
  console.error('❌ FAIL: Expected focus-visible:ring-2 indicators on interactive elements in Products.tsx');
  process.exit(1);
}
console.log('✔ Test 3 Passed: Focus visible rings configured for keyboard accessibility.');

console.log('=== All Products Accessibility Tests Passed Successfully! ===');
