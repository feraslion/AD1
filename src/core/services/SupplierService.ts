import { SupplierRepository } from '../repositories/SupplierRepository.ts';
import { ValidationError, NotFoundError } from '../domain/index.ts';

export class SupplierService {
  static async getSuppliers(search?: string) {
    return await SupplierRepository.findAll(search);
  }

  static async getSupplierById(id: string) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) throw new NotFoundError('المورد غير موجود');
    return supplier;
  }

  static async saveSupplier(data: any) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('اسم المورد مطلوب ويجب أن يكون حرفين على الأقل');
    }
    return await SupplierRepository.upsert(data);
  }

  static async deleteSupplier(id: string) {
    await this.getSupplierById(id);
    return await SupplierRepository.delete(id);
  }

  static async getSupplierPurchases(id: string) {
    await this.getSupplierById(id);
    return await SupplierRepository.getSupplierPurchases(id);
  }
}
