## 2026-08-25 - Confirmation Prompts and Keyboard Accessibility

**Learning:** It is crucial to place UX interactions, such as `window.confirm()` dialogs for destructive actions, before any early return checks for authentication (e.g., `if (!userId) return;`). This ensures the interaction can be tested locally using mock data even when the user is unauthenticated. Additionally, icon-only buttons require `aria-label` attributes for screen readers and visible focus indicators (`focus-visible`) for keyboard navigation.

**Action:** When implementing destructive actions in applications relying on external authentication, place confirmation prompts at the beginning of the handler function. Always verify that icon-only buttons have clear aria-labels and defined `focus-visible` styles using the existing design system (e.g., Tailwind's `ring` classes).
