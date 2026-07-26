export interface JournalLineInput {
  debit: number;
  credit: number;
}

export function validateJournalEntryBalance(lines: JournalLineInput[]): {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
} {
  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  return {
    isBalanced: difference < 0.001 && totalDebit > 0,
    totalDebit: parseFloat(totalDebit.toFixed(2)),
    totalCredit: parseFloat(totalCredit.toFixed(2)),
    difference: parseFloat(difference.toFixed(2)),
  };
}
