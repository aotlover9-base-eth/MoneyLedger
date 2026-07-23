## 2026-07-23 - Focus States and Confirmations Missing
**Learning:** Found that custom buttons lack focus outlines (failing keyboard a11y) and destructive actions (Delete Entry) lacked any confirmation, allowing accidental single-click data loss.
**Action:** Always add `focus-visible:ring-2` (and related offset/color classes) to custom buttons and wrap destructive Firebase delete calls in `window.confirm()` or equivalent modal dialogs.
