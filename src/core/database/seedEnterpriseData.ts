import { db } from './index.ts';
import { ensureDatabaseTables } from './initSchema.ts';
import { 
  companies, 
  warehouses, 
  categories, 
  units, 
  accounts, 
  currencies, 
  paymentMethods,
  taxes
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedEnterpriseData() {
  console.log('[Seed] Seeding enterprise ERP base data...');
  
  // 1. Ensure DB Schema exists
  await ensureDatabaseTables();

  // 2. Default Company
  const existingComp = await db.select().from(companies).where(eq(companies.id, 'company-1'));
  if (existingComp.length === 0) {
    await db.insert(companies).values({
      id: 'company-1',
      name: 'المؤسسة الرئيسية',
      taxNumber: '300000000000003',
      email: 'info@ad1-erp.com',
      phone: '0110000000',
      address: 'الرياض - المملكة العربية السعودية'
    }).catch(() => {});
  }

  // 3. Default Warehouses (wh_main, wh_sec, wh_west)
  const defaultWarehouses = [
    { id: 'wh_main', companyId: 'company-1', name: 'المستودع الرئيسي', code: 'WH-MAIN', location: 'الرياض - المركز الرئيسي' },
    { id: 'wh_sec', companyId: 'company-1', name: 'المستودع الفرعي', code: 'WH-SEC', location: 'الرياض - الفرع الشمالي' },
    { id: 'wh_west', companyId: 'company-1', name: 'مستودع الغربية', code: 'WH-WEST', location: 'جدة - حي الصفا' }
  ];

  for (const wh of defaultWarehouses) {
    const existingWh = await db.select().from(warehouses).where(eq(warehouses.id, wh.id));
    if (existingWh.length === 0) {
      await db.insert(warehouses).values(wh).catch(() => {});
    }
  }

  // 4. Default Categories & Units
  const existingCat = await db.select().from(categories).where(eq(categories.id, 'cat_general'));
  if (existingCat.length === 0) {
    await db.insert(categories).values({
      id: 'cat_general',
      name: 'عام',
      icon: 'box',
      companyId: 'company-1'
    }).catch(() => {});
  }

  const existingUnit = await db.select().from(units).where(eq(units.id, 'unit_piece'));
  if (existingUnit.length === 0) {
    await db.insert(units).values({
      id: 'unit_piece',
      name: 'حبة'
    }).catch(() => {});
  }

  // 5. Default Chart of Accounts
  const defaultAccounts = [
    { id: 'acc_cash', code: '1101', name: 'النقدية والصندوق', type: 'asset', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_bank', code: '1102', name: 'البنك الرئيسي', type: 'asset', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_receivable', code: '1103', name: 'العملاء (مدينون)', type: 'asset', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_ar', code: '1103', name: 'العملاء (مدينون)', type: 'asset', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_inventory', code: '1104', name: 'المخزون السلعي', type: 'asset', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_payable', code: '2101', name: 'الموردون (دائنون)', type: 'liability', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_ap', code: '2101', name: 'الموردون (دائنون)', type: 'liability', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_tax', code: '2102', name: 'ضريبة القيمة المضافة', type: 'liability', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_vat_payable', code: '2102', name: 'ضريبة القيمة المضافة', type: 'liability', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_equity', code: '3101', name: 'رأس المال', type: 'equity', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_sales', code: '4101', name: 'إيرادات المبيعات', type: 'revenue', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_fx_gain_loss', code: '4201', name: 'أرباح وخسائر عملات', type: 'revenue', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_forex_gain', code: '4201', name: 'أرباح فروق العملات', type: 'revenue', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة', type: 'expense', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_expense', code: '5201', name: 'مصروفات تشغيلية', type: 'expense', currency: 'SAR', companyId: 'company-1', balance: '0' },
    { id: 'acc_expenses', code: '5201', name: 'مصروفات تشغيلية', type: 'expense', currency: 'SAR', companyId: 'company-1', balance: '0' },
  ];

  for (const acc of defaultAccounts) {
    const existingAcc = await db.select().from(accounts).where(eq(accounts.id, acc.id));
    if (existingAcc.length === 0) {
      await db.insert(accounts).values(acc).catch(() => {});
    }
  }

  // 6. Default Currencies
  const defaultCurrencies = [
    { id: 'curr_sar', code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', exchangeRate: '1.0', isBase: true },
    { id: 'curr_usd', code: 'USD', name: 'دولار أمريكي', symbol: '$', exchangeRate: '3.75', isBase: false },
    { id: 'curr_syp', code: 'SYP', name: 'ليرة سورية', symbol: 'ل.س', exchangeRate: '0.00025', isBase: false },
    { id: 'curr_try', code: 'TRY', name: 'ليرة تركية', symbol: '₺', exchangeRate: '0.11', isBase: false }
  ];

  for (const curr of defaultCurrencies) {
    const existingCurr = await db.select().from(currencies).where(eq(currencies.code, curr.code));
    if (existingCurr.length === 0) {
      await db.insert(currencies).values(curr).catch(() => {});
    }
  }

  // 7. Default Taxes
  const existingTax = await db.select().from(taxes).where(eq(taxes.id, 'tax_vat15'));
  if (existingTax.length === 0) {
    await db.insert(taxes).values({
      id: 'tax_vat15',
      name: 'ضريبة القيمة المضافة 15%',
      code: 'VAT_15',
      rate: '15.00',
      isInclusive: 'false',
      companyId: 'company-1'
    }).catch(() => {});
  }

  // 8. Default Payment Methods
  const defaultPms = [
    { id: 'pm_cash', name: 'نقداً', code: 'CASH', type: 'cash', accountId: 'acc_cash', companyId: 'company-1' },
    { id: 'pm_card', name: 'بطاقة مدى / ائتمان', code: 'CARD', type: 'card', accountId: 'acc_bank', companyId: 'company-1' },
    { id: 'pm_bank', name: 'تحويل بنكي', code: 'BANK', type: 'bank', accountId: 'acc_bank', companyId: 'company-1' }
  ];

  for (const pm of defaultPms) {
    const existingPm = await db.select().from(paymentMethods).where(eq(paymentMethods.id, pm.id));
    if (existingPm.length === 0) {
      await db.insert(paymentMethods).values(pm).catch(() => {});
    }
  }

  console.log('✓ Enterprise base data seeded successfully.');
}
