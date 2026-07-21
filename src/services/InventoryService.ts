import { Product, Category, Unit } from '../types';
import { ProductService, CategoryService, UnitService, WarehouseService } from '../core/api/api';

export const InventoryService = {
  // Underlying API services proxy
  getProducts: ProductService.getProducts,
  createProduct: ProductService.createProduct,
  deleteProduct: ProductService.deleteProduct,
  
  getCategories: CategoryService.getCategories,
  createCategory: CategoryService.createCategory,
  deleteCategory: CategoryService.deleteCategory,
  
  getUnits: UnitService.getUnits,
  createUnit: UnitService.createUnit,
  deleteUnit: UnitService.deleteUnit,

  getWarehouses: WarehouseService.getWarehouses,
  createWarehouse: WarehouseService.createWarehouse,
  deleteWarehouse: WarehouseService.deleteWarehouse,

  getStockMoves: WarehouseService.getStockMoves,
  transferStock: WarehouseService.transferStock,
  adjustPhysicalStock: WarehouseService.adjustPhysicalStock,
  getProductStockLedger: WarehouseService.getProductStockLedger,
  getInventoryValuation: WarehouseService.getInventoryValuation,

  // Calculation and filtering business logic
  totalStockItems: (products: Product[]): number => {
    return products.reduce((acc, p) => acc + (p.stock || 0), 0);
  },

  totalPurchaseValue: (products: Product[]): number => {
    return products.reduce((acc, p) => acc + (p.stock * (p.purchasePrice || 0)), 0);
  },

  totalSaleValue: (products: Product[]): number => {
    return products.reduce((acc, p) => acc + (p.stock * (p.price || 0)), 0);
  },

  isLowStock: (product: Product): boolean => {
    return product.stock <= product.minStock && product.minStock > 0 && product.stock > 0;
  },

  isOutOfStock: (product: Product): boolean => {
    return product.stock <= 0 && product.minStock > 0;
  },

  filterProducts: (
    products: Product[],
    searchQuery: string,
    categoryFilter: string,
    stockFilter: 'all' | 'low' | 'out'
  ): Product[] => {
    return products.filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = InventoryService.isLowStock(p);
      } else if (stockFilter === 'out') {
        matchesStock = InventoryService.isOutOfStock(p);
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }
};
