import { db } from '../database/index.ts';
import { currencies, exchangeRatesHistory } from '../database/schema.ts';
import { eq, desc } from 'drizzle-orm';

export class CurrencyRepository {
  static async getCurrencies() {
    return await db.select().from(currencies);
  }

  static async findCurrencyById(id: string) {
    const res = await db.select().from(currencies).where(eq(currencies.id, id));
    return res[0] || null;
  }

  static async findCurrencyByCode(code: string) {
    const res = await db.select().from(currencies).where(eq(currencies.code, code));
    return res[0] || null;
  }

  static async upsertCurrency(data: any) {
    const id = data.id || 'curr_' + Math.random().toString(36).substr(2, 9);
    const code = (data.code || '').toUpperCase();
    const dbValue = {
      id,
      code,
      name: data.name,
      symbol: data.symbol || code,
      exchangeRate: (data.exchangeRate !== undefined ? data.exchangeRate : 1.0).toString(),
      isDefault: data.isDefault ? 'true' : 'false',
      companyId: data.companyId || null
    };

    if (data.isDefault) {
      await db.update(currencies).set({ isDefault: 'false' });
    }

    const existing = await this.findCurrencyById(id);
    if (existing) {
      await db.update(currencies).set(dbValue).where(eq(currencies.id, id));
    } else {
      await db.insert(currencies).values(dbValue);
    }

    await this.addExchangeRateHistory({
      id: 'rate_h_' + Math.random().toString(36).substr(2, 9),
      currencyId: id,
      currencyCode: code,
      rate: dbValue.exchangeRate,
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: 'إنشاء/تحديث معلومات العملة',
      createdBy: data.recordedBy || 'system'
    });

    const updated = await this.findCurrencyById(id);
    return updated;
  }

  static async updateRate(id: string, exchangeRate: number, changedBy?: string) {
    const currency = await this.findCurrencyById(id);
    if (!currency) {
      throw new Error('العملة غير موجودة');
    }

    await db.update(currencies).set({
      exchangeRate: exchangeRate.toString(),
      updatedAt: new Date()
    }).where(eq(currencies.id, id));

    const historyRecord = {
      id: 'rate_h_' + Math.random().toString(36).substr(2, 9),
      currencyId: id,
      currencyCode: currency.code,
      rate: exchangeRate.toString(),
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: 'تعديل سعر الصرف الرسمي',
      createdBy: changedBy || 'system'
    };

    await this.addExchangeRateHistory(historyRecord);

    return await this.findCurrencyById(id);
  }

  static async deleteCurrency(id: string) {
    const currency = await this.findCurrencyById(id);
    if (currency?.isDefault === 'true') {
      throw new Error('لا يمكن حذف العملة الأساسية للنظام.');
    }
    await db.delete(currencies).where(eq(currencies.id, id));
    return { success: true };
  }

  static async getExchangeRateHistory(currencyId?: string) {
    if (currencyId) {
      return await db.select().from(exchangeRatesHistory)
        .where(eq(exchangeRatesHistory.currencyId, currencyId))
        .orderBy(desc(exchangeRatesHistory.createdAt));
    }
    return await db.select().from(exchangeRatesHistory).orderBy(desc(exchangeRatesHistory.createdAt));
  }

  static async addExchangeRateHistory(data: {
    id?: string;
    currencyId: string;
    currencyCode: string;
    rate: string | number;
    effectiveDate?: string;
    notes?: string;
    createdBy?: string;
  }) {
    const id = data.id || 'rate_h_' + Math.random().toString(36).substr(2, 9);
    const dbValue = {
      id,
      currencyId: data.currencyId,
      currencyCode: data.currencyCode,
      rate: data.rate.toString(),
      effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
      notes: data.notes || 'تحديث سعر الصرف',
      createdBy: data.createdBy || 'system'
    };
    await db.insert(exchangeRatesHistory).values(dbValue);
    return dbValue;
  }
}
