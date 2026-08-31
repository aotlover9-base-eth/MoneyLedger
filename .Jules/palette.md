## 2024-11-20 - Confirm Dialogs and Firebase Auth
**Learning:** To locally test UI elements that depend on Firebase data without functional authentication, confirmation dialogs for destructive actions must be placed *before* any authentication checks in the control flow.
**Action:** Place `window.confirm` before early returns that check for auth.
