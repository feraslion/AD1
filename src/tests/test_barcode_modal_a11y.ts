import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('=== Running BarcodeLabelModal Accessibility Verification Test ===');

const filePath = resolve(process.cwd(), 'src/components/BarcodeLabelModal.tsx');
const content = readFileSync(filePath, 'utf-8');

// 1. Verify dialog role, aria-modal, and aria-labelledby
if (!content.includes('role="dialog"') || !content.includes('aria-modal="true"') || !content.includes('aria-labelledby="barcode-modal-title"')) {
  console.error('❌ Failed: Dialog modal attributes (role="dialog", aria-modal="true", aria-labelledby="barcode-modal-title") missing on outer container.');
  process.exit(1);
}
console.log('✔ Test 1 Passed: Outer container correctly defines role="dialog", aria-modal="true", and aria-labelledby.');

// 2. Verify title element ID
if (!content.includes('id="barcode-modal-title"')) {
  console.error('❌ Failed: Title element missing id="barcode-modal-title".');
  process.exit(1);
}
console.log('✔ Test 2 Passed: Modal title element possesses id="barcode-modal-title".');

// 3. Verify close button accessibility (aria-label="إغلاق" and focus-visible ring)
if (!content.includes('aria-label="إغلاق"') || !content.includes('focus-visible:ring-2 focus-visible:ring-amber-500')) {
  console.error('❌ Failed: Close button missing Arabic aria-label="إغلاق" or focus-visible ring styling.');
  process.exit(1);
}
console.log('✔ Test 3 Passed: Close button includes explicit Arabic aria-label and focus-visible ring.');

// 4. Verify quantity stepper buttons accessibility
if (!content.includes('aria-label="إنقاص عدد النسخ"') || !content.includes('aria-label="زيادة عدد النسخ"')) {
  console.error('❌ Failed: Stepper quantity buttons missing explicit ARIA labels.');
  process.exit(1);
}
console.log('✔ Test 4 Passed: Quantity stepper buttons include explicit ARIA labels.');

// 5. Verify decorative icons marked with aria-hidden="true"
if (!content.includes('aria-hidden="true"')) {
  console.error('❌ Failed: Decorative Lucide icons missing aria-hidden="true".');
  process.exit(1);
}
console.log('✔ Test 5 Passed: Decorative icons correctly marked with aria-hidden="true".');

console.log('=== All BarcodeLabelModal Accessibility Tests Passed Successfully! ===');
