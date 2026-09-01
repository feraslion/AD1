import fs from 'fs';
import path from 'path';

declare const process: any;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('=== Running VirtualKeyboardModal Accessibility Verification Test ===\n');

const componentPath = path.resolve('src/shared/components/ui/VirtualKeyboardModal.tsx');
assert(fs.existsSync(componentPath), 'VirtualKeyboardModal.tsx file exists');

const content = fs.readFileSync(componentPath, 'utf-8');

// 1. Check Dialog ARIA attributes & Title binding
assert(content.includes('role="dialog"'), 'Component has role="dialog"');
assert(content.includes('aria-modal="true"'), 'Component has aria-modal="true"');
assert(content.includes('aria-labelledby="virtual-keyboard-modal-title"'), 'Component binds aria-labelledby to modal title ID');
assert(content.includes('id="virtual-keyboard-modal-title"'), 'Modal title element has matching ID');

// 2. Check localized Arabic aria-labels on key controls
assert(content.includes('aria-label="إغلاق لوحة المفاتيح"'), 'Close button has localized aria-label');
assert(content.includes('aria-label="نص لوحة المفاتيح"'), 'Textarea has localized aria-label');
assert(content.includes('aria-label="نسخ النص"'), 'Copy button has localized aria-label');
assert(content.includes('aria-label="مسح النص"'), 'Clear button has localized aria-label');
assert(content.includes('aria-label="إدراج ونص الكاشير"'), 'Insert button has localized aria-label');
assert(content.includes('aria-label="تغيير اللغة"'), 'Language switch button has localized aria-label');
assert(content.includes('aria-label="تبديل الأحرف الكبيرة"'), 'Shift toggle button has localized aria-label');
assert(content.includes('aria-label="تراجع"'), 'Backspace key has localized aria-label');
assert(content.includes('aria-label="مسافة"'), 'Space bar key has localized aria-label');

// 3. Check decorative icons are aria-hidden="true"
assert(content.includes('<Keyboard className="w-5 h-5" aria-hidden="true" />'), 'Keyboard icon is aria-hidden');
assert(content.includes('<X className="w-5 h-5" aria-hidden="true" />'), 'X icon is aria-hidden');
assert(content.includes('aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />'), 'Copy/Check icons are aria-hidden');
assert(content.includes('<Trash2 className="w-4 h-4" aria-hidden="true" />'), 'Trash2 icon is aria-hidden');
assert(content.includes('<ArrowLeftRight className="w-4 h-4 text-amber-400" aria-hidden="true" />'), 'ArrowLeftRight icon is aria-hidden');

// 4. Check focus indicators for keyboard navigation
assert(content.includes('focus-visible:ring-2 focus-visible:ring-indigo-500'), 'Includes visible focus rings for keyboard navigation');

console.log('✔ All VirtualKeyboardModal Accessibility Tests Passed Successfully!\n');
