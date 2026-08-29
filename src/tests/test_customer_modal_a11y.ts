import fs from 'fs';
import path from 'path';

function runAccessibilityCheck() {
  console.log('=== Verifying CustomerFormModal Accessibility Enhancements ===\n');

  const filePath = path.join(process.cwd(), 'src/modules/customers/CustomerFormModal.tsx');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check 1: role="dialog"
  if (!content.includes('role="dialog"')) {
    throw new Error('CustomerFormModal missing role="dialog"');
  }
  console.log('✓ role="dialog" attribute found');

  // Check 2: aria-modal="true"
  if (!content.includes('aria-modal="true"')) {
    throw new Error('CustomerFormModal missing aria-modal="true"');
  }
  console.log('✓ aria-modal="true" attribute found');

  // Check 3: aria-labelledby binding
  if (!content.includes('aria-labelledby="customer-form-modal-title"')) {
    throw new Error('CustomerFormModal missing aria-labelledby binding');
  }
  if (!content.includes('id="customer-form-modal-title"')) {
    throw new Error('CustomerFormModal missing matching header title id');
  }
  console.log('✓ aria-labelledby and title ID correctly bound');

  // Check 4: Localized close button label
  if (!content.includes('aria-label="إغلاق النافذة"')) {
    throw new Error('CustomerFormModal missing localized close button aria-label');
  }
  console.log('✓ Close button localized aria-label found');

  // Check 5: Escape key listener
  if (!content.includes('e.key === \'Escape\'')) {
    throw new Error('CustomerFormModal missing Escape key dismissal handler');
  }
  console.log('✓ Escape key dismissal handler verified');

  // Check 6: aria-hidden on decorative icons
  if (!content.includes('aria-hidden="true"')) {
    throw new Error('CustomerFormModal missing aria-hidden on decorative icons');
  }
  console.log('✓ Decorative icons marked with aria-hidden="true"');

  // Check 7: focus-visible ring styles
  if (!content.includes('focus-visible:ring-2')) {
    throw new Error('CustomerFormModal missing focus-visible ring styles');
  }
  console.log('✓ Focus ring styles verified for keyboard navigation');

  console.log('\n✅ All CustomerFormModal accessibility checks PASSED!');
}

runAccessibilityCheck();
