## 2026-08-30 - Prevent Accidental Deletions and Ensure Screen Reader Support
**Learning:** When using an icon-only button for a destructive action (like deleting a ledger entry), not adding an 'aria-label' hides the action's intent from screen readers, and lacking a confirmation prompt easily leads to data loss if users misclick.
**Action:** Always wrap destructive actions in `window.confirm()` (placed before early returns for missing auth) and ensure icon-only buttons include `aria-label` and `aria-hidden="true"` on decorative child elements. Ensure keyboard accessibility with focus rings.
