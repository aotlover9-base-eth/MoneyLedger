## 2024-06-25 - Testing destructive actions before auth check
**Learning:** During local development without Firebase auth initialized, early returns like `if (!userId || !db) return;` completely block testing of UI interactions tied to destructive actions (like delete confirmation prompts).
**Action:** When adding confirmation dialogs (like `window.confirm()`) to destructive actions, place the prompt *before* any early returns that check for authentication. This allows the UX interaction to be tested locally using mock data even when unauthenticated, improving the feedback loop.
