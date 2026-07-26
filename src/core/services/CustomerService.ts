import { CustomerRepository } from '../repositories/CustomerRepository.ts';
import { ValidationError, NotFoundError } from '../domain/index.ts';

export class CustomerService {
  static async getCustomers(search?: string) {
    return await CustomerRepository.findAll({ search });
  }

  static async getCustomerById(id: string) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) throw new NotFoundError('العميل غير موجود');
    return customer;
  }

  static async saveCustomer(data: any) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ValidationError('اسم العميل مطلوب ويجب أن يكون حرفين على الأقل');
    }
    return await CustomerRepository.upsert(data);
  }

  static async deleteCustomer(id: string) {
    await this.getCustomerById(id);
    return await CustomerRepository.delete(id);
  }

  static async getCustomerLedger(id: string, startDate?: string, endDate?: string) {
    await this.getCustomerById(id);
    return await CustomerRepository.getCustomerLedger(id, startDate, endDate);
  }

  static async getDebtAging() {
    return await CustomerRepository.getDebtAging();
  }
}
