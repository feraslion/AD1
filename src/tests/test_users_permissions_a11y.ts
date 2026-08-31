import fs from 'fs';
import path from 'path';

function runUsersPermissionsA11yTest() {
  console.log("=== USERS & PERMISSIONS ACCESSIBILITY (A11Y) VERIFICATION ===");

  const componentPath = path.resolve(process.cwd(), 'src/shared/components/UsersAndPermissions.tsx');
  const source = fs.readFileSync(componentPath, 'utf8');

  // 1. Check Dialog ARIA roles and modal binding
  if (!source.includes('role="dialog"') || !source.includes('aria-modal="true"')) {
    throw new Error('FAIL: Modal dialog missing role="dialog" or aria-modal="true" attributes');
  }

  if (!source.includes('aria-labelledby="user-modal-title"') || !source.includes('id="user-modal-title"')) {
    throw new Error('FAIL: User Modal missing aria-labelledby or matching title ID binding');
  }

  if (!source.includes('aria-labelledby="role-modal-title"') || !source.includes('id="role-modal-title"')) {
    throw new Error('FAIL: Role Modal missing aria-labelledby or matching title ID binding');
  }

  // 2. Check Escape key dismissal handler
  if (!source.includes("e.key === 'Escape'") && !source.includes('Escape')) {
    throw new Error('FAIL: Component missing Escape key dismissal event listener');
  }

  // 3. Check Sub-tabs navigation semantics
  if (!source.includes('role="tablist"') || !source.includes('role="tab"')) {
    throw new Error('FAIL: Sub-tabs navigation missing role="tablist" or role="tab" ARIA semantics');
  }

  if (!source.includes('aria-selected={activeSubTab ===')) {
    throw new Error('FAIL: Sub-tabs missing dynamic aria-selected binding');
  }

  // 4. Check Localized Close Button labels & Lucide X Icon
  if (!source.includes('aria-label="إغلاق"') || !source.includes('<X ')) {
    throw new Error('FAIL: Modal close button missing localized aria-label="إغلاق" or Lucide X icon');
  }

  // 5. Check Action Buttons ARIA Labels
  if (!source.includes('aria-label="تحديث مصفوفة الصلاحيات"')) {
    throw new Error('FAIL: Refresh button missing explicit aria-label');
  }

  if (!source.includes('aria-label={`تعديل الموظف ${u.name}`}') || !source.includes('aria-label={`حذف الموظف ${u.name}`}')) {
    throw new Error('FAIL: User action buttons missing dynamic aria-label');
  }

  // 6. Check Decorative Icon Hiding
  if (!source.includes('aria-hidden="true"')) {
    throw new Error('FAIL: Interactive icons missing aria-hidden="true" attribute');
  }

  // 7. Check Visible Focus Ring Indicators
  if (!source.includes('focus-visible:ring-2')) {
    throw new Error('FAIL: Interactive controls missing visible focus-visible:ring-2 focus indicators');
  }

  console.log("✓ All Users & Permissions accessibility (A11y) assertions passed successfully!");
}

runUsersPermissionsA11yTest();
