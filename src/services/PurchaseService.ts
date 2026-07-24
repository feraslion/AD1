import { PurchaseService as RawPurchaseService, SupplierService, PaymentService } from '../core/api/api';

export interface PurchaseItem {
  productId: string;
  purchasePrice: number;
  quantity: number;
}

export const PurchaseService = {
  // Underlying API services proxy
  getPurchaseRequests: RawPurchaseService.getPurchaseRequests,
  createPurchaseRequest: RawPurchaseService.createPurchaseRequest,
  convertRequestToOrder: RawPurchaseService.convertRequestToOrder,
  getPurchases: RawPurchaseService.getPurchases,
  createPurchase: RawPurchaseService.createPurchase,
  receiveGoods: RawPurchaseService.receiveGoods,
  issueSupplierInvoice: RawPurchaseService.issueSupplierInvoice,
  getSuppliers: SupplierService.getSuppliers,
  createSupplier: SupplierService.createSupplier,
  deleteSupplier: SupplierService.deleteSupplier,
  getSupplierLedger: SupplierService.getSupplierLedger,
  payCustomer: PaymentService.payCustomer,
  paySupplier: PaymentService.paySupplier,

  // Calculation and business logic
  calculatePurchaseSubtotal: (items: PurchaseItem[]): number => {
    return items.reduce((sum, item) => sum + ((Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0)), 0);
  },

  calculatePurchaseTax: (subtotal: number, taxRate: number): number => {
    return parseFloat((subtotal * (taxRate / 100)).toFixed(2));
  },

  calculatePurchaseGrandTotal: (subtotal: number, taxAmount: number): number => {
    return parseFloat((subtotal + taxAmount).toFixed(2));
  }
};
