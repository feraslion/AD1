import { ProductRepository } from '../repositories/ProductRepository.ts';
import { InventoryRepository } from '../repositories/InventoryRepository.ts';
import { ValidationError, NotFoundError } from '../domain/index.ts';

export class ProductService {
  static async getAllProducts(filter?: { category?: string; search?: string; page?: number; limit?: number; companyId?: string; branchId?: string }) {
    return await ProductRepository.findAll(filter);
  }

  static async getProductById(id: string) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`المنتج ذو المعرف '${id}' غير موجود`);
    }
    return product;
  }

  static async saveProduct(data: any) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('اسم المنتج مطلوب ويجب أن يكون حرفين على الأقل');
    }
    if (!data.barcode || data.barcode.trim().length < 1) {
      throw new ValidationError('باركود المنتج مطلوب');
    }

    const saved = await ProductRepository.upsert(data);
    return saved;
  }

  static async deleteProduct(id: string) {
    const existing = await ProductRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`المنتج غير موجود`);
    }
    return await ProductRepository.delete(id);
  }

  static async getProductHistory(id: string) {
    await this.getProductById(id);
    return await ProductRepository.getProductHistory(id);
  }
}
