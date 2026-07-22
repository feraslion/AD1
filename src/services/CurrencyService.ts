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
   * Rates represent how much 1 unit of currency is worth in base currency (SAR).
   * E.g., USD rate = 3.75 (1 USD = 3.75 SAR), SYP rate = 0.00028 (1 SYP = 0.00028 SAR)
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

    // Convert source amount to base currency (SAR)
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
   * Calculate Realized FX Gain or Loss when an invoice issued in foreign currency is settled at a new exchange rate.
   * Returns positive for Gain, negative for Loss.
   */
  static calculateFxDifference(
    amountForeign: number,
    invoiceExchangeRate: number,
    paymentExchangeRate: number,
    transactionType: 'sale' | 'purchase' = 'sale'
  ): { differenceBase: number; type: 'gain' | 'loss' | 'none'; amount: number } {
    // Original value in base currency at time of invoice creation
    const originalValueBase = amountForeign * invoiceExchangeRate;
    // Settled value in base currency at time of payment
    const settledValueBase = amountForeign * paymentExchangeRate;

    // For Sales:
    // If settled value > original value -> We received more base currency -> Gain
    // If settled value < original value -> We received less base currency -> Loss
    // For Purchases:
    // If settled value > original value -> We paid more base currency -> Loss
    // If settled value < original value -> We paid less base currency -> Gain
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
   * Format currency display string cleanly with appropriate precision based on currency value magnitude.
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
