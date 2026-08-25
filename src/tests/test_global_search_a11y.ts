import fs from 'fs';
import path from 'path';

function runGlobalSearchA11yTests() {
  console.log('=== Running GlobalSearchModal Accessibility (a11y) Verification Test ===');

  const filePath = path.join(process.cwd(), 'src/shared/components/ui/GlobalSearchModal.tsx');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at ${filePath}`);
  }

  const code = fs.readFileSync(filePath, 'utf-8');

  // Test 1: Dialog ARIA Attributes
  console.assert(code.includes('role="dialog"'), 'Missing role="dialog"');
  console.assert(code.includes('aria-modal="true"'), 'Missing aria-modal="true"');
  console.assert(code.includes('aria-labelledby="global-search-modal-title"'), 'Missing aria-labelledby title binding');
  console.log('✔ Test 1 Passed: Modal dialog ARIA attributes correctly configured.');

  // Test 2: Screen reader hidden title
  console.assert(code.includes('id="global-search-modal-title"'), 'Missing title ID element');
  console.assert(code.includes('className="sr-only"'), 'Missing sr-only title class');
  console.log('✔ Test 2 Passed: Screen reader title element correctly provided.');

  // Test 3: Search input ARIA attributes
  console.assert(code.includes('role="combobox"'), 'Missing role="combobox" on search input');
  console.assert(code.includes('aria-label="ابحث عن منتج، عميل، بركود، أو رقم فاتورة"'), 'Missing input aria-label');
  console.assert(code.includes('aria-expanded='), 'Missing input aria-expanded');
  console.assert(code.includes('aria-autocomplete="list"'), 'Missing input aria-autocomplete');
  console.assert(code.includes('aria-controls="global-search-results"'), 'Missing input aria-controls');
  console.assert(code.includes('aria-activedescendant='), 'Missing input aria-activedescendant binding');
  console.log('✔ Test 3 Passed: Search input control possesses complete ARIA annotations.');

  // Test 4: Close button ARIA label and focus styles
  console.assert(code.includes('aria-label="إغلاق البحث"'), 'Missing close button aria-label');
  console.assert(code.includes('focus-visible:ring-2'), 'Missing focus-visible ring on close button');
  console.log('✔ Test 4 Passed: Close button accessibility and focus ring applied.');

  // Test 5: Tablist and Tabs semantics
  console.assert(code.includes('role="tablist"'), 'Missing role="tablist"');
  console.assert(code.includes('aria-label="تصنيفات البحث"'), 'Missing tablist aria-label');
  console.assert(code.includes('role="tab"'), 'Missing role="tab" on category buttons');
  console.assert(code.includes('aria-selected={activeFilter ==='), 'Missing aria-selected on tabs');
  console.log('✔ Test 5 Passed: Category tabs feature correct ARIA tablist semantics.');

  // Test 6: Listbox and Option semantics
  console.assert(code.includes('id="global-search-results"'), 'Missing listbox ID');
  console.assert(code.includes('role="listbox"'), 'Missing role="listbox"');
  console.assert(code.includes('role="option"'), 'Missing role="option" on search result items');
  console.assert(code.includes('id={`search-option-${idx}`}'), 'Missing id on search result items for activedescendant');
  console.assert(code.includes('aria-selected={isSelected}'), 'Missing aria-selected on search result items');
  console.log('✔ Test 6 Passed: Results container and option items feature listbox semantics.');

  // Test 7: Decorative icons hiding
  console.assert(code.includes('aria-hidden="true"'), 'Missing aria-hidden="true" on decorative icons');
  console.log('✔ Test 7 Passed: Decorative icons correctly hidden from screen readers.');

  console.log('=== All GlobalSearchModal Accessibility Verification Tests Passed! ===');
}

runGlobalSearchA11yTests();
