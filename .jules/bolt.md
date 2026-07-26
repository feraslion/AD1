# Bolt's Performance Journal

This is Bolt's journal for tracking CRITICAL performance-related learnings specific to this codebase.

## 2025-03-01 - [Optimizing Financial Statement SQL Joins]
**Learning:** In memory array filtering of database results scale horribly ($O(N)$ memory and CPU overhead in Node.js) when handling transaction-heavy domains like ERP/Accounting. Performing a SQL INNER JOIN of `journal_lines` on `journal_entries` delegates date & currency filtering to PostgreSQL's query optimizer and index structures.
**Action:** Use database-level filters and joins instead of memory filtering in JavaScript.
