## 2024-11-20 - Ensure confirmation dialogue bypasses auth logic during testing
**Learning:** During testing, unauthenticated users would bypass validation loops preventing the test flow.
**Action:** When adding confirmation pop-ups, add them before the auth-check to allow mock data testing.
