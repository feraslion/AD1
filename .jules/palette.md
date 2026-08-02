# Palette's UX Journal

This journal records critical UX and accessibility learnings for the AD1 ERP platform.

## 2026-08-02 - Modal Dismissal & Keyboard Focus Indicators
**Learning:** Multi-functional overlay modals (such as the document export SocialShareModal) must always implement local event handlers for the keyboard 'Escape' key to ensure that keyboard-only and assistive technology users can easily dismiss interactive overlays. Additionally, visual focus rings using `focus-visible` rules are essential across custom tabs, dropdown selects, and input text fields to provide clear visual cues during sequential keyboard navigation.
**Action:** When creating or auditing custom modal overlays, always register a window 'keydown' listener for 'Escape' that respects the modal's open state, and ensure every focusable child element includes focus ring outlines (`focus-visible:ring-2`).
