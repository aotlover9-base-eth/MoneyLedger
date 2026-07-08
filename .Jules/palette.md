## 2024-05-17 - Dynamic ARIA Labels in Lists
**Learning:** Static ARIA labels or titles (like `title="Delete Entry"`) in dynamically mapped lists create a poor screen reader experience because users don't know *which* specific item the button acts upon, especially when navigating by interactive elements (e.g., tabbing through buttons).
**Action:** Always use contextual data from the mapped item to create dynamic labels (e.g., `aria-label={\`Delete \${entry.itemName} entry\`}`) to provide clear intent for interactive elements within lists.
