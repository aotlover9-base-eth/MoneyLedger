## 2026-08-26 - Add confirmation dialog and ARIA labels to destructive actions
**Learning:** Destructive actions without confirmation dialogues can lead to accidental data loss. Furthermore, icon-only buttons often lack accessibility context for screen readers and visible focus indicators for keyboard navigation.
**Action:** Always wrap destructive actions in a `window.confirm()` or equivalent dialog. For icon-only buttons, ensure proper ARIA attributes (`aria-label`) are provided and that they have visible focus rings (`focus-visible:ring-2`) to support keyboard accessibility.
