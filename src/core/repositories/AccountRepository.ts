import { db } from '../database/index.ts';
import { accounts } from '../database/schema.ts';
import { eq } from 'drizzle-orm';
import { AccountService, AccountInput } from '../services/AccountService.ts';

export class AccountRepository {
  static async getAccounts(filter?: { companyId?: string; type?: string; activeOnly?: boolean; search?: string }) {
    return await AccountService.getAccounts(filter);
  }

  static async getAccountsTree(companyId?: string) {
    return await AccountService.getAccountsTree(companyId);
  }

  static async findAccountById(id: string) {
    return await AccountService.getAccountById(id);
  }

  static async findAccountByCode(code: string) {
    return await AccountService.getAccountByCode(code);
  }

  static async suggestChildCode(parentId: string) {
    return await AccountService.suggestChildCode(parentId);
  }

  static async upsertAccount(data: AccountInput) {
    return await AccountService.upsertAccount(data);
  }

  static async toggleAccountActive(id: string, isActive: boolean) {
    return await AccountService.toggleAccountActive(id, isActive);
  }

  static async deleteAccount(id: string) {
    return await AccountService.deleteAccount(id);
  }

  static async seedDefaultChartOfAccounts(companyId?: string) {
    return await AccountService.seedDefaultChartOfAccounts(companyId);
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
