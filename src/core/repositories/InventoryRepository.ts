import { db } from '../database/index.ts';
import { products, warehouses, stockMoves } from '../database/schema.ts';
import { eq, desc, inArray, and, or } from 'drizzle-orm';
import { AccountingRepository } from './AccountingRepository.ts';

export interface StockMoveInput {
  productId: string;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  quantity: number;
  unitCost?: number;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'initial';
  referenceId?: string | null;
  notes?: string | null;
  companyId?: string | null;
  branchId?: string | null;
}

export class InventoryRepository {
  // 1. WAREHOUSES MANAGEMENT
  static async getWarehouses() {
    let list = await db.select().from(warehouses);
    if (list.length === 0) {
      // Auto-seed default main warehouse if none exists
      const defaultWh = {
        id: 'wh_main',
        companyId: 'company-1',
        name: 'المستودع الرئيسي',
        code: 'WH-MAIN',
        location: 'المركز الرئيسي'
      };
      await db.insert(warehouses).values(defaultWh);
      list = [defaultWh as any];
    }
    return list;
  }

  static async findWarehouseById(id: string) {
    const res = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return res[0] || null;
  }

  static async upsertWarehouse(data: any) {
    const whId = data.id || 'wh_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id: whId,
      companyId: data.companyId || 'company-1',
      branchId: data.branchId || null,
      name: data.name,
      code: data.code,
      location: data.location || ''
    };

    const existing = await this.findWarehouseById(whId);
    if (existing) {
      await db.update(warehouses).set(dbValue).where(eq(warehouses.id, whId));
    } else {
      await db.insert(warehouses).values(dbValue);
    }
    return dbValue;
  }

  static async deleteWarehouse(id: string) {
    // Check if there are stock moves associated with this warehouse
    const movesFrom = await db.select().from(stockMoves).where(eq(stockMoves.fromWarehouseId, id));
    const movesTo = await db.select().from(stockMoves).where(eq(stockMoves.toWarehouseId, id));

    if (movesFrom.length > 0 || movesTo.length > 0) {
      throw new Error('لا يمكن حذف المستودع نظراً لوجود حركات مخزنية مرتبطة به.');
    }

    await db.delete(warehouses).where(eq(warehouses.id, id));
    return { success: true };
  }

  // 2. STOCK MOVES
  static async recordStockMove(input: StockMoveInput) {
    const moveId = 'sm_' + Math.random().toString(36).substr(2, 9);
    const value = {
      id: moveId,
      companyId: input.companyId || 'company-1',
      branchId: input.branchId || null,
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId || null,
      toWarehouseId: input.toWarehouseId || null,
      quantity: input.quantity.toString(),
      unitCost: (input.unitCost || 0).toString(),
      type: input.type,
      referenceId: input.referenceId || null,
      notes: input.notes || null
    };

    await db.insert(stockMoves).values(value);
    return value;
  }

  static async getStockMoves(productId?: string, warehouseId?: string, type?: string) {
    let moves = await db.select().from(stockMoves).orderBy(desc(stockMoves.createdAt));

    if (productId) {
      moves = moves.filter(m => m.productId === productId);
    }
    if (warehouseId) {
      moves = moves.filter(m => m.fromWarehouseId === warehouseId || m.toWarehouseId === warehouseId);
    }
    if (type && type !== 'all') {
      moves = moves.filter(m => m.type === type);
    }

    return moves;
  }

  // 3. WEIGHTED AVERAGE COST CALCULATION ON PURCHASES
  static async updateWeightedAverageCostOnPurchase(productId: string, incomingQty: number, unitCost: number) {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) return;

    const currentStock = parseFloat(product.stock || '0');
    const oldCost = parseFloat(product.purchasePrice || '0');

    let newAvgCost = oldCost;
    const newStock = currentStock + incomingQty;

    if (newStock > 0 && incomingQty > 0) {
      newAvgCost = ((currentStock * oldCost) + (incomingQty * unitCost)) / newStock;
      newAvgCost = Math.round(newAvgCost * 100) / 100;
    }

    await db.update(products).set({
      stock: newStock.toString(),
      purchasePrice: newAvgCost.toString()
    }).where(eq(products.id, productId));

    return { newStock, newAvgCost };
  }

  // 4. WAREHOUSE TRANSFERS
  static async transferStock(productId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number, notes?: string) {
    if (quantity <= 0) {
      throw new Error('الكمية المحولة يجب أن تكون أكبر من الصفر.');
    }
    if (fromWarehouseId === toWarehouseId) {
      throw new Error('المستودع المحول منه والمستودع المحول إليه يجب أن يكونا مختلفين.');
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new Error('المنتج غير موجود.');
    }

    const fromWh = await this.findWarehouseById(fromWarehouseId);
    const toWh = await this.findWarehouseById(toWarehouseId);

    if (!fromWh || !toWh) {
      throw new Error('أحد المستودعات المحددة غير موجود.');
    }

    // Record single transfer stock move
    const move = await this.recordStockMove({
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      type: 'transfer',
      notes: notes || `تحويل مخزني من ${fromWh.name} إلى ${toWh.name}`
    });

    return move;
  }

  // 5. PHYSICAL STOCK ADJUSTMENT WITH AUTOMATIC ACCOUNTING ENTRY
  static async adjustPhysicalStock(productId: string, warehouseId: string, actualQuantity: number, notes?: string) {
    if (actualQuantity < 0) {
      throw new Error('الكمية الفعلية لا يمكن أن تكون بالسالب.');
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new Error('المنتج غير موجود.');
    }

    const currentStock = parseFloat(product.stock || '0');
    const delta = actualQuantity - currentStock;

    if (delta === 0) {
      return { success: true, message: 'الكمية المطابقة مطابقة للمخزون الحالي، لم يطرأ تغيير.' };
    }

    const unitCost = parseFloat(product.purchasePrice || '0');
    const totalValueDiff = Math.abs(delta) * unitCost;

    // Update Product Stock
    await db.update(products).set({ stock: actualQuantity.toString() }).where(eq(products.id, productId));

    // Record Stock Move
    const wh = await this.findWarehouseById(warehouseId);
    await this.recordStockMove({
      productId,
      fromWarehouseId: delta < 0 ? warehouseId : null,
      toWarehouseId: delta > 0 ? warehouseId : null,
      quantity: Math.abs(delta),
      type: 'adjustment',
      notes: notes || `تسوية جردية مخزنية للمنتج (${product.name}) - ${delta > 0 ? 'زيادة' : 'عجز/تالف'}`
    });

    // Accounting Journal Entry Integration
    let journalResult = null;
    if (totalValueDiff > 0) {
      const invAcc = 'acc_inventory';
      const cogsAcc = 'acc_cogs';
      const revAcc = 'acc_sales';

      const entryDate = new Date().toISOString().split('T')[0];
      const entryNum = 'JE-ADJ-' + Math.floor(1000 + Math.random() * 9000);

      const lines = [];
      if (delta > 0) {
        // Surplus: Debit Inventory, Credit Revenue/Adjustment
        lines.push({ accountId: invAcc, debit: totalValueDiff, credit: 0 });
        lines.push({ accountId: revAcc, debit: 0, credit: totalValueDiff });
      } else {
        // Deficit: Debit COGS/Loss, Credit Inventory
        lines.push({ accountId: cogsAcc, debit: totalValueDiff, credit: 0 });
        lines.push({ accountId: invAcc, debit: 0, credit: totalValueDiff });
      }

      journalResult = await AccountingRepository.postJournalEntry(
        entryNum,
        `تسوية جردية للمخزون - ${product.name} (${delta > 0 ? 'فائض زيادة' : 'عجز/تلف'})`,
        entryDate,
        lines
      );
    }

    return {
      success: true,
      previousStock: currentStock,
      newStock: actualQuantity,
      delta,
      totalValueDiff,
      journalEntry: journalResult
    };
  }

  // 6. STOCK LEDGER FOR PRODUCT
  static async getProductStockLedger(productId: string) {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      throw new Error('المنتج غير موجود.');
    }

    const moves = await db.select().from(stockMoves).where(eq(stockMoves.productId, productId));
    const sortedMoves = moves.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    const allWhs = await this.getWarehouses();
    const whMap = new Map(allWhs.map(w => [w.id, w.name]));

    let runningStock = 0;
    const ledgerLines = sortedMoves.map(m => {
      const qty = parseFloat(m.quantity || '0');
      let change = 0;

      if (m.type === 'purchase' || m.type === 'initial') {
        change = qty;
      } else if (m.type === 'sale') {
        change = -qty;
      } else if (m.type === 'adjustment') {
        // If toWarehouse is set, it was an increase
        change = m.toWarehouseId ? qty : -qty;
      } else if (m.type === 'transfer') {
        change = 0; // Transfer changes warehouse location, net overall stays 0
      }

      runningStock += change;

      return {
        id: m.id,
        type: m.type,
        typeLabel: m.type === 'purchase' ? 'مشتريات' :
                   m.type === 'sale' ? 'مبيعات' :
                   m.type === 'transfer' ? 'تحويل بين مستودعات' :
                   m.type === 'adjustment' ? 'تسوية جردية' : 'رصيد أول المشتريات',
        quantity: qty,
        change,
        runningStock,
        fromWarehouse: m.fromWarehouseId ? (whMap.get(m.fromWarehouseId) || m.fromWarehouseId) : '-',
        toWarehouse: m.toWarehouseId ? (whMap.get(m.toWarehouseId) || m.toWarehouseId) : '-',
        referenceId: m.referenceId || '-',
        notes: m.notes || '-',
        date: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString()
      };
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        stock: parseFloat(product.stock || '0'),
        purchasePrice: parseFloat(product.purchasePrice || '0'),
        price: parseFloat(product.price || '0'),
        unit: product.unit
      },
      ledgerLines,
      currentTotalStock: parseFloat(product.stock || '0')
    };
  }

  private static calculateFifoValuationForProduct(productId: string, stock: number, avgCost: number, productMoves: any[]) {
    if (stock <= 0) {
      return { fifoUnitCost: avgCost, fifoTotalValue: 0 };
    }

    // Inward moves for FIFO are purchase, initial, or positive adjustment
    const inwardMoves = productMoves.filter(m => 
      m.productId === productId && (
        m.type === 'purchase' || 
        m.type === 'initial' || 
        (m.type === 'adjustment' && m.toWarehouseId)
      )
    ).sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA; // Newest first
    });

    let remainingQty = stock;
    let fifoTotalValue = 0;

    for (const move of inwardMoves) {
      if (remainingQty <= 0) break;
      const qty = parseFloat(move.quantity || '0');
      const unitCost = parseFloat(move.unitCost || '0') || avgCost;
      const takeQty = Math.min(remainingQty, qty);
      fifoTotalValue += takeQty * unitCost;
      remainingQty -= takeQty;
    }

    if (remainingQty > 0) {
      fifoTotalValue += remainingQty * avgCost;
    }

    fifoTotalValue = Math.round(fifoTotalValue * 100) / 100;
    const fifoUnitCost = Math.round((fifoTotalValue / stock) * 100) / 100;

    return { fifoUnitCost, fifoTotalValue };
  }

  // 7. INVENTORY VALUATION REPORT (Average Cost & FIFO)
  static async getInventoryValuation(method: 'average' | 'fifo' = 'average') {
    const allProducts = await db.select().from(products);
    const allMoves = await db.select().from(stockMoves);

    const valuationItems = allProducts.map(p => {
      const stock = parseFloat(p.stock || '0');
      const avgCost = parseFloat(p.purchasePrice || '0');
      const sellingPrice = parseFloat(p.price || '0');

      const { fifoUnitCost, fifoTotalValue } = this.calculateFifoValuationForProduct(p.id, stock, avgCost, allMoves);

      const wacTotalValue = Math.round((stock * avgCost) * 100) / 100;
      const selectedTotalCostValue = method === 'fifo' ? fifoTotalValue : wacTotalValue;
      const totalSalesValue = Math.round((stock * sellingPrice) * 100) / 100;
      const potentialProfit = Math.round((totalSalesValue - selectedTotalCostValue) * 100) / 100;

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        stock,
        avgCost,
        fifoCost: fifoUnitCost,
        sellingPrice,
        wacCostValue: wacTotalValue,
        fifoCostValue: fifoTotalValue,
        totalCostValue: selectedTotalCostValue,
        totalSalesValue,
        potentialProfit
      };
    });

    const totalCostSum = valuationItems.reduce((acc, item) => acc + item.totalCostValue, 0);
    const totalFifoCostSum = valuationItems.reduce((acc, item) => acc + item.fifoCostValue, 0);
    const totalWacCostSum = valuationItems.reduce((acc, item) => acc + item.wacCostValue, 0);
    const totalSalesSum = valuationItems.reduce((acc, item) => acc + item.totalSalesValue, 0);
    const totalPotentialProfitSum = totalSalesSum - totalCostSum;

    return {
      method,
      items: valuationItems,
      totalCostSum,
      totalWacCostSum,
      totalFifoCostSum,
      totalSalesSum,
      totalPotentialProfitSum,
      totalItemsCount: valuationItems.length
    };
  }

  // 8. LOW STOCK ALERTS
  static async getLowStockAlerts() {
    const allProducts = await db.select().from(products);
    
    const alertItems = allProducts.map(p => {
      const stock = parseFloat(p.stock || '0');
      const minStock = parseFloat(p.minStock || '5');
      const isOut = stock <= 0;
      const isLow = stock <= minStock;

      if (!isLow && !isOut) return null;

      const suggestedReorder = Math.max(1, (minStock * 2) - stock);

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        stock,
        minStock,
        status: isOut ? 'out_of_stock' : 'low_stock',
        statusLabel: isOut ? 'نفذت الكمية' : 'مخزون حرج',
        suggestedReorder,
        purchasePrice: parseFloat(p.purchasePrice || '0')
      };
    }).filter(Boolean);

    return alertItems;
  }
}
