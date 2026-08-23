import fs from 'fs';
import path from 'path';

console.log('=== Running Accessibility Verification for SocialShareModal.tsx ===');

const filePath = path.join(process.cwd(), 'src/shared/components/ui/SocialShareModal.tsx');
const code = fs.readFileSync(filePath, 'utf-8');

const checks = [
  { name: 'Modal dialog role attribute', regex: /role="dialog"/ },
  { name: 'Modal aria-modal attribute', regex: /aria-modal="true"/ },
  { name: 'Modal aria-labelledby attribute', regex: /aria-labelledby="social-share-modal-title"/ },
  { name: 'Matching title id', regex: /id="social-share-modal-title"/ },
  { name: 'Escape key event listener', regex: /e\.key === 'Escape'/ },
  { name: 'Tablist role for platform navigation', regex: /role="tablist"/ },
  { name: 'Tab role for platform buttons', regex: /role="tab"/ },
  { name: 'aria-selected attribute on tabs', regex: /aria-selected=/ },
  { name: 'Localized Arabic aria-label on close buttons', regex: /aria-label="إغلاق/ },
  { name: 'Localized Arabic aria-label on tab buttons', regex: /aria-label="مشاركة عبر/ },
  { name: 'Localized Arabic aria-label on file upload button', regex: /aria-label=\{attachedFile \?/ },
  { name: 'Localized Arabic aria-label on copy message button', regex: /aria-label="نسخ نص الرسالة إلى الحافظة"/ },
  { name: 'aria-hidden on decorative icons', regex: /aria-hidden="true"/ },
  { name: 'Focus ring indicators', regex: /focus-visible:ring-2/ },
];

let failed = false;

for (const check of checks) {
  if (check.regex.test(code)) {
    console.log(`✅ Passed: ${check.name}`);
  } else {
    console.error(`❌ Failed: ${check.name}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSocialShareModal accessibility checks failed!');
  process.exit(1);
} else {
  console.log('\nAll SocialShareModal accessibility checks passed successfully! 🎉');
}
