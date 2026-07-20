import { Invoice, CartItem, Product } from '../types';
import { InvoiceService } from '../core/api/api';

export const SalesService = {
  // Underlying API services proxy
  getInvoices: InvoiceService.getInvoices,
  createInvoice: InvoiceService.createInvoice,

  // Calculation business logic
  calculateSubtotal: (cart: CartItem[]): number => {
    return cart.reduce((acc, item) => {
      const itemPrice = item.product.price * item.quantity;
      let itemDiscount = 0;
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          itemDiscount = itemPrice * (item.discount / 100);
        } else {
          itemDiscount = item.discount * item.quantity;
        }
      }
      return acc + (itemPrice - itemDiscount);
    }, 0);
  },

  calculateTotalDiscount: (subtotal: number, invoiceDiscount: number, invoiceDiscountType: 'fixed' | 'percentage'): number => {
    let disc = 0;
    if (invoiceDiscount > 0) {
      if (invoiceDiscountType === 'percentage') {
        disc = subtotal * (invoiceDiscount / 100);
      } else {
        disc = invoiceDiscount;
      }
    }
    return parseFloat(disc.toFixed(2));
  },

  calculateTaxableAmount: (subtotal: number, totalDiscount: number): number => {
    return Math.max(0, subtotal - totalDiscount);
  },

  calculateTaxAmount: (taxableAmount: number, taxRate: number): number => {
    return parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  },

  calculateGrandTotal: (taxableAmount: number, taxAmount: number): number => {
    return parseFloat((taxableAmount + taxAmount).toFixed(2));
  },

  prepareInvoiceItems: (cart: CartItem[], taxRate: number) => {
    return cart.map(item => {
      const itemPrice = item.product.price;
      const discountVal = item.discount;
      let total = itemPrice * item.quantity;
      if (discountVal > 0) {
        if (item.discountType === 'percentage') {
          total -= total * (discountVal / 100);
        } else {
          total -= discountVal * item.quantity;
        }
      }
      return {
        productId: item.product.id,
        productName: item.product.name,
        price: itemPrice,
        quantity: item.quantity,
        discount: item.discount,
        discountType: item.discountType,
        total: parseFloat(total.toFixed(2)),
        taxAmount: parseFloat((total * (taxRate / 100)).toFixed(2))
      };
    });
  }
};
