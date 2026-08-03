## 2024-08-03 - Testability of destructive actions
**Learning:** Placing UI confirmation prompts before authentication checks allows for local testability with mock data even without auth.
**Action:** Always place confirmation dialogs before early returns for missing auth credentials.