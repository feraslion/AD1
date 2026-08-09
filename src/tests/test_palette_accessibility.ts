import { readFileSync } from 'fs';
import { join } from 'path';

console.log('=== Starting Specialized Accessibility Static Integration Test ===');

const modalPath = join(process.cwd(), 'src/shared/components/ui/SocialShareModal.tsx');
let content = '';

try {
  content = readFileSync(modalPath, 'utf-8');
} catch (e) {
  console.error('❌ Failed to read SocialShareModal.tsx file:', e);
  process.exit(1);
}

let errors = 0;

// Helper to assert matches
const assertContains = (pattern: string | RegExp, description: string) => {
  const matched = typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
  if (matched) {
    console.log(`✔ SUCCESS: ${description}`);
  } else {
    console.error(`❌ FAILURE: ${description} (Pattern: ${pattern.toString()})`);
    errors++;
  }
};

// 1. Verify ARIA Label relationships on close button
assertContains('aria-label="إغلاق نافذة المشاركة"', 'Close button must have an explicit aria-label for Arabic screen readers.');

// 2. Verify Keyboard focus indicators
assertContains('focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none', 'Close button must have visible focus ring indicators.');

// 3. Verify labels htmlFor and input id associations
assertContains('htmlFor="customer-share-name"', 'Customer name label must be linked using htmlFor.');
assertContains('id="customer-share-name"', 'Customer name input must be linked using matching id.');

assertContains('htmlFor="customer-share-phone"', 'Customer phone label must be linked using htmlFor.');
assertContains('id="customer-share-phone"', 'Customer phone input must be linked using matching id.');

assertContains('htmlFor="customer-share-email"', 'Customer email label must be linked using htmlFor.');
assertContains('id="customer-share-email"', 'Customer email input must be linked using matching id.');

// 4. Verify Tablist structural roles & accessibility
assertContains('role="tablist"', 'Tabs container must have role="tablist".');
assertContains('role="tab"', 'Tab items must have role="tab".');
assertContains('aria-selected={activeTab ===', 'Tab items must track aria-selected state dynamically.');

if (errors > 0) {
  console.error(`\n❌ Specialized Accessibility Test failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('\n✔ All Specialized Accessibility Static Integration Tests Passed Successfully!');
  process.exit(0);
}
