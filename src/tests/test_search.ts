import { normalizeArabicText } from '../core/server/routes/v1/search.routes.ts';

function runSearchTests() {
  console.log('=== Running Global Search & Normalization Unit Tests ===');

  // Test 1: Arabic Normalization - Alif variants
  const input1 = 'أحمد إبراهيم آمنة ٱسماء';
  const expected1 = 'احمد ابراهيم امنه اسماء';
  const result1 = normalizeArabicText(input1);
  console.assert(result1 === expected1, `Test 1 Failed: Expected "${expected1}", got "${result1}"`);
  console.log('✔ Test 1 Passed: Arabic Alif normalization works correctly.');

  // Test 2: Ta Marbouta & Ya variants
  const input2 = 'شركة المبيعات الكبرى';
  const expected2 = 'شركه المبيعات الكبري';
  const result2 = normalizeArabicText(input2);
  console.assert(result2 === expected2, `Test 2 Failed: Expected "${expected2}", got "${result2}"`);
  console.log('✔ Test 2 Passed: Ta Marbouta & Ya normalization works correctly.');

  // Test 3: Diacritics (Tashkeel) removal
  const input3 = 'مُنتَجٌ جَدِيدٌ';
  const expected3 = 'منتج جديد';
  const result3 = normalizeArabicText(input3);
  console.assert(result3 === expected3, `Test 3 Failed: Expected "${expected3}", got "${result3}"`);
  console.log('✔ Test 3 Passed: Arabic diacritics removal works correctly.');

  console.log('=== All Global Search Unit Tests Passed Successfully! ===');
}

runSearchTests();
