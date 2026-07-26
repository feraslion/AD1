export interface ProductStockInfo {
  stock: number;
  minStock: number;
}

export function isLowStock(product: ProductStockInfo): boolean {
  if (product.stock === 999) return false;
  return product.stock <= product.minStock;
}

export function calculateInventoryValuation(products: { stock: number; purchasePrice?: number; price?: number }[]): {
  totalItems: number;
  totalCostValue: number;
  totalRetailValue: number;
} {
  let totalItems = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;

  for (const p of products) {
    if (p.stock !== 999 && p.stock > 0) {
      totalItems += p.stock;
      totalCostValue += p.stock * (p.purchasePrice || 0);
      totalRetailValue += p.stock * (p.price || 0);
    }
  }

  return {
    totalItems,
    totalCostValue: parseFloat(totalCostValue.toFixed(2)),
    totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
  };
}
