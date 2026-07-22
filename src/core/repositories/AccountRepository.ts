import { db } from '../database/index.ts';
import { accounts } from '../database/schema.ts';
import { eq } from 'drizzle-orm';
import { AccountingRepository } from './AccountingRepository.ts';

export class AccountRepository {
  static async getAccounts() {
    return await AccountingRepository.getAccounts();
  }

  static async findAccountById(id: string) {
    return await AccountingRepository.findAccountById(id);
  }

  static async findAccountByCode(code: string) {
    return await AccountingRepository.findAccountByCode(code);
  }

  static async upsertAccount(data: any) {
    return await AccountingRepository.upsertAccount(data);
  }

  static async deleteAccount(id: string) {
    return await AccountingRepository.deleteAccount(id);
  }

  static async updateBalance(id: string, baseBalance: number, foreignBalance?: number) {
    const setValues: any = { balance: baseBalance.toString() };
    if (foreignBalance !== undefined) {
      setValues.foreignBalance = foreignBalance.toString();
    }
    await db.update(accounts).set(setValues).where(eq(accounts.id, id));
    return await this.findAccountById(id);
  }
}
