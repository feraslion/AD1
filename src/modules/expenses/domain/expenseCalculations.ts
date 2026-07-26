export interface ExpenseItemInput {
  amount: number;
  taxAmount?: number;
}

export function calculateExpenseTotals(expenses: ExpenseItemInput[]): {
  totalAmount: number;
  totalTax: number;
  grandTotal: number;
} {
  let totalAmount = 0;
  let totalTax = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    const tax = Number(exp.taxAmount) || 0;
    totalAmount += amt;
    totalTax += tax;
  }

  return {
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    grandTotal: parseFloat((totalAmount + totalTax).toFixed(2)),
  };
}
