## 2024-11-20 - Delete Button Confirmation & Accessibility
**Learning:** Destructive actions without confirmation dialogues are problematic, and icon-only buttons need proper ARIA labels and focus states for keyboard users.
**Action:** Always add a `window.confirm` for delete actions, `aria-label` to icon buttons, `aria-hidden="true"` to inner SVGs, and explicit `focus-visible` styles for a11y.
