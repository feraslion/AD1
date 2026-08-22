import { readFileSync } from 'fs';
import { resolve } from 'path';

export function runBarcodeScannerModalA11yTest() {
  console.log('=== Starting BarcodeScannerModal Accessibility Verification ===\n');

  const filePath = resolve(process.cwd(), 'src/modules/sales/BarcodeScannerModal.tsx');
  const fileContent = readFileSync(filePath, 'utf8');

  // Check 1: Dialog ARIA attributes
  const hasDialogRole = fileContent.includes('role="dialog"');
  const hasAriaModal = fileContent.includes('aria-modal="true"');
  const hasAriaLabelledBy = fileContent.includes('aria-labelledby="barcode-scanner-modal-title"');
  const hasTitleId = fileContent.includes('id="barcode-scanner-modal-title"');

  if (!hasDialogRole || !hasAriaModal || !hasAriaLabelledBy || !hasTitleId) {
    throw new Error('BarcodeScannerModal is missing required dialog ARIA semantics.');
  }

  // Check 2: Keyboard Escape listener
  const hasEscapeListener = fileContent.includes("e.key === 'Escape'");
  if (!hasEscapeListener) {
    throw new Error('BarcodeScannerModal is missing Escape key handler.');
  }

  // Check 3: Tablist semantics
  const hasTablistRole = fileContent.includes('role="tablist"');
  const hasTabRole = fileContent.includes('role="tab"');
  const hasTabpanelRole = fileContent.includes('role="tabpanel"');
  const hasAriaSelected = fileContent.includes('aria-selected=');

  if (!hasTablistRole || !hasTabRole || !hasTabpanelRole || !hasAriaSelected) {
    throw new Error('BarcodeScannerModal is missing proper ARIA tablist structure.');
  }

  // Check 4: Localized ARIA labels & Focus Rings
  const hasCloseAriaLabel = fileContent.includes('aria-label="إغلاق النافذة"');
  const hasFocusVisibleRings = fileContent.includes('focus-visible:ring-2');

  if (!hasCloseAriaLabel || !hasFocusVisibleRings) {
    throw new Error('BarcodeScannerModal is missing ARIA labels or focus ring indicators.');
  }

  // Check 5: Decorative icons aria-hidden
  const hasAriaHiddenIcons = fileContent.includes('aria-hidden="true"');
  if (!hasAriaHiddenIcons) {
    throw new Error('BarcodeScannerModal has decorative icons without aria-hidden="true".');
  }

  console.log('🎉 ALL BARCODE SCANNER MODAL ACCESSIBILITY CHECKS PASSED SUCCESSFULLY!\n');
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBarcodeScannerModalA11yTest();
}
