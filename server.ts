import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Enforce required security environment variables early in server startup
const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.REFRESH_SECRET;

if (!jwtSecret || !refreshSecret) {
  console.error('\n==================================================================');
  console.error('❌ CRITICAL CONFIGURATION ERROR: MISSING REQUIRED SECURITY KEYS');
  console.error('==================================================================');
  console.error('Both JWT_SECRET and REFRESH_SECRET environment variables must be defined.');
  console.error('To run the server, please set these variables in your environment.');
  console.error('Example:');
  console.error('  export JWT_SECRET="your-super-secure-64-plus-character-access-secret"');
  console.error('  export REFRESH_SECRET="your-super-secure-64-plus-character-refresh-secret"');
  console.error('==================================================================\n');
  throw new Error('Required security environment variables (JWT_SECRET, REFRESH_SECRET) are missing.');
}

import { db } from './src/core/database/index.ts';
import { ensureDatabaseTables } from './src/core/database/initSchema.ts';
import {
  users,
  roles,
  permissions,
  rolePermissions,
  postingRules,
  companies,
  branches,
  accounts,
  suppliers,
  units,
  categories,
  cashboxes,
  currencies,
  settings
} from './src/core/database/schema.ts';
import { DEFAULT_CURRENCIES } from './src/services/CurrencyService.ts';
import v1Router from './src/core/server/routes/v1/index.ts';
import { authRouter } from './src/core/server/routes/authRoutes.ts';
import { defaultRateLimiter } from './src/core/server/middleware/rateLimiter.ts';
import { errorHandler } from './src/core/server/middleware/errorHandler.ts';
import apiRouter from './src/core/server/routes/api/index.ts';
import { authenticate, AuthenticatedUser } from './src/core/server/routes/api/helpers.ts';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// ─── REQUEST LOGGER MIDDLEWARE ───
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const userStr = req.user ? `${req.user.name} (${req.user.role})` : 'Guest';
  console.log(`[${timestamp}] ${req.method} ${req.url} - User: ${userStr}`);
  next();
}

app.use('/api', defaultRateLimiter);
app.use('/api/auth', authRouter);
app.use('/api', authenticate);
app.use('/api', requestLogger);
app.use('/api/v1', v1Router);

// ─── MOUNT THE DECOUPLED DOMAIN ROUTER ───
app.use('/api', apiRouter);

// ─── DATABASE SEEDER FOR DEFAULT ERP CONVENTIONS ───
async function seedDefaultData() {
  try {
    await ensureDatabaseTables();

    const existingCompanies = await db.select().from(companies);
    if (existingCompanies.length === 0) {
      console.log('Seeding default Company...');
      await db.insert(companies).values({
        id: 'company-1',
        name: 'المؤسسة الرئيسية',
        taxNumber: '300000000000003',
        email: 'info@company.com',
        phone: '0110000000',
        address: 'الرياض، المملكة العربية السعودية'
      });
    }

    const existingBranches = await db.select().from(branches);
    if (existingBranches.length === 0) {
      console.log('Seeding default Branch...');
      await db.insert(branches).values({
        id: 'branch-1',
        companyId: 'company-1',
        name: 'الفرع الرئيسي',
        code: 'BR-MAIN',
        address: 'الرياض'
      });
    }

    const existingAccounts = await db.select().from(accounts);
    if (existingAccounts.length === 0) {
      console.log('Seeding default Chart of Accounts...');
      const defaultAccounts = [
        { id: 'acc_cash', code: '1101', name: 'النقدية بالصندوق (Cash)', type: 'asset', balance: '0' },
        { id: 'acc_bank', code: '1102', name: 'الحساب البنكي (Bank)', type: 'asset', balance: '0' },
        { id: 'acc_receivable', code: '1103', name: 'الذمم المدينة للعملاء (Receivables)', type: 'asset', balance: '0' },
        { id: 'acc_inventory', code: '1201', name: 'مخزون البضائع (Inventory)', type: 'asset', balance: '0' },
        { id: 'acc_payable', code: '2101', name: 'الذمم الدائنة للموردين (Payables)', type: 'liability', balance: '0' },
        { id: 'acc_tax', code: '2201', name: 'ضريبة القيمة المضافة المستحقة (VAT)', type: 'liability', balance: '0' },
        { id: 'acc_equity', code: '3101', name: 'رأس المال (Capital)', type: 'equity', balance: '0' },
        { id: 'acc_sales', code: '4101', name: 'إيراد المبيعات (Sales Revenue)', type: 'revenue', balance: '0' },
        { id: 'acc_forex_gain', code: '4201', name: 'أرباح فروق العملة (Gain on FX)', type: 'revenue', balance: '0' },
        { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة (COGS)', type: 'expense', balance: '0' },
        { id: 'acc_expense', code: '5201', name: 'المصاريف العمومية والتشغيلية (Expenses)', type: 'expense', balance: '0' },
        { id: 'acc_forex_loss', code: '5202', name: 'خسائر فروق العملة (Loss on FX)', type: 'expense', balance: '0' },
      ];
      await db.insert(accounts).values(defaultAccounts);
      console.log('Chart of Accounts seeded successfully.');
    }

    const existingSuppliers = await db.select().from(suppliers);
    if (existingSuppliers.length === 0) {
      console.log('Seeding default Suppliers...');
      const defaultSuppliers = [
        { id: 'supp-1', name: 'شركة المراعي الوطنية', phone: '0114944444', email: 'info@almarai.com', balance: '0' },
        { id: 'supp-2', name: 'شركة لوزين للمخبوزات', phone: '0112345678', email: 'sales@lusine.com', balance: '0' },
        { id: 'supp-3', name: 'موزع حلويات الخليج', phone: '0501112223', email: 'dist@gulfsweets.com', balance: '0' },
      ];
      await db.insert(suppliers).values(defaultSuppliers);
    }

    const existingUnits = await db.select().from(units);
    if (existingUnits.length === 0) {
      console.log('Seeding default Units...');
      const defaultUnits = [
        { id: '1', name: 'حبة' },
        { id: '2', name: 'كيلو' },
        { id: '3', name: 'كرتون' },
        { id: '4', name: 'لتر' },
        { id: '5', name: 'شدة' },
        { id: '6', name: 'جرام' }
      ];
      await db.insert(units).values(defaultUnits);
    }

    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      console.log('Seeding default Categories...');
      const defaultCategories = [
        { id: 'cat-1', name: 'المعلبات والأغذية', icon: '🥫' },
        { id: 'cat-2', name: 'المخبوزات والحلويات', icon: '🍞' },
        { id: 'cat-3', name: 'المشروبات والعصائر', icon: '🥤' },
        { id: 'cat-4', name: 'الألبان والأجبان', icon: '🧀' },
        { id: 'cat-5', name: 'الخضروات والفواكه', icon: '🍎' }
      ];
      await db.insert(categories).values(defaultCategories);
    }

    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      console.log('Seeding default ERP Roles...');
      const defaultRoles = [
        { id: 'role_manager', name: 'المدير العام', code: 'manager', description: 'صلاحيات كاملة على كافة النظام والتحكم بالصلاحيات والمستخدمين' },
        { id: 'role_accountant', name: 'المحاسب المالي', code: 'accountant', description: 'إدارة الحسابات وقيود اليومية والتقارير المالية والضريبية' },
        { id: 'role_inventory', name: 'أمين المستودع', code: 'inventory', description: 'إدارة المنتجات، الكميات، التحركات المخزنية وفواتير المشتريات' },
        { id: 'role_cashier', name: 'موظف الكاشير', code: 'cashier', description: 'إجراء المبيعات وإصدار فواتير نقاط البيع السريعة' }
      ];
      await db.insert(roles).values(defaultRoles);
    }

    const existingPermissions = await db.select().from(permissions);
    if (existingPermissions.length === 0) {
      console.log('Seeding default ERP Permissions...');
      const defaultPermissions = [
        { id: 'p_view_dashboard', name: 'عرض لوحة التحكم', code: 'view_dashboard', module: 'dashboard', description: 'عرض الإحصائيات العامة للمؤسسة' },
        { id: 'p_pos_access', name: 'الوصول لنقطة البيع', code: 'pos_access', module: 'sales', description: 'استخدام كاشير المبيعات ونقاط البيع' },
        { id: 'p_manage_inventory', name: 'إدارة المنتجات والمخزن', code: 'manage_inventory', module: 'inventory', description: 'إضافة وتعديل المنتجات وإدارة الكميات والتحركات' },
        { id: 'p_view_invoices', name: 'عرض الفواتير والضرائب', code: 'view_invoices', module: 'sales', description: 'الاطلاع على فواتير المبيعات والتقارير الضريبية' },
        { id: 'p_view_reports', name: 'عرض التقارير والأرباح', code: 'view_reports', module: 'dashboard', description: 'عرض التقارير المالية التفصيلية وحساب الأربائر والخسائر' },
        { id: 'p_view_purchases', name: 'المشتريات والمدفوعات', code: 'view_purchases', module: 'purchases', description: 'إدارة فواتير المشتريات ومستحقات الموردين' },
        { id: 'p_view_accounting', name: 'القيود والحسابات المالية', code: 'view_accounting', module: 'accounting', description: 'إدارة الدفاتر المحاسبية وشجرة الحسابات وقيود اليومية' },
        { id: 'p_view_settings', name: 'إعدادات النظام والضريبة', code: 'view_settings', module: 'settings', description: 'إعدادات المتجر وبيانات الضريبة والطباعة الحرارية' },
        { id: 'p_manage_users', name: 'إدارة المستخدمين والصلاحيات', code: 'manage_users', module: 'users', description: 'إدارة ملفات الموظفين وأدوارهم وصلاحياتهم' }
      ];
      await db.insert(permissions).values(defaultPermissions);
    }

    const existingRolePerms = await db.select().from(rolePermissions);
    if (existingRolePerms.length === 0) {
      console.log('Seeding default Role Permissions...');
      const defaultRolePerms = [
        // Manager gets everything
        { id: 'rp1', roleId: 'role_manager', permissionId: 'p_view_dashboard' },
        { id: 'rp2', roleId: 'role_manager', permissionId: 'p_pos_access' },
        { id: 'rp3', roleId: 'role_manager', permissionId: 'p_manage_inventory' },
        { id: 'rp4', roleId: 'role_manager', permissionId: 'p_view_invoices' },
        { id: 'rp5', roleId: 'role_manager', permissionId: 'p_view_reports' },
        { id: 'rp6', roleId: 'role_manager', permissionId: 'p_view_purchases' },
        { id: 'rp7', roleId: 'role_manager', permissionId: 'p_view_accounting' },
        { id: 'rp8', roleId: 'role_manager', permissionId: 'p_view_settings' },
        { id: 'rp9', roleId: 'role_manager', permissionId: 'p_manage_users' },

        // Accountant
        { id: 'rp10', roleId: 'role_accountant', permissionId: 'p_view_dashboard' },
        { id: 'rp11', roleId: 'role_accountant', permissionId: 'p_pos_access' },
        { id: 'rp12', roleId: 'role_accountant', permissionId: 'p_view_invoices' },
        { id: 'rp13', roleId: 'role_accountant', permissionId: 'p_view_reports' },
        { id: 'rp14', roleId: 'role_accountant', permissionId: 'p_view_purchases' },
        { id: 'rp15', roleId: 'role_accountant', permissionId: 'p_view_accounting' },

        // Inventory
        { id: 'rp16', roleId: 'role_inventory', permissionId: 'p_view_dashboard' },
        { id: 'rp17', roleId: 'role_inventory', permissionId: 'p_manage_inventory' },
        { id: 'rp18', roleId: 'role_inventory', permissionId: 'p_view_purchases' },

        // Cashier
        { id: 'rp19', roleId: 'role_cashier', permissionId: 'p_pos_access' },
        { id: 'rp20', roleId: 'role_cashier', permissionId: 'p_view_invoices' }
      ];
      await db.insert(rolePermissions).values(defaultRolePerms);
    }

    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log('Seeding default ERP Users with Role IDs...');
      const defaultUsers = [
        { id: '001', uid: '001', email: 'manager@system.com', name: 'عبدالرحمن (المدير العام)', role: 'manager', roleId: 'role_manager' },
        { id: '002', uid: '002', email: 'accountant@system.com', name: 'ياسر (المحاسب المالي)', role: 'accountant', roleId: 'role_accountant' },
        { id: '003', uid: '003', email: 'inventory@system.com', name: 'أنس (أمين المستودع)', role: 'inventory', roleId: 'role_inventory' },
        { id: '004', uid: '004', email: 'cashier@system.com', name: 'أحمد (موظف الكاشير)', role: 'cashier', roleId: 'role_cashier' }
      ];
      await db.insert(users).values(defaultUsers);
      console.log('ERP Users seeded successfully.');
    } else {
      // For existing users, update roleId if it is null
      for (const u of existingUsers) {
        if (!u.roleId) {
          let roleId = 'role_cashier';
          if (u.role === 'manager') roleId = 'role_manager';
          else if (u.role === 'accountant') roleId = 'role_accountant';
          else if (u.role === 'inventory') roleId = 'role_inventory';
          
          await db.update(users).set({ roleId }).where(eq(users.id, u.id));
        }
      }
    }

    const existingBoxes = await db.select().from(cashboxes);
    if (existingBoxes.length === 0) {
      console.log('Seeding default Cashboxes...');
      const defaultBoxes = [
        { id: 'box_main', name: 'الصندوق الرئيسي (المبيعات اليومية)', status: 'closed', currentBalance: '0' },
        { id: 'box_spare', name: 'صندوق الطوارئ الاحتياطي', status: 'closed', currentBalance: '0' }
      ];
      await db.insert(cashboxes).values(defaultBoxes);
    }

    const existingRules = await db.select().from(postingRules);
    if (existingRules.length === 0) {
      console.log('Seeding default Posting Rules...');
      const defaultRules = [
        { id: 'pr_s_cash', ruleCode: 'sales_cash_debit', accountId: 'acc_cash', description: 'حساب مدين المبيعات النقدية (الصندوق)' },
        { id: 'pr_s_bank', ruleCode: 'sales_bank_debit', accountId: 'acc_bank', description: 'حساب مدين المبيعات البنكية (الشبكة)' },
        { id: 'pr_s_credit', ruleCode: 'sales_credit_debit', accountId: 'acc_receivable', description: 'حساب مدين المبيعات الآجلة (العملاء)' },
        { id: 'pr_s_rev', ruleCode: 'sales_revenue_credit', accountId: 'acc_sales', description: 'حساب دائن إيرادات المبيعات' },
        { id: 'pr_s_tax', ruleCode: 'sales_tax_credit', accountId: 'acc_tax', description: 'حساب دائن ضريبة القيمة المضافة المحتسبة' },
        { id: 'pr_s_cogs', ruleCode: 'sales_cogs_debit', accountId: 'acc_cogs', description: 'حساب مدين تكلفة البضاعة المباعة' },
        { id: 'pr_s_inv', ruleCode: 'sales_inventory_credit', accountId: 'acc_inventory', description: 'حساب دائن المخزون (المبيعات)' },
        { id: 'pr_p_cash', ruleCode: 'purchase_cash_credit', accountId: 'acc_cash', description: 'حساب دائن المشتريات النقدية (الصندوق)' },
        { id: 'pr_p_bank', ruleCode: 'purchase_bank_credit', accountId: 'acc_bank', description: 'حساب دائن المشتريات البنكية (الشبكة)' },
        { id: 'pr_p_credit', ruleCode: 'purchase_credit_credit', accountId: 'acc_payable', description: 'حساب دائن المشتريات الآجلة (الموردين)' },
        { id: 'pr_p_inv', ruleCode: 'purchase_inventory_debit', accountId: 'acc_inventory', description: 'حساب مدين المخزون (المشتريات)' },
        { id: 'pr_p_tax', ruleCode: 'purchase_tax_debit', accountId: 'acc_tax', description: 'حساب مدين ضريبة مدخلات المشتريات' },
        { id: 'pr_e_deb', ruleCode: 'expense_debit', accountId: 'acc_expense', description: 'حساب مدين المصاريف التشغيلية' },
        { id: 'pr_e_cred', ruleCode: 'expense_credit', accountId: 'acc_cash', description: 'حساب دائن سداد المصاريف (الصندوق)' },
        { id: 'pr_pm_c_deb_cash', ruleCode: 'payment_customer_debit_cash', accountId: 'acc_cash', description: 'حساب مدين سندات القبض نقدًا (الصندوق)' },
        { id: 'pr_pm_c_deb_bank', ruleCode: 'payment_customer_debit_bank', accountId: 'acc_bank', description: 'حساب مدين سندات القبض بنكًا (الشبكة)' },
        { id: 'pr_pm_c_cred', ruleCode: 'payment_customer_credit', accountId: 'acc_receivable', description: 'حساب دائن تسوية عميل (سند قبض)' },
        { id: 'pr_pm_s_deb', ruleCode: 'payment_supplier_debit', accountId: 'acc_payable', description: 'حساب مدين تسوية مورد (سند صرف)' },
        { id: 'pr_pm_s_cred_cash', ruleCode: 'payment_supplier_credit_cash', accountId: 'acc_cash', description: 'حساب دائن سندات الصرف نقدًا (الصندوق)' },
        { id: 'pr_pm_s_cred_bank', ruleCode: 'payment_supplier_credit_bank', accountId: 'acc_bank', description: 'حساب دائن سندات الصرف بنكًا (الشبكة)' },
        { id: 'pr_forex_gain', ruleCode: 'forex_gain_credit', accountId: 'acc_forex_gain', description: 'حساب أرباح فروق تسعير العملات' },
        { id: 'pr_forex_loss', ruleCode: 'forex_loss_debit', accountId: 'acc_forex_loss', description: 'حساب خسائر فروق تسعير العملات' },
      ];
      await db.insert(postingRules).values(defaultRules);
      console.log('Posting Rules seeded successfully.');
    }

    const existingCurrencies = await db.select().from(currencies);
    if (existingCurrencies.length === 0) {
      console.log('Seeding default Currencies (SAR, USD, SYP, TRY)...');
      for (const curr of DEFAULT_CURRENCIES) {
        await db.insert(currencies).values({
          id: curr.id,
          code: curr.code,
          name: curr.name,
          symbol: curr.symbol,
          exchangeRate: curr.exchangeRate.toString(),
          isDefault: curr.isDefault ? 'true' : 'false',
        });
      }
      console.log('Default Currencies seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database default data:', error);
  }
}

app.use(errorHandler);

// ─── VITE DEV / PROD MIDDLEWARE INTEGRATION ───
async function startServer() {
  try {
    await ensureDatabaseTables();
    await seedDefaultData();
  } catch (err) {
    console.error('Error during database table check / seedDefaultData initialization:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
