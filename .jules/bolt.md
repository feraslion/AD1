# Bolt Performance Agent Journal

## 2026-03-05 - [Unmemoized State Computations in POS Cashier Interface]
**Learning:** The POS interface (`src/modules/sales/POS.tsx`) handles frequent user interactions, barcode scans, and state changes (such as fast barcode scanner input, modal toggles, and cashier numpad entries). Computing the filtered catalog (`filteredProducts`) and aggregate checkout totals (`subtotal`, `totalDiscount`, `taxableAmount`, `taxAmount`, `grandTotal`) on every render can cause substantial UI lag. Memoizing these derivations using React's `useMemo` ensures that calculations are only rerun when their specific source dependencies (like `cart`, `products`, `searchQuery`, or `selectedCategory`) change.
**Action:** Always wrap catalog filtering and invoice calculations in React `useMemo` in high-interaction views like the POS and Point-of-Sale checkout screens.
