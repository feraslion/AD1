# Bolt Performance Journal

## 2025-03-05 - POS Component Calculations Memoization
**Learning:** High-frequency rendering events in point-of-sale cashier screens (such as rapid hardware laser scanner key events, category tab clicks, and visual search input queries) can trigger heavy computations and array-filtering overhead on every single render cycle if not properly memoized.
**Action:** Always wrap product list array filter operations and total calculations in `useMemo` hooks with strict dependencies (`cart`, `invoiceDiscount`, `invoiceDiscountType`, `settings.taxRate`, `products`, `selectedCategory`, `searchQuery`) to avoid UI lag and frame drops during intense checkout flows.
