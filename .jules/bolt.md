## 2025-02-27 - Notification Index Missing
**Learning:** The `Notification` model lacked indexes on `userId` and `createdAt`, leading to potential sequential scans when a user checks their notifications.
**Action:** Add compound indexes for frequently queried foreign keys combined with ordering/filtering fields to avoid full table scans.
