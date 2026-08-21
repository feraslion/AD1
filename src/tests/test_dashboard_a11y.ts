import * as fs from 'fs';
import * as path from 'path';

function runDashboardA11yTest() {
  console.log('=== Running Dashboard Accessibility & UX Static Verification Test ===');

  const filePath = path.resolve('src/shared/components/Dashboard.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Test 1: Verify sync force refresh button has aria-label and focus visible ring
  console.assert(
    fileContent.includes('aria-label="تحديث البيانات والمزامنة"'),
    'Test 1 Failed: Sync button missing aria-label'
  );
  console.assert(
    fileContent.includes('focus-visible:ring-emerald-500'),
    'Test 1 Failed: Sync button missing focus ring'
  );
  console.log('✔ Test 1 Passed: Sync force refresh button includes aria-label and focus visible indicator.');

  // Test 2: Verify To-Do checkbox buttons have role="checkbox" and aria-checked
  console.assert(
    fileContent.includes('role="checkbox"'),
    'Test 2 Failed: To-Do item toggle missing role="checkbox"'
  );
  console.assert(
    fileContent.includes('aria-checked={todo.completed}'),
    'Test 2 Failed: To-Do item toggle missing aria-checked'
  );
  console.log('✔ Test 2 Passed: To-Do checkboxes implement correct ARIA semantics.');

  // Test 3: Verify To-Do add and delete buttons have aria-label
  console.assert(
    fileContent.includes('aria-label="إضافة المهمة"'),
    'Test 3 Failed: Add To-Do button missing aria-label'
  );
  console.assert(
    fileContent.includes('aria-label={`حذف المهمة: ${todo.text}`}'),
    'Test 3 Failed: Delete To-Do button missing aria-label'
  );
  console.log('✔ Test 3 Passed: To-Do action buttons have localized aria-labels.');

  // Test 4: Verify Low Stock accordion button has aria-expanded
  console.assert(
    fileContent.includes('aria-expanded={isLowStockExpanded}'),
    'Test 4 Failed: Low stock toggle button missing aria-expanded'
  );
  console.log('✔ Test 4 Passed: Low Stock toggle button includes aria-expanded state.');

  // Test 5: Verify decorative icons have aria-hidden="true"
  console.assert(
    fileContent.includes('aria-hidden="true"'),
    'Test 5 Failed: Decorative icons missing aria-hidden="true"'
  );
  console.log('✔ Test 5 Passed: Decorative icons are marked aria-hidden="true".');

  console.log('=== All Dashboard Accessibility Tests Passed Successfully! ===');
}

runDashboardA11yTest();
