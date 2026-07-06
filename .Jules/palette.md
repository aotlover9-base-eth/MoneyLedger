## 2024-11-26 - Contextual Labels and Focus Management for Icon-Only Actions

**Learning:** When using icon-only buttons for destructive actions like "Delete Entry" in a list or table, standard `title` attributes are insufficient for screen readers, as they don't provide unique context per row. Furthermore, a lack of keyboard focus indicators makes navigation difficult for non-mouse users. The existing app's design system relies on Tailwind for layout but lacks standard accessibility implementations for action buttons.

**Action:** Consistently apply contextual `aria-label`s that reference the unique item being modified/deleted (e.g., `aria-label={"Delete " + itemName}`).  Additionally, standardizing the application of Tailwind's `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1` on all interactive elements will ensure proper keyboard navigation visibility. Ensure decorative SVG icons within these buttons use `aria-hidden="true"`.
