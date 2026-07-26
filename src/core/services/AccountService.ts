import { db } from '../database/index.ts';
import { accounts, journalLines, journalDetails } from '../database/schema.ts';
import { eq, asc, inArray, and, sql } from 'drizzle-orm';
import { CurrencyRepository } from '../repositories/CurrencyRepository.ts';
import { withAutoMigration } from '../database/initSchema.ts';

export interface AccountInput {
  id?: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | string;
  balance?: number;
  currency?: string;
  foreignBalance?: number;
  companyId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}

export interface AccountTreeNode {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  foreignBalance: number;
  companyId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
  isActive: boolean;
  level: number;
  children: AccountTreeNode[];
}

export class AccountService {
  // Normalize account type to lowercase standard ('asset', 'liability', 'equity', 'revenue', 'expense')
  static normalizeType(type: string): string {
    const t = (type || '').toLowerCase().trim();
    if (['asset', 'assets', 'أصول', 'أصل'].includes(t)) return 'asset';
    if (['liability', 'liabilities', 'خصوم', 'التزامات'].includes(t)) return 'liability';
    if (['equity', 'حقوق ملكية', 'حقوق الملكية'].includes(t)) return 'equity';
    if (['revenue', 'revenues', 'إيرادات', 'مبيعات'].includes(t)) return 'revenue';
    if (['expense', 'expenses', 'مصروفات', 'مصاريف'].includes(t)) return 'expense';
    return t;
  }

  // Calculate account hierarchy level based on parent chain
  static async getAccountLevel(parentId?: string | null): Promise<number> {
    if (!parentId) return 1;
    const parent = await this.getAccountById(parentId);
    if (!parent) return 1;
    return (await this.getAccountLevel(parent.parentId)) + 1;
  }

  // Get all accounts flat list
  static async getAccounts(filter?: { companyId?: string; type?: string; activeOnly?: boolean; search?: string }) {
    return await withAutoMigration(async () => {
      let all = await db.select().from(accounts).orderBy(asc(accounts.code));

      if (filter?.companyId) {
        all = all.filter(a => a.companyId === filter.companyId || !a.companyId);
      }

      if (filter?.type && filter.type !== 'all') {
        const targetType = this.normalizeType(filter.type);
        all = all.filter(a => this.normalizeType(a.type) === targetType);
      }

      if (filter?.activeOnly) {
        all = all.filter(a => (a as any).isActive !== false);
      }

      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        all = all.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
      }

      return all.map(a => ({
        ...a,
        balance: parseFloat(a.balance || '0'),
        foreignBalance: parseFloat(a.foreignBalance || '0'),
        isActive: (a as any).isActive !== false
      }));
    });
  }

  // Get hierarchical Chart of Accounts tree
  static async getAccountsTree(companyId?: string): Promise<AccountTreeNode[]> {
    const flatAccounts = await this.getAccounts({ companyId });

    // Map by ID
    const accountMap = new Map<string, AccountTreeNode>();
    const rootNodes: AccountTreeNode[] = [];

    // Initialize nodes
    flatAccounts.forEach(acc => {
      accountMap.set(acc.id, {
        ...acc,
        level: 1,
        children: []
      });
    });

    // Build hierarchy
    flatAccounts.forEach(acc => {
      const node = accountMap.get(acc.id)!;
      if (acc.parentId && accountMap.has(acc.parentId)) {
        const parent = accountMap.get(acc.parentId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  // Find single account by ID
  static async getAccountById(id: string) {
    const res = await db.select().from(accounts).where(eq(accounts.id, id));
    if (!res[0]) return null;
    const a = res[0];
    return {
      ...a,
      balance: parseFloat(a.balance || '0'),
      foreignBalance: parseFloat(a.foreignBalance || '0'),
      isActive: (a as any).isActive !== false
    };
  }

  // Find single account by Code
  static async getAccountByCode(code: string) {
    const res = await db.select().from(accounts).where(eq(accounts.code, code.trim()));
    if (!res[0]) return null;
    const a = res[0];
    return {
      ...a,
      balance: parseFloat(a.balance || '0'),
      foreignBalance: parseFloat(a.foreignBalance || '0'),
      isActive: (a as any).isActive !== false
    };
  }

  // Suggest next code for sub-account based on smart numbering scheme
  static async suggestChildCode(parentId: string): Promise<string> {
    const parent = await this.getAccountById(parentId);
    if (!parent) throw new Error('الحساب الرئيسي غير موجود');

    const children = await db.select().from(accounts).where(eq(accounts.parentId, parentId)).orderBy(asc(accounts.code));
    if (children.length === 0) {
      return `${parent.code}01`;
    }

    const lastChildCode = children[children.length - 1].code;
    const numPart = parseInt(lastChildCode, 10);
    if (!isNaN(numPart)) {
      return (numPart + 1).toString();
    }
    return `${parent.code}${String(children.length + 1).padStart(2, '0')}`;
  }

  // Create or Update Account with full validations & hierarchy rules
  static async upsertAccount(data: AccountInput) {
    if (!data.code || !data.code.trim()) {
      throw new Error('رمز الحساب (code) مطلوب');
    }
    if (!data.name || !data.name.trim()) {
      throw new Error('اسم الحساب (name) مطلوب');
    }

    const normalizedType = this.normalizeType(data.type);
    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(normalizedType)) {
      throw new Error('نوع الحساب غير صالح. الأنواع المتاحة: asset, liability, equity, revenue, expense');
    }

    const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();
    const accountId = data.id || 'acc_' + Math.random().toString(36).substring(2, 10);

    // Validate unique code
    const existingCodeAcc = await this.getAccountByCode(data.code.trim());
    if (existingCodeAcc && existingCodeAcc.id !== accountId) {
      throw new Error(`رمز الحساب "${data.code}" مستخدم بالفعل بحساب آخر (${existingCodeAcc.name})`);
    }

    // Validate Parent Account
    if (data.parentId) {
      if (data.parentId === accountId) {
        throw new Error('لا يمكن اختيار الحساب كنفسه كأب');
      }

      const parent = await this.getAccountById(data.parentId);
      if (!parent) {
        throw new Error('الحساب الرئيسي المحدد غير موجود');
      }

      // Check Parent Type match
      const parentType = this.normalizeType(parent.type);
      if (parentType !== normalizedType) {
        throw new Error(`نوع الحساب الفرعي (${normalizedType}) يجب أن يطابق نوع الحساب الرئيسي (${parentType})`);
      }

      // Cycle detection
      let currentParentId: string | null = parent.parentId || null;
      while (currentParentId) {
        if (currentParentId === accountId) {
          throw new Error('تم اكتشاف حلقة هرمية غير صحيحة بين الحسابات (Cyclic Parent)');
        }
        const ancestor = await this.getAccountById(currentParentId);
        currentParentId = ancestor?.parentId || null;
      }
    }

    const dbValues: any = {
      id: accountId,
      code: data.code.trim(),
      name: data.name.trim(),
      type: normalizedType,
      balance: (data.balance || 0).toString(),
      currency: data.currency || baseCurrency,
      foreignBalance: (data.foreignBalance || 0).toString(),
      parentId: data.parentId || null,
      companyId: data.companyId || null,
      branchId: data.branchId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      updatedAt: new Date()
    };

    const existing = await this.getAccountById(accountId);
    if (existing) {
      await db.update(accounts).set(dbValues).where(eq(accounts.id, accountId));
    } else {
      dbValues.createdAt = new Date();
      await db.insert(accounts).values(dbValues);
    }

    return await this.getAccountById(accountId);
  }

  // Toggle active/inactive
  static async toggleAccountActive(id: string, isActive: boolean) {
    const acc = await this.getAccountById(id);
    if (!acc) throw new Error('الحساب غير موجود');

    await db.update(accounts).set({ isActive } as any).where(eq(accounts.id, id));
    return await this.getAccountById(id);
  }

  // Delete account safely
  static async deleteAccount(id: string) {
    const acc = await this.getAccountById(id);
    if (!acc) throw new Error('الحساب غير موجود');

    // Check for child accounts
    const children = await db.select().from(accounts).where(eq(accounts.parentId, id));
    if (children.length > 0) {
      throw new Error(`لا يمكن حذف الحساب (${acc.name}) لأنه يحتوي على ${children.length} حسابات فرعية.`);
    }

    // Check for journal details or lines
    const details = await db.select().from(journalDetails).where(eq(journalDetails.accountId, id));
    if (details.length > 0) {
      throw new Error(`لا يمكن حذف الحساب (${acc.name}) نظراً لوجود قيود محاسبية مسجلة عليه.`);
    }

    const lines = await db.select().from(journalLines).where(eq(journalLines.accountId, id));
    if (lines.length > 0) {
      throw new Error(`لا يمكن حذف الحساب (${acc.name}) نظراً لوجود حركة مسجلة عليه في دفتر الأستاذ.`);
    }

    await db.delete(accounts).where(eq(accounts.id, id));
    return { success: true, message: `تم حذف الحساب (${acc.name}) بنجاح` };
  }

  // Seed standard ERP Chart of Accounts with Multi-Currency (SAR, USD, SYP, TRY) and Multi-Company support
  static async seedDefaultChartOfAccounts(companyId?: string) {
    return await withAutoMigration(async () => {
      const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();

      const defaultAccounts: { id: string; code: string; name: string; type: string; parentId?: string; currency?: string }[] = [
      // 1. ASSETS (الأصول)
      { id: 'acc_1', code: '1', name: 'الأصول', type: 'asset' },
      { id: 'acc_11', code: '11', name: 'الأصول المتداولة', type: 'asset', parentId: 'acc_1' },
      
      // Cash Treasury Accounts
      { id: 'acc_cash', code: '1101', name: 'الصناديق والخزائن النقدية', type: 'asset', parentId: 'acc_11' },
      { id: 'acc_110101', code: '110101', name: 'الصندوق الرئيسي (محلي - SAR)', type: 'asset', parentId: 'acc_cash', currency: 'SAR' },
      { id: 'acc_110102', code: '110102', name: 'صندوق الدولار الأمريكي (USD)', type: 'asset', parentId: 'acc_cash', currency: 'USD' },
      { id: 'acc_110103', code: '110103', name: 'صندوق الليرة السورية (SYP)', type: 'asset', parentId: 'acc_cash', currency: 'SYP' },
      { id: 'acc_110104', code: '110104', name: 'صندوق الليرة التركية (TRY)', type: 'asset', parentId: 'acc_cash', currency: 'TRY' },
      
      // Bank Accounts
      { id: 'acc_bank', code: '1102', name: 'البنوك والمصارف', type: 'asset', parentId: 'acc_11' },
      { id: 'acc_110201', code: '110201', name: 'حساب البنك الرئيسي (SAR)', type: 'asset', parentId: 'acc_bank', currency: 'SAR' },
      { id: 'acc_110202', code: '110202', name: 'حساب بنك التجارة الدولي (USD)', type: 'asset', parentId: 'acc_bank', currency: 'USD' },
      { id: 'acc_110203', code: '110203', name: 'حساب البنك - ليرة تركية (TRY)', type: 'asset', parentId: 'acc_bank', currency: 'TRY' },
      
      // Receivables & Customers
      { id: 'acc_receivable', code: '1103', name: 'العملاء والمدينون', type: 'asset', parentId: 'acc_11' },
      { id: 'acc_110301', code: '110301', name: 'ذمم العملاء التجاريين (محلي)', type: 'asset', parentId: 'acc_receivable', currency: 'SAR' },
      { id: 'acc_110302', code: '110302', name: 'ذمم عملاء التصدير (USD)', type: 'asset', parentId: 'acc_receivable', currency: 'USD' },
      { id: 'acc_110303', code: '110303', name: 'ذمم العملاء الإقليمية (SYP/TRY)', type: 'asset', parentId: 'acc_receivable', currency: 'TRY' },

      // Inventory Accounts
      { id: 'acc_inventory', code: '1104', name: 'المخزون البضائعي', type: 'asset', parentId: 'acc_11' },
      { id: 'acc_110401', code: '110401', name: 'مخزون المنتجات الجاهزة للبيع', type: 'asset', parentId: 'acc_inventory', currency: 'SAR' },
      { id: 'acc_110402', code: '110402', name: 'مخزون المواد الخام والمستلزمات', type: 'asset', parentId: 'acc_inventory', currency: 'SAR' },
      
      // Fixed Assets
      { id: 'acc_12', code: '12', name: 'الأصول الثابتة', type: 'asset', parentId: 'acc_1' },
      { id: 'acc_1201', code: '1201', name: 'العقارات والمباني', type: 'asset', parentId: 'acc_12', currency: 'SAR' },
      { id: 'acc_1202', code: '1202', name: 'الآلات والمعدات التشغيلية', type: 'asset', parentId: 'acc_12', currency: 'SAR' },
      { id: 'acc_1203', code: '1203', name: 'السيارات ووسائل النقل', type: 'asset', parentId: 'acc_12', currency: 'SAR' },
      { id: 'acc_1204', code: '1204', name: 'الأثاث والديكورات والتجهيزات', type: 'asset', parentId: 'acc_12', currency: 'SAR' },

      // 2. LIABILITIES (الخصوم والالتزامات)
      { id: 'acc_2', code: '2', name: 'الخصوم والالتزامات', type: 'liability' },
      { id: 'acc_21', code: '21', name: 'الالتزامات المتداولة', type: 'liability', parentId: 'acc_2' },
      
      // Payables & Suppliers
      { id: 'acc_payable', code: '2101', name: 'الموردون والدائنون', type: 'liability', parentId: 'acc_21' },
      { id: 'acc_210101', code: '210101', name: 'ذمم الموردين المحليين (SAR)', type: 'liability', parentId: 'acc_payable', currency: 'SAR' },
      { id: 'acc_210102', code: '210102', name: 'ذمم الموردين الخارجيين (USD)', type: 'liability', parentId: 'acc_payable', currency: 'USD' },
      { id: 'acc_210103', code: '210103', name: 'ذمم الموردين الإقليميين (TRY)', type: 'liability', parentId: 'acc_payable', currency: 'TRY' },
      
      // Taxes & Accruals
      { id: 'acc_tax', code: '2102', name: 'الضرائب والمستحقات', type: 'liability', parentId: 'acc_21' },
      { id: 'acc_210201', code: '210201', name: 'ضريبة القيمة المضافة المستحقة (VAT)', type: 'liability', parentId: 'acc_tax', currency: 'SAR' },
      { id: 'acc_210202', code: '210202', name: 'مستحقات رواتب الموظفين', type: 'liability', parentId: 'acc_tax', currency: 'SAR' },

      // 3. EQUITY (حقوق الملكية)
      { id: 'acc_3', code: '3', name: 'حقوق الملكية', type: 'equity' },
      { id: 'acc_equity', code: '31', name: 'رأس المال والاحتياطيات', type: 'equity', parentId: 'acc_3' },
      { id: 'acc_3101', code: '3101', name: 'رأس المال المدفوع', type: 'equity', parentId: 'acc_equity', currency: 'SAR' },
      { id: 'acc_32', code: '32', name: 'الأرباح والخسائر المدورة', type: 'equity', parentId: 'acc_3', currency: 'SAR' },
      { id: 'acc_33', code: '33', name: 'مسحوبات الشركاء', type: 'equity', parentId: 'acc_3', currency: 'SAR' },

      // 4. REVENUE (الإيرادات)
      { id: 'acc_4', code: '4', name: 'الإيرادات', type: 'revenue' },
      { id: 'acc_41', code: '41', name: 'إيرادات النشاط الرئيسي', type: 'revenue', parentId: 'acc_4' },
      { id: 'acc_sales', code: '4101', name: 'مبيعات البضائع والخدمات', type: 'revenue', parentId: 'acc_41', currency: 'SAR' },
      { id: 'acc_4102', code: '4102', name: 'إيرادات المبيعات الخارجية (USD)', type: 'revenue', parentId: 'acc_41', currency: 'USD' },
      { id: 'acc_42', code: '42', name: 'إيرادات أخرى وفروق عملات', type: 'revenue', parentId: 'acc_4' },
      { id: 'acc_forex_gain', code: '4201', name: 'أرباح فروق أسعار الصرف (Forex Gain)', type: 'revenue', parentId: 'acc_42', currency: 'SAR' },

      // 5. EXPENSES (المصروفات)
      { id: 'acc_5', code: '5', name: 'المصروفات', type: 'expense' },
      { id: 'acc_51', code: '51', name: 'تكلفة البضاعة المباعة COGS', type: 'expense', parentId: 'acc_5' },
      { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة الرئيسية', type: 'expense', parentId: 'acc_51', currency: 'SAR' },
      { id: 'acc_52', code: '52', name: 'المصروفات الإدارية والتشغيلية', type: 'expense', parentId: 'acc_5' },
      { id: 'acc_expense', code: '5201', name: 'المصاريف التشغيلية العامة', type: 'expense', parentId: 'acc_52', currency: 'SAR' },
      { id: 'acc_5202', code: '5202', name: 'رواتب وأجور الموظفين', type: 'expense', parentId: 'acc_52', currency: 'SAR' },
      { id: 'acc_5203', code: '5203', name: 'إيجار المقرات والمستودعات', type: 'expense', parentId: 'acc_52', currency: 'SAR' },
      { id: 'acc_5204', code: '5204', name: 'الكهرباء والمياه والمرافق', type: 'expense', parentId: 'acc_52', currency: 'SAR' },
      { id: 'acc_forex_loss', code: '5205', name: 'خسائر فروق أسعار الصرف (Forex Loss)', type: 'expense', parentId: 'acc_52', currency: 'SAR' },
    ];

    let createdCount = 0;
    for (const acc of defaultAccounts) {
      const existing = await this.getAccountById(acc.id) || await this.getAccountByCode(acc.code);
      if (!existing) {
        await db.insert(accounts).values({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          balance: '0',
          currency: acc.currency || baseCurrency,
          foreignBalance: '0',
          parentId: acc.parentId || null,
          companyId: companyId || null
        });
        createdCount++;
      }
    }

    return { success: true, seededCount: createdCount };
    });
  }
}
