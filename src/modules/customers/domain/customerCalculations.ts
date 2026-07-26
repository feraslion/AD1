export interface InvoiceForAging {
  id: string;
  date: string;
  grandTotal: number;
  status?: string;
}

export interface DebtAgingBucket {
  current: number;
  thirtyToSixty: number;
  sixtyToNinety: number;
  overNinety: number;
  total: number;
}

export function calculateDebtAging(invoices: InvoiceForAging[], referenceDate = new Date()): DebtAgingBucket {
  const bucket: DebtAgingBucket = {
    current: 0,
    thirtyToSixty: 0,
    sixtyToNinety: 0,
    overNinety: 0,
    total: 0,
  };

  const refTime = referenceDate.getTime();

  for (const inv of invoices) {
    if (inv.status === 'unpaid' || inv.status === 'partially_paid') {
      const invDate = new Date(inv.date).getTime();
      const diffDays = Math.floor((refTime - invDate) / (1000 * 60 * 60 * 24));
      const amount = inv.grandTotal || 0;

      bucket.total += amount;
      if (diffDays <= 30) {
        bucket.current += amount;
      } else if (diffDays <= 60) {
        bucket.thirtyToSixty += amount;
      } else if (diffDays <= 90) {
        bucket.sixtyToNinety += amount;
      } else {
        bucket.overNinety += amount;
      }
    }
  }

  bucket.current = parseFloat(bucket.current.toFixed(2));
  bucket.thirtyToSixty = parseFloat(bucket.thirtyToSixty.toFixed(2));
  bucket.sixtyToNinety = parseFloat(bucket.sixtyToNinety.toFixed(2));
  bucket.overNinety = parseFloat(bucket.overNinety.toFixed(2));
  bucket.total = parseFloat(bucket.total.toFixed(2));

  return bucket;
}
