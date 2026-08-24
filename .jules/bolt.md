# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-05 - [Optimize Customer Debt Aging N+1 Query Loop]
**Learning:** Executing `this.getCustomerInvoices(c.id)` inside a loop over debtor customers caused an $N+1$ query bottleneck (1 + $N$ queries).
**Action:** Extract debtor customer IDs, batch-fetch all matching invoices in a single query using Drizzle ORM's `inArray(invoices.customerId, debtorCustomerIds)`, and pre-group into an in-memory `Map` for $O(1)$ lookup per customer, reducing database queries from $1+N$ down to 2.
