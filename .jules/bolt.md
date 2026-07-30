# Bolt Performance Agent Journal

## 2025-03-02 - Memoization in POS Screen
**Learning:** High-frequency rendering events in point-of-sale systems (like real-time laser barcode scanning, quick search queries, and immediate cart updates) cause noticeable lag when filtering large product catalogs and recalculating invoice totals on every render.
**Action:** Use `useMemo` hooks for both product catalog filtering and invoice aggregate totals calculation (subtotal, taxes, discount, and grand total) in `POS.tsx` to prevent redundant computations and stabilize frame rate during interactive sessions.
