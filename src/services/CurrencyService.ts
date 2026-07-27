import { db } from '../core/database/index.ts';
import { accounts } from '../core/database/schema.ts';
import { eq } from 'drizzle-orm';
import { CurrencyRepository } from '../core/repositories/CurrencyRepository.ts';
import { JournalEngine, JournalLineInput } from '../core/services/JournalEngine.ts';

export interface Currency {
  id: string;
  code: string; // e.g. 'SAR', 'USD', 'SYP', 'TRY'
  name: string; // e.g. 'ريال سعودي', 'دولار أمريكي', 'ليرة سورية', 'ليرة تركية'
  symbol: string; // e.g. 'ر.س', '$', 'ل.س', '₺'
  exchangeRate: number; // rate relative to base currency (e.g. 1 USD = 3.75 SAR)
  isDefault: boolean;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExchangeRateHistory {
  id: string;
  currencyId: string;
  currencyCode: string;
  rate: number;
  effectiveDate: string; // ISO or YYYY-MM-DD
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ConversionResult {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  effectiveRate: number; // rate used for target / source
  baseAmount: number; // converted value in base currency (SAR)
}

export interface RevalueOptions {
  date?: string;
  currencyCode?: string;
  newRate?: number;
  createdBy?: string;
}

export interface RevalueAccountItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  currency: string;
  foreignBalance: number;
  oldBaseBalance: number;
  newBaseBalance: number;
  difference: number;
  type: 'gain' | 'loss' | 'none';
  rateUsed: number;
}

export interface RevaluationSummary {
  date: string;
  baseCurrency: string;
  revaluedAccounts: RevalueAccountItem[];
  totalGain: number;
  totalLoss: number;
  netGainLoss: number;
  journalEntryId: string | null;
}

export const DEFAULT_CURRENCIES: Currency[] = [
  {
    id: 'curr_sar',
    code: 'SAR',
    name: 'ريال سعودي (العملة الأساسية)',
    symbol: 'ر.س',
    exchangeRate: 1.0,
    isDefault: true
  },
  {
    id: 'curr_usd',
    code: 'USD',
    name: 'دولار أمريكي',
    symbol: '$',
    exchangeRate: 3.75,
    isDefault: false
  },
  {
    id: 'curr_syp',
    code: 'SYP',
    name: 'ليرة سورية',
    symbol: 'ل.س',
    exchangeRate: 0.00028, // 1 SAR = ~3,571 SYP -> 1 SYP = 0.00028 SAR
    isDefault: false
  },
  {
    id: 'curr_try',
    code: 'TRY',
    name: 'ليرة تركية',
    symbol: '₺',
    exchangeRate: 0.11, // 1 TRY = 0.11 SAR
    isDefault: false
  }
];

export class CurrencyService {
  /**
   * Convert an amount from one currency to another using exchange rates relative to the base currency.
   */
  static convertAmount(
    amount: number,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    currenciesList: Currency[]
  ): ConversionResult {
    const fromCurr = currenciesList.find(c => c.code.toUpperCase() === fromCurrencyCode.toUpperCase()) || {
      code: fromCurrencyCode,
      exchangeRate: 1.0
    };
    const toCurr = currenciesList.find(c => c.code.toUpperCase() === toCurrencyCode.toUpperCase()) || {
      code: toCurrencyCode,
      exchangeRate: 1.0
    };

    const fromRate = Number(fromCurr.exchangeRate) || 1.0;
    const toRate = Number(toCurr.exchangeRate) || 1.0;

    // Convert source amount to base currency
    const baseAmount = amount * fromRate;

    // Convert base amount to target currency
    const targetAmount = toRate > 0 ? baseAmount / toRate : baseAmount;

    // Direct effective exchange rate: target / source
    const effectiveRate = amount > 0 ? targetAmount / amount : (fromRate / toRate);

    return {
      sourceAmount: amount,
      sourceCurrency: fromCurrencyCode,
      targetAmount: Number(targetAmount.toFixed(4)),
      targetCurrency: toCurrencyCode,
      effectiveRate: Number(effectiveRate.toFixed(6)),
      baseAmount: Number(baseAmount.toFixed(4))
    };
  }

  /**
   * Get historical rate for a currency code at a specific date
   */
  static async getHistoricalRate(currencyCode: string, targetDate?: string): Promise<number> {
    return await CurrencyRepository.getHistoricalRate(currencyCode, targetDate);
  }

  /**
   * Convert an amount using historical rate on a specific date
   */
  static async convertWithHistoricalRate(
    amount: number,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    targetDate?: string
  ): Promise<ConversionResult> {
    const fromRate = await this.getHistoricalRate(fromCurrencyCode, targetDate);
    const toRate = await this.getHistoricalRate(toCurrencyCode, targetDate);

    const baseAmount = amount * fromRate;
    const targetAmount = toRate > 0 ? baseAmount / toRate : baseAmount;
    const effectiveRate = amount > 0 ? targetAmount / amount : (fromRate / toRate);

    return {
      sourceAmount: amount,
      sourceCurrency: fromCurrencyCode,
      targetAmount: Number(targetAmount.toFixed(4)),
      targetCurrency: toCurrencyCode,
      effectiveRate: Number(effectiveRate.toFixed(6)),
      baseAmount: Number(baseAmount.toFixed(4))
    };
  }

  /**
   * Convert Invoice amounts to target currency or recalculate base currency amounts
   */
  static convertInvoice(
    invoice: any,
    targetCurrency: string,
    customRate?: number
  ) {
    const sourceCurrency = invoice.currency || 'SAR';
    const rate = customRate || Number(invoice.exchangeRate) || 1.0;

    const subtotal = Number(invoice.subtotal || invoice.totalWithoutTax) || 0;
    const taxAmount = Number(invoice.taxAmount) || 0;
    const discountAmount = Number(invoice.discountAmount) || 0;
    const grandTotal = Number(invoice.grandTotal) || 0;

    if (sourceCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
      return {
        ...invoice,
        convertedSubtotal: subtotal,
        convertedTax: taxAmount,
        convertedDiscount: discountAmount,
        convertedGrandTotal: grandTotal,
        rateUsed: 1.0,
        targetCurrency
      };
    }

    const convertedSubtotal = Number((subtotal * rate).toFixed(2));
    const convertedTax = Number((taxAmount * rate).toFixed(2));
    const convertedDiscount = Number((discountAmount * rate).toFixed(2));
    const convertedGrandTotal = Number((grandTotal * rate).toFixed(2));

    return {
      ...invoice,
      convertedSubtotal,
      convertedTax,
      convertedDiscount,
      convertedGrandTotal,
      rateUsed: rate,
      targetCurrency
    };
  }

  /**
   * Revaluation Engine: Revalue all foreign currency accounts or specified account
   */
  static async revalueForeignBalances(options?: RevalueOptions): Promise<RevaluationSummary> {
    const today = options?.date || new Date().toISOString().split('T')[0];
    const baseCurrency = await CurrencyRepository.getBaseCurrencyCode();
    const createdBy = options?.createdBy || 'system';

    const allAccounts = await db.select().from(accounts);

    let forexGainAcc = allAccounts.find(a => a.code === '4201' || a.id === 'acc_forex_gain');
    if (!forexGainAcc) {
      forexGainAcc = allAccounts.find(a => a.name.includes('أرباح فروق أسعار الصرف') || a.name.includes('Forex Gain'));
    }

    let forexLossAcc = allAccounts.find(a => a.code === '5205' || a.id === 'acc_forex_loss');
    if (!forexLossAcc) {
      forexLossAcc = allAccounts.find(a => a.name.includes('خسائر فروق أسعار الصرف') || a.name.includes('Forex Loss'));
    }

    // Ensure fallback account IDs if missing
    const gainAccId = forexGainAcc ? forexGainAcc.id : 'acc_forex_gain';
    const lossAccId = forexLossAcc ? forexLossAcc.id : 'acc_forex_loss';

    const revaluedItems: RevalueAccountItem[] = [];
    const journalLinesInput: JournalLineInput[] = [];

    let totalGain = 0;
    let totalLoss = 0;

    for (const acc of allAccounts) {
      const accCurrency = (acc.currency || baseCurrency).toUpperCase();
      if (accCurrency === baseCurrency.toUpperCase()) continue; // Skip base currency accounts

      if (options?.currencyCode && accCurrency !== options.currencyCode.toUpperCase()) {
        continue;
      }

      const foreignBalance = Number((acc as any).foreignBalance) || 0;
      const oldBaseBalance = Number(acc.balance) || 0;

      if (foreignBalance === 0 && oldBaseBalance === 0) continue;

      const rateUsed = options?.newRate && options.currencyCode?.toUpperCase() === accCurrency
        ? options.newRate
        : await this.getHistoricalRate(accCurrency, today);

      const newBaseBalance = Number((foreignBalance * rateUsed).toFixed(2));
      const diff = Number((newBaseBalance - oldBaseBalance).toFixed(2));

      if (Math.abs(diff) < 0.01) {
        revaluedItems.push({
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          currency: accCurrency,
          foreignBalance,
          oldBaseBalance,
          newBaseBalance,
          difference: 0,
          type: 'none',
          rateUsed
        });
        continue;
      }

      const isAsset = acc.type === 'asset';
      let type: 'gain' | 'loss' = 'gain';

      if (isAsset) {
        if (diff > 0) {
          // Asset value increased -> Gain
          type = 'gain';
          totalGain += diff;
          // Debit asset account, Credit Forex Gain
          journalLinesInput.push({
            accountId: acc.id,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `إعادة تقييم حساب (${acc.name}) بسعر صرف ${rateUsed}`
          });
          journalLinesInput.push({
            accountId: gainAccId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `أرباح فروق أعادة تقييم (${acc.name})`
          });
        } else {
          // Asset value decreased -> Loss
          type = 'loss';
          totalLoss += Math.abs(diff);
          // Debit Forex Loss, Credit asset account
          journalLinesInput.push({
            accountId: lossAccId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `خسائر فروق أعادة تقييم (${acc.name})`
          });
          journalLinesInput.push({
            accountId: acc.id,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `إعادة تقييم حساب (${acc.name}) بسعر صرف ${rateUsed}`
          });
        }
      } else {
        // Liability or Equity
        if (diff > 0) {
          // Liability value increased -> Loss
          type = 'loss';
          totalLoss += diff;
          journalLinesInput.push({
            accountId: lossAccId,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `خسائر فروق أعادة تقييم التزام (${acc.name})`
          });
          journalLinesInput.push({
            accountId: acc.id,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `إعادة تقييم حساب التزام (${acc.name})`
          });
        } else {
          // Liability value decreased -> Gain
          type = 'gain';
          totalGain += Math.abs(diff);
          journalLinesInput.push({
            accountId: acc.id,
            debit: Math.abs(diff),
            credit: 0,
            currency: baseCurrency,
            description: `إعادة تقييم حساب التزام (${acc.name})`
          });
          journalLinesInput.push({
            accountId: gainAccId,
            debit: 0,
            credit: Math.abs(diff),
            currency: baseCurrency,
            description: `أرباح فروق أعادة تقييم التزام (${acc.name})`
          });
        }
      }

      revaluedItems.push({
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        currency: accCurrency,
        foreignBalance,
        oldBaseBalance,
        newBaseBalance,
        difference: diff,
        type,
        rateUsed
      });
    }

    let journalEntryId: string | null = null;
    if (journalLinesInput.length > 0) {
      const entryNum = `REV-${Date.now().toString().slice(-6)}`;
      const entry = await JournalEngine.postJournalEntry(
        entryNum,
        `قيد إعادة تقييم أصل/التزام العملات الأجنبية تاريخ ${today}`,
        today,
        journalLinesInput,
        {
          status: 'posted',
          createdBy
        }
      );
      journalEntryId = entry.id;
    }

    const netGainLoss = Number((totalGain - totalLoss).toFixed(2));

    return {
      date: today,
      baseCurrency,
      revaluedAccounts: revaluedItems,
      totalGain: Number(totalGain.toFixed(2)),
      totalLoss: Number(totalLoss.toFixed(2)),
      netGainLoss,
      journalEntryId
    };
  }

  /**
   * Calculate Realized FX Gain or Loss when an invoice issued in foreign currency is settled at a new exchange rate.
   */
  static calculateFxDifference(
    amountForeign: number,
    invoiceExchangeRate: number,
    paymentExchangeRate: number,
    transactionType: 'sale' | 'purchase' = 'sale'
  ): { differenceBase: number; type: 'gain' | 'loss' | 'none'; amount: number } {
    const originalValueBase = amountForeign * invoiceExchangeRate;
    const settledValueBase = amountForeign * paymentExchangeRate;

    let diff = settledValueBase - originalValueBase;
    if (transactionType === 'purchase') {
      diff = -diff;
    }

    const roundedDiff = Number(diff.toFixed(2));
    if (Math.abs(roundedDiff) < 0.01) {
      return { differenceBase: 0, type: 'none', amount: 0 };
    }

    return {
      differenceBase: roundedDiff,
      type: roundedDiff > 0 ? 'gain' : 'loss',
      amount: Math.abs(roundedDiff)
    };
  }

  /**
   * Format currency display string cleanly.
   */
  static formatCurrencyDisplay(amount: number, currencyCode: string, symbol?: string): string {
    const decimals = (currencyCode === 'SYP') ? 0 : 2;
    const formattedNum = amount.toLocaleString('ar-SA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${formattedNum} ${symbol || currencyCode}`;
  }
}
