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

  // 7. FINANCIAL STATEMENTS (القوائم المالية المحاسبية الشاملة)
  static async getFinancialStatements(filter?: ReportFilter & { currency?: string }) {
    const allAccounts = await db.select().from(accounts).orderBy(asc(accounts.code));
    
    // Get entries & lines with optional date and currency filters
    let entries = await db.select().from(journalEntries);
    if (filter?.startDate) {
      entries = entries.filter(e => e.date >= filter.startDate!);
    }
    if (filter?.endDate) {
      entries = entries.filter(e => e.date <= filter.endDate!);
    }
    if (filter?.currency && filter.currency !== 'ALL') {
      entries = entries.filter(e => e.currency === filter.currency);
    }

    const validEntryIds = new Set(entries.map(e => e.id));
    const allLines = await db.select().from(journalLines);
    const lines = allLines.filter(l => validEntryIds.has(l.journalEntryId));

    const accountStats: Record<string, { debit: number; credit: number; foreignDebit: number; foreignCredit: number }> = {};

    lines.forEach(line => {
      const accId = line.accountId;
      if (!accountStats[accId]) {
        accountStats[accId] = { debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 };
      }
      accountStats[accId].debit += Number(line.debit) || 0;
      accountStats[accId].credit += Number(line.credit) || 0;
      accountStats[accId].foreignDebit += Number(line.foreignDebit) || 0;
      accountStats[accId].foreignCredit += Number(line.foreignCredit) || 0;
    });

    // 1. Trial Balance (ميزان المراجعة)
    let totalTrialDebit = 0;
    let totalTrialCredit = 0;

    const trialBalanceAccounts = allAccounts.map(acc => {
      const stats = accountStats[acc.id] || { debit: 0, credit: 0, foreignDebit: 0, foreignCredit: 0 };
      const baseBalance = Number(acc.balance) || 0;
      const isDebitSide = acc.type === 'asset' || acc.type === 'expense';
      const netBal = isDebitSide ? (stats.debit - stats.credit) : (stats.credit - stats.debit);

      totalTrialDebit += stats.debit;
      totalTrialCredit += stats.credit;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currency: acc.currency || 'SAR',
        currentBalance: baseBalance,
        periodDebit: stats.debit,
        periodCredit: stats.credit,
        netBalance: netBal
      };
    });

    const isTrialBalanced = Math.abs(totalTrialDebit - totalTrialCredit) < 0.01;

    // 2. Income Statement (قائمة الدخل)
    const revenues = trialBalanceAccounts.filter(a => a.type === 'revenue' || a.code.startsWith('4'));
    const cogsAccounts = trialBalanceAccounts.filter(a => a.code.startsWith('51') || a.code === 'acc_cogs');
    const operatingExpenses = trialBalanceAccounts.filter(a => (a.type === 'expense' || a.code.startsWith('5') || a.code.startsWith('6')) && !a.code.startsWith('51') && a.code !== 'acc_cogs');

    const totalRevenues = revenues.reduce((sum, a) => sum + (a.periodCredit - a.periodDebit), 0);
    const totalCOGS = cogsAccounts.reduce((sum, a) => sum + (a.periodDebit - a.periodCredit), 0);
    const grossProfit = totalRevenues - totalCOGS;

    const totalExpenses = operatingExpenses.reduce((sum, a) => sum + (a.periodDebit - a.periodCredit), 0);
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

    // 3. Balance Sheet (الميزانية العمومية)
    const assets = trialBalanceAccounts.filter(a => a.type === 'asset' || a.code.startsWith('1'));
    const liabilities = trialBalanceAccounts.filter(a => a.type === 'liability' || a.code.startsWith('2'));
    const equityAccounts = trialBalanceAccounts.filter(a => a.type === 'equity' || a.code.startsWith('3'));

    const totalAssets = assets.reduce((sum, a) => sum + (a.currentBalance || (a.netBalance)), 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.currentBalance || (a.netBalance)), 0);
    const totalEquityWithoutProfit = equityAccounts.reduce((sum, a) => sum + (a.currentBalance || (a.netBalance)), 0);
    
    // Retained Earnings / Current Net Profit
    const totalEquity = totalEquityWithoutProfit + netProfit;

    // Verify Accounting Equation: Assets = Liabilities + Equity
    const equationDiff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    const isEquationBalanced = equationDiff < 0.01;

    // 4. Cash Flow Statement (قائمة التدفقات النقدية)
    let operatingInflows = 0;
    let operatingOutflows = 0;
    let investingInflows = 0;
    let investingOutflows = 0;
    let financingInflows = 0;
    let financingOutflows = 0;

    lines.forEach(l => {
      const acc = allAccounts.find(a => a.id === l.accountId);
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;

      // Cash/Bank account movements
      if (acc?.code.startsWith('1101') || acc?.code.startsWith('1102') || acc?.id === 'acc_cash' || acc?.id === 'acc_bank') {
        if (debit > 0) {
          // Cash Inflow
          operatingInflows += debit;
        }
        if (credit > 0) {
          // Cash Outflow
          operatingOutflows += credit;
        }
      }
    });

    const netOperatingCash = operatingInflows - operatingOutflows;
    const netInvestingCash = investingInflows - investingOutflows;
    const netFinancingCash = financingInflows - financingOutflows;
    const netCashFlow = netOperatingCash + netInvestingCash + netFinancingCash;

    const cashAndBankAccounts = allAccounts.filter(a => a.code.startsWith('1101') || a.code.startsWith('1102') || a.id === 'acc_cash' || a.id === 'acc_bank');
    const endingCashBalance = cashAndBankAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const beginningCashBalance = endingCashBalance - netCashFlow;

    return {
      filter: {
        startDate: filter?.startDate || null,
        endDate: filter?.endDate || null,
        currency: filter?.currency || 'ALL'
      },
      trialBalance: {
        accounts: trialBalanceAccounts,
        totalDebit: totalTrialDebit,
        totalCredit: totalTrialCredit,
        isBalanced: isTrialBalanced
      },
      incomeStatement: {
        revenues,
        cogsAccounts,
        operatingExpenses,
        totalRevenues,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin
      },
      balanceSheet: {
        assets,
        liabilities,
        equity: equityAccounts,
        totalAssets,
        totalLiabilities,
        totalEquityWithoutProfit,
        netProfit,
        totalEquity,
        equation: {
          assets: totalAssets,
          liabilitiesPlusEquity: totalLiabilities + totalEquity,
          difference: equationDiff,
          isBalanced: isEquationBalanced
        }
      },
      cashFlowStatement: {
        operating: {
          inflows: operatingInflows,
          outflows: operatingOutflows,
          net: netOperatingCash
        },
        investing: {
          inflows: investingInflows,
          outflows: investingOutflows,
          net: netInvestingCash
        },
        financing: {
          inflows: financingInflows,
          outflows: financingOutflows,
          net: netFinancingCash
        },
        netCashFlow,
        beginningCashBalance,
        endingCashBalance
      }
    };
  }
}
