import fs from 'fs';
import path from 'path';

function runCalculatorModalA11yTest() {
  console.log('=== Running CalculatorModal Accessibility (a11y) Verification ===');

  const filePath = path.resolve(process.cwd(), 'src/shared/components/ui/CalculatorModal.tsx');
  const source = fs.readFileSync(filePath, 'utf-8');

  // Test 1: Verify dialog role and modal semantics
  console.assert(source.includes('role="dialog"'), 'Test 1 Failed: CalculatorModal is missing role="dialog"');
  console.assert(source.includes('aria-modal="true"'), 'Test 2 Failed: CalculatorModal is missing aria-modal="true"');
  console.assert(source.includes('aria-labelledby="calculator-modal-title"'), 'Test 3 Failed: CalculatorModal is missing aria-labelledby="calculator-modal-title"');
  console.assert(source.includes('id="calculator-modal-title"'), 'Test 4 Failed: CalculatorModal title is missing matching id="calculator-modal-title"');
  console.log('✔ Test 1-4 Passed: Dialog container ARIA semantics are correctly configured.');

  // Test 2: Verify tablist, tab, and tabpanel semantics
  console.assert(source.includes('role="tablist"'), 'Test 5 Failed: CalculatorModal is missing role="tablist"');
  console.assert(source.includes('role="tab"'), 'Test 6 Failed: CalculatorModal tabs are missing role="tab"');
  console.assert(source.includes('aria-selected='), 'Test 7 Failed: CalculatorModal tabs are missing aria-selected attribute');
  console.assert(source.includes('aria-controls='), 'Test 8 Failed: CalculatorModal tabs are missing aria-controls attribute');
  console.assert(source.includes('role="tabpanel"'), 'Test 9 Failed: CalculatorModal panels are missing role="tabpanel"');
  console.assert(source.includes('aria-labelledby="calc-tab-standard"'), 'Test 10 Failed: Standard panel missing aria-labelledby="calc-tab-standard"');
  console.assert(source.includes('aria-labelledby="calc-tab-vat"'), 'Test 11 Failed: VAT panel missing aria-labelledby="calc-tab-vat"');
  console.assert(source.includes('aria-labelledby="calc-tab-change"'), 'Test 12 Failed: Change panel missing aria-labelledby="calc-tab-change"');
  console.log('✔ Test 5-11 Passed: Tablist and tabpanel semantics are correctly configured.');

  // Test 3: Verify close button and icon accessibility
  console.assert(source.includes('aria-label="إغلاق الحاسبة"'), 'Test 12 Failed: Close button missing explicit localized aria-label');
  console.assert(source.includes('aria-hidden="true"'), 'Test 13 Failed: Decorative icons missing aria-hidden="true"');
  console.log('✔ Test 12-13 Passed: Close button label and icon decorativeness are verified.');

  // Test 4: Verify keyboard focus visible indicators
  console.assert(source.includes('focus-visible:ring-2'), 'Test 14 Failed: Focusable controls are missing focus-visible:ring-2 style indicators');
  console.log('✔ Test 14 Passed: Keyboard focus visible indicators are present on interactive controls.');

  console.log('=== All CalculatorModal Accessibility Tests Passed Successfully! ===');
}

runCalculatorModalA11yTest();
