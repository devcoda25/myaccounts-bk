## 2025-02-27 - [Optimized Notification findMany]
**Learning:** The Notification model is frequently queried by `userId` and sorted by `createdAt` (descending) but lacked an index, which could lead to slow sequential scans or in-memory sorts for active users.
**Action:** Adding a composite index `@@index([userId, createdAt(sort: Desc)])` to optimize the `NotificationsService.findAll` query.
