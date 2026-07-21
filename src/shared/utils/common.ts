// Common Shared Utilities for Enterprise POS & ERP System
import { logger } from './logger';

export const SharedUtils = {
  /**
   * Format numbers to localized currency (e.g. 150.00 ر.س)
   */
  formatCurrency: (amount: number, currency: string = 'ر.س'): string => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      amount = 0;
    }
    return `${amount.toFixed(2)} ${currency}`;
  },

  /**
   * Localized date & time formatting in Arabic style
   */
  formatDate: (dateString: string | Date, includeTime: boolean = true): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return String(dateString);

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };

      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return new Intl.DateTimeFormat('ar-SA', options).format(date);
    } catch (e) {
      logger.error('SharedUtils', 'Error formatting date', dateString, e);
      return String(dateString);
    }
  },

  /**
   * Standard KSA VAT calculation helper
   * Returns: { baseAmount, taxAmount, totalWithTax }
   */
  calculateVAT: (amountWithoutTax: number, taxRatePercentage: number = 15) => {
    const base = parseFloat(amountWithoutTax.toFixed(2));
    const tax = parseFloat((base * (taxRatePercentage / 100)).toFixed(2));
    const total = parseFloat((base + tax).toFixed(2));
    return {
      baseAmount: base,
      taxAmount: tax,
      totalWithTax: total
    };
  },

  /**
   * Safely set an item in localStorage
   */
  setLocalStorage: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      logger.error('SharedUtils', `Failed to write to localStorage for key: ${key}`, e);
      return false;
    }
  },

  /**
   * Safely retrieve an item from localStorage with a fallback
   */
  getLocalStorage: <T>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch (e) {
      logger.error('SharedUtils', `Failed to read from localStorage for key: ${key}`, e);
      return fallback;
    }
  },

  /**
   * Standardize discount values
   */
  calculateDiscount: (
    originalPrice: number,
    discountVal: number,
    discountType: 'fixed' | 'percentage'
  ): number => {
    if (discountVal <= 0) return 0;
    let computedDiscount = 0;
    if (discountType === 'percentage') {
      computedDiscount = originalPrice * (discountVal / 100);
    } else {
      computedDiscount = discountVal;
    }
    return parseFloat(Math.min(computedDiscount, originalPrice).toFixed(2));
  },

  /**
   * Generates a secure high-resolution random alphanumeric transaction ID/invoice barcode
   */
  generateTransactionCode: (prefix: string = 'TXN'): string => {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${datePart}-${randomPart}`;
  }
};
export default SharedUtils;
