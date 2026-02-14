## 2025-02-18 - [Notification Index Optimization]
**Learning:** The `Notification` model lacked a composite index on `[userId, createdAt]`, causing inefficient queries for user notification feeds (filtering by user and sorting by date).
**Action:** Always verify indexes for frequently accessed and sorted data, especially for high-volume tables like `Notification` or `AuditLog`.
