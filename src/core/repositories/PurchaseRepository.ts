import { db } from '../database/index.ts';
import { purchases, purchaseItems, suppliers, products } from '../database/schema.ts';
import { eq, desc, inArray } from 'drizzle-orm';
import { InventoryRepository } from './InventoryRepository.ts';
import { SupplierRepository } from './SupplierRepository.ts';
import { AccountingRepository } from './AccountingRepository.ts';

export class PurchaseRepository {
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
