import { CartItem, StoreSettings } from '../../../types';

export interface CartTotals {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export function calculateCartTotals(
  cart: CartItem[],
  invoiceDiscount: number,
  invoiceDiscountType: 'fixed' | 'percentage',
  settings: StoreSettings
): CartTotals {
  const subtotal = cart.reduce((acc, item) => {
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

  let totalDiscount = 0;
  if (invoiceDiscount > 0) {
    if (invoiceDiscountType === 'percentage') {
      totalDiscount = subtotal * (invoiceDiscount / 100);
    } else {
      totalDiscount = invoiceDiscount;
    }
  }
  totalDiscount = parseFloat(totalDiscount.toFixed(2));

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxRate = settings.taxRate ?? 15;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalDiscount,
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    taxAmount,
    grandTotal,
  };
}
