import { db } from '../database/index.ts';
import { purchases, purchaseItems, suppliers, products, purchaseRequests, purchaseRequestItems } from '../database/schema.ts';
import { eq, desc, inArray } from 'drizzle-orm';
import { InventoryRepository } from './InventoryRepository.ts';
import { SupplierRepository } from './SupplierRepository.ts';
import { AccountingRepository } from './AccountingRepository.ts';

export class PurchaseRepository {
  static async findAllPurchaseRequests() {
    const reqList = await db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.createdAt));
    if (reqList.length === 0) return [];

    const reqIds = reqList.map(r => r.id);
    const itemsList = await db.select().from(purchaseRequestItems).where(inArray(purchaseRequestItems.requestId, reqIds));
    const supplierList = await db.select().from(suppliers);
    const suppliersMap = new Map(supplierList.map(s => [s.id, s]));

    return reqList.map(req => {
      const rItems = itemsList
        .filter(item => item.requestId === req.id)
        .map(i => ({
          ...i,
          estimatedPrice: parseFloat(i.estimatedPrice || '0'),
          quantity: parseFloat(i.quantity || '0'),
          total: parseFloat(i.total || '0')
        }));

      const supp = req.supplierId ? suppliersMap.get(req.supplierId) : null;

      return {
        ...req,
        subtotal: parseFloat(req.subtotal || '0'),
        taxAmount: parseFloat(req.taxAmount || '0'),
        grandTotal: parseFloat(req.grandTotal || '0'),
        exchangeRate: parseFloat(req.exchangeRate || '1.0'),
        supplierName: supp ? supp.name : 'غير محدد',
        items: rItems
      };
    });
  }

  static async createPurchaseRequest(data: any) {
    const reqId = data.id || `pr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const reqNum = data.requestNumber || `PR-${Math.floor(100000 + Math.random() * 900000)}`;

    const reqVal = {
      id: reqId,
      requestNumber: reqNum,
      requesterName: data.requesterName || 'إدارة المشتريات',
      department: data.department || 'المستودع والمشتريات',
      date: data.date || new Date().toISOString().split('T')[0],
      requiredDate: data.requiredDate || data.date || new Date().toISOString().split('T')[0],
      subtotal: (data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      currency: data.currency || 'SAR',
      exchangeRate: (data.exchangeRate || 1.0).toString(),
      status: data.status || 'pending', // 'draft' | 'pending' | 'approved' | 'converted' | 'rejected'
      notes: data.notes || '',
      supplierId: data.supplierId || null
    };

    const rItemsVal = (data.items || []).map((item: any) => ({
      id: `pri_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      requestId: reqId,
      productId: item.productId || null,
      productName: item.productName || 'صنف غير محدد',
      estimatedPrice: (item.estimatedPrice || item.purchasePrice || 0).toString(),
      quantity: (item.quantity || 1).toString(),
      total: ((item.quantity || 1) * (item.estimatedPrice || item.purchasePrice || 0)).toString()
    }));

    await db.insert(purchaseRequests).values(reqVal);
    if (rItemsVal.length > 0) {
      await db.insert(purchaseRequestItems).values(rItemsVal);
    }

    return { success: true, requestId: reqId, requestNumber: reqNum };
  }

  static async convertRequestToOrder(requestId: string) {
    const [req] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, requestId));
    if (!req) throw new Error('طلب الشراء غير موجود');

    const items = await db.select().from(purchaseRequestItems).where(eq(purchaseRequestItems.requestId, requestId));

    const poNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`;
    const purchaseData = {
      supplierId: req.supplierId,
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: poNumber,
      purchaseNumber: poNumber,
      currency: req.currency,
      exchangeRate: req.exchangeRate,
      status: 'ordered',
      paymentMethod: 'credit',
      subtotal: parseFloat(req.subtotal || '0'),
      taxAmount: parseFloat(req.taxAmount || '0'),
      grandTotal: parseFloat(req.grandTotal || '0'),
      notes: `محول من طلب شراء رقم ${req.requestNumber}`,
      items: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        purchasePrice: parseFloat(i.estimatedPrice || '0'),
        quantity: parseFloat(i.quantity || '0'),
        total: parseFloat(i.total || '0'),
        taxAmount: 0
      }))
    };

    const orderRes = await this.createPurchaseOrder(purchaseData);

    await db.update(purchaseRequests).set({
      status: 'converted',
      updatedAt: new Date()
    }).where(eq(purchaseRequests.id, requestId));

    return { success: true, orderId: orderRes.purchaseId, purchaseNumber: poNumber };
  }
  static async findAllPurchases() {
    const purchaseList = await db.select().from(purchases).orderBy(desc(purchases.createdAt));
    if (purchaseList.length === 0) return [];

    const purchaseIds = purchaseList.map(p => p.id);
    const itemsList = await db.select().from(purchaseItems).where(inArray(purchaseItems.purchaseId, purchaseIds));
    const supplierList = await db.select().from(suppliers);
    const productList = await db.select().from(products);

    const suppliersMap = new Map(supplierList.map(s => [s.id, s]));
    const productsMap = new Map(productList.map(p => [p.id, p]));

    return purchaseList.map(pur => {
      const pItems = itemsList
        .filter(item => item.purchaseId === pur.id)
        .map(i => ({
          ...i,
          productName: productsMap.get(i.productId)?.name || i.productId,
          purchasePrice: parseFloat(i.purchasePrice || '0'),
          quantity: parseFloat(i.quantity || '0'),
          total: parseFloat(i.total || '0'),
          taxAmount: parseFloat(i.taxAmount || '0')
        }));

      const supp = pur.supplierId ? suppliersMap.get(pur.supplierId) : null;

      return {
        ...pur,
        subtotal: parseFloat(pur.subtotal || '0'),
        taxAmount: parseFloat(pur.taxAmount || '0'),
        grandTotal: parseFloat(pur.grandTotal || '0'),
        supplierName: supp ? supp.name : 'غير محدد',
        supplierPhone: supp ? supp.phone : '',
        items: pItems
      };
    });
  }

  static async findById(id: string) {
    const [pur] = await db.select().from(purchases).where(eq(purchases.id, id));
    if (!pur) return null;
    const items = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    return { ...pur, items };
  }

  static async createPurchaseOrder(data: any) {
    const purId = data.id || `pur_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const compId = data.companyId || 'comp_default';
    const invoiceNumber = data.invoiceNumber || data.purchaseNumber;

    const purchaseVal = {
      id: purId,
      companyId: compId,
      purchaseNumber: invoiceNumber,
      supplierInvoiceNumber: data.supplierInvoiceNumber || invoiceNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      subtotal: (data.totalWithoutTax || data.subtotal || 0).toString(),
      taxAmount: (data.taxAmount || 0).toString(),
      grandTotal: (data.grandTotal || 0).toString(),
      status: data.status || 'completed', // 'draft' | 'ordered' | 'received' | 'completed'
      paymentMethod: data.paymentMethod || 'cash',
      currency: data.currency || 'SAR',
      exchangeRate: (data.exchangeRate || 1.0).toString(),
      warehouseId: data.warehouseId || 'wh_main',
      supplierId: data.supplierId || null,
      notes: data.notes || ''
    };

    const pItemsVal = (data.items || []).map((item: any) => ({
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      purchaseId: purId,
      productId: item.productId,
      purchasePrice: (item.purchasePrice || 0).toString(),
      quantity: (item.quantity || 0).toString(),
      total: ((item.quantity || 0) * (item.purchasePrice || 0)).toString(),
      taxAmount: (item.taxAmount || 0).toString()
    }));

    await db.insert(purchases).values(purchaseVal);
    if (pItemsVal.length > 0) {
      await db.insert(purchaseItems).values(pItemsVal);
    }

    // Goods Receipt & Weighted Average Cost calculation if status is received or completed
    if (purchaseVal.status === 'completed' || purchaseVal.status === 'received') {
      for (const item of data.items || []) {
        await InventoryRepository.updateWeightedAverageCostOnPurchase(
          item.productId,
          parseFloat(item.quantity || '0'),
          parseFloat(item.purchasePrice || '0')
        );
        await InventoryRepository.recordStockMove({
          productId: item.productId,
          toWarehouseId: purchaseVal.warehouseId,
          quantity: parseFloat(item.quantity || '0'),
          type: 'purchase',
          referenceId: invoiceNumber,
          notes: `استلام مشتريات رقم ${invoiceNumber}`
        });
      }
    }

    // Accounting posting & Supplier balance if status is completed
    if (purchaseVal.status === 'completed') {
      if (purchaseVal.paymentMethod === 'credit' && purchaseVal.supplierId) {
        await SupplierRepository.adjustBalance(purchaseVal.supplierId, parseFloat(purchaseVal.grandTotal));
      }

      await this.postPurchaseJournalEntry({
        invoiceNumber,
        date: purchaseVal.date,
        paymentMethod: purchaseVal.paymentMethod,
        subtotal: parseFloat(purchaseVal.subtotal),
        taxAmount: parseFloat(purchaseVal.taxAmount),
        grandTotal: parseFloat(purchaseVal.grandTotal),
        currency: purchaseVal.currency,
        exchangeRate: parseFloat(purchaseVal.exchangeRate)
      });
    }

    return { success: true, purchaseId: purId };
  }

  static async receiveGoods(id: string, options: { warehouseId?: string; notes?: string }) {
    const pur = await this.findById(id);
    if (!pur) throw new Error('أمر الشراء غير موجود');

    const warehouseId = options.warehouseId || pur.warehouseId || 'wh_main';
    const notes = options.notes || '';

    for (const item of pur.items) {
      const qty = parseFloat(item.quantity || '0');
      const price = parseFloat(item.purchasePrice || '0');

      await InventoryRepository.updateWeightedAverageCostOnPurchase(item.productId, qty, price);
      await InventoryRepository.recordStockMove({
        productId: item.productId,
        toWarehouseId: warehouseId,
        quantity: qty,
        type: 'purchase',
        referenceId: pur.purchaseNumber,
        notes: `إذن استلام مخزني لأمر الشراء ${pur.purchaseNumber} ${notes}`
      });
    }

    await db.update(purchases).set({
      status: 'received',
      warehouseId,
      notes: notes ? `${pur.notes || ''} | ${notes}` : pur.notes,
      updatedAt: new Date()
    }).where(eq(purchases.id, id));

    return { success: true, message: 'تم استلام وتحديث المخزون بنجاح' };
  }

  static async issueSupplierInvoice(id: string, options: { supplierInvoiceNumber?: string; paymentMethod?: string; date?: string }) {
    const pur = await this.findById(id);
    if (!pur) throw new Error('أمر الشراء غير موجود');

    const supplierInvoiceNumber = options.supplierInvoiceNumber || pur.purchaseNumber;
    const paymentMethod = options.paymentMethod || pur.paymentMethod || 'credit';
    const date = options.date || new Date().toISOString().split('T')[0];

    const subtotal = parseFloat(pur.subtotal || '0');
    const taxAmount = parseFloat(pur.taxAmount || '0');
    const grandTotal = parseFloat(pur.grandTotal || '0');

    if (paymentMethod === 'credit' && pur.supplierId) {
      await SupplierRepository.adjustBalance(pur.supplierId, grandTotal);
    }

    await this.postPurchaseJournalEntry({
      invoiceNumber: supplierInvoiceNumber,
      date,
      paymentMethod,
      subtotal,
      taxAmount,
      grandTotal,
      currency: pur.currency || 'SAR',
      exchangeRate: parseFloat(pur.exchangeRate || '1.0')
    });

    await db.update(purchases).set({
      status: 'completed',
      supplierInvoiceNumber,
      paymentMethod,
      updatedAt: new Date()
    }).where(eq(purchases.id, id));

    return { success: true, message: 'تم إصدار فاتورة المورد والترحيل المحاسبي بنجاح' };
  }

  private static async postPurchaseJournalEntry(data: {
    invoiceNumber: string;
    date: string;
    paymentMethod: string;
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
    currency?: string;
    exchangeRate?: number;
  }) {
    const getAccountByRule = async (ruleId: string, fallbackAccId: string) => {
      const rule = await AccountingRepository.findPostingRuleByCode(ruleId);
      return rule?.accountId || fallbackAccId;
    };

    const cashAcc = await getAccountByRule('purchase_cash_credit', 'acc_cash');
    const bankAcc = await getAccountByRule('purchase_bank_credit', 'acc_bank');
    const payAcc = await getAccountByRule('purchase_credit_credit', 'acc_payable');
    const invAcc = await getAccountByRule('purchase_inventory_debit', 'acc_inventory');
    const taxAcc = await getAccountByRule('purchase_tax_debit', 'acc_tax');

    const accountingLines = [];
    accountingLines.push({ accountId: invAcc, debit: data.subtotal, credit: 0 });
    if (data.taxAmount > 0) {
      accountingLines.push({ accountId: taxAcc, debit: data.taxAmount, credit: 0 });
    }

    if (data.paymentMethod === 'cash') {
      accountingLines.push({ accountId: cashAcc, debit: 0, credit: data.grandTotal });
    } else if (data.paymentMethod === 'card') {
      accountingLines.push({ accountId: bankAcc, debit: 0, credit: data.grandTotal });
    } else if (data.paymentMethod === 'credit') {
      accountingLines.push({ accountId: payAcc, debit: 0, credit: data.grandTotal });
    }

    await AccountingRepository.postJournalEntry(
      `JE-PUR-${data.invoiceNumber}`,
      `فاتورة مشتريات رقم ${data.invoiceNumber}`,
      data.date,
      accountingLines,
      {
        currency: data.currency,
        exchangeRate: data.exchangeRate
      }
    );
  }
}
