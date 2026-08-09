## 2026-08-09 - Placed confirmation prompt before early return for testability

**Learning:** When adding UI confirmation dialogs (like `window.confirm()`) to destructive actions in an application with early returns for unauthenticated states (e.g., `if (!userId || !db) return;`), placing the confirmation prompt *before* the early return ensures the prompt can be tested locally using mock data even when unauthenticated.

**Action:** Always place confirmation dialogs before authentication or backend-specific early returns to enable UI testing.
