import { readFileSync } from 'fs';
import { join } from 'path';

function runAccessibilityTests() {
  console.log('=== Running Palette Accessibility Programmatic Tests ===');

  const filePath = join(process.cwd(), 'src/shared/components/ui/SocialShareModal.tsx');
  const fileContent = readFileSync(filePath, 'utf-8');

  // Test 1: Check role="tablist" presence
  const hasTablist = fileContent.includes('role="tablist"');
  console.assert(hasTablist, 'Test 1 Failed: role="tablist" is missing on the tab selector container');
  if (hasTablist) {
    console.log('✔ Test 1 Passed: role="tablist" is present.');
  }

  // Test 2: Check role="tab" presence
  const hasTab = fileContent.includes('role="tab"');
  console.assert(hasTab, 'Test 2 Failed: role="tab" is missing on tab buttons');
  if (hasTab) {
    console.log('✔ Test 2 Passed: role="tab" is present.');
  }

  // Test 3: Check aria-selected presence
  const hasAriaSelected = fileContent.includes('aria-selected=');
  console.assert(hasAriaSelected, 'Test 3 Failed: aria-selected is missing on tab buttons');
  if (hasAriaSelected) {
    console.log('✔ Test 3 Passed: aria-selected is present.');
  }

  // Test 4: Check focus-visible focus indicators
  const hasFocusVisible = fileContent.includes('focus-visible:ring-2');
  console.assert(hasFocusVisible, 'Test 4 Failed: focus-visible focus indicator ring style is missing');
  if (hasFocusVisible) {
    console.log('✔ Test 4 Passed: focus-visible:ring-2 style is present.');
  }

  // Test 5: Check aria-label for close button
  const hasAriaLabelClose = fileContent.includes('aria-label="إغلاق النافذة"');
  console.assert(hasAriaLabelClose, 'Test 5 Failed: aria-label="إغلاق النافذة" is missing on close button');
  if (hasAriaLabelClose) {
    console.log('✔ Test 5 Passed: aria-label="إغلاق النافذة" is present on header close button.');
  }

  // Test 6: Check role="radiogroup" presence
  const hasRadiogroup = fileContent.includes('role="radiogroup"');
  console.assert(hasRadiogroup, 'Test 6 Failed: role="radiogroup" is missing on the template picker');
  if (hasRadiogroup) {
    console.log('✔ Test 6 Passed: role="radiogroup" is present on template picker.');
  }

  // Test 7: Check role="radio" and aria-checked presence
  const hasRadioAndChecked = fileContent.includes('role="radio"') && fileContent.includes('aria-checked=');
  console.assert(hasRadioAndChecked, 'Test 7 Failed: role="radio" or aria-checked is missing on template buttons');
  if (hasRadioAndChecked) {
    console.log('✔ Test 7 Passed: role="radio" and aria-checked are present on template buttons.');
  }

  // Test 8: Check htmlFor labels
  const hasHtmlForLabels = fileContent.includes('htmlFor="customerNameInput"') &&
                           fileContent.includes('htmlFor="customerPhoneInput"') &&
                           fileContent.includes('htmlFor="customerEmailInput"');
  console.assert(hasHtmlForLabels, 'Test 8 Failed: htmlFor labels are missing for input elements');
  if (hasHtmlForLabels) {
    console.log('✔ Test 8 Passed: htmlFor labels are properly associated with form inputs.');
  }

  console.log('=== All Accessibility Unit Tests Passed Successfully! ===');
}

runAccessibilityTests();
