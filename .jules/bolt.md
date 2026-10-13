## 2026-10-13 - Missing Composite Index for Notifications
**Learning:** The Notification model is queried by userId and sorted chronologically, which can cause an expensive in-memory sort if lacking a composite index.
**Action:** Added @@index([userId, createdAt(sort: Desc)]) to the Notification model to optimize the findMany queries.
