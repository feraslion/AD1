# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Batch Customer Debt Aging Invoice Queries]
**Learning:** In `CustomerRepository.getDebtAging`, retrieving invoices individually per customer (`await getCustomerInvoices(c.id)`) inside a loop causes an $N+1$ query bottleneck when generating aging reports for large customer bases.
**Action:** Pre-filter debtor customers (`balance > 0`), batch fetch all debtor invoices using Drizzle ORM's `inArray(invoices.customerId, debtorIds)` in a single database roundtrip, and index them into an in-memory `Map<string, Invoice[]>` for $O(1)$ lookup.
