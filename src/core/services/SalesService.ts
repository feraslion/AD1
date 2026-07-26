import { SalesRepository } from '../repositories/SalesRepository.ts';
import { ValidationError, NotFoundError } from '../domain/index.ts';

export class SalesService {
  static async getInvoices(filter?: { page?: number; limit?: number; customerId?: string; status?: string; date?: string; companyId?: string; branchId?: string }) {
    return await SalesRepository.findAllInvoices(filter);
  }

  static async getInvoiceById(id: string) {
    const inv = await SalesRepository.findInvoiceById(id);
    if (!inv) throw new NotFoundError('فاتورة المبيعات غير موجودة');
    return inv;
  }

  static async createSaleInvoice(data: any) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('يجب إضافة منتج واحد على الأقل في فاتورة المبيعات');
    }
    return await SalesRepository.createSaleInvoice(data);
  }

  static async returnSaleInvoice(id: string) {
    return await SalesRepository.returnSaleInvoice(id);
  }

  static async getQuotations() {
    return await SalesRepository.findAllQuotations();
  }

  static async createQuotation(data: any) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('يجب إضافة منتج واحد على الأقل في عرض السعر');
    }
    return await SalesRepository.createQuotation(data);
  }

  static async convertQuotationToOrder(id: string) {
    return await SalesRepository.convertQuotationToOrder(id);
  }

  static async getSalesOrders() {
    return await SalesRepository.findAllSalesOrders();
  }

  static async createSalesOrder(data: any) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new ValidationError('يجب إضافة منتج واحد على الأقل في أمر المبيعات');
    }
    return await SalesRepository.createSalesOrder(data);
  }

  static async convertOrderToInvoice(id: string, paymentMethod: string = 'credit') {
    return await SalesRepository.convertOrderToInvoice(id, paymentMethod as 'cash' | 'credit' | 'card');
  }

  static async recordCustomerPayment(data: any) {
    if (!data.customerId || !data.amount || parseFloat(data.amount) <= 0) {
      throw new ValidationError('بيانات تحصيل دفعة العميل غير صالحة');
    }
    return await SalesRepository.recordCustomerPayment(data);
  }
}
