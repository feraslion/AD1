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
    const res = await db.select().from(currencies).where(eq(currencies.code, code.toUpperCase()));
    return res[0] || null;
  }

  static async getBaseCurrency() {
    const all = await this.getCurrencies();
    const base = all.find(c => c.isDefault === 'true' || c.isDefault === '1');
    if (base) return base;
    if (all.length > 0) return all[0];
    return {
      id: 'curr_usd',
      code: 'USD',
      name: 'دولار أمريكي',
      symbol: '$',
      exchangeRate: '1.0',
      isDefault: 'true'
    };
  }

  static async getBaseCurrencyCode(): Promise<string> {
    const base = await this.getBaseCurrency();
    return base.code || 'USD';
  }

  static async setBaseCurrency(currencyIdOrCode: string, changedBy?: string) {
    let target = await this.findCurrencyById(currencyIdOrCode);
    if (!target) {
      target = await this.findCurrencyByCode(currencyIdOrCode);
    }
    if (!target) {
      throw new Error('العملة المطلوبة غير موجودة');
    }

    const oldRate = parseFloat(target.exchangeRate || '1.0') || 1.0;
    const all = await this.getCurrencies();

    for (const curr of all) {
      if (curr.id === target.id) {
        await db.update(currencies).set({
          isDefault: 'true',
          exchangeRate: '1.0',
          updatedAt: new Date()
        }).where(eq(currencies.id, curr.id));
      } else {
        const currentRate = parseFloat(curr.exchangeRate || '1.0') || 1.0;
        const newRate = oldRate > 0 ? (currentRate / oldRate) : 1.0;
        const formattedRate = Number(newRate.toFixed(6)).toString();

        await db.update(currencies).set({
          isDefault: 'false',
          exchangeRate: formattedRate,
          updatedAt: new Date()
        }).where(eq(currencies.id, curr.id));

        await this.addExchangeRateHistory({
          currencyId: curr.id,
          currencyCode: curr.code,
          rate: formattedRate,
          notes: `إعادة احتساب نسبة الصرف بعد تغيير العملة الأساسية إلى (${target.code})`,
          createdBy: changedBy || 'system'
        });
      }
    }

    await this.addExchangeRateHistory({
      currencyId: target.id,
      currencyCode: target.code,
      rate: '1.0',
      notes: `تعيين العملة (${target.code}) كعملة أساسية للشركة`,
      createdBy: changedBy || 'system'
    });

    return await this.getCurrencies();
  }

  static async upsertCurrency(data: any) {
    const id = data.id || 'curr_' + Math.random().toString(36).substr(2, 9);
    const code = (data.code || '').toUpperCase();
    const isDef = data.isDefault === true || data.isDefault === 'true';

    if (isDef) {
      await db.update(currencies).set({ isDefault: 'false' });
    }

    const dbValue = {
      id,
      code,
      name: data.name,
      symbol: data.symbol || code,
      exchangeRate: isDef ? '1.0' : (data.exchangeRate !== undefined ? data.exchangeRate : 1.0).toString(),
      isDefault: isDef ? 'true' : 'false',
      companyId: data.companyId || null
    };

    const existing = await this.findCurrencyById(id);
    if (existing) {
      await db.update(currencies).set(dbValue).where(eq(currencies.id, id));
    } else {
      await db.insert(currencies).values(dbValue);
    }

    await this.addExchangeRateHistory({
      currencyId: id,
      currencyCode: code,
      rate: dbValue.exchangeRate,
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: 'إنشاء/تحديث معلومات العملة',
      createdBy: data.recordedBy || 'system'
    });

    return await this.findCurrencyById(id);
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
