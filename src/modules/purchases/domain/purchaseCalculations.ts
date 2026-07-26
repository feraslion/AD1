export interface PurchaseItemInput {
  purchasePrice: number;
  quantity: number;
}

export function calculatePurchaseTotal(items: PurchaseItemInput[], taxRate = 15): {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
} {
  const subtotal = items.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0);
  const taxAmount = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
  const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount,
    grandTotal,
  };
}
