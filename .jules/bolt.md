## 2024-05-21 - Missing Index on Notifications
**Learning:** `Notification` table is frequently queried by `userId` and sorted by `createdAt` (desc), but lacked an index. This forces the database to perform expensive sort operations or full table scans for every dashboard load, scaling poorly as notification history grows.
**Action:** Always verify indexes for entities displayed in primary user views (dashboards, feeds).
