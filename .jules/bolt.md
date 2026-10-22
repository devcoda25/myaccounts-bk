## 2025-02-27 - Notification Service N+1 Performance Optimization
**Learning:** The application uses `findMany` across services without specific filtering considerations leading to N+1 queries. We need an index on `userId` + `read` fields in the `Notification` table to avoid table scans during unread count and `markAllAsRead` operations.
**Action:** Add index for `userId` and `read` combination to the Notification model to optimize the common unread fetch and mark operations.
