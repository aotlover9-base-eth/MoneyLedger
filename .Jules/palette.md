## 2024-05-18 - Missing ARIA labels and Delete Confirmation
**Learning:** Icon-only buttons (like the delete trash can) across the app lack ARIA labels, making them inaccessible to screen readers. Additionally, destructive actions (like deleting an entry) lack a confirmation dialog, which could lead to accidental data loss.
**Action:** Always ensure icon-only buttons have an `aria-label` and `aria-hidden="true"` on the icon itself. Always add a `window.confirm` or similar confirmation mechanism before executing destructive actions.
