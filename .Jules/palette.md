## 2026-07-17 - Add Delete Confirmation and Accessibility to Entry Removal
**Learning:** Destructive actions (like deleting financial entries) in single-page apps without undo functionality mandate immediate confirmations (like `window.confirm`). Additionally, icon buttons must have `aria-label` and `focus-visible` styles for keyboard navigation and screen reader accessibility.
**Action:** Always include confirmation dialogs for destructive actions unless an undo feature exists. Ensure all icon-only buttons include descriptive `aria-label`s and visible focus states (`focus-visible`).
