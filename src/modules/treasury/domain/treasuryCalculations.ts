export interface BankAccountInput {
  currentBalance: number;
  status: string;
}

export function calculateTreasurySummary(accounts: BankAccountInput[]): {
  activeAccountsCount: number;
  totalLiquidity: number;
} {
  let activeAccountsCount = 0;
  let totalLiquidity = 0;

  for (const acc of accounts) {
    if (acc.status === 'active') {
      activeAccountsCount++;
      totalLiquidity += Number(acc.currentBalance) || 0;
    }
  }

  return {
    activeAccountsCount,
    totalLiquidity: parseFloat(totalLiquidity.toFixed(2)),
  };
}
