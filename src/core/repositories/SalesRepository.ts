import { db } from '../database/index.ts';
import { invoices, invoiceItems, products, quotations, quotationItems, salesOrders, salesOrderItems, payments } from '../database/schema.ts';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';
import { InventoryRepository } from './InventoryRepository.ts';
import { CustomerRepository } from './CustomerRepository.ts';
import { AccountingRepository } from './AccountingRepository.ts';

export class SalesRepository {
  static async findAllInvoices(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: string;
    date?: string;
  }) {
    const conditions = [];
    if (params?.customerId) conditions.push(eq(invoices.customerId, params.customerId));
    if (params?.status) conditions.push(eq(invoices.status, params.status));
    if (params?.date) conditions.push(eq(invoices.date, params.date));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let total = 0;
    if (params?.page || params?.limit) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(whereClause);
      total = Number(countResult[0]?.count || 0);
    }

    let query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    if (params?.page && params?.limit) {
      const offset = (params.page - 1) * params.limit;
      query = query.limit(params.limit).offset(offset) as any;
    }

    const invoiceList = await query;
    const invoiceIds = invoiceList.map(i => i.id);

    const itemsList = invoiceIds.length > 0
      ? await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
      : [];

    const mapped = invoiceList.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      items: itemsList.filter(item => item.invoiceId === inv.id).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        discountType: item.discountType as 'fixed' | 'percentage',
        total: parseFloat(item.total || '0'),
        taxAmount: parseFloat(item.taxAmount || '0')
      })),
      totalWithoutTax: parseFloat(inv.totalWithoutTax || '0'),
      taxAmount: parseFloat(inv.taxAmount || '0'),
      discountAmount: parseFloat(inv.discountAmount || '0'),
      grandTotal: parseFloat(inv.grandTotal || '0'),
      paymentMethod: inv.paymentMethod as 'cash' | 'card' | 'credit' | 'split',
      paymentDetails: {
        cashAmount: parseFloat(inv.cashAmount || '0'),
        cardAmount: parseFloat(inv.cardAmount || '0')
      },
      status: inv.status as 'paid' | 'unpaid' | 'partially_paid' | 'returned',
      customerId: inv.customerId || undefined,
      customerName: inv.customerName || undefined,
      taxNumber: inv.taxNumber || undefined,
      cashierName: inv.cashierName
    }));

    return { items: mapped, total };
  }

  static async findInvoiceById(id: string) {
    const invRes = await db.select().from(invoices).where(eq(invoices.id, id));
    if (invRes.length === 0) return null;
    const inv = invRes[0];
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        discountType: item.discountType,
        total: parseFloat(item.total || '0'),
        taxAmount: parseFloat(item.taxAmount || '0')
      })),
      totalWithoutTax: parseFloat(inv.totalWithoutTax || '0'),
      taxAmount: parseFloat(inv.taxAmount || '0'),
      discountAmount: parseFloat(inv.discountAmount || '0'),
      grandTotal: parseFloat(inv.grandTotal || '0'),
      paymentMethod: inv.paymentMethod,
      cashAmount: parseFloat(inv.cashAmount || '0'),
      cardAmount: parseFloat(inv.cardAmount || '0'),
      status: inv.status,
      customerId: inv.customerId,
      customerName: inv.customerName,
      taxNumber: inv.taxNumber,
      cashierName: inv.cashierName
    };
  }

  static async createSaleInvoice(invData: any) {
    const invId = invData.id || 'inv_' + Math.random().toString(36).substr(2, 9);

    await db.insert(invoices).values({
      id: invId,
      invoiceNumber: invData.invoiceNumber,
      date: invData.date,
      totalWithoutTax: (invData.totalWithoutTax || 0).toString(),
      taxAmount: (invData.taxAmount || 0).toString(),
      discountAmount: (invData.discountAmount || 0).toString(),
      grandTotal: (invData.grandTotal || 0).toString(),
      paymentMethod: invData.paymentMethod || 'cash',
      cashAmount: (invData.paymentDetails?.cashAmount || 0).toString(),
      cardAmount: (invData.paymentDetails?.cardAmount || 0).toString(),
      status: invData.status || 'paid',
      customerId: invData.customerId || null,
      customerName: invData.customerName || null,
      taxNumber: invData.taxNumber || null,
      cashierName: invData.cashierName || 'أحمد الكاشير'
    });

    let totalCogs = 0;
    const itemIds = Array.from(new Set((invData.items || []).map((item: any) => item.productId))) as string[];

    const productsList = itemIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, itemIds))
      : [];
    const productsMap = new Map(productsList.map(p => [p.id, p]));

    const invoiceItemValues = [];

    for (const item of (invData.items || [])) {
      const itemId = 'item_' + Math.random().toString(36).substr(2, 9);
      invoiceItemValues.push({
        id: itemId,
        invoiceId: invId,
        productId: item.productId,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        discountType: item.discountType || 'fixed',
        total: (item.total || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString()
      });

      const product = productsMap.get(item.productId);
      if (product) {
        const purchasePrice = parseFloat(product.purchasePrice || '0');
        totalCogs += purchasePrice * item.quantity;
      }
    }

    if (invoiceItemValues.length > 0) {
      await db.insert(invoiceItems).values(invoiceItemValues);
    }

    // 2. Reduce Inventory Stock
    const stockUpdatePromises = (invData.items || []).map(async (item: any) => {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        if (currentStock !== 999) {
          const nextStock = Math.max(0, currentStock - item.quantity);
          await db.update(products).set({
            stock: nextStock.toString()
          }).where(eq(products.id, item.productId));

          await InventoryRepository.recordStockMove({
            productId: item.productId,
            fromWarehouseId: 'wh_main',
            quantity: item.quantity,
            type: 'sale',
            referenceId: invId,
            notes: `فاتورة مبيعات رقم ${invData.invoiceNumber}`
          });
        }
      }
    });

    await Promise.all(stockUpdatePromises);

    // 3. Customer Balance update for credit sales & split credit
    const creditAmount = invData.paymentMethod === 'credit'
      ? invData.grandTotal
      : (invData.paymentMethod === 'split' ? (invData.paymentDetails?.creditAmount || 0) : 0);

    if (creditAmount > 0 && invData.customerId) {
      await CustomerRepository.adjustBalance(invData.customerId, creditAmount);
    }

    // 4. Double-Entry Accounting Entry
    const getAccountByRule = async (ruleId: string, fallbackAccId: string) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };

    const cashAcc = await getAccountByRule('sales_cash_debit', 'acc_cash');
    const bankAcc = await getAccountByRule('sales_bank_debit', 'acc_bank');
    const recAcc = await getAccountByRule('sales_credit_debit', 'acc_receivable');
    const salesAcc = await getAccountByRule('sales_revenue_credit', 'acc_sales');
    const taxAcc = await getAccountByRule('sales_tax_credit', 'acc_tax');
    const cogsAcc = await getAccountByRule('sales_cogs_debit', 'acc_cogs');
    const invAcc = await getAccountByRule('sales_inventory_credit', 'acc_inventory');

    const accountingLines = [];

    if (invData.paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === 'card') {
      accountingLines.push({ accountId: bankAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === 'credit') {
      accountingLines.push({ accountId: recAcc, debit: invData.grandTotal, credit: 0 });
    } else if (invData.paymentMethod === 'split') {
      const cashAmt = invData.paymentDetails?.cashAmount || 0;
      const cardAmt = invData.paymentDetails?.cardAmount || 0;
      const credAmt = invData.paymentDetails?.creditAmount || 0;
      if (cashAmt > 0) accountingLines.push({ accountId: cashAcc, debit: cashAmt, credit: 0 });
      if (cardAmt > 0) accountingLines.push({ accountId: bankAcc, debit: cardAmt, credit: 0 });
      if (credAmt > 0) accountingLines.push({ accountId: recAcc, debit: credAmt, credit: 0 });
    }

    accountingLines.push({ accountId: salesAcc, debit: 0, credit: invData.totalWithoutTax });

    if (invData.taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: 0, credit: invData.taxAmount });
    }

    if (totalCogs > 0) {
      accountingLines.push({ accountId: cogsAcc, debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: invAcc, debit: 0, credit: totalCogs });
    }

    await AccountingRepository.postJournalEntry(
      `JE-INV-${invData.invoiceNumber}`,
      `فاتورة مبيعات رقم ${invData.invoiceNumber}`,
      invData.date,
      accountingLines,
      {
        currency: invData.currency,
        exchangeRate: invData.exchangeRate
      }
    );

    return { success: true, invoiceId: invId };
  }

  static async returnSaleInvoice(id: string) {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!inv) {
      throw new Error('الفاتورة غير موجودة');
    }
    if (inv.status === 'returned') {
      throw new Error('تم إرجاع هذه الفاتورة مسبقاً');
    }

    // 1. Mark as returned
    await db.update(invoices).set({ status: 'returned' }).where(eq(invoices.id, id));

    // 2. Restore inventory
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    let totalCogs = 0;

    const itemIds = Array.from(new Set(items.map((item) => item.productId))) as string[];
    const productsList = itemIds.length > 0 
      ? await db.select().from(products).where(inArray(products.id, itemIds)) 
      : [];
    const productsMap = new Map(productsList.map(p => [p.id, p]));

    for (const item of items) {
      const product = productsMap.get(item.productId);
      if (product) {
        const currentStock = parseFloat(product.stock || '0');
        const qty = parseFloat(item.quantity || '0');
        const purchasePrice = parseFloat(product.purchasePrice || '0');
        totalCogs += purchasePrice * qty;

        if (currentStock !== 999) {
          await db.update(products).set({
            stock: (currentStock + qty).toString()
          }).where(eq(products.id, item.productId));

          await InventoryRepository.recordStockMove({
            productId: item.productId,
            toWarehouseId: 'wh_main',
            quantity: qty,
            type: 'sale',
            referenceId: id,
            notes: `مرتجع مبيعات للفاتورة رقم ${inv.invoiceNumber}`
          });
        }
      }
    }

    // 3. Customer balance update if credit sale
    const grandTotal = parseFloat(inv.grandTotal || '0');
    const totalWithoutTax = parseFloat(inv.totalWithoutTax || '0');
    const taxAmount = parseFloat(inv.taxAmount || '0');

    const returnedCreditAmt = inv.paymentMethod === 'credit'
      ? grandTotal
      : (inv.paymentMethod === 'split' ? parseFloat((inv as any).creditAmount || '0') : 0);

    if (returnedCreditAmt > 0 && inv.customerId) {
      await CustomerRepository.adjustBalance(inv.customerId, -returnedCreditAmt);
    }

    // 4. Create reverse accounting journal entries
    const getAccountByRule = async (ruleId: string, fallbackAccId: string) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };

    const cashAcc = await getAccountByRule('sales_cash_debit', 'acc_cash');
    const bankAcc = await getAccountByRule('sales_bank_debit', 'acc_bank');
    const recAcc = await getAccountByRule('sales_credit_debit', 'acc_receivable');
    const salesAcc = await getAccountByRule('sales_revenue_credit', 'acc_sales');
    const taxAcc = await getAccountByRule('sales_tax_credit', 'acc_tax');
    const cogsAcc = await getAccountByRule('sales_cogs_debit', 'acc_cogs');
    const invAcc = await getAccountByRule('sales_inventory_credit', 'acc_inventory');

    const accountingLines = [];

    accountingLines.push({ accountId: salesAcc, debit: totalWithoutTax, credit: 0 });
    if (taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: taxAmount, credit: 0 });
    }

    if (inv.paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === 'card') {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === 'credit') {
      accountingLines.push({ accountId: recAcc, debit: 0, credit: grandTotal });
    } else if (inv.paymentMethod === 'split') {
      const cashAmt = parseFloat(inv.cashAmount || '0');
      const cardAmt = parseFloat(inv.cardAmount || '0');
      const credAmt = parseFloat((inv as any).creditAmount || '0');
      if (cashAmt > 0) accountingLines.push({ accountId: cashAcc, debit: 0, credit: cashAmt });
      if (cardAmt > 0) accountingLines.push({ accountId: bankAcc, debit: 0, credit: cardAmt });
      if (credAmt > 0) accountingLines.push({ accountId: recAcc, debit: 0, credit: credAmt });
    }

    if (totalCogs > 0) {
      accountingLines.push({ accountId: invAcc, debit: totalCogs, credit: 0 });
      accountingLines.push({ accountId: cogsAcc, debit: 0, credit: totalCogs });
    }

    const journalResult = await AccountingRepository.postJournalEntry(
      `JE-RET-${inv.invoiceNumber}`,
      `مرتجع مبيعات للفاتورة رقم ${inv.invoiceNumber}`,
      new Date().toISOString().split('T')[0],
      accountingLines
    );

    return { success: true, journalEntry: journalResult };
  }

  // ==================== 1. QUOTATIONS (عروض الأسعار) ====================
  static async findAllQuotations() {
    const list = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
    const qIds = list.map(q => q.id);
    const allItems = qIds.length > 0
      ? await db.select().from(quotationItems).where(inArray(quotationItems.quotationId, qIds))
      : [];

    return list.map(q => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      customerId: q.customerId || undefined,
      customerName: q.customerName || undefined,
      date: q.date,
      validUntil: q.validUntil || undefined,
      subtotal: parseFloat(q.subtotal || '0'),
      taxAmount: parseFloat(q.taxAmount || '0'),
      discountAmount: parseFloat(q.discountAmount || '0'),
      grandTotal: parseFloat(q.grandTotal || '0'),
      currency: q.currency || 'SAR',
      exchangeRate: parseFloat(q.exchangeRate || '1.0'),
      status: q.status || 'draft',
      notes: q.notes || undefined,
      items: allItems.filter(item => item.quotationId === q.id).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        taxAmount: parseFloat(item.taxAmount || '0'),
        total: parseFloat(item.total || '0')
      }))
    }));
  }

  static async createQuotation(data: any) {
    const id = data.id || 'quote_' + Math.random().toString(36).substr(2, 9);
    const quotationNumber = data.quotationNumber || 'QT-' + Date.now().toString().slice(-6);

    await db.insert(quotations).values({
      id,
      quotationNumber,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      date: data.date || new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || null,
      subtotal: (data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      discountAmount: (data.discountAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      currency: data.currency || 'SAR',
      exchangeRate: (data.exchangeRate || 1.0).toString(),
      status: data.status || 'draft',
      notes: data.notes || null
    });

    if (data.items && data.items.length > 0) {
      const itemValues = data.items.map((item: any) => ({
        id: 'qitem_' + Math.random().toString(36).substr(2, 9),
        quotationId: id,
        productId: item.productId || null,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString(),
        total: (item.total || 0).toString()
      }));
      await db.insert(quotationItems).values(itemValues);
    }

    return { id, quotationNumber, success: true };
  }

  // ==================== 2. SALES ORDERS (أوامر المبيعات) ====================
  static async findAllSalesOrders() {
    const list = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));
    const oIds = list.map(o => o.id);
    const allItems = oIds.length > 0
      ? await db.select().from(salesOrderItems).where(inArray(salesOrderItems.orderId, oIds))
      : [];

    return list.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      quotationId: o.quotationId || undefined,
      customerId: o.customerId || undefined,
      customerName: o.customerName || undefined,
      date: o.date,
      deliveryDate: o.deliveryDate || undefined,
      subtotal: parseFloat(o.subtotal || '0'),
      taxAmount: parseFloat(o.taxAmount || '0'),
      discountAmount: parseFloat(o.discountAmount || '0'),
      grandTotal: parseFloat(o.grandTotal || '0'),
      currency: o.currency || 'SAR',
      exchangeRate: parseFloat(o.exchangeRate || '1.0'),
      status: o.status || 'confirmed',
      notes: o.notes || undefined,
      items: allItems.filter(item => item.orderId === o.id).map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        discount: parseFloat(item.discount || '0'),
        taxAmount: parseFloat(item.taxAmount || '0'),
        total: parseFloat(item.total || '0')
      }))
    }));
  }

  static async createSalesOrder(data: any) {
    const id = data.id || 'order_' + Math.random().toString(36).substr(2, 9);
    const orderNumber = data.orderNumber || 'SO-' + Date.now().toString().slice(-6);

    await db.insert(salesOrders).values({
      id,
      orderNumber,
      quotationId: data.quotationId || null,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      date: data.date || new Date().toISOString().split('T')[0],
      deliveryDate: data.deliveryDate || null,
      subtotal: (data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      discountAmount: (data.discountAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      currency: data.currency || 'SAR',
      exchangeRate: (data.exchangeRate || 1.0).toString(),
      status: data.status || 'confirmed',
      notes: data.notes || null
    });

    if (data.items && data.items.length > 0) {
      const itemValues = data.items.map((item: any) => ({
        id: 'soitem_' + Math.random().toString(36).substr(2, 9),
        orderId: id,
        productId: item.productId || null,
        productName: item.productName,
        price: (item.price || 0).toString(),
        quantity: (item.quantity || 0).toString(),
        discount: (item.discount || 0).toString(),
        taxAmount: (item.taxAmount || 0).toString(),
        total: (item.total || 0).toString()
      }));
      await db.insert(salesOrderItems).values(itemValues);
    }

    // If converted from quotation, update quotation status
    if (data.quotationId) {
      await db.update(quotations).set({ status: 'converted' }).where(eq(quotations.id, data.quotationId));
    }

    return { id, orderNumber, success: true };
  }

  // ==================== 3. CONVERSION WORKFLOWS ====================
  static async convertQuotationToOrder(quotationId: string) {
    const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId));
    if (!q) throw new Error('عرض السعر غير موجود');

    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));

    return await this.createSalesOrder({
      quotationId: q.id,
      customerId: q.customerId,
      customerName: q.customerName,
      date: new Date().toISOString().split('T')[0],
      subtotal: parseFloat(q.subtotal || '0'),
      taxAmount: parseFloat(q.taxAmount || '0'),
      discountAmount: parseFloat(q.discountAmount || '0'),
      grandTotal: parseFloat(q.grandTotal || '0'),
      currency: q.currency,
      exchangeRate: parseFloat(q.exchangeRate || '1.0'),
      status: 'confirmed',
      notes: `تم تحويله تلقائياً من عرض السعر رقم ${q.quotationNumber}`,
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: parseFloat(i.price || '0'),
        quantity: parseFloat(i.quantity || '0'),
        discount: parseFloat(i.discount || '0'),
        taxAmount: parseFloat(i.taxAmount || '0'),
        total: parseFloat(i.total || '0')
      }))
    });
  }

  static async convertOrderToInvoice(orderId: string, paymentMethod: 'cash' | 'card' | 'credit' = 'credit') {
    const [o] = await db.select().from(salesOrders).where(eq(salesOrders.id, orderId));
    if (!o) throw new Error('أمر المبيعات غير موجود');

    const items = await db.select().from(salesOrderItems).where(eq(salesOrderItems.orderId, orderId));
    const invNumber = 'INV-' + Date.now().toString().slice(-6);

    const res = await this.createSaleInvoice({
      invoiceNumber: invNumber,
      date: new Date().toISOString().split('T')[0],
      customerId: o.customerId,
      customerName: o.customerName,
      totalWithoutTax: parseFloat(o.subtotal || '0'),
      taxAmount: parseFloat(o.taxAmount || '0'),
      discountAmount: parseFloat(o.discountAmount || '0'),
      grandTotal: parseFloat(o.grandTotal || '0'),
      paymentMethod,
      currency: o.currency,
      exchangeRate: parseFloat(o.exchangeRate || '1.0'),
      status: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      cashierName: 'النظام الآلي',
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        price: parseFloat(i.price || '0'),
        quantity: parseFloat(i.quantity || '0'),
        discount: parseFloat(i.discount || '0'),
        total: parseFloat(i.total || '0'),
        taxAmount: parseFloat(i.taxAmount || '0')
      }))
    });

    await db.update(salesOrders).set({ status: 'converted' }).where(eq(salesOrders.id, orderId));
    return res;
  }

  // ==================== 4. CUSTOMER PAYMENTS (تحصيل سندات المبيعات) ====================
  static async recordCustomerPayment(paymentData: {
    customerId: string;
    customerName?: string;
    amount: number;
    method: 'cash' | 'bank' | 'check';
    currency?: string;
    exchangeRate?: number;
    reference?: string;
    notes?: string;
  }) {
    if (!paymentData.customerId || paymentData.amount <= 0) {
      throw new Error('يرجى تحديد العميل والمبلغ الصحيح لتحصيل الدفعة');
    }

    const payId = 'pay_' + Math.random().toString(36).substr(2, 9);
    const paymentNumber = 'PAY-' + Date.now().toString().slice(-6);
    const date = new Date().toISOString().split('T')[0];

    // 1. Record payment in database
    await db.insert(payments).values({
      id: payId,
      companyId: 'comp_default',
      paymentNumber,
      date,
      type: 'receipt', // Incoming receipt voucher
      partyId: paymentData.customerId,
      partyType: 'customer',
      amount: paymentData.amount.toString(),
      method: paymentData.method || 'cash',
      reference: paymentData.reference || null,
      notes: paymentData.notes || `تحصيل دفعة مبيعات من العميل ${paymentData.customerName || paymentData.customerId}`
    });

    // 2. Reduce Customer Credit Balance
    await CustomerRepository.adjustBalance(paymentData.customerId, -paymentData.amount);

    // 3. Post Double-Entry Accounting Journal Entry
    const getAccountByRule = async (ruleId: string, fallbackAccId: string) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };

    const cashAcc = await getAccountByRule('sales_cash_debit', 'acc_cash');
    const bankAcc = await getAccountByRule('sales_bank_debit', 'acc_bank');
    const recAcc = await getAccountByRule('sales_credit_debit', 'acc_receivable');

    const debitAcc = paymentData.method === 'bank' ? bankAcc : cashAcc;

    const journalLines = [
      { accountId: debitAcc, debit: paymentData.amount, credit: 0 },
      { accountId: recAcc, debit: 0, credit: paymentData.amount }
    ];

    const journalResult = await AccountingRepository.postJournalEntry(
      `JE-${paymentNumber}`,
      `سند قبض تحصيل دفعة مبيعات - ${paymentData.customerName || paymentData.customerId}`,
      date,
      journalLines,
      {
        currency: paymentData.currency || 'SAR',
        exchangeRate: paymentData.exchangeRate || 1.0
      }
    );

    return {
      success: true,
      paymentId: payId,
      paymentNumber,
      journalEntry: journalResult
    };
  }
}
