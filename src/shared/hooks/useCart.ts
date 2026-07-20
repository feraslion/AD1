import { useState, useCallback } from 'react';
import { Product, CartItem, StoreSettings } from '../../types';

export function useCart(settings: StoreSettings) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'fixed' | 'percentage'>('fixed');

  const addToCart = useCallback((product: Product, onError?: (msg: string) => void) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (product.stock !== 999 && existing.quantity >= product.stock) {
          if (onError) onError(`تنبيه: لا يوجد سوى ${product.stock} قطع في المخزون`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (product.stock !== 999 && product.stock <= 0) {
          if (onError) onError('المنتج غير متوفر بالمخزون');
          return prevCart;
        }
        return [
          ...prevCart,
          { id: product.id, product, quantity: 1, discount: 0, discountType: 'percentage' },
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number, onError?: (msg: string) => void) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      if (qty <= 0) {
        return prev.filter((i) => i.id !== id);
      }

      if (item.product.stock !== 999 && qty > item.product.stock) {
        if (onError) onError(`تنبيه: الحد الأقصى للمخزون هو ${item.product.stock}`);
        return prev;
      }

      return prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    });
  }, []);

  const updateItemDiscount = useCallback((id: string, discount: number, type: 'fixed' | 'percentage') => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, discount, discountType: type } : i))
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setInvoiceDiscount(0);
  }, []);

  // Calculations
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

  const totalDiscount = (() => {
    let disc = 0;
    if (invoiceDiscount > 0) {
      if (invoiceDiscountType === 'percentage') {
        disc = subtotal * (invoiceDiscount / 100);
      } else {
        disc = invoiceDiscount;
      }
    }
    return parseFloat(disc.toFixed(2));
  })();

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxRate = settings.taxRate;
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

  return {
    cart,
    setCart,
    invoiceDiscount,
    setInvoiceDiscount,
    invoiceDiscountType,
    setInvoiceDiscountType,
    addToCart,
    updateQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    subtotal,
    totalDiscount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}
