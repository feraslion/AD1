# Palette UX Journal - Critical UX & Accessibility Learnings

## 2025-05-15 - POS Form Association and ARIA Labeling
**Learning:** In fast-paced retail POS environments, screen-reader accessibility and clear label-to-input association are critical. Standard custom icon buttons and dropdowns must contain descriptive labels for non-visual and power-keyboard users.
**Action:** Always provide explicit matching `id` and `htmlFor` attributes for interactive fields such as customer setup forms, and descriptive `aria-label` tags for icon-only action buttons.
