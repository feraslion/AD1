import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  products,
  customers,
  suppliers,
  invoices,
  invoiceItems,
  accounts,
  journalEntries,
  journalDetails,
  expenses,
  settings,
  users
} from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Robust Two-Layer Error Handling
function handleApiError(res: express.Response, error: any, message: string) {
  console.error(`${message}:`, error);
  res.status(500).json({ error: message, details: error instanceof Error ? error.message : String(error) });
}

// Helper to generate Journal Entries (Accounting Engine)
async function postJournalEntry(entryNumber: string, description: string, date: string, lines: { accountId: string, debit: number, credit: number }[]) {
  const entryId = 'je_' + Math.random().toString(36).substr(2, 9);
  
  await db.insert(journalEntries).values({
    id: entryId,
    entryNumber,
    description,
    date
  });

  for (const line of lines) {
    const detailId = 'jd_' + Math.random().toString(36).substr(2, 9);
    
    await db.insert(journalDetails).values({
      id: detailId,
      journalEntryId: entryId,
      accountId: line.accountId,
      debit: line.debit.toString(),
      credit: line.credit.toString()
    });

    const [account] = await db.select().from(accounts).where(eq(accounts.id, line.accountId));
    if (account) {
      let currentBal = parseFloat(account.balance || '0');
      const change = line.debit - line.credit;
      
      if (account.type === 'asset' || account.type === 'expense') {
        currentBal += change;
      } else {
        currentBal -= change; // Credit increases balance for liabilities, equity, and revenues
      }

      await db.update(accounts).set({ balance: currentBal.toString() }).where(eq(accounts.id, line.accountId));
    }
  }
}

// API Routes

// 1. Products API
app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    // Map database numeric strings back to javascript numbers
    const mapped = allProducts.map(p => ({
      ...p,
      price: parseFloat(p.price || '0'),
      purchasePrice: parseFloat(p.purchasePrice || '0'),
      stock: parseFloat(p.stock || '0'),
      minStock: parseFloat(p.minStock || '0'),
      taxRate: parseFloat(p.taxRate || '15')
    }));
    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب المنتجات');
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const p = req.body;
    const existing = await db.select().from(products).where(eq(products.id, p.id));
    
    const dbValue = {
      id: p.id || 'prod_' + Math.random().toString(36).substr(2, 9),
      name: p.name,
      barcode: p.barcode,
      price: (p.price || 0).toString(),
      purchasePrice: (p.purchasePrice || 0).toString(),
      stock: (p.stock || 0).toString(),
      minStock: (p.minStock || 0).toString(),
      category: p.category || 'عام',
      unit: p.unit || 'حبة',
      taxRate: (p.taxRate ?? 15).toString(),
      image: p.image || '',
      description: p.description || ''
    };

    if (existing.length > 0) {
      await db.update(products).set(dbValue).where(eq(products.id, p.id));
    } else {
      await db.insert(products).values(dbValue);
    }
    res.json({ success: true, product: dbValue });
  } catch (error) {
    handleApiError(res, error, 'فشل حفظ المنتج');
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.delete(products).where(eq(products.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'فشل حذف المنتج');
  }
});

// 2. Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const allCustomers = await db.select().from(customers);
    const mapped = allCustomers.map(c => ({
      ...c,
      balance: parseFloat(c.balance || '0'),
      creditLimit: parseFloat(c.creditLimit || '5000')
    }));
    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب العملاء');
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const c = req.body;
    const id = c.id || 'cust_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      balance: (c.balance || 0).toString(),
      creditLimit: (c.creditLimit || 5000).toString()
    };

    const existing = await db.select().from(customers).where(eq(customers.id, id));
    if (existing.length > 0) {
      await db.update(customers).set(dbValue).where(eq(customers.id, id));
    } else {
      await db.insert(customers).values(dbValue);
    }
    res.json({ success: true, customer: dbValue });
  } catch (error) {
    handleApiError(res, error, 'فشل حفظ العميل');
  }
});

// 3. Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    const allSuppliers = await db.select().from(suppliers);
    const mapped = allSuppliers.map(s => ({
      ...s,
      balance: parseFloat(s.balance || '0')
    }));
    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب الموردين');
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const s = req.body;
    const id = s.id || 'supp_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      balance: (s.balance || 0).toString()
    };

    const existing = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (existing.length > 0) {
      await db.update(suppliers).set(dbValue).where(eq(suppliers.id, id));
    } else {
      await db.insert(suppliers).values(dbValue);
    }
    res.json({ success: true, supplier: dbValue });
  } catch (error) {
    handleApiError(res, error, 'فشل حفظ المورد');
  }
});

// 4. Invoices & POS Sales API
app.get('/api/invoices', async (req, res) => {
  try {
    const allInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    const allItems = await db.select().from(invoiceItems);

    const mapped = allInvoices.map(inv => {
      const items = allItems.filter(item => item.invoiceId === inv.id).map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        discountType: item.discountType as 'fixed' | 'percentage',
        total: parseFloat(item.total || '0'),
        taxAmount: parseFloat(item.taxAmount || '0')
      }));

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        items,
        totalWithoutTax: parseFloat(inv.totalWithoutTax || '0'),
        taxAmount: parseFloat(inv.taxAmount || '0'),
        discountAmount: parseFloat(inv.discountAmount || '0'),
        grandTotal: parseFloat(inv.grandTotal || '0'),
        paymentMethod: inv.paymentMethod as 'cash' | 'card' | 'credit' | 'split',
        paymentDetails: {
          cashAmount: parseFloat(inv.cashAmount || '0'),
          cardAmount: parseFloat(inv.cardAmount || '0')
        },
        status: inv.status as 'paid' | 'unpaid' | 'partially_paid',
        customerId: inv.customerId || undefined,
        customerName: inv.customerName || undefined,
        taxNumber: inv.taxNumber || undefined,
        cashierName: inv.cashierName
      };
    });

    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب الفواتير');
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const inv = req.body;
    const invId = inv.id || 'inv_' + Math.random().toString(36).substr(2, 9);
    
    // Create Invoice Record
    await db.insert(invoices).values({
      id: invId,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      totalWithoutTax: inv.totalWithoutTax.toString(),
      taxAmount: inv.taxAmount.toString(),
      discountAmount: inv.discountAmount.toString(),
      grandTotal: inv.grandTotal.toString(),
      paymentMethod: inv.paymentMethod,
      cashAmount: (inv.paymentDetails?.cashAmount || 0).toString(),
      cardAmount: (inv.paymentDetails?.cardAmount || 0).toString(),
      status: inv.status,
      customerId: inv.customerId || null,
      customerName: inv.customerName || null,
      taxNumber: inv.taxNumber || null,
      cashierName: inv.cashierName || 'أحمد الكاشير'
    });

    let totalCogs = 0;

    // Create Invoice Items Records and Update Stock
    for (const item of inv.items) {
      const itemId = 'item_' + Math.random().toString(36).substr(2, 9);
      await db.insert(invoiceItems).values({
        id: itemId,
        invoiceId: invId,
        productId: item.productId,
        productName: item.productName,
        price: item.price.toString(),
        quantity: item.quantity.toString(),
        discount: item.discount.toString(),
        discountType: item.discountType,
        total: item.total.toString(),
        taxAmount: item.taxAmount.toString()
      });

      // Update Stock in PostgreSQL
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        const purchasePrice = parseFloat(product.purchasePrice || '0');
        totalCogs += purchasePrice * item.quantity;

        // Deduct stock if not unlimited (unlimited indicated by stock 999 mock, but let's deduct normally)
        if (currentStock !== 999) {
          await db.update(products).set({
            stock: Math.max(0, currentStock - item.quantity).toString()
          }).where(eq(products.id, item.productId));
        }
      }
    }

    // ─── Automated Accounting integration (Double-entry journal posting) ───
    const accountingLines = [];

    // 1. Debit Cash/Bank/Receivable
    if (inv.paymentMethod === 'cash') {
      accountingLines.push({ accountId: 'acc_cash', debit: inv.grandTotal, credit: 0 });
    } else if (inv.paymentMethod === 'card') {
      accountingLines.push({ accountId: 'acc_bank', debit: inv.grandTotal, credit: 0 });
    } else if (inv.paymentMethod === 'credit') {
      accountingLines.push({ accountId: 'acc_receivable', debit: inv.grandTotal, credit: 0 });
      // Update Customer balance
      if (inv.customerId) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
        if (customer) {
          const newBal = parseFloat(customer.balance || '0') + inv.grandTotal;
          await db.update(customers).set({ balance: newBal.toString() }).where(eq(customers.id, inv.customerId));
        }
      }
    } else if (inv.paymentMethod === 'split') {
      const cashAmt = inv.paymentDetails?.cashAmount || 0;
      const cardAmt = inv.paymentDetails?.cardAmount || 0;
      if (cashAmt > 0) accountingLines.push({ accountId: 'acc_cash', debit: cashAmt, credit: 0 });
      if (cardAmt > 0) accountingLines.push({ accountId: 'acc_bank', debit: cardAmt, credit: 0 });
    }

    // 2. Credit Sales Revenue
    accountingLines.push({ accountId: 'acc_sales', debit: 0, credit: inv.totalWithoutTax });

    // 3. Credit VAT Payable
    if (inv.taxAmount > 0) {
      accountingLines.push({ accountId: 'acc_tax', debit: 0, credit: inv.taxAmount });
    }

    // 4. COGS & Inventory entries
    if (totalCogs > 0) {
      accountingLines.push({ accountId: 'acc_cogs', debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: 'acc_inventory', debit: 0, credit: totalCogs });
    }

    await postJournalEntry(
      `JE-INV-${inv.invoiceNumber}`,
      `فاتورة مبيعات رقم ${inv.invoiceNumber}`,
      inv.date,
      accountingLines
    );

    res.json({ success: true, invoiceId: invId });
  } catch (error) {
    handleApiError(res, error, 'فشل إنشاء الفاتورة');
  }
});

// 5. Expenses API
app.get('/api/expenses', async (req, res) => {
  try {
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    const mapped = allExpenses.map(e => ({
      ...e,
      amount: parseFloat(e.amount)
    }));
    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب المصاريف');
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const exp = req.body;
    const id = 'exp_' + Math.random().toString(36).substr(2, 9);
    
    await db.insert(expenses).values({
      id,
      description: exp.description,
      amount: exp.amount.toString(),
      accountId: 'acc_expense',
      date: exp.date
    });

    // ─── Automated Journal Entry for Expense ───
    await postJournalEntry(
      `JE-EXP-${id}`,
      `مصروف: ${exp.description}`,
      exp.date,
      [
        { accountId: 'acc_expense', debit: exp.amount, credit: 0 },
        { accountId: 'acc_cash', debit: 0, credit: exp.amount }
      ]
    );

    res.json({ success: true, id });
  } catch (error) {
    handleApiError(res, error, 'فشل تسجيل المصروف');
  }
});

// 6. Accounting reports & Ledger API
app.get('/api/accounting/accounts', async (req, res) => {
  try {
    const allAccounts = await db.select().from(accounts);
    res.json(allAccounts.map(acc => ({
      ...acc,
      balance: parseFloat(acc.balance || '0')
    })));
  } catch (error) {
    handleApiError(res, error, 'فشل جلب الحسابات');
  }
});

app.get('/api/accounting/journal-entries', async (req, res) => {
  try {
    const allEntries = await db.select().from(journalEntries).orderBy(desc(journalEntries.createdAt));
    const allDetails = await db.select().from(journalDetails);

    const mapped = allEntries.map(entry => {
      const details = allDetails.filter(d => d.journalEntryId === entry.id).map(d => ({
        id: d.id,
        accountId: d.accountId,
        debit: parseFloat(d.debit || '0'),
        credit: parseFloat(d.credit || '0')
      }));
      return { ...entry, details };
    });

    res.json(mapped);
  } catch (error) {
    handleApiError(res, error, 'فشل جلب قيود اليومية');
  }
});

app.post('/api/accounting/journal-entries', async (req, res) => {
  try {
    const { description, date, lines } = req.body;
    const entryNum = 'JE-MAN-' + Math.floor(1000 + Math.random() * 9000);
    await postJournalEntry(entryNum, description, date, lines);
    res.json({ success: true, entryNumber: entryNum });
  } catch (error) {
    handleApiError(res, error, 'فشل حفظ القيد المحاسبي اليدوي');
  }
});

// 7. Store Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const existing = await db.select().from(settings);
    if (existing.length === 0) {
      // Default Settings
      const defaultSettings = {
        id: 'global_settings',
        name: 'مطعم ومقهى السحاب',
        logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&h=100&fit=crop',
        address: 'الرياض، طريق الملك فهد',
        phone: '0501234567',
        taxNumber: '310234567800003',
        taxRate: '15',
        currency: 'ر.س',
        thermalPrinterWidth: '80mm'
      };
      await db.insert(settings).values(defaultSettings);
      return res.json({
        ...defaultSettings,
        taxRate: parseFloat(defaultSettings.taxRate)
      });
    }
    const current = existing[0];
    res.json({
      ...current,
      taxRate: parseFloat(current.taxRate || '15')
    });
  } catch (error) {
    handleApiError(res, error, 'فشل جلب إعدادات المتجر');
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    const dbValue = {
      id: 'global_settings',
      name: s.name,
      logo: s.logo || '',
      address: s.address || '',
      phone: s.phone || '',
      taxNumber: s.taxNumber || '',
      taxRate: (s.taxRate ?? 15).toString(),
      currency: s.currency || 'ر.س',
      thermalPrinterWidth: s.thermalPrinterWidth || '80mm'
    };

    const existing = await db.select().from(settings).where(eq(settings.id, 'global_settings'));
    if (existing.length > 0) {
      await db.update(settings).set(dbValue).where(eq(settings.id, 'global_settings'));
    } else {
      await db.insert(settings).values(dbValue);
    }
    res.json({ success: true, settings: dbValue });
  } catch (error) {
    handleApiError(res, error, 'فشل تحديث الإعدادات');
  }
});
// 8. Custom Seeder for ERP Chart of Accounts & Suppliers
async function seedDefaultData() {
  try {
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
        { id: 'acc_cogs', code: '5101', name: 'تكلفة البضاعة المباعة (COGS)', type: 'expense', balance: '0' },
        { id: 'acc_expense', code: '5201', name: 'المصاريف العمومية والتشغيلية (Expenses)', type: 'expense', balance: '0' },
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
  } catch (error) {
    console.error('Error seeding database default data:', error);
  }
}

// 9. Purchasing API
app.post('/api/purchases', async (req, res) => {
  try {
    const { supplierId, date, items, paymentMethod, invoiceNumber, taxAmount, totalWithoutTax, grandTotal } = req.body;
    
    // items: Array of { productId, purchasePrice, quantity }
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        const nextStock = currentStock === 999 ? 999 : currentStock + item.quantity;
        await db.update(products).set({
          stock: nextStock.toString(),
          purchasePrice: item.purchasePrice.toString()
        }).where(eq(products.id, item.productId));
      }
    }

    if (paymentMethod === 'credit' && supplierId) {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
      if (supplier) {
        const nextBalance = parseFloat(supplier.balance || '0') + grandTotal;
        await db.update(suppliers).set({ balance: nextBalance.toString() }).where(eq(suppliers.id, supplierId));
      }
    }

    const accountingLines = [];
    accountingLines.push({ accountId: 'acc_inventory', debit: totalWithoutTax, credit: 0 });
    if (taxAmount > 0) {
      accountingLines.push({ accountId: 'acc_tax', debit: taxAmount, credit: 0 });
    }

    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: 'acc_cash', debit: 0, credit: grandTotal });
    } else if (paymentMethod === 'card') {
      accountingLines.push({ accountId: 'acc_bank', debit: 0, credit: grandTotal });
    } else if (paymentMethod === 'credit') {
      accountingLines.push({ accountId: 'acc_payable', debit: 0, credit: grandTotal });
    }

    await postJournalEntry(
      `JE-PUR-${invoiceNumber}`,
      `فاتورة مشتريات رقم ${invoiceNumber}`,
      date,
      accountingLines
    );

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'فشل تسجيل فاتورة المشتريات');
  }
});

// 10. Customer Receipt Payments API
app.post('/api/payments/customer', async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, date, receiptNumber } = req.body;
    
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) throw new Error('العميل غير موجود');
    
    const nextBalance = parseFloat(customer.balance || '0') - amount;
    await db.update(customers).set({ balance: nextBalance.toString() }).where(eq(customers.id, customerId));

    const accountingLines = [];
    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: 'acc_cash', debit: amount, credit: 0 });
    } else {
      accountingLines.push({ accountId: 'acc_bank', debit: amount, credit: 0 });
    }
    accountingLines.push({ accountId: 'acc_receivable', debit: 0, credit: amount });

    await postJournalEntry(
      `JE-RCPT-${receiptNumber}`,
      `سند قبض عميل: ${customer.name}`,
      date,
      accountingLines
    );

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'فشل تسجيل سند القبض');
  }
});

// 11. Supplier Payments API
app.post('/api/payments/supplier', async (req, res) => {
  try {
    const { supplierId, amount, paymentMethod, date, paymentNumber } = req.body;
    
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) throw new Error('المورد غير موجود');
    
    const nextBalance = parseFloat(supplier.balance || '0') - amount;
    await db.update(suppliers).set({ balance: nextBalance.toString() }).where(eq(suppliers.id, supplierId));

    const accountingLines = [];
    accountingLines.push({ accountId: 'acc_payable', debit: amount, credit: 0 });
    if (paymentMethod === 'cash') {
      accountingLines.push({ accountId: 'acc_cash', debit: 0, credit: amount });
    } else {
      accountingLines.push({ accountId: 'acc_bank', debit: 0, credit: amount });
    }

    await postJournalEntry(
      `JE-PAY-${paymentNumber}`,
      `سند صرف مورد: ${supplier.name}`,
      date,
      accountingLines
    );

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'فشل تسجيل سند الصرف');
  }
});


// Vite Dev / Prod Middleware Integration
async function startServer() {
  await seedDefaultData();

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
