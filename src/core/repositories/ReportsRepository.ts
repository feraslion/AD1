import { db } from '../database/index.ts';
import { 
  invoices, 
  invoiceItems, 
  purchases, 
  purchaseItems, 
  products, 
  customers, 
  suppliers, 
  expenseRequests, 
  accounts, 
  journalEntries, 
  journalLines
} from '../database/schema.ts';
import { eq, desc, asc, and, gte, lte, sql, inArray } from 'drizzle-orm';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  categoryId?: string;
  customerId?: string;
  supplierId?: string;
}

export class ReportsRepository {
  // 1. SALES REPORT
  static async getSalesReport(filter: ReportFilter) {
    let whereClause = gte(invoices.date, filter.startDate ? filter.startDate : '2020-01-01');
    if (filter.endDate) {
      whereClause = and(whereClause, lte(invoices.date, filter.endDate))!;
    }

    const allInvoices = await db.select().from(invoices).where(whereClause);

    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;

    const paymentMethods: Record<string, number> = { cash: 0, card: 0, credit: 0 };

    allInvoices.forEach(inv => {
      const grandTotal = Number(inv.grandTotal) || 0;
      const tax = Number(inv.taxAmount) || 0;
      const sub = Number(inv.totalWithoutTax) || 0;
      const disc = Number(inv.discountAmount) || 0;

      totalSales += grandTotal;
      totalTax += tax;
      netSales += sub;
      totalDiscount += disc;

      if (inv.status === 'paid') paidInvoices++;
      else pendingInvoices++;

      const pm = inv.paymentMethod || 'cash';
      paymentMethods[pm] = (paymentMethods[pm] || 0) + grandTotal;
    });

    // Top Selling Products
    const items = await db
      .select({
        productName: invoiceItems.productName,
        productId: invoiceItems.productId,
        qty: sql<number>`sum(${invoiceItems.quantity})`,
        totalRevenue: sql<number>`sum(${invoiceItems.total})`
      })
      .from(invoiceItems)
      .groupBy(invoiceItems.productId, invoiceItems.productName)
      .orderBy(sql`sum(${invoiceItems.total}) DESC`)
      .limit(10);

    return {
      summary: {
        totalInvoices: allInvoices.length,
        totalSales,
        totalTax,
        totalDiscount,
        netSales,
        paidInvoices,
        pendingInvoices
      },
      paymentMethods,
      topProducts: items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        qtySold: Number(i.qty) || 0,
        revenue: Number(i.totalRevenue) || 0
      })),
      invoicesList: allInvoices.slice(0, 50)
    };
  }

  // 2. PURCHASE REPORT
  static async getPurchaseReport(filter: ReportFilter) {
    let whereClause = gte(purchases.date, filter.startDate ? filter.startDate : '2020-01-01');
    if (filter.endDate) {
      whereClause = and(whereClause, lte(purchases.date, filter.endDate))!;
    }

    const pos = await db.select().from(purchases).where(whereClause);

    let totalPurchases = 0;
    let totalTax = 0;
    let pendingOrders = 0;
    let receivedOrders = 0;

    pos.forEach(po => {
      const amt = Number(po.grandTotal) || 0;
      const tax = Number(po.taxAmount) || 0;

      totalPurchases += amt;
      totalTax += tax;

      if (po.status === 'received' || po.status === 'completed') receivedOrders++;
      else pendingOrders++;
    });

    // Top Purchased Products from purchaseItems & products
    const topPurchased = await db
      .select({
        productId: purchaseItems.productId,
        qty: sql<number>`sum(${purchaseItems.quantity})`,
        totalCost: sql<number>`sum(${purchaseItems.total})`
      })
      .from(purchaseItems)
      .groupBy(purchaseItems.productId)
      .orderBy(sql`sum(${purchaseItems.total}) DESC`)
      .limit(10);

    return {
      summary: {
        totalPOCount: pos.length,
        totalPurchases,
        totalTax,
        pendingOrders,
        receivedOrders
      },
      topProducts: topPurchased.map(p => ({
        productId: p.productId,
        qtyPurchased: Number(p.qty) || 0,
        totalCost: Number(p.totalCost) || 0
      })),
      ordersList: pos.slice(0, 50)
    };
  }

  // 3. INVENTORY REPORT
  static async getInventoryReport() {
    const allProducts = await db.select().from(products);

    let totalItemsCount = allProducts.length;
    let totalStockQty = 0;
    let totalValuationCost = 0;
    let totalValuationSale = 0;
    let lowStockCount = 0;

    const categoryMap: Record<string, { count: number; stock: number; costVal: number; saleVal: number }> = {};
    const lowStockList: any[] = [];

    allProducts.forEach(p => {
      const stock = Number(p.stock) || 0;
      const cost = Number(p.purchasePrice) || 0;
      const price = Number(p.price) || 0;
      const minStock = Number(p.minStock) || 5;

      totalStockQty += stock;
      totalValuationCost += stock * cost;
      totalValuationSale += stock * price;

      if (stock <= minStock) {
        lowStockCount++;
        lowStockList.push({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          stock,
          minStock,
          category: p.category
        });
      }

      const cat = p.category || 'غير مصنف';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, stock: 0, costVal: 0, saleVal: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].stock += stock;
      categoryMap[cat].costVal += stock * cost;
      categoryMap[cat].saleVal += stock * price;
    });

    const potentialProfit = totalValuationSale - totalValuationCost;

    return {
      summary: {
        totalItemsCount,
        totalStockQty,
        totalValuationCost,
        totalValuationSale,
        potentialProfit,
        lowStockCount
      },
      categoryBreakdown: Object.entries(categoryMap).map(([category, val]) => ({
        category,
        ...val
      })),
      lowStockList
    };
  }

  // 4. CUSTOMER REPORT
  static async getCustomerReport() {
    const allCustomers = await db.select().from(customers);
    const allInvoices = await db.select().from(invoices);

    const customerMap: Record<string, { totalPurchases: number; invoiceCount: number; paidAmount: number; balance: number }> = {};

    allInvoices.forEach(inv => {
      const custId = inv.customerId || 'walk_in';
      if (!customerMap[custId]) {
        customerMap[custId] = { totalPurchases: 0, invoiceCount: 0, paidAmount: 0, balance: 0 };
      }
      const total = Number(inv.grandTotal) || 0;
      customerMap[custId].totalPurchases += total;
      customerMap[custId].invoiceCount += 1;

      if (inv.status === 'paid') {
        customerMap[custId].paidAmount += total;
      } else {
        customerMap[custId].balance += total;
      }
    });

    const reportList = allCustomers.map(c => {
      const stats = customerMap[c.id] || { totalPurchases: 0, invoiceCount: 0, paidAmount: 0, balance: 0 };
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '-',
        address: c.address || '-',
        totalPurchases: stats.totalPurchases,
        invoiceCount: stats.invoiceCount,
        paidAmount: stats.paidAmount,
        remainingDebt: stats.balance || Number(c.balance) || 0
      };
    });

    const totalDebts = reportList.reduce((acc, c) => acc + c.remainingDebt, 0);

    return {
      summary: {
        totalCustomers: allCustomers.length,
        totalDebts
      },
      customers: reportList.sort((a, b) => b.totalPurchases - a.totalPurchases)
    };
  }

  // 5. SUPPLIER REPORT
  static async getSupplierReport() {
    const allSuppliers = await db.select().from(suppliers);
    const allPOs = await db.select().from(purchases);

    const supplierMap: Record<string, { totalOrders: number; totalPurchases: number; paidAmount: number; balance: number }> = {};

    allPOs.forEach(po => {
      const suppId = po.supplierId || 'general';
      if (!supplierMap[suppId]) {
        supplierMap[suppId] = { totalOrders: 0, totalPurchases: 0, paidAmount: 0, balance: 0 };
      }
      const total = Number(po.grandTotal) || 0;
      supplierMap[suppId].totalPurchases += total;
      supplierMap[suppId].totalOrders += 1;

      if (po.status === 'completed' || po.status === 'received') {
        supplierMap[suppId].paidAmount += total;
      } else {
        supplierMap[suppId].balance += total;
      }
    });

    const reportList = allSuppliers.map(s => {
      const stats = supplierMap[s.id] || { totalOrders: 0, totalPurchases: 0, paidAmount: 0, balance: 0 };
      return {
        id: s.id,
        name: s.name,
        phone: s.phone || '-',
        email: s.email || '-',
        totalPurchases: stats.totalPurchases,
        totalOrders: stats.totalOrders,
        paidAmount: stats.paidAmount,
        remainingPayables: stats.balance || Number(s.balance) || 0
      };
    });

    const totalPayables = reportList.reduce((acc, s) => acc + s.remainingPayables, 0);

    return {
      summary: {
        totalSuppliers: allSuppliers.length,
        totalPayables
      },
      suppliers: reportList.sort((a, b) => b.totalPurchases - a.totalPurchases)
    };
  }

  // 6. PROFIT REPORT (أرباح وخسائر)
  static async getProfitReport(filter: ReportFilter) {
    let whereClauseInvoices = gte(invoices.date, filter.startDate ? filter.startDate : '2020-01-01');
    if (filter.endDate) {
      whereClauseInvoices = and(whereClauseInvoices, lte(invoices.date, filter.endDate))!;
    }

    const allInvoices = await db.select().from(invoices).where(whereClauseInvoices);
    const allExpenses = await db.select().from(expenseRequests).where(eq(expenseRequests.status, 'paid'));

    let totalRevenue = 0;
    let totalCOGS = 0; // Cost of Goods Sold

    allInvoices.forEach(inv => {
      totalRevenue += Number(inv.totalWithoutTax) || Number(inv.grandTotal) || 0;
    });

    // Approximate COGS from invoice items & product purchase prices
    const invIds = allInvoices.map(i => i.id);
    if (invIds.length > 0) {
      const items = await db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invIds));
      items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const costEstimate = price * 0.70;
        totalCOGS += qty * costEstimate;
      });
    }

    const grossProfit = totalRevenue - totalCOGS;

    let totalOperatingExpenses = 0;
    allExpenses.forEach(e => {
      totalOperatingExpenses += Number(e.amount) || 0;
    });

    const netProfit = grossProfit - totalOperatingExpenses;
    const profitMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalOperatingExpenses,
      netProfit,
      profitMarginPercentage
    };
  }

  // 7. FINANCIAL STATEMENTS (القوائم المالية المحاسبية)
  static async getFinancialStatements() {
    const allAccounts = await db.select().from(accounts).orderBy(asc(accounts.code));
    const lines = await db.select().from(journalLines);

    const accountBalances: Record<string, { debit: number; credit: number; balance: number }> = {};

    lines.forEach(line => {
      const accId = line.accountId;
      if (!accountBalances[accId]) {
        accountBalances[accId] = { debit: 0, credit: 0, balance: 0 };
      }
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      accountBalances[accId].debit += debit;
      accountBalances[accId].credit += credit;
    });

    // Trial Balance
    let totalTrialDebit = 0;
    let totalTrialCredit = 0;

    const trialBalance = allAccounts.map(acc => {
      const stats = accountBalances[acc.id] || { debit: 0, credit: 0, balance: 0 };
      const netBal = stats.debit - stats.credit;

      totalTrialDebit += stats.debit;
      totalTrialCredit += stats.credit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        totalDebit: stats.debit,
        totalCredit: stats.credit,
        netBalance: netBal
      };
    });

    // Income Statement (Revenues, Cost, Expenses)
    const revenues = trialBalance.filter(a => a.type === 'revenue' || a.code.startsWith('4'));
    const expenses = trialBalance.filter(a => a.type === 'expense' || a.code.startsWith('5') || a.code.startsWith('6'));

    const totalIncome = revenues.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0);
    const statementNetProfit = totalIncome - totalExpenses;

    // Balance Sheet (Assets, Liabilities, Equity)
    const assets = trialBalance.filter(a => a.type === 'asset' || a.code.startsWith('1'));
    const liabilities = trialBalance.filter(a => a.type === 'liability' || a.code.startsWith('2'));
    const equity = trialBalance.filter(a => a.type === 'equity' || a.code.startsWith('3'));

    const totalAssets = assets.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0);
    const totalEquity = equity.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0) + statementNetProfit;

    return {
      trialBalance: {
        accounts: trialBalance,
        totalDebit: totalTrialDebit,
        totalCredit: totalTrialCredit,
        isBalanced: Math.abs(totalTrialDebit - totalTrialCredit) < 0.01
      },
      incomeStatement: {
        revenues,
        expenses,
        totalIncome,
        totalExpenses,
        netProfit: statementNetProfit
      },
      balanceSheet: {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    };
  }
}
