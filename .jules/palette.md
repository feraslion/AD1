# Palette UX Journal 🎨

Critical UX/accessibility learnings discovered while working on AD1 Enterprise ERP & Point of Sale System.

## 2025-02-15 - POS Accessible Controls & Overlaid Modals
**Learning:** The Point of Sale (POS) cashier interface relies heavily on high-speed user actions and utilizes multiple overlaid modals (including Payment, Thermal Receipt, Returns, Quick Customer Add, and Cash Drawer shift). These modal screens and quick-key control components use icon-only buttons (such as Minus/Plus for quantity, Trash for cart item removal, and standard X icons for modal closures) without explicit `aria-label` or accessible names. Screen readers cannot parse these icon elements natively, leading to complete non-accessibility for keyboard and assistive-device operators.
**Action:** Always provide explicit, translated `aria-label` and `title` attributes on all icon-only buttons, close actions, and custom inputs in high-interactivity components (such as the POS cashier workspace) to ensure accessibility conforms to WCAG guidelines while preserving fast rendering performance.
