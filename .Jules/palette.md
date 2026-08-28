## 2026-08-28 - Testability of Destructive Actions
**Learning:** When adding native `window.confirm` dialogs to destructive actions in components relying on external auth (like Firebase), placing the confirmation prompt *before* the early return auth checks (`if (!userId) return;`) allows the UI state and dialog to be fully tested locally using mock data, even when authentication is bypassed.
**Action:** Always sequence user-facing confirmation dialogs before backend validation/auth checks in event handlers to decouple UI testability from backend state.

## 2026-08-28 - Screen Reader Redundancy in Icon Buttons
**Learning:** Adding an `aria-label` to an icon-only button is insufficient if the child `<svg>` is not explicitly hidden from screen readers. Some assistive technologies may announce both the button label and attempt to interpret the SVG, creating confusing double-announcements.
**Action:** Always pair `aria-label` on the parent `<button>` with `aria-hidden="true"` on any purely decorative child `<svg>` elements.
