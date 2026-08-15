# Bolt Performance Agent Journal

## 2025-03-05 - [Optimize Journal Line Account Validation N+1 Queries]
**Learning:** Checking account statuses and details for each line in a journal entry by issuing individual queries inside a loop introduces an $N+1$ query bottleneck. This drastically reduces general ledger posting performance.
**Action:** Resolve by batch-querying all required accounts at once using Drizzle ORM's `inArray` query constructor and checking accounts with an in-memory `Map` lookup, reducing DB overhead to $O(1)$ query.

## 2025-03-06 - [Optimize Debt Aging Query N+1 Bottleneck]
**Learning:** Calling `getCustomerInvoices(customerId)` sequentially inside a loop over debtor customers issues $N$ separate database queries, causing severe performance degradation on debt aging reports.
**Action:** Pre-filter active debtor customers (`balance > 0`), batch-fetch all associated invoices in a single query using Drizzle ORM's `inArray(invoices.customerId, debtorIds)` filter, and group invoices in memory using a `Map` lookup for $O(1)$ customer matching.
