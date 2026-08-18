import { readFileSync } from 'fs';
import { resolve } from 'path';

function runCameraScannerA11yTest() {
  console.log('🧪 Starting CameraBarcodeScanner Accessibility Verification Test...');

  const filePath = resolve(process.cwd(), 'src/modules/sales/CameraBarcodeScanner.tsx');
  const sourceCode = readFileSync(filePath, 'utf-8');

  const assertions: { name: string; condition: boolean }[] = [
    {
      name: 'Modal contains role="dialog"',
      condition: sourceCode.includes('role="dialog"'),
    },
    {
      name: 'Modal contains aria-modal="true"',
      condition: sourceCode.includes('aria-modal="true"'),
    },
    {
      name: 'Modal contains aria-labelledby="camera-modal-title"',
      condition: sourceCode.includes('aria-labelledby="camera-modal-title"'),
    },
    {
      name: 'Heading has id="camera-modal-title"',
      condition: sourceCode.includes('id="camera-modal-title"'),
    },
    {
      name: 'Close button has explicit localized aria-label',
      condition: sourceCode.includes('aria-label="إغلاق نافذة الكاميرا"'),
    },
    {
      name: 'Camera select dropdown has aria-label',
      condition: sourceCode.includes('aria-label="اختر الكاميرا"'),
    },
    {
      name: 'Torch toggle button has aria-label and aria-pressed state',
      condition: sourceCode.includes('aria-label="تفعيل فلاش الكاميرا"') && sourceCode.includes('aria-pressed={torchOn}'),
    },
    {
      name: 'Sound toggle button has dynamic aria-label and aria-pressed state',
      condition: sourceCode.includes('aria-pressed={soundEnabled}') && sourceCode.includes("aria-label={soundEnabled ? 'إيقاف التنبيه الصوتي' : 'تفعيل التنبيه الصوتي'}"),
    },
    {
      name: 'Decorative icons have aria-hidden="true"',
      condition: sourceCode.includes('aria-hidden="true"'),
    },
    {
      name: 'Interactive controls have focus-visible ring classes',
      condition: sourceCode.includes('focus-visible:ring-2'),
    },
  ];

  let passedCount = 0;
  assertions.forEach(assertion => {
    if (assertion.condition) {
      console.log(`  ✅ PASS: ${assertion.name}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${assertion.name}`);
    }
  });

  if (passedCount === assertions.length) {
    console.log(`\n🎉 All ${assertions.length} accessibility assertions passed successfully!`);
    process.exit(0);
  } else {
    console.error(`\n💥 ${assertions.length - passedCount} assertion(s) failed.`);
    process.exit(1);
  }
}

runCameraScannerA11yTest();
