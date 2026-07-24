import { db } from '../database/index.ts';
import { customers, invoices, payments, salesInvoices } from '../database/schema.ts';
import { eq, like, or, and, gte, lte, desc } from 'drizzle-orm';

export class CustomerRepository {
  static async findAll(params?: { search?: string; type?: string; status?: string; page?: number; limit?: number }) {
    let query = db.select().from(customers);
    
    const conditions = [];
    if (params?.search) {
      const searchTerm = `%${params.search}%`;
      conditions.push(
        or(
          like(customers.name, searchTerm),
          like(customers.phone, searchTerm),
          like(customers.taxNumber, searchTerm)
        )
      );
    }
    if (params?.type && params.type !== 'all') {
      conditions.push(eq(customers.type, params.type));
    }
    if (params?.status && params.status !== 'all') {
      conditions.push(eq(customers.status, params.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (params?.page || params?.limit) {
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const offset = (page - 1) * limit;
      return await query.limit(limit).offset(offset);
    }

    return await query;
  }

  static async findById(id: string) {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0] || null;
  }

  static async upsert(customerData: any) {
    const existing = await this.findById(customerData.id);
    if (existing) {
      await db.update(customers).set({
        ...customerData,
        updatedAt: new Date()
      }).where(eq(customers.id, customerData.id));
    } else {
      await db.insert(customers).values(customerData);
    }
    return await this.findById(customerData.id);
  }

  static async updateBalance(id: string, newBalance: number) {
    await db.update(customers).set({ balance: newBalance.toString(), updatedAt: new Date() }).where(eq(customers.id, id));
    return await this.findById(id);
  }

  static async adjustBalance(id: string, deltaAmount: number) {
    const customer = await this.findById(id);
    if (!customer) throw new Error('العميل غير موجود');
    const current = parseFloat(customer.balance || '0');
    const updated = current + deltaAmount;
    await this.updateBalance(id, updated);
    return updated;
  }

  static async getCustomerInvoices(customerId: string) {
    // Check both invoices table and salesInvoices table for maximum compatibility
    const invList = await db.select().from(invoices).where(eq(invoices.customerId, customerId));
    return invList;
  }

  static async getCustomerPayments(customerId: string) {
    const pmts = await db.select().from(payments).where(
      and(
        eq(payments.partyId, customerId),
        eq(payments.type, 'receipt')
      )
    );
    return pmts;
  }

  static async getCustomerLedger(customerId: string, startDate?: string, endDate?: string) {
    const customer = await this.findById(customerId);
    if (!customer) throw new Error('العميل غير موجود');

    const invList = await this.getCustomerInvoices(customerId);
    const pmtList = await this.getCustomerPayments(customerId);

    const openingBalance = parseFloat(customer.openingBalance || '0');
    let runningBalance = openingBalance;

    const rawLines: any[] = [];

    // Add Opening balance line
    if (openingBalance !== 0) {
      rawLines.push({
        id: `op-${customer.id}`,
        date: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : '2026-01-01',
        type: 'opening_balance',
        typeLabel: 'رصيد افتتاحي',
        reference: 'OP-BAL',
        invoiceNumber: '-',
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        notes: 'الرصيد السايق / الافتتاحي للعميل'
      });
    }

    // Process Sales Invoices
    for (const inv of invList) {
      const gTotal = parseFloat(inv.grandTotal || '0');
      // Credit sale or invoice amount adds to customer debt (Debit)
      const pMethod = inv.paymentMethod;
      const creditPart = (inv as any).paymentDetails?.creditAmount || (pMethod === 'credit' ? gTotal : 0);

      if (pMethod === 'credit' || creditPart > 0 || inv.status === 'unpaid' || inv.status === 'partially_paid') {
        const debitVal = creditPart > 0 ? creditPart : gTotal;
        rawLines.push({
          id: `inv-${inv.id}`,
          date: inv.date ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'sales_invoice',
          typeLabel: 'فاتورة مبيعات آجلة',
          reference: inv.invoiceNumber,
          invoiceNumber: inv.invoiceNumber,
          debit: debitVal,
          credit: 0,
          notes: `فاتورة مبيعات رقم ${inv.invoiceNumber}`
        });
      } else if (inv.status === 'returned') {
        rawLines.push({
          id: `ret-${inv.id}`,
          date: inv.date ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'return_invoice',
          typeLabel: 'مرتجع مبيعات',
          reference: `RET-${inv.invoiceNumber}`,
          invoiceNumber: inv.invoiceNumber,
          debit: 0,
          credit: gTotal,
          notes: `إشعار دائن - مرتجع فاتورة ${inv.invoiceNumber}`
        });
      }
    }

    // Process Customer Receipt Payments
    for (const pmt of pmtList) {
      const amt = parseFloat(pmt.amount || '0');
      if (amt > 0) {
        rawLines.push({
          id: `pmt-${pmt.id}`,
          date: pmt.date || new Date().toISOString().split('T')[0],
          type: 'receipt_payment',
          typeLabel: 'سند قبض',
          reference: pmt.paymentNumber,
          invoiceNumber: pmt.reference || '-',
          debit: 0,
          credit: amt,
          notes: pmt.notes || `سند قبض رقم ${pmt.paymentNumber} (${pmt.method})`
        });
      }
    }

    // Sort chronologically by date
    rawLines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    const ledgerLines = rawLines.map(line => {
      runningBalance = runningBalance + (line.debit || 0) - (line.credit || 0);
      return {
        ...line,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    });

    // Apply date range filter if provided
    let filteredLines = ledgerLines;
    if (startDate) {
      filteredLines = filteredLines.filter(l => l.date >= startDate);
    }
    if (endDate) {
      filteredLines = filteredLines.filter(l => l.date <= endDate);
    }

    return {
      customer: {
        ...customer,
        balance: parseFloat(customer.balance || '0'),
        creditLimit: parseFloat(customer.creditLimit || '5000'),
        openingBalance: parseFloat(customer.openingBalance || '0')
      },
      currentBalance: parseFloat(customer.balance || '0'),
      totalDebit: filteredLines.reduce((acc, curr) => acc + curr.debit, 0),
      totalCredit: filteredLines.reduce((acc, curr) => acc + curr.credit, 0),
      ledgerLines: filteredLines
    };
  }

  static async getDebtAging() {
    const allCustomers = await db.select().from(customers);
    const now = new Date().getTime();

    const result = [];

    for (const c of allCustomers) {
      const bal = parseFloat(c.balance || '0');
      const limit = parseFloat(c.creditLimit || '5000');
      if (bal <= 0) continue; // Skip non-debtor customers in aging breakdown

      const invs = await this.getCustomerInvoices(c.id);
      
      let curr0_30 = 0;
      let days31_60 = 0;
      let days61_90 = 0;
      let daysOver90 = 0;

      for (const inv of invs) {
        if (inv.status === 'unpaid' || inv.status === 'partially_paid' || inv.paymentMethod === 'credit') {
          const invDate = new Date(inv.date || new Date()).getTime();
          const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
          const amt = parseFloat(inv.grandTotal || '0');

          if (diffDays <= 30) curr0_30 += amt;
          else if (diffDays <= 60) days31_60 += amt;
          else if (diffDays <= 90) days61_90 += amt;
          else daysOver90 += amt;
        }
      }

      // If no detailed invoices match, attribute total balance to current 0-30
      if (curr0_30 + days31_60 + days61_90 + daysOver90 === 0 && bal > 0) {
        curr0_30 = bal;
      }

      const status = bal > limit ? 'exceeded' : bal > (limit * 0.8) ? 'warning' : 'safe';

      result.push({
        customerId: c.id,
        customerName: c.name,
        phone: c.phone || '',
        creditLimit: limit,
        totalBalance: bal,
        current0To30: parseFloat(curr0_30.toFixed(2)),
        days31To60: parseFloat(days31_60.toFixed(2)),
        days61To90: parseFloat(days61_90.toFixed(2)),
        daysOver90: parseFloat(daysOver90.toFixed(2)),
        status
      });
    }

    return result;
  }

  static async delete(id: string) {
    await db.delete(customers).where(eq(customers.id, id));
    return { success: true };
  }
}
