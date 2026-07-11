## 2024-05-24 - Dynamic Aria Labels for Table Actions
**Learning:** Relying solely on the `title` attribute for icon-only action buttons in data tables is insufficient for some screen readers. When these buttons are rendered in rows (e.g., in a mapped array), it is critical to provide dynamic `aria-label`s that reference the specific row data (e.g., `aria-label={\`Delete \${entry.formOfMoney} entry\`}`) to give proper context.
**Action:** Always include dynamic `aria-label`s for icon-only action buttons within lists or tables to explicitly identify the item being acted upon.
